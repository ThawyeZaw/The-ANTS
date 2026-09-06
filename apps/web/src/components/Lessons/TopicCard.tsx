'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TopicCard
// Per-topic interactive card: tri-state cycling indicator + confidence dot rating.
// Belongs to: src/components/Lessons/  (BMK & ABC)
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  Circle,
  Clock4,
  CheckCircle2,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { TopicItem, TopicProgressRecord, TopicStatus } from '@/context/LessonContext';

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
    icon: <Circle className="h-5 w-5" />,
    iconColor: 'text-[var(--foreground-muted)]',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: <Clock4 className="h-5 w-5" />,
    iconColor: 'text-[var(--warning)]',
  },
  {
    value: 'completed',
    label: 'Completed',
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
  curriculumId?: string | null;
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
  onConfidenceChange,
  onStatusChange,
}: TopicCardProps) {
  const currentConfidence = progress?.confidence_level ?? 0;
  const currentStatus: TopicStatus = progress?.status ?? 'not_started';
  const statusConfig = STATUS_CYCLE.find((s) => s.value === currentStatus)!;

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

      {/* Last updated */}
      {progress?.updated_at && (
        <p className="text-xs text-foreground-muted pt-1 border-t border-border">
          Updated {formatRelativeTime(progress.updated_at)}
        </p>
      )}
    </article>
  );
}
