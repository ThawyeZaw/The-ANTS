'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useFlashcardSRS Hook (Supabase)
// SRS study session powered by real card_reviews data.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import type { FlashCard, SRSRating, StudySessionState } from '@/types';
import { computeNextReview, getNewCardDefaults, QUALITY_MAP } from '@/lib/srs/algorithm';
import { createClient } from '@/lib/supabase/client';

export interface UseFlashcardSRSReturn {
  dueCards: FlashCard[];
  currentIndex: number;
  isFlipped: boolean;
  hasFlipped: boolean;
  sessionComplete: boolean;
  ratings: Record<SRSRating, number>;
  totalCards: number;
  reviewedCount: number;
  currentCard: FlashCard | null;
  flip: () => void;
  rate: (rating: SRSRating) => void;
  restartSession: () => void;
  goBack: () => void;
  goNext: () => void;
  loadDeck: (deckId: string, userId: string) => void;
}

export function useFlashcardSRS(): UseFlashcardSRSReturn {
  const supabase = createClient()!;

  const [state, setState] = useState<StudySessionState>({
    deckId: '',
    dueCards: [],
    currentIndex: 0,
    isFlipped: false,
    hasFlipped: false,
    sessionComplete: false,
    cardRatings: {},
    pendingReviews: {},
  });

  const [userId, setUserId] = useState<string>('');

  // Cache of existing reviews keyed by card_id for O(1) lookup during rating
  const [reviewCache, setReviewCache] = useState<Record<string, {
    interval_days: number;
    ease_factor: number;
    repetitions: number;
  }>>({});

  const loadDeck = useCallback(async (deckId: string, uid: string) => {
    setUserId(uid);

    // Fetch all cards for this deck
    const { data: cards } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId);

    if (!cards) {
      setState(prev => ({ ...prev, deckId, dueCards: [], sessionComplete: true, cardRatings: {}, pendingReviews: {} }));
      return;
    }

    // Fetch all existing reviews for this user for these cards
    const cardIds = cards.map(c => c.id);
    const { data: reviews } = await supabase
      .from('card_reviews')
      .select('*')
      .eq('user_id', uid)
      .in('card_id', cardIds);

    // Build review cache
    const cache: Record<string, { interval_days: number; ease_factor: number; repetitions: number }> = {};
    if (reviews) {
      for (const r of reviews) {
        cache[r.card_id] = {
          interval_days: r.interval ?? 0,
          ease_factor: r.ease_factor ?? 2.5,
          repetitions: r.repetitions ?? 0,
        };
      }
    }
    setReviewCache(cache);

    // Determine due cards: cards with no review OR review next_review_date <= now
    const now = new Date().toISOString();
    const dueCards: FlashCard[] = cards.filter(c => {
      const review = reviews?.find(r => r.card_id === c.id);
      if (!review) return true; // new card, always due
      return review.next_review_date && review.next_review_date <= now;
    }).map(c => ({
      id: c.id,
      deck_id: c.deck_id,
      front_text: c.front_text ?? '',
      back_text: c.back_text ?? '',
      created_at: c.created_at ?? '',
    }));

    setState({
      deckId,
      dueCards,
      currentIndex: 0,
      isFlipped: false,
      hasFlipped: false,
      sessionComplete: dueCards.length === 0,
      cardRatings: {},
      pendingReviews: {},
    });
  }, [supabase]);

  const flip = useCallback(() => {
    setState(prev => ({ ...prev, isFlipped: !prev.isFlipped, hasFlipped: true }));
  }, []);

  const rate = useCallback((rating: SRSRating) => {
    setState(prev => {
      if (!prev.isFlipped) return prev;
      const card = prev.dueCards[prev.currentIndex];
      if (!card) return prev;

      const existingReview = reviewCache[card.id];
      const defaults = getNewCardDefaults();
      const currentInterval = existingReview?.interval_days ?? defaults.interval_days;
      const currentEaseFactor = existingReview?.ease_factor ?? defaults.ease_factor;

      const { newInterval, newEaseFactor, nextReviewDate } = computeNextReview(
        rating,
        currentInterval,
        currentEaseFactor
      );

      const newPendingReviews = {
        ...prev.pendingReviews,
        [card.id]: {
          interval_days: newInterval,
          ease_factor: newEaseFactor,
          next_review_date: nextReviewDate.toISOString(),
          last_rating: rating,
        }
      };

      const newCardRatings = {
        ...prev.cardRatings,
        [card.id]: rating
      };

      const nextIndex = prev.currentIndex + 1;
      const sessionComplete = nextIndex >= prev.dueCards.length;

      // Persist to Supabase when session is complete
      if (sessionComplete) {
        const upserts = Object.entries(newPendingReviews).map(([cardId, review]) =>
          supabase.from('card_reviews').upsert({
            card_id: cardId,
            user_id: userId,
            interval: review.interval_days,
            ease_factor: review.ease_factor,
            next_review_date: review.next_review_date,
            quality: QUALITY_MAP[review.last_rating],
            last_review_date: new Date().toISOString(),
            repetitions: (existingReview?.repetitions ?? 0) + 1,
          })
        );
        Promise.all(upserts);
      }

      return {
        ...prev,
        currentIndex: nextIndex,
        isFlipped: false,
        hasFlipped: false,
        sessionComplete,
        cardRatings: newCardRatings,
        pendingReviews: newPendingReviews,
      };
    });
  }, [userId, reviewCache, supabase]);

  const restartSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: 0,
      isFlipped: false,
      hasFlipped: false,
      sessionComplete: false,
      cardRatings: {},
      pendingReviews: {},
    }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.currentIndex > 0) {
        return { ...prev, currentIndex: prev.currentIndex - 1, isFlipped: false, hasFlipped: false };
      }
      return prev;
    });
  }, []);

  const goNext = useCallback(() => {
    setState(prev => {
      if (prev.currentIndex < prev.dueCards.length - 1) {
        return { ...prev, currentIndex: prev.currentIndex + 1, isFlipped: false, hasFlipped: false };
      }
      return prev;
    });
  }, []);

  const currentCard = state.sessionComplete ? null : (state.dueCards[state.currentIndex] ?? null);

  const ratings: Record<SRSRating, number> = { again: 0, hard: 0, good: 0, easy: 0 };
  Object.values(state.cardRatings).forEach(r => {
    if (ratings[r] !== undefined) ratings[r]++;
  });

  return {
    dueCards: state.dueCards,
    currentIndex: state.currentIndex,
    isFlipped: state.isFlipped,
    hasFlipped: state.hasFlipped,
    sessionComplete: state.sessionComplete,
    ratings,
    totalCards: state.dueCards.length,
    reviewedCount: state.currentIndex,
    currentCard,
    flip,
    rate,
    restartSession,
    goBack,
    goNext,
    loadDeck,
  };
}
