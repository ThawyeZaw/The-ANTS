'use client';

import Link from 'next/link';
import { Zap, CalendarDays, Calculator, Timer, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolbarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const ITEMS: ToolbarItem[] = [
  {
    label: 'Library',
    href: '/library',
    icon: <Library className="h-5 w-5" />,
    color: 'text-primary bg-primary/15',
    bg: 'bg-primary/6 hover:bg-primary/12',
  },
  {
    label: 'Timetable',
    href: '/timetable',
    icon: <CalendarDays className="h-5 w-5" />,
    color: 'text-indigo-500 bg-indigo-500/15',
    bg: 'bg-indigo-500/6 hover:bg-indigo-500/12',
  },
  {
    label: 'Calculator',
    href: '/calculator',
    icon: <Calculator className="h-5 w-5" />,
    color: 'text-emerald-500 bg-emerald-500/15',
    bg: 'bg-emerald-500/6 hover:bg-emerald-500/12',
  },
  {
    label: 'Pomodoro',
    href: '/pomodoro',
    icon: <Timer className="h-5 w-5" />,
    color: 'text-rose-500 bg-rose-500/15',
    bg: 'bg-rose-500/6 hover:bg-rose-500/12',
  },
];

export default function QuickAccessToolbar() {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border)]',
        'bg-[var(--background-card)] p-4'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          Quick Access
        </span>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3.5',
              'hover:shadow-md hover:-translate-y-0.5',
              'transition-all duration-200',
              'group flex-1',
              item.bg
            )}
          >
            <span
              className={cn(
                'inline-flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
                item.color
              )}
            >
              {item.icon}
            </span>
            <span className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
