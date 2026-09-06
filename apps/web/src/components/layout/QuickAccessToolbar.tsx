'use client';

import Link from 'next/link';
import { Zap, CalendarDays, Calculator, Timer, Library } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import { cn } from '@/lib/utils';

interface ToolbarItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ITEMS: ToolbarItem[] = [
  { label: 'Library', href: '/library', icon: Library },
  { label: 'Timetable', href: '/timetable', icon: CalendarDays },
  { label: 'Calculator', href: '/calculator', icon: Calculator },
  { label: 'Pomodoro', href: '/pomodoro', icon: Timer },
];

export default function QuickAccessToolbar() {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border',
        'bg-background-card p-4'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <AppIcon icon={Zap} size="sm" tone="primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Quick Access
        </span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3.5 py-3',
              'bg-background-secondary/60 hover:bg-background-secondary',
              'transition-colors duration-200',
              'group flex-1 min-w-[135px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
          >
            <AppIcon icon={item.icon} size="md" tone="secondary" frame="soft" />
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
