'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — StudySession Component
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Keyboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFlashcardSRS } from '@/hooks/useFlashcardSRS';
import SessionSummary from './SessionSummary';
import FlashcardText from './FlashcardText';
import type { SRSRating } from '@/types';

interface StudySessionProps {
  deckId: string;
  deckName: string;
  userId: string;
  onBack: () => void;
}

const RATING_BUTTONS: { rating: SRSRating; label: string; shortcut: string; color: string; hoverColor: string; emoji: string }[] = [
  { rating: 'again', label: 'Again', shortcut: '1', color: 'border-red-400 text-red-500', hoverColor: 'hover:bg-red-50', emoji: '🔴' },
  { rating: 'hard', label: 'Hard', shortcut: '2', color: 'border-amber-400 text-amber-500', hoverColor: 'hover:bg-amber-50', emoji: '🟡' },
  { rating: 'good', label: 'Good', shortcut: '3', color: 'border-green-400 text-green-500', hoverColor: 'hover:bg-green-50', emoji: '🟢' },
  { rating: 'easy', label: 'Easy', shortcut: '4', color: 'border-blue-400 text-blue-500', hoverColor: 'hover:bg-blue-50', emoji: '🔵' },
];

export default function StudySession({ deckId, deckName, userId, onBack }: StudySessionProps) {
  const {
    currentCard,
    isFlipped,
    hasFlipped,
    sessionComplete,
    ratings,
    totalCards,
    reviewedCount,
    dueCards,
    flip,
    rate,
    restartSession,
    goBack,
    goNext,
    loadDeck,
  } = useFlashcardSRS();

  // Load deck on mount
  useEffect(() => {
    loadDeck(deckId, userId);
  }, [deckId, userId, loadDeck]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (sessionComplete) return;
    if (e.code === 'Space') {
      e.preventDefault();
      flip();
    }
    if (hasFlipped) {
      if (e.key === '1') rate('again');
      if (e.key === '2') rate('hard');
      if (e.key === '3') rate('good');
      if (e.key === '4') rate('easy');
    }
    if (e.key === 'ArrowLeft') goBack();
    if (e.key === 'ArrowRight') goNext();
  }, [hasFlipped, sessionComplete, flip, rate, goBack, goNext]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const progressPct = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;

  // ── Empty state ──
  if (totalCards === 0 && !sessionComplete) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="text-6xl">🎉</div>
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">All caught up!</h2>
          <p className="mt-2 text-[var(--foreground-secondary)]">
            No cards are due for review in <strong>{deckName}</strong> right now.
          </p>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">Come back later, or study all cards below.</p>
        </div>
        <div className="flex gap-3">
          <button id="back-btn-empty" onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] transition-colors">
            <ArrowLeft size={14} /> Back to Decks
          </button>
          <button id="study-all-btn" onClick={restartSession}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all">
            <RotateCcw size={14} /> Study All Cards
          </button>
        </div>
      </div>
    );
  }

  // ── Session complete ──
  if (sessionComplete) {
    return (
      <SessionSummary
        ratings={ratings}
        totalCards={totalCards}
        userId={userId}
        reviewedCards={dueCards}
        onRestart={restartSession}
        onBackToDecks={onBack}
      />
    );
  }

  if (!currentCard) return null;

  return (
    <div className="flex h-full flex-col gap-5 p-4 sm:p-6">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button id="study-back-btn" onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <p className="text-xs text-[var(--foreground-muted)] mb-1">
            {deckName} — Card {reviewedCount + 1} of {totalCards}
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--background-secondary)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-purple-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-bold text-[var(--foreground-secondary)] tabular-nums">
          {progressPct}%
        </span>
      </div>

      {/* Ratings tally (compact) */}
      <div className="flex items-center justify-center gap-3 text-xs">
        {RATING_BUTTONS.map(b => (
          <span key={b.rating} className="flex items-center gap-1 text-[var(--foreground-muted)]">
            {b.emoji} <span className="font-semibold">{ratings[b.rating]}</span>
          </span>
        ))}
      </div>

      {/* Flashcard 3D flip */}
      <div
        id="flashcard-container"
        className="cursor-pointer h-[300px] min-h-[300px] w-full"
        onClick={flip}
        style={{ perspective: '1200px' }}
      >
        <div
          className="relative h-full w-full transition-transform duration-600"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transitionDuration: '0.55s',
            minHeight: '300px',
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-8 shadow-[var(--shadow-lg)]"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--primary)]">
              Question
            </p>
            <FlashcardText
            text={currentCard.front_text}
            className="text-center text-xl font-semibold text-[var(--foreground)] leading-relaxed whitespace-pre-wrap"
          />
            {!isFlipped && (
              <p className="absolute bottom-5 text-xs text-[var(--foreground-muted)] flex flex-wrap items-center justify-center gap-1.5 px-3 text-center">
                <Keyboard size={11} /> Press <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-xs font-mono">Space</kbd> to flip, then use <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-xs font-mono">1</kbd>–<kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-xs font-mono">4</kbd> to rate
              </p>
            )}
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[var(--primary)] bg-gradient-to-br from-[var(--primary-light)] to-[var(--background-card)] p-8 shadow-[var(--shadow-lg)]"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
              Answer
            </p>
            <FlashcardText
              text={currentCard.back_text}
              className="text-center text-xl font-semibold text-[var(--foreground)] leading-relaxed whitespace-pre-wrap"
            />
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className="space-y-3 min-h-[90px] flex flex-col justify-end">
        {hasFlipped && (
          <>
            <p className="text-center text-xs text-[var(--foreground-muted)]">
              How well did you remember this?
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RATING_BUTTONS.map(btn => (
                <button
                  key={btn.rating}
                  id={`rate-${btn.rating}-btn`}
                  onClick={() => rate(btn.rating)}
                  className={`flex min-h-[96px] flex-col items-center justify-between gap-3 rounded-2xl border-2 px-3 py-3 text-sm font-semibold transition-all hover:shadow-md ${btn.color} ${btn.hoverColor}`}
                >
                  <span className="text-lg">{btn.emoji}</span>
                  <span>{btn.label}</span>
                  <kbd className="rounded bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.2)] px-2 py-1 font-mono text-white shadow-sm">
                    {btn.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-2 border-t border-[var(--border)] pt-4">
        <button
          onClick={goBack}
          disabled={reviewedCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} /> Previous Card
        </button>
        <button
          onClick={goNext}
          disabled={reviewedCount >= totalCards - 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] disabled:opacity-30 transition-colors"
        >
          Next Card <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
