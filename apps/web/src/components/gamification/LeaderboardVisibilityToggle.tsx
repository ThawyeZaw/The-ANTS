'use client';

import { useState, useTransition } from 'react';
import { Trophy } from 'lucide-react';
import { setLeaderboardVisibility } from '@/actions/gamification';
import { cn } from '@/lib/utils';

interface LeaderboardVisibilityToggleProps {
  userId: string;
  initialVisible: boolean;
  className?: string;
  compact?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export function LeaderboardVisibilityToggle({
  userId,
  initialVisible,
  className,
  compact = false,
  onVisibilityChange,
}: LeaderboardVisibilityToggleProps) {
  const [visible, setVisible] = useState(initialVisible);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !visible;
    setVisible(next);
    startTransition(async () => {
      const res = await setLeaderboardVisibility(next);
      if (!res.success) {
        setVisible(!next);
      } else {
        onVisibilityChange?.(next);
      }
    });
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-2xl border border-border bg-background-secondary/60 px-4 py-3',
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground">
            {compact ? 'Leaderboard visibility' : 'Show me on Scholar Leaderboard'}
          </p>
          <p className="text-[11px] text-foreground-muted mt-0.5 leading-relaxed">
            When off, you are hidden from rankings and public scholar stats.
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={visible}
        disabled={pending}
        onClick={toggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          visible ? 'bg-primary' : 'bg-border',
          pending && 'opacity-60'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform',
            visible ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
