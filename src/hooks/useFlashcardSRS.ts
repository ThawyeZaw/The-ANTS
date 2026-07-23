'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useFlashcardSRS Hook (Mock Facade)
// SRS study session powered by the unified mock data facade.
// All data flows through src/lib/mock/database.ts — no direct Supabase calls.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import type { FlashCard, SRSRating, StudySessionState } from '@/types';
import { computeNextReview, getNewCardDefaults } from '@/lib/srs/algorithm';
import { getCardsByDeck, getDeckReviews, upsertCardReview } from '@/lib/mock/database';

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
  }>>({});

  const loadDeck = useCallback((deckId: string, uid: string) => {
    setUserId(uid);

    // Fetch all cards for this deck from mock facade
    const cards = getCardsByDeck(deckId);

    if (cards.length === 0) {
      setState(prev => ({ ...prev, deckId, dueCards: [], sessionComplete: true, cardRatings: {}, pendingReviews: {} }));
      return;
    }

    // Fetch all existing reviews for this user for these cards from mock facade
    const reviews = getDeckReviews(deckId, uid);

    // Build review cache
    const cache: Record<string, { interval_days: number; ease_factor: number }> = {};
    for (const r of reviews) {
      cache[r.card_id] = {
        interval_days: r.interval_days,
        ease_factor: r.ease_factor,
      };
    }
    setReviewCache(cache);

    // Determine due cards: cards with no review OR review next_review_date <= now
    const now = new Date().toISOString();
    const dueCards: FlashCard[] = cards.filter(c => {
      const review = reviews.find(r => r.card_id === c.id);
      if (!review) return true; // new card, always due
      return review.next_review_date && review.next_review_date <= now;
    });

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
  }, []);

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

      // Persist to mock facade when session is complete
      if (sessionComplete) {
        for (const [cardId, review] of Object.entries(newPendingReviews)) {
          upsertCardReview(cardId, userId, {
            interval_days: review.interval_days,
            ease_factor: review.ease_factor,
            next_review_date: review.next_review_date,
            last_rating: review.last_rating,
          });
        }
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
  }, [userId, reviewCache]);

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
