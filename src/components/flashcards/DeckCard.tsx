'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — DeckCard Component
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { BookOpen, Brain, Globe, Lock, Link as LinkIcon, Play, Pencil, Copy, Trash2 } from 'lucide-react';
import type { Deck } from '@/types';
import { getCardsByDeck, getDueCards } from '@/lib/mock/database';

// Category color mapping for visual variety
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Physics:     { bg: 'bg-blue-500/10',   text: 'text-blue-500',   border: 'border-blue-500/20' },
  Biology:     { bg: 'bg-green-500/10',  text: 'text-green-500',  border: 'border-green-500/20' },
  Chemistry:   { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  Mathematics: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
  IELTS:       { bg: 'bg-rose-500/10',   text: 'text-rose-500',   border: 'border-rose-500/20' },
  History:     { bg: 'bg-amber-500/10',  text: 'text-amber-500',  border: 'border-amber-500/20' },
  Custom:      { bg: 'bg-slate-500/10',  text: 'text-slate-500',  border: 'border-slate-500/20' },
};

const DEFAULT_COLOR = { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' };

function getCategoryColor(category: string | null) {
  if (!category) return DEFAULT_COLOR;
  return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}

interface DeckCardProps {
  deck: Deck;
  /** The viewing user's ID (for SRS due count) */
  userId: string;
  /** Whether this card is in the user's own collection */
  isOwned: boolean;
  onStudy: (deckId: string) => void;
  onEdit?: (deckId: string) => void;
  onClone?: (deckId: string) => void;
  onDelete?: (deckId: string) => void;
}

export default function DeckCard({
  deck,
  userId,
  isOwned,
  onStudy,
  onEdit,
  onClone,
  onDelete,
}: DeckCardProps) {
  const allCards = getCardsByDeck(deck.id);
  const dueCards = getDueCards(deck.id, userId);
  const categoryColor = getCategoryColor(deck.category);
  const hasDueCards = dueCards.length > 0;

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 transition-all duration-300 hover:border-[var(--primary)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Visibility badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        {deck.visibility === 'public' ? (
          <span className="flex items-center gap-1 rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]" title="Shared in Library">
            <Globe size={10} /> Public
          </span>
        ) : deck.visibility === 'link' ? (
          <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500" title="Link Shared">
            <LinkIcon size={10} /> Shared
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-[var(--background-secondary)] px-2 py-0.5 text-xs font-medium text-[var(--foreground-muted)]" title="Private">
            <Lock size={10} /> Private
          </span>
        )}
      </div>

      {/* Tags row */}
      <div className="mb-3 flex flex-wrap gap-2">
        {deck.exam_board && (
          <span className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-500">
            {deck.exam_board} {deck.syllabus_code && `(${deck.syllabus_code})`}
          </span>
        )}
        {deck.category && (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}`}
          >
            {deck.category}
          </span>
        )}
      </div>

      {/* Deck name & description */}
      <div className="mb-4 flex-1">
        <h3 className="mb-1 text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2 pr-16">
          {deck.name}
        </h3>
        {deck.description && (
          <p className="text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
            {deck.description}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="mb-4 flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
        <span className="flex items-center gap-1.5">
          <BookOpen size={13} />
          <span>{allCards.length} card{allCards.length !== 1 ? 's' : ''}</span>
        </span>
        {hasDueCards && (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-500 font-medium">
            <Brain size={13} />
            <span>{dueCards.length} due</span>
          </span>
        )}
        {!hasDueCards && allCards.length > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-green-500 font-medium">
            <span>✓ All caught up</span>
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Study button (primary) */}
        <button
          id={`study-btn-${deck.id}`}
          onClick={() => onStudy(deck.id)}
          disabled={allCards.length === 0}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-glow)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play size={14} fill="white" />
          {hasDueCards ? `Study (${dueCards.length})` : 'Study All'}
        </button>

        {/* Secondary actions */}
        {isOwned && onEdit && (
          <button
            id={`edit-btn-${deck.id}`}
            onClick={() => onEdit(deck.id)}
            title="Edit deck"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--foreground-secondary)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]"
          >
            <Pencil size={14} />
          </button>
        )}

        {!isOwned && onClone && (
          <button
            id={`clone-btn-${deck.id}`}
            onClick={() => onClone(deck.id)}
            title="Clone to My Decks"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--foreground-secondary)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)]"
          >
            <Copy size={14} />
          </button>
        )}

        {isOwned && onDelete && (
          <button
            id={`delete-btn-${deck.id}`}
            onClick={() => onDelete(deck.id)}
            title="Delete deck"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--foreground-secondary)] transition-all hover:border-red-400 hover:text-red-400 hover:bg-red-50"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
