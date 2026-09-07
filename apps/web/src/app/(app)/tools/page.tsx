'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Tools Hub Page
// Route: /tools — guest-accessible; Pomodoro tryable without login.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import {
  Clock,
  Calculator,
  CalendarDays,
  Timer,
  ArrowRight,
  Wrench,
  Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface ToolItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  guestOk?: boolean;
}

const TOOLS: ToolItem[] = [
  {
    id: 'pomodoro',
    label: 'Pomodoro Timer',
    description: 'Try vibes and focus mode — no account needed. Sign up later to sync streaks.',
    href: '/pomodoro',
    icon: Timer,
    badge: 'Try free',
    guestOk: true,
  },
  {
    id: 'countdown',
    label: 'Exam Countdown',
    description: 'Track time remaining until target exam papers and assessments.',
    href: '/countdown',
    icon: Clock,
    badge: 'Essential',
  },
  {
    id: 'calculator',
    label: 'Grade Calculator',
    description: 'Predict, calculate, and target your subject grades with ease.',
    href: '/calculator',
    icon: Calculator,
  },
  {
    id: 'timetable',
    label: 'Study Timetable',
    description: 'Schedule revision slots and manage your weekly study plan.',
    href: '/timetable',
    icon: CalendarDays,
  },
];

export default function ToolsHubPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-background-card p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Wrench className="h-3.5 w-3.5" />
            Productivity Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Study Tools &amp; Calculators
          </h1>
          <p className="text-sm text-foreground-muted leading-relaxed">
            {isAuthenticated
              ? 'Essential interactive tools designed to keep your revision structured and maximize daily focus.'
              : 'Try the Pomodoro focus timer without an account. Sign in for the full toolkit.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOOLS.map((tool) => {
          const locked = !isAuthenticated && !tool.guestOk;
          const href = locked ? '/login' : tool.href;

          return (
            <Link
              key={tool.id}
              href={href}
              className={cn(
                'group relative flex flex-col justify-between p-5 rounded-2xl border border-border',
                'bg-background-card hover:bg-background-secondary hover:border-border-hover',
                'transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                locked && 'opacity-80',
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <AppIcon icon={tool.icon} size="lg" tone="secondary" frame="soft" />
                  {tool.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {tool.label}
                </h2>
                <p className="text-xs text-foreground-muted mt-1.5 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-medium text-primary">
                <span className="inline-flex items-center gap-1.5">
                  {locked && <Lock className="h-3.5 w-3.5" />}
                  {locked ? 'Sign in to use' : tool.guestOk && !isAuthenticated ? 'Try without account' : 'Open Tool'}
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
