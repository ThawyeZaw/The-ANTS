'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — User Level & XP Progress Card
// ──────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserLevelCardProps {
  level: number;
  totalXp: number;
  rankTitle: string;
  className?: string;
}

export function UserLevelCard({
  level,
  totalXp,
  rankTitle,
  className,
}: UserLevelCardProps) {
  const currentLevelBase = (level - 1) * 100;
  const currentLevelProgress = Math.max(0, totalXp - currentLevelBase);
  const xpNeeded = 100 - currentLevelProgress;
  const percentage = Math.min(100, Math.max(0, currentLevelProgress));

  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-background-card p-5 sm:p-6 space-y-4 shadow-xs',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Level {level}
              </span>
              <span className="text-foreground-muted text-xs">•</span>
              <span className="text-xs font-semibold text-foreground-secondary">
                {rankTitle}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-foreground tracking-tight">
              Academic Scholar
            </h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider block">
            Total XP
          </span>
          <span className="text-xl font-bold font-mono text-foreground">
            {totalXp}{' '}
            <span className="text-xs font-normal text-primary">XP</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-foreground-muted font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Level Progress
          </span>
          <span className="font-mono text-foreground font-semibold">
            {currentLevelProgress} / 100 XP
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-background-secondary overflow-hidden border border-border">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-foreground-muted">
          <span>Level {level}</span>
          <span className="font-mono">{xpNeeded} XP to Level {level + 1}</span>
        </div>
      </div>
    </div>
  );
}
