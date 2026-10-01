'use client';

import React from 'react';
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
  const rawBoard = (countdown.exam_board || countdown.qualification_group || '').toUpperCase();
  const isEdexcel = rawBoard.includes('EDEXCEL') || rawBoard.includes('PEARSON');
  const isCambridge = rawBoard.includes('CAIE') || rawBoard.includes('CAMBRIDGE');

  const boardLabel = isEdexcel ? 'Edexcel' : isCambridge ? 'Cambridge' : (countdown.exam_board || countdown.qualification_group || null);
  const paperName = countdown.paper_name || null;
  const formattedDate = formatExamDateTime(targetDate);

  const isCritical = !time.isPast && time.days < 7;
  const isWarning = !time.isPast && time.days >= 7 && time.days < 30;

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border bg-background-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-2xs',
        time.isPast
          ? 'border-border/60 bg-background-secondary/30 opacity-70'
          : isCritical
            ? 'border-red-500/40 hover:border-red-500/70'
            : isWarning
              ? 'border-amber-500/40 hover:border-amber-500/70'
              : 'border-border hover:border-primary/40'
      )}
    >
      {/* Top row: Board / Paper Badge + Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {boardLabel && (
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                isEdexcel
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                  : isCambridge
                    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                    : 'bg-background-secondary text-foreground-secondary border border-border'
              )}
            >
              {boardLabel}
            </span>
          )}

          {paperName && (
            <span className="font-mono text-[11px] font-semibold text-foreground-secondary bg-background-secondary border border-border/70 px-1.5 py-0.5 rounded-md">
              {paperName}
            </span>
          )}

          {edited && (
            <span className="text-[10px] text-foreground-muted italic">Edited</span>
          )}
        </div>

        {/* Actions (Pencil & Trash) */}
        <div className="flex shrink-0 items-center gap-0.5">
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDelete?.(countdown.id)}
                className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(countdown)}
                  className="rounded-lg p-1 text-foreground-muted hover:bg-background-secondary hover:text-foreground transition-colors cursor-pointer"
                  title="Edit countdown"
                  aria-label={`Edit ${title}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onAskDelete?.(countdown.id)}
                  className="rounded-lg p-1 text-foreground-muted hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                  title="Remove countdown"
                  aria-label={`Remove ${title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Middle: Subject / Exam Title & Sitting Date */}
      <div className="space-y-1 mb-3">
        <h3
          className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors"
          title={title}
        >
          {title}
        </h3>

        <p className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
          <Calendar className="h-3 w-3 shrink-0" />
          <span className="truncate">{formattedDate}</span>
        </p>
      </div>

      {/* ── Centered Big Live Countdown: Days : Hours : Mins : Secs ──────── */}
      <div className="border-t border-border/60 pt-3 mt-auto">
        {time.isPast ? (
          <div className="flex items-center justify-center py-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
              ✓ Sitting Concluded
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 select-none">
            {/* Days Unit */}
            <div className="flex flex-col items-center justify-center flex-1 rounded-xl bg-background-secondary/80 border border-border/80 py-2 px-1 shadow-2xs">
              <span
                className={cn(
                  'font-mono text-xl sm:text-2xl font-black tabular-nums tracking-tight leading-none',
                  isCritical
                    ? 'text-red-600 dark:text-red-400'
                    : isWarning
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-foreground'
                )}
              >
                {time.days}
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-foreground-muted mt-1">
                Days
              </span>
            </div>

            <span className="font-mono text-sm sm:text-base font-black text-foreground-muted/40 pb-3 select-none">
              :
            </span>

            {/* Hours Unit */}
            <div className="flex flex-col items-center justify-center flex-1 rounded-xl bg-background-secondary/80 border border-border/80 py-2 px-1 shadow-2xs">
              <span className="font-mono text-lg sm:text-xl font-bold tabular-nums tracking-tight leading-none text-foreground">
                {pad(time.hours)}
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-foreground-muted mt-1">
                Hours
              </span>
            </div>

            <span className="font-mono text-sm sm:text-base font-black text-foreground-muted/40 pb-3 select-none">
              :
            </span>

            {/* Minutes Unit */}
            <div className="flex flex-col items-center justify-center flex-1 rounded-xl bg-background-secondary/80 border border-border/80 py-2 px-1 shadow-2xs">
              <span className="font-mono text-lg sm:text-xl font-bold tabular-nums tracking-tight leading-none text-foreground">
                {pad(time.minutes)}
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-foreground-muted mt-1">
                Mins
              </span>
            </div>

            <span className="font-mono text-sm sm:text-base font-black text-foreground-muted/40 pb-3 select-none">
              :
            </span>

            {/* Seconds Unit (Pulsing lively accent) */}
            <div
              className={cn(
                'flex flex-col items-center justify-center flex-1 rounded-xl py-2 px-1 shadow-2xs border',
                isCritical
                  ? 'bg-red-500/10 border-red-500/25'
                  : isWarning
                    ? 'bg-amber-500/10 border-amber-500/25'
                    : 'bg-primary/10 border-primary/25'
              )}
            >
              <span
                className={cn(
                  'font-mono text-lg sm:text-xl font-black tabular-nums tracking-tight leading-none animate-pulse',
                  isCritical
                    ? 'text-red-600 dark:text-red-400'
                    : isWarning
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-primary'
                )}
              >
                {pad(time.seconds)}
              </span>
              <span
                className={cn(
                  'text-[9px] font-extrabold uppercase tracking-wider mt-1',
                  isCritical
                    ? 'text-red-600 dark:text-red-400'
                    : isWarning
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-primary'
                )}
              >
                Secs
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
