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
  if (!targetDateStr) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalHours: 0 };
  const diff = new Date(targetDateStr).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalHours: 0 };

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

  const title = countdown.custom_title || countdown.title || countdown.paper_name || 'Upcoming Exam';
  const examBoard = countdown.exam_board || countdown.qualification_group || null;
  const paperName = countdown.paper_name || null;
  const targetGrade = countdown.target_grade || null;

  const formattedDate = formatExamDateTime(targetDate);

  // Urgency indicator
  const isUrgent = !time.isPast && time.days < 7;
  const isUpcoming = !time.isPast && time.days >= 7 && time.days < 30;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 bg-[var(--background-card)]',
        isUrgent
          ? 'border-amber-500/40 shadow-sm shadow-amber-500/10 hover:border-amber-500/60'
          : 'border-[var(--border)] hover:border-[var(--primary)]/40 hover:shadow-md'
      )}
    >
      {/* Top row: Board / Paper badge & Delete */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {examBoard && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
              {examBoard}
            </span>
          )}
          {paperName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono text-[var(--foreground-secondary)] bg-[var(--background-secondary)]">
              {paperName}
            </span>
          )}
          {targetGrade && (
            <Link
              href={
                countdown.subject_id
                  ? `/calculator?subject=${countdown.subject_id}`
                  : '/calculator'
              }
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
            >
              <Sparkles className="w-3 h-3" />
              Target: {targetGrade}
              <Calculator className="w-3 h-3" />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isUrgent && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {time.days === 0 ? 'Exam Today!' : `${time.days}d left`}
            </span>
          )}

          {canDelete && onDelete && countdown.id && (
            <button
              onClick={() => onDelete(countdown.id)}
              className="opacity-60 hover:opacity-100 p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Delete countdown"
              aria-label={`Delete ${title} countdown`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Title & Scheduled Date */}
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
          {title}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--foreground-secondary)]">
          <Calendar className="h-3.5 w-3.5 text-[var(--foreground-muted)] shrink-0" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="rounded-xl bg-[var(--background-secondary)]/80 border border-[var(--border)] p-3">
        {time.isPast ? (
          <div className="flex items-center justify-center gap-2 py-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            <Clock className="h-4 w-4" />
            <span>Exam concluded</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Days */}
            <div className="flex flex-col items-center bg-[var(--background-card)] py-1.5 px-1 rounded-lg border border-[var(--border)]/50">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[var(--foreground)] tracking-tight">
                {String(time.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[var(--foreground-muted)] tracking-wider mt-0.5">
                Days
              </span>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center bg-[var(--background-card)] py-1.5 px-1 rounded-lg border border-[var(--border)]/50">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[var(--foreground)] tracking-tight">
                {String(time.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[var(--foreground-muted)] tracking-wider mt-0.5">
                Hours
              </span>
            </div>

            {/* Mins */}
            <div className="flex flex-col items-center bg-[var(--background-card)] py-1.5 px-1 rounded-lg border border-[var(--border)]/50">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[var(--foreground)] tracking-tight">
                {String(time.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[var(--foreground-muted)] tracking-wider mt-0.5">
                Mins
              </span>
            </div>

            {/* Secs */}
            <div className="flex flex-col items-center bg-[var(--background-card)] py-1.5 px-1 rounded-lg border border-[var(--border)]/50">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[var(--primary)] tracking-tight">
                {String(time.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[var(--primary)]/80 tracking-wider mt-0.5">
                Secs
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
