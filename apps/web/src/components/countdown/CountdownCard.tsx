'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Clock, Calendar, Sparkles, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatExamDateTime } from '@/lib/exam-datetime';

interface CountdownCardProps {
  countdown: any;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

function getTimeBreakdown(targetDateStr: string | null) {
  if (!targetDateStr)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalHours: 0 };
  const diff = new Date(targetDateStr).getTime() - Date.now();
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalHours: 0 };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const totalHours = Math.floor(diff / (1000 * 60 * 60));

  return { days, hours, minutes, seconds, isPast: false, totalHours };
}

export function CountdownCard({ countdown, onDelete, canDelete = true }: CountdownCardProps) {
  const targetDate = countdown.exam_date || countdown.target_date || countdown.date || null;
  const [time, setTime] = useState(() => countdown.timeLeft || getTimeBreakdown(targetDate));

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      setTime(getTimeBreakdown(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const title =
    countdown.custom_title || countdown.title || countdown.paper_name || 'Upcoming Exam';
  const examBoard = countdown.exam_board || countdown.qualification_group || null;
  const paperName = countdown.paper_name || null;
  const targetGrade = countdown.target_grade || null;

  const formattedDate = formatExamDateTime(targetDate);

  const isUrgent = !time.isPast && time.days < 7;
  const isUpcoming = !time.isPast && time.days >= 7 && time.days < 30;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 sm:p-5 bg-background-card',
        isUrgent
          ? 'border-rose-300/70 shadow-sm shadow-rose-500/10 dark:border-rose-500/40'
          : isUpcoming
            ? 'border-amber-500/30 hover:border-amber-500/50'
            : 'border-border hover:border-primary/40 hover:shadow-md'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {examBoard && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {examBoard}
            </span>
          )}
          {paperName && (
            <span className="inline-flex items-center rounded-md bg-background-secondary px-2 py-0.5 font-mono text-xs text-foreground-secondary">
              {paperName}
            </span>
          )}
          {isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              Deadline
            </span>
          )}
          {targetGrade && (
            <Link
              href={
                countdown.subject_id
                  ? `/calculator?subject=${countdown.subject_id}`
                  : '/calculator'
              }
              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
            >
              <Sparkles className="h-3 w-3" />
              Target: {targetGrade}
              <Calculator className="h-3 w-3" />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isUrgent && (
            <span className="inline-flex items-center gap-1 animate-pulse text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              {time.days === 0 ? 'Exam today' : `${time.days}d left`}
            </span>
          )}

          {canDelete && onDelete && countdown.id && (
            <button
              onClick={() => onDelete(countdown.id)}
              className="rounded-lg p-1.5 text-foreground-muted opacity-60 transition-colors hover:bg-red-500/10 hover:text-red-500 hover:opacity-100"
              title="Delete countdown"
              aria-label={`Delete ${title} countdown`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="line-clamp-1 text-base font-bold text-foreground transition-colors group-hover:text-primary sm:text-lg">
          {title}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-foreground-secondary">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background-secondary/80 p-2.5 sm:p-3">
        {time.isPast ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <Clock className="h-4 w-4" />
            <span>Exam concluded</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 text-center sm:gap-2">
            {(
              [
                { value: time.days, label: 'Days', accent: false },
                { value: time.hours, label: 'Hours', accent: false },
                { value: time.minutes, label: 'Mins', accent: false },
                { value: time.seconds, label: 'Secs', accent: true },
              ] as const
            ).map((cell) => (
              <div
                key={cell.label}
                className="flex flex-col items-center rounded-lg border border-border/50 bg-background-card px-1 py-1.5"
              >
                <span
                  className={cn(
                    'font-mono text-xl font-bold tracking-tight tabular-nums sm:text-3xl',
                    cell.accent
                      ? isUrgent
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-primary'
                      : 'text-foreground'
                  )}
                >
                  {String(cell.value).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'mt-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    cell.accent
                      ? isUrgent
                        ? 'text-rose-600/80 dark:text-rose-400/80'
                        : 'text-primary/80'
                      : 'text-foreground-muted'
                  )}
                >
                  {cell.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
