'use client';

import React from 'react';
import {
  Award,
  BookOpen,
  Timer,
  CheckCircle2,
  Flame,
  Zap,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BadgeDefinition } from '@/lib/gamification/badges';

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

interface BadgeUnlockModalProps {
  badge: BadgeDefinition | null;
  onClose: () => void;
}

export function BadgeUnlockModal({ badge, onClose }: BadgeUnlockModalProps) {
  if (!badge) return null;

  const IconComponent = ICON_MAP[badge.iconName] || Award;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-unlock-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-primary/30 bg-background-card p-6 shadow-2xl text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shadow-md">
          <IconComponent className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Milestone Unlocked
          </span>
          <h3 id="badge-unlock-title" className="text-lg font-bold text-foreground">
            {badge.title}
          </h3>
          <p className="text-xs text-foreground-muted leading-relaxed">{badge.description}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
