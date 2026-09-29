'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Pencil, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatExamDateTime } from '@/lib/exam-datetime';
import type { CountdownWithTime } from '@/hooks/useCountdown';

interface CountdownCardProps {
  countdown: CountdownWithTime;
  onDelete?: (id: string) => void;
  onEdit?: (countdown: CountdownWithTime) => void;
  confirmDelete?: boolean;
  onAskDelete?: (id: string) => void;
  onCancelDelete?: () => void;
  edited?: boolean;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function CountdownCard({
  countdown,
  onDelete,
  onEdit,
  confirmDelete = false,
  onAskDelete,
  onCancelDelete,
  edited = false,
}: CountdownCardProps) {
  const targetDate = countdown.exam_date || countdown.target_date || null;
  const time = countdown.timeLeft;
  const title =
    countdown.custom_title || countdown.title || countdown.paper_name || 'Upcoming Exam';
  const examBoard = countdown.exam_board || countdown.qualification_group || null;
  const paperName = countdown.paper_name || null;
  const formattedDate = formatExamDateTime(targetDate);
  const isUrgent = !time.isPast && time.days < 7;
  const isUpcoming = !time.isPast && time.days >= 7 && time.days < 30;

  // Compute progress ratio for the sweep bar (0–1, counts down)
  // We show 30 days max as "full bar"
  const totalWindow = 30; // days
  const progressRatio = time.isPast
    ? 1
    : Math.max(0, Math.min(1, 1 - time.days / totalWindow));

  const accentColor = isUrgent
    ? '#ef4444'
    : isUpcoming
      ? '#f59e0b'
      : 'var(--primary)';

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-2xl border bg-background-card overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg shadow-xs',
        isUrgent
          ? 'border-red-400/50 dark:border-red-500/40'
          : isUpcoming
            ? 'border-amber-400/40'
            : 'border-border hover:border-primary/40'
      )}
    >
      {/* Urgency colour top bar */}
      <div
        className="h-0.5 w-full transition-all duration-500"
        style={{ backgroundColor: accentColor, opacity: isUrgent ? 1 : isUpcoming ? 0.7 : 0.4 }}
      />

      {/* Body */}
      <div className="flex flex-col gap-3 p-4">
        {/* Top row: badges + actions */}
        <div className="flex items-start justify-between gap-2">
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-1 min-w-0">
            {examBoard && (
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                {examBoard}
              </span>
            )}
            {paperName && (
              <span className="inline-flex items-center rounded-md bg-background-secondary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground-secondary border border-border/60">
                {paperName}
              </span>
            )}
            {edited && (
              <span className="text-[10px] font-medium text-foreground-muted italic">Edited</span>
            )}
            {countdown.target_grade && (
              <Link
                href={
                  countdown.subject_id
                    ? `/calculator?subject=${countdown.subject_id}`
                    : '/calculator'
                }
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 hover:underline dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full"
              >
                Target {countdown.target_grade}
              </Link>
            )}
          </div>

          {/* Edit / Delete actions */}
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(countdown)}
                className="rounded-lg p-1.5 text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
                title="Edit countdown"
                aria-label={`Edit ${title}`}
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDelete?.(countdown.id)}
                  className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-500/20 dark:text-red-400"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={onCancelDelete}
                  className="rounded-md px-1.5 py-1 text-[10px] font-medium text-foreground-muted hover:text-foreground"
                >
                  Keep
                </button>
              </div>
            ) : (
              onDelete && (
                <button
                  type="button"
                  onClick={() => onAskDelete?.(countdown.id)}
                  className="rounded-lg p-1.5 text-foreground-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                  title="Remove countdown"
                  aria-label={`Remove ${title}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Date row */}
        <p className="flex items-center gap-1 text-[11px] text-foreground-muted">
          <Calendar className="h-3 w-3 shrink-0" />
          <span className="truncate">{formattedDate}</span>
        </p>

        {/* Countdown display */}
        <div className="flex items-end justify-between gap-2 pt-2 mt-1 border-t border-border/60">
          {time.isPast ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              ✓ Completed
            </span>
          ) : (
            <>
              <div className="flex flex-col">
                <span
                  className={cn(
                    'font-mono text-3xl font-black tabular-nums leading-none tracking-tight',
                    isUrgent
                      ? 'text-red-500 dark:text-red-400'
                      : isUpcoming
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-foreground'
                  )}
                >
                  {time.days}
                  <span className="text-sm font-bold ml-0.5 opacity-70">d</span>
                </span>
                <span
                  className={cn(
                    'font-mono text-[11px] font-semibold tabular-nums mt-0.5 tracking-tight',
                    isUrgent ? 'text-red-500 dark:text-red-400' : 'text-foreground-muted'
                  )}
                >
                  {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
                </span>
              </div>

              {/* Circular progress ring */}
              <div className="relative h-10 w-10 shrink-0">
                <svg viewBox="0 0 40 40" className="-rotate-90 h-full w-full" aria-hidden>
                  <circle cx={20} cy={20} r={16} fill="none" stroke="var(--border)" strokeWidth={3} />
                  <circle
                    cx={20}
                    cy={20}
                    r={16}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray={100.53}
                    strokeDashoffset={100.53 * (1 - progressRatio)}
                    className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                    style={{ filter: `drop-shadow(0 0 4px ${accentColor}60)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock
                    className="h-3.5 w-3.5"
                    style={{ color: accentColor }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
