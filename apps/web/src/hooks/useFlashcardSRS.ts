'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useFlashcardSRS Hook (Hono API / Neon Backend)
// SRS study session powered by real card_reviews data.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import type { FlashCard, SRSRating, StudySessionState } from '@/types';
import { computeNextReview, getNewCardDefaults, QUALITY_MAP } from '@/lib/srs/algorithm';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

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

  const [reviewCache, setReviewCache] = useState<
    Record<
      string,
      {
        interval_days: number;
        ease_factor: number;
        repetitions: number;
      }
    >
  >({});

  const loadDeck = useCallback(async (deckId: string, uid: string) => {
    setUserId(uid);

    try {
      const res = await fetch(`${API_BASE_URL}/api/flashcards/decks/${deckId}?userId=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.deck && json.deck.cards) {
          const cardsList: FlashCard[] = json.deck.cards.map((c: any) => ({
            id: c.id,
            deck_id: c.deck_id,
            front: c.front,
            back: c.back,
            order_index: c.order_index ?? 0,
            image_url: c.image_url ?? undefined,
          }));

          setState({
            deckId,
            dueCards: cardsList,
            currentIndex: 0,
            isFlipped: false,
            hasFlipped: false,
            sessionComplete: cardsList.length === 0,
            cardRatings: {},
            pendingReviews: {},
          });
        }
      }
    } catch (err) {
      console.error('Error loading deck:', err);
    }
  }, []);

  const flip = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isFlipped: !prev.isFlipped,
      hasFlipped: true,
    }));
  }, []);

  const rate = useCallback(
    async (rating: SRSRating) => {
      const { dueCards, currentIndex, cardRatings } = state;
      const currentCard = dueCards[currentIndex];
      if (!currentCard) return;

      const quality = QUALITY_MAP[rating];
      const existing = reviewCache[currentCard.id];
      const currentProgress = existing
        ? {
            interval_days: existing.interval_days,
            ease_factor: existing.ease_factor,
            repetitions: existing.repetitions,
          }
        : getNewCardDefaults();

      const next = computeNextReview(currentProgress, quality);

      // Optimistically update reviewCache
      setReviewCache((prev) => ({
        ...prev,
        [currentCard.id]: {
          interval_days: next.interval_days,
          ease_factor: next.ease_factor,
          repetitions: next.repetitions,
        },
      }));

      // Async write to API
      if (userId) {
        try {
          await fetch(`${API_BASE_URL}/api/flashcards/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              cardId: currentCard.id,
              rating: quality,
              state: 'review',
              easeFactor: next.ease_factor,
              intervalDays: next.interval_days,
              dueDate: next.next_review_date.toISOString(),
              lapses: 0,
            }),
          });
        } catch (err) {
          console.warn('[useFlashcardSRS] Failed to persist review:', err);
        }
      }

      const nextIndex = currentIndex + 1;
      const isComplete = nextIndex >= dueCards.length;

      setState((prev) => ({
        ...prev,
        currentIndex: nextIndex,
        isFlipped: false,
        hasFlipped: false,
        sessionComplete: isComplete,
        cardRatings: {
          ...cardRatings,
          [currentCard.id]: rating,
        },
      }));
    },
    [state, reviewCache, userId]
  );

  const restartSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentIndex: 0,
      isFlipped: false,
      hasFlipped: false,
      sessionComplete: false,
      cardRatings: {},
    }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
      isFlipped: false,
      hasFlipped: false,
    }));
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentIndex + 1;
      return {
        ...prev,
        currentIndex: nextIndex,
        isFlipped: false,
        hasFlipped: false,
        sessionComplete: nextIndex >= prev.dueCards.length,
      };
    });
  }, []);

  const ratings: Record<SRSRating, number> = {
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  };

  Object.values(state.cardRatings).forEach((r) => {
    if (r in ratings) ratings[r]++;
  });

  const totalCards = state.dueCards.length;
  const reviewedCount = Object.keys(state.cardRatings).length;
  const currentCard = state.dueCards[state.currentIndex] ?? null;

  return {
    dueCards: state.dueCards,
    currentIndex: state.currentIndex,
    isFlipped: state.isFlipped,
    hasFlipped: state.hasFlipped,
    sessionComplete: state.sessionComplete,
    ratings,
    totalCards,
    reviewedCount,
    currentCard,
    flip,
    rate,
    restartSession,
    goBack,
    goNext,
    loadDeck,
  };
}
