'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  amount: number;
  source: string;
  description?: string | null;
  earnedAt?: Date | null;
}

interface RecentActivityFeedProps {
  items: ActivityItem[];
  className?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  past_paper: 'Past paper',
  pomodoro: 'Focus block',
  lesson: 'Syllabus topic',
  timetable: 'Timetable',
};

export function RecentActivityFeed({ items, className }: RecentActivityFeedProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        Recent XP Activity
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background-secondary/50 px-3 py-2.5 text-xs"
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">
                {item.description || SOURCE_LABELS[item.source] || item.source}
              </p>
              <p className="text-[10px] text-foreground-muted mt-0.5">
                {SOURCE_LABELS[item.source] || item.source}
              </p>
            </div>
            <span className="font-mono font-bold text-primary shrink-0">+{item.amount} XP</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
