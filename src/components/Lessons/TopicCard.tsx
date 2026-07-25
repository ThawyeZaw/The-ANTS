'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TopicCard
// Per-topic interactive card: confidence star rating + status toggle.
// Also surfaces related notes and due flashcard counts with one-click study links.
// Belongs to: src/components/Lessons/  (BMK & ABC)
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import { Star, CheckCircle2, Circle, Clock4, NotebookPen, Layers, ExternalLink } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { TopicItem, TopicProgressRecord, TopicStatus } from '@/context/LessonContext';
import { useLessonLinkedContent } from '@/hooks/useLessons';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: TopicStatus;
  label: string;
  icon: React.ReactNode;
  classes: string;
  activeClasses: string;
}[] = [
  {
    value: 'not_started',
    label: 'Not Started',
    icon: <Circle className="h-3.5 w-3.5" />,
    classes:
      'border-border text-foreground-muted hover:border-border-hover hover:text-foreground',
    activeClasses: 'border-foreground-muted bg-foreground-muted/10 text-foreground',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: <Clock4 className="h-3.5 w-3.5" />,
    classes:
      'border-info/40 text-info/70 hover:border-info hover:text-info',
    activeClasses: 'border-info bg-info/10 text-info',
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    classes:
      'border-success/40 text-success/70 hover:border-success hover:text-success',
    activeClasses: 'border-success bg-success/10 text-success',
  },
];

// ── Confidence label ──────────────────────────────────────────────────────────

const CONFIDENCE_LABELS = ['', 'Guessing', 'Shaky', 'Getting there', 'Confident', 'Mastered'];
const CONFIDENCE_COLORS = [
  '',
  'text-error',
  'text-warning',
  'text-warning',
  'text-accent',
  'text-success',
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface TopicCardProps {
  topic: TopicItem;
  progress: TopicProgressRecord | undefined;
  onConfidenceChange: (topicId: string, level: number) => void;
  onStatusChange: (topicId: string, status: TopicStatus) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TopicCard({
  topic,
  progress,
  onConfidenceChange,
  onStatusChange,
}: TopicCardProps) {
  const currentConfidence = progress?.confidence_level ?? 0;
  const currentStatus: TopicStatus = progress?.status ?? 'not_started';

  // Hover preview for confidence stars
  const [hoverLevel, setHoverLevel] = useState<number | null>(null);
  const displayLevel = hoverLevel ?? currentConfidence;

  // Linked content (notes + due cards)
  const { data: linkedContent } = useLessonLinkedContent(topic.id);
  const notesCount = linkedContent?.notes.length ?? 0;
  const dueCards = linkedContent?.dueCards ?? 0;
  const linkedDeckId = linkedContent?.deckId ?? null;

  return (
    <article
      id={`topic-card-${topic.id}`}
      className="rounded-xl border border-border bg-background-card p-5 space-y-4 transition-all duration-200 hover:border-border-hover hover:shadow-md animate-fade-in"
    >
      {/* Topic title + description */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-2 h-2 rounded-full bg-primary/60 mt-2" />
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-foreground leading-snug">{topic.title}</h4>
          {topic.description && (
            <p className="mt-1 text-sm text-foreground-muted leading-relaxed">
              {topic.description}
            </p>
          )}
        </div>
      </div>

      {/* Confidence rating */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
            Confidence
          </span>
          {displayLevel > 0 && (
            <span className={cn('text-xs font-semibold transition-colors', CONFIDENCE_COLORS[displayLevel])}>
              {CONFIDENCE_LABELS[displayLevel]}
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label={`Confidence rating for ${topic.title}`}
          onMouseLeave={() => setHoverLevel(null)}
        >
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              id={`topic-${topic.id}-confidence-${level}`}
              type="button"
              aria-label={`Set confidence to ${CONFIDENCE_LABELS[level]}`}
              className={cn(
                'transition-all duration-150 cursor-pointer focus-ring rounded',
                displayLevel >= level ? 'text-warning scale-110' : 'text-foreground-muted/40 hover:text-warning/60'
              )}
              onMouseEnter={() => setHoverLevel(level)}
              onClick={() => onConfidenceChange(topic.id, level)}
            >
              <Star
                className="h-5 w-5"
                fill={displayLevel >= level ? 'currentColor' : 'none'}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Status toggle */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
          Status
        </span>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              id={`topic-${topic.id}-status-${opt.value}`}
              type="button"
              aria-pressed={currentStatus === opt.value}
              onClick={() => onStatusChange(topic.id, opt.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer focus-ring',
                currentStatus === opt.value ? opt.activeClasses : opt.classes
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Linked content pills (only when counts > 0) */}
      {(notesCount > 0 || dueCards > 0) && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex flex-wrap items-center gap-2">
            {notesCount > 0 && (
              <Link
                href={`/library?topicId=${topic.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-secondary px-3 py-1 text-xs font-medium text-foreground-secondary hover:border-primary/50 hover:text-primary transition-colors duration-150 focus-ring"
              >
                <NotebookPen className="h-3.5 w-3.5" />
                {notesCount} note{notesCount !== 1 ? 's' : ''}
              </Link>
            )}
            {dueCards > 0 && (
              <Link
                href={linkedDeckId ? `/flashcards/${linkedDeckId}?topicId=${topic.id}` : `/flashcards?topicId=${topic.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-secondary px-3 py-1 text-xs font-medium text-foreground-secondary hover:border-accent/50 hover:text-accent transition-colors duration-150 focus-ring"
              >
                <Layers className="h-3.5 w-3.5" />
                {dueCards} due
              </Link>
            )}
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {notesCount > 0 && (
              <Link
                href={`/library?topicId=${topic.id}`}
                className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary-hover transition-colors duration-150"
              >
                Study notes
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            {dueCards > 0 && (
              <Link
                href={linkedDeckId ? `/flashcards/${linkedDeckId}?topicId=${topic.id}` : `/flashcards?topicId=${topic.id}`}
                className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-hover transition-colors duration-150"
              >
                Review cards
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Last updated */}
      {progress?.updated_at && (
        <p className="text-xs text-foreground-muted pt-1 border-t border-border">
          Updated {formatRelativeTime(progress.updated_at)}
        </p>
      )}
    </article>
  );
}
