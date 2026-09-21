'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Student Badge Shelf Component
// Displays earned and locked achievements with unlock conditions
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Timer,
  CheckCircle2,
  Flame,
  Zap,
  GraduationCap,
  Sparkles,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BadgeDefinition } from '@/lib/gamification/badges';

interface BadgeWithStatus extends BadgeDefinition {
  unlocked: boolean;
  earnedAt?: Date | null;
}

interface BadgeShelfProps {
  badges: BadgeWithStatus[];
  className?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Award,
  Timer,
  CheckCircle2,
  Flame,
  Zap,
  GraduationCap,
  Sparkles,
};

export function BadgeShelf({ badges, className }: BadgeShelfProps) {
  const [activeBadge, setActiveBadge] = useState<BadgeWithStatus | null>(null);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-primary" />
          Scholar Milestones & Badges
        </h4>
        <span className="text-xs font-mono text-foreground-secondary">
          {badges.filter((b) => b.unlocked).length} / {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {badges.map((b) => {
          const IconComponent = ICON_MAP[b.iconName] || Award;

          return (
            <button
              key={b.key}
              type="button"
              onClick={() => setActiveBadge(b)}
              className={cn(
                'group relative flex flex-col items-center text-center p-3.5 rounded-2xl border transition-all duration-200',
                b.unlocked
                  ? 'bg-background-card border-border hover:border-primary/40 hover:shadow-xs cursor-pointer'
                  : 'bg-background-secondary/40 border-border/60 opacity-60 hover:opacity-80 cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-105',
                  b.unlocked
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
                    : 'bg-background-secondary text-foreground-muted border border-border'
                )}
              >
                {b.unlocked ? (
                  <IconComponent className="w-5 h-5" />
                ) : (
                  <Lock className="w-4 h-4 text-foreground-muted" />
                )}
              </div>

              <span className="text-xs font-bold text-foreground line-clamp-1">
                {b.title}
              </span>
              <span className="text-[10px] text-foreground-muted line-clamp-1 mt-0.5">
                {b.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Badge Details Modal / Flyout */}
      {activeBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveBadge(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-background-card p-6 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'w-16 h-16 rounded-2xl mx-auto flex items-center justify-center',
                activeBadge.unlocked
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-md'
                  : 'bg-background-secondary text-foreground-muted border border-border'
              )}
            >
              {activeBadge.unlocked ? (
                React.createElement(ICON_MAP[activeBadge.iconName] || Award, {
                  className: 'w-8 h-8',
                })
              ) : (
                <Lock className="w-8 h-8 text-foreground-muted" />
              )}
            </div>

            <div className="space-y-1">
              <span
                className={cn(
                  'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  activeBadge.unlocked
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-background-secondary text-foreground-muted border border-border'
                )}
              >
                {activeBadge.unlocked ? 'Unlocked Milestone' : 'Locked Milestone'}
              </span>
              <h3 className="text-lg font-bold text-foreground">
                {activeBadge.title}
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                {activeBadge.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveBadge(null)}
              className="w-full py-2.5 rounded-xl bg-background-secondary text-foreground text-xs font-bold hover:bg-background-secondary/80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
