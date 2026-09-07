'use client';

import Link from 'next/link';
import { Zap, CalendarDays, Calculator, Timer, Library, ChevronRight } from 'lucide-react';
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
    <div className="dash-panel p-4 h-full">
      <div className="flex items-center gap-2 mb-3.5">
        <AppIcon icon={Zap} size="sm" tone="primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Quick Access
        </span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'dash-quick-tile focus-ring group',
              'dash-rise',
              i === 0 && 'dash-rise-delay-1',
              i === 1 && 'dash-rise-delay-2',
              i === 2 && 'dash-rise-delay-3',
              i === 3 && 'dash-rise-delay-4'
            )}
          >
            <AppIcon icon={item.icon} size="md" tone="secondary" frame="soft" />
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
              {item.label}
            </span>
            <ChevronRight className="dash-quick-tile__chevron h-4 w-4 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
