'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Pencil, Trash2 } from 'lucide-react';
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

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border bg-background-card px-3 py-2 transition-colors',
        isUrgent
          ? 'border-rose-300/70 dark:border-rose-500/40'
          : isUpcoming
            ? 'border-amber-500/30'
            : 'border-border hover:border-primary/40'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-1">
          {examBoard && (
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">
              {examBoard}
            </span>
          )}
          {paperName && (
            <span className="inline-flex items-center rounded bg-background-secondary px-1.5 py-px font-mono text-[10px] text-foreground-secondary">
              {paperName}
            </span>
          )}
          {edited && (
            <span className="text-[10px] font-medium text-foreground-muted">Edited</span>
          )}
          {countdown.target_grade && (
            <Link
              href={
                countdown.subject_id
                  ? `/calculator?subject=${countdown.subject_id}`
                  : '/calculator'
              }
              className="text-[10px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Target {countdown.target_grade}
            </Link>
          )}
        </div>
        <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-foreground-muted">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{formattedDate}</span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        {time.isPast ? (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Done</span>
        ) : (
          <>
            <p
              className={cn(
                'font-mono text-sm font-bold tabular-nums leading-none',
                isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
              )}
            >
              {time.days}d
            </p>
            <p
              className={cn(
                'mt-1 font-mono text-[11px] font-semibold tabular-nums',
                isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-primary'
              )}
            >
              {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
            </p>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(countdown)}
            className="rounded-lg p-1.5 text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
            title="Edit countdown"
            aria-label={`Edit ${title}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDelete?.(countdown.id)}
              className="rounded-md bg-red-500/10 px-1.5 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-500/20 dark:text-red-400"
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
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
