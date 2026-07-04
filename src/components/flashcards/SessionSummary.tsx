'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — SessionSummary Component
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { RotateCcw, ArrowLeft, Brain, TrendingUp } from 'lucide-react';
import type { SRSRating, FlashCard } from '@/types';
import { getUserCardReview, mockDecks } from '@/lib/mock/database';
import { formatNextReview } from '@/lib/srs/algorithm';
import RelatedContent from '@/components/ui/RelatedContent';

interface SessionSummaryProps {
  ratings: Record<SRSRating, number>;
  totalCards: number;
  userId: string;
  reviewedCards: FlashCard[];
  onRestart: () => void;
  onBackToDecks: () => void;
  deckId: string;
}

const RATING_CONFIG: Record<SRSRating, { label: string; color: string; bg: string; emoji: string }> = {
  again: { label: 'Again', color: 'text-red-500',    bg: 'bg-red-500/10',    emoji: '🔴' },
  hard:  { label: 'Hard',  color: 'text-amber-500',  bg: 'bg-amber-500/10',  emoji: '🟡' },
  good:  { label: 'Good',  color: 'text-green-500',  bg: 'bg-green-500/10',  emoji: '🟢' },
  easy:  { label: 'Easy',  color: 'text-blue-500',   bg: 'bg-blue-500/10',   emoji: '🔵' },
};

export default function SessionSummary({
  ratings,
  totalCards,
  userId,
  reviewedCards,
  onRestart,
  onBackToDecks,
  deckId,
}: SessionSummaryProps) {
  const deck = mockDecks.find((d) => d.id === deckId);
  const totalRated = Object.values(ratings).reduce((s, v) => s + v, 0);
  const masteryRate = totalCards > 0
    ? Math.round(((ratings.good + ratings.easy) / totalCards) * 100)
    : 0;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-6 text-center animate-fade-in-up">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 mx-auto shadow-lg animate-float">
          <Brain size={36} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Session Complete!</h2>
        <p className="text-[var(--foreground-secondary)]">
          You reviewed <span className="font-bold text-[var(--primary)]">{totalCards} card{totalCards !== 1 ? 's' : ''}</span> in this session
        </p>
      </div>

      {/* Mastery meter */}
      <div className="w-full max-w-sm space-y-2">
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-[var(--foreground-secondary)]">Session Mastery</span>
          <span className={masteryRate >= 70 ? 'text-green-500' : masteryRate >= 40 ? 'text-orange-500' : 'text-red-500'}>
            {masteryRate}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--background-secondary)]">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              masteryRate >= 70 ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : masteryRate >= 40 ? 'bg-gradient-to-r from-orange-400 to-amber-500'
              : 'bg-gradient-to-r from-red-400 to-rose-500'
            }`}
            style={{ width: `${masteryRate}%` }}
          />
        </div>
        <p className="text-xs text-[var(--foreground-muted)]">
          {masteryRate >= 70 ? '🌟 Great session! Keep it up.' : masteryRate >= 40 ? '📚 Good effort — keep reviewing.' : '💪 Tough session — review again soon!'}
        </p>
      </div>

      {/* Ratings breakdown */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-3">
        {(['again', 'hard', 'good', 'easy'] as SRSRating[]).map((rating) => {
          const count = ratings[rating];
          const config = RATING_CONFIG[rating];
          const pct = totalRated > 0 ? Math.round((count / totalRated) * 100) : 0;
          return (
            <div
              key={rating}
              className={`rounded-2xl border border-[var(--border)] p-4 text-left ${config.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${config.color}`}>
                  {config.emoji} {config.label}
                </span>
                <span className="text-lg font-extrabold text-[var(--foreground)]">{count}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--background-secondary)]">
                <div
                  className={`h-full rounded-full ${config.color.replace('text-', 'bg-')}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">{pct}%</p>
            </div>
          );
        })}
      </div>

      {/* Next review schedule */}
      {reviewedCards.length > 0 && (
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-[var(--primary)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">Next Review Schedule</span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {reviewedCards.slice(0, 6).map(card => {
              const review = getUserCardReview(card.id, userId);
              return (
                <div
                  key={card.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--background-secondary)] px-3 py-2 text-xs"
                >
                  <span className="truncate flex-1 text-[var(--foreground-secondary)]">
                    {card.front_text.length > 40 ? card.front_text.slice(0, 40) + '…' : card.front_text}
                  </span>
                  <span className="ml-3 shrink-0 font-semibold text-[var(--primary)]">
                    {review ? formatNextReview(review.next_review_date) : 'Soon'}
                  </span>
                </div>
              );
            })}
            {reviewedCards.length > 6 && (
              <p className="text-center text-xs text-[var(--foreground-muted)]">
                +{reviewedCards.length - 6} more cards scheduled
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 w-full max-w-sm">
        <button
          id="back-to-decks-btn"
          onClick={onBackToDecks}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] transition-colors"
        >
          <ArrowLeft size={15} /> My Decks
        </button>
        <button
          id="restart-session-btn"
          onClick={onRestart}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all shadow-[var(--shadow-md)]"
        >
          <RotateCcw size={15} /> Study Again
        </button>
      </div>

      {deck && (
        <div className="w-full max-w-lg mt-6 pt-6 border-t border-[var(--border)] text-left">
          <RelatedContent
            curriculumId={deck.curriculum_id}
            subjectId={deck.subject_id}
            excludeDeckId={deck.id}
            maxItems={2}
          />
        </div>
      )}
    </div>
  );
}
