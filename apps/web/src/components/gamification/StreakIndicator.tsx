'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Streak Indicator Component
// ──────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak?: number;
  compact?: boolean;
  className?: string;
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  compact = false,
  className,
}: StreakIndicatorProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold font-mono',
          className
        )}
      >
        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
        <span>{currentStreak}d</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400',
        className
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
        <Flame className="w-6 h-6 fill-amber-500 text-amber-500 animate-pulse" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-mono font-extrabold text-foreground leading-none">
            {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-[11px] text-foreground-muted font-medium block mt-0.5">
          {longestStreak ? `Best streak: ${longestStreak} days` : 'Daily study habit'}
        </span>
      </div>
    </div>
  );
}
