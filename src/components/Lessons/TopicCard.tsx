'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TopicCard
// Per-topic interactive card: tri-state cycling indicator + confidence dot rating.
// Also surfaces related content (notes, flashcards) with one-click study links.
// Belongs to: src/components/Lessons/  (BMK & ABC)
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import {
  Circle,
  Clock4,
  CheckCircle2,
  NotebookPen,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { TopicItem, TopicProgressRecord, TopicStatus } from '@/context/LessonContext';
import { useLessonLinkedContent } from '@/hooks/useLessons';
import RelatedContent from '@/components/ui/RelatedContent';

// ── Tri-state cycle config ────────────────────────────────────────────────────

const STATUS_CYCLE: {
  value: TopicStatus;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
}[] = [
  {
    value: 'not_started',
    label: 'Not Started',
    // Outlined circle — distinct shape, not color-only
    icon: <Circle className="h-5 w-5" />,
    iconColor: 'text-[var(--foreground-muted)]',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    // Clock icon — distinct shape for "in progress" (not color-only)
    icon: <Clock4 className="h-5 w-5" />,
    iconColor: 'text-[var(--warning)]',
  },
  {
    value: 'completed',
    label: 'Completed',
    // Filled check — distinct shape (not color-only), matches Badge variant="success"
    icon: <CheckCircle2 className="h-5 w-5" fill="currentColor" />,
    iconColor: 'text-[var(--success)]',
  },
];

const NEXT_STATUS: Record<TopicStatus, TopicStatus> = {
  not_started: 'in_progress',
  in_progress: 'completed',
  completed: 'not_started',
};

// ── Confidence label ──────────────────────────────────────────────────────────

const CONFIDENCE_LABELS = ['', 'Guessing', 'Shaky', 'Getting there', 'Confident', 'Mastered'];
const CONFIDENCE_COLORS = [
  '',
  'text-[var(--error)]',
  'text-[var(--warning)]',
  'text-[var(--warning)]',
  'text-[var(--accent)]',
  'text-[var(--success)]',
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface TopicCardProps {
  topic: TopicItem;
  progress: TopicProgressRecord | undefined;
  curriculumId: string | null;
  onConfidenceChange: (topicId: string, level: number) => void;
  onStatusChange: (topicId: string, status: TopicStatus) => void;
}

// ── Confidence Dots (1–5 pip rating) ──────────────────────────────────────────

function ConfidenceDots({
  level,
  topicId,
  topicTitle,
  onChange,
}: {
  level: number;
  topicId: string;
  topicTitle: string;
  onChange: (topicId: string, level: number) => void;
}) {
  const [hoverLevel, setHoverLevel] = useState<number | null>(null);
  const displayLevel = hoverLevel ?? level;

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={`Confidence rating for ${topicTitle}`}
      onMouseLeave={() => setHoverLevel(null)}
    >
      {[1, 2, 3, 4, 5].map((dot) => {
        const isActive = displayLevel >= dot;
        return (
          <button
            key={dot}
            type="button"
            aria-label={`Set confidence to ${CONFIDENCE_LABELS[dot]} for ${topicTitle}`}
            onClick={() => onChange(topicId, dot)}
            onMouseEnter={() => setHoverLevel(dot)}
            className={cn(
              'transition-all duration-200 cursor-pointer focus-ring rounded-full',
              'hover:scale-125',
              isActive
                ? 'text-[var(--warning)]'
                : 'text-[var(--foreground-muted)]/40 hover:text-[var(--warning)]/60'
            )}
            style={{ transitionProperty: 'transform, color' }}
          >
            <Circle
              className="h-4 w-4"
              fill={isActive ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TopicCard({
  topic,
  progress,
  curriculumId,
  onConfidenceChange,
  onStatusChange,
}: TopicCardProps) {
  const currentConfidence = progress?.confidence_level ?? 0;
  const currentStatus: TopicStatus = progress?.status ?? 'not_started';
  const statusConfig = STATUS_CYCLE.find((s) => s.value === currentStatus)!;

  // Expanded detail state (shows RelatedContent when expanded)
  const [isExpanded, setIsExpanded] = useState(false);

  // Linked content (notes + due cards)
  const { data: linkedContent } = useLessonLinkedContent(topic.id);
  const notesCount = linkedContent?.notes.length ?? 0;
  const dueCards = linkedContent?.dueCards ?? 0;
  const linkedDeckId = linkedContent?.deckId ?? null;

  // Cycle to next status
  const handleStatusCycle = () => {
    const next = NEXT_STATUS[currentStatus];
    onStatusChange(topic.id, next);
  };

  return (
    <article
      id={`topic-card-${topic.id}`}
      className="rounded-xl border border-border bg-background-card p-5 space-y-4 transition-all duration-200 hover:border-border-hover hover:shadow-md animate-fade-in"
    >
      {/* ── Topic header row: tri-state indicator + title ────────────────── */}
      <div className="flex items-start gap-3">
        {/* Tri-state cycling button — distinct icon shape per state, not color alone */}
        <button
          type="button"
          aria-label={`Mark ${topic.title} as ${NEXT_STATUS[currentStatus] === 'not_started' ? 'not started' : NEXT_STATUS[currentStatus] === 'in_progress' ? 'in progress' : 'completed'}`}
          aria-pressed={false}
          onClick={handleStatusCycle}
          className={cn(
            'shrink-0 mt-0.5 cursor-pointer focus-ring rounded-full transition-all duration-200',
            statusConfig.iconColor,
            'hover:scale-110'
          )}
          style={{ transitionProperty: 'transform, color' }}
          title={`Status: ${statusConfig.label}. Click to change.`}
        >
          {statusConfig.icon}
        </button>

        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-foreground leading-snug">{topic.title}</h4>
          {topic.description && (
            <p className="mt-1 text-sm text-foreground-muted leading-relaxed">
              {topic.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Confidence dot rating (only for completed topics) ────────────── */}
      {currentStatus === 'completed' && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide shrink-0">
            Mastery
          </span>
          <ConfidenceDots
            level={currentConfidence}
            topicId={topic.id}
            topicTitle={topic.title}
            onChange={onConfidenceChange}
          />
          {currentConfidence > 0 && (
            <span
              className={cn(
                'text-xs font-semibold transition-colors shrink-0',
                CONFIDENCE_COLORS[currentConfidence]
              )}
            >
              {CONFIDENCE_LABELS[currentConfidence]}
            </span>
          )}
        </div>
      )}

      {/* ── Status label (text-only, non-interactive) ────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
          Status
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
            currentStatus === 'not_started'
              ? 'border-border text-foreground-muted'
              : currentStatus === 'in_progress'
                ? 'border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]'
                : 'border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]'
          )}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      {/* ── Expand toggle + Linked content pills ────────────────────────── */}
      {(notesCount > 0 || dueCards > 0) && (
        <div className="space-y-3 pt-2 border-t border-border">
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

      {/* ── Expand toggle for RelatedContent ────────────────────────────── */}
      <div className="pt-2 border-t border-border">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={`topic-related-${topic.id}`}
          onClick={() => setIsExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors duration-150 cursor-pointer focus-ring rounded"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {isExpanded ? 'Hide' : 'Show'} related content
        </button>

        {/* ── RelatedContent placed directly beneath expanded topic row ──── */}
        {isExpanded && (
          <div id={`topic-related-${topic.id}`} className="mt-3">
            <RelatedContent
              curriculumId={curriculumId}
              subjectId={topic.subject_id}
              topicId={topic.id}
            />
          </div>
        )}
      </div>

      {/* Last updated */}
      {progress?.updated_at && (
        <p className="text-xs text-foreground-muted pt-1 border-t border-border">
          Updated {formatRelativeTime(progress.updated_at)}
        </p>
      )}
    </article>
  );
}
