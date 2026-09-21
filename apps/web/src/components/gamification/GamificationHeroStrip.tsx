'use client';

import { Award } from 'lucide-react';
import { StreakIndicator } from './StreakIndicator';
import { levelProgress } from '@/lib/gamification/levels';
import { cn } from '@/lib/utils';

interface GamificationHeroStripProps {
  level: number;
  totalXp: number;
  rankTitle: string;
  currentStreak: number;
  longestStreak?: number;
  className?: string;
}

export function GamificationHeroStrip({
  level,
  totalXp,
  rankTitle,
  currentStreak,
  longestStreak,
  className,
}: GamificationHeroStripProps) {
  const progress = levelProgress(totalXp);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-5 rounded-2xl bg-background-secondary border border-border shrink-0',
        className
      )}
    >
      <StreakIndicator
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        compact
      />

      <div className="space-y-1.5 min-w-[170px] flex-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-foreground flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-primary" />
            Level {level}
          </span>
          <span className="text-[11px] font-mono text-primary font-bold">{totalXp} XP</span>
        </div>
        <div className="h-2 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-foreground-muted">
          <span>{rankTitle}</span>
          <span className="font-mono">{progress.xpToNextLevel} XP to next level</span>
        </div>
      </div>
    </div>
  );
}
