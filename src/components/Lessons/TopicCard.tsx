'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — TopicCard
// Per-topic interactive card: confidence star rating + status toggle.
// Belongs to: src/components/Lessons/  (BMK & ABC)
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Star, CheckCircle2, Circle, Clock4 } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { TopicItem, TopicProgressRecord, TopicStatus } from '@/hooks/useLessons';

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

      {/* Last updated */}
      {progress?.updated_at && (
        <p className="text-xs text-foreground-muted pt-1 border-t border-border">
          Updated {formatRelativeTime(progress.updated_at)}
        </p>
      )}
    </article>
  );
}
