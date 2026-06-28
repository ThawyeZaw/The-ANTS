'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useFlashcardSRS Hook
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react';
import type { FlashCard, SRSRating, StudySessionState } from '@/types';
import { computeNextReview, getNewCardDefaults } from '@/lib/srs/algorithm';
import { getDueCards, getUserCardReview, upsertCardReview } from '@/lib/mock/database';

export interface UseFlashcardSRSReturn {
  /** Cards due for this session */
  dueCards: FlashCard[];
  /** Index of the currently displayed card */
  currentIndex: number;
  /** Whether the card is currently flipped to the back */
  isFlipped: boolean;
  /** Whether the card has been flipped during the current view */
  hasFlipped: boolean;
  /** Whether all due cards have been reviewed */
  sessionComplete: boolean;
  /** Tally of ratings given during this session */
  ratings: Record<SRSRating, number>;
  /** Total cards in this session */
  totalCards: number;
  /** Cards reviewed so far */
  reviewedCount: number;
  /** The current card object, or null if session is complete */
  currentCard: FlashCard | null;

  /** Flip the current card to reveal the answer */
  flip: () => void;
  /** Rate the current card and advance to the next */
  rate: (rating: SRSRating) => void;
  /** Restart the session from scratch (useful for re-review) */
  restartSession: () => void;
  /** Go to the previous card */
  goBack: () => void;
  /** Go to the next card */
  goNext: () => void;
  /** Load due cards for a deck (call on mount or deck change) */
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

  const loadDeck = useCallback((deckId: string, uid: string) => {
    setUserId(uid);
    const dueCards = getDueCards(deckId, uid);
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
      if (!prev.isFlipped) return prev; // must flip before rating
      const card = prev.dueCards[prev.currentIndex];
      if (!card) return prev;

      // Get current SRS state for this card
      const existingReview = getUserCardReview(card.id, userId);
      const defaults = getNewCardDefaults();
      const currentInterval = existingReview?.interval_days ?? defaults.interval_days;
      const currentEaseFactor = existingReview?.ease_factor ?? defaults.ease_factor;

      // Compute next SRS values
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

      // If session complete, persist all cached reviews to DB
      if (sessionComplete) {
        Object.entries(newPendingReviews).forEach(([cardId, review]) => {
          upsertCardReview(cardId, userId, review);
        });
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
  }, [userId]);

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
        return {
          ...prev,
          currentIndex: prev.currentIndex - 1,
          isFlipped: false,
          hasFlipped: false,
        };
      }
      return prev;
    });
  }, []);

  const goNext = useCallback(() => {
    setState(prev => {
      if (prev.currentIndex < prev.dueCards.length - 1) {
        return {
          ...prev,
          currentIndex: prev.currentIndex + 1,
          isFlipped: false,
          hasFlipped: false,
        };
      }
      return prev;
    });
  }, []);

  const currentCard = state.sessionComplete ? null : (state.dueCards[state.currentIndex] ?? null);

  const ratings: Record<SRSRating, number> = { again: 0, good: 0, easy: 0 };
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
