'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Tools Hub Page
// Route: /tools — Central dashboard for study & productivity tools.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import {
  Clock,
  Calculator,
  CalendarDays,
  Timer,
  ArrowRight,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accentColor: string;
  badge?: string;
}

const TOOLS: ToolItem[] = [
  {
    id: 'countdown',
    label: 'Exam Countdown',
    description: 'Track time remaining until target exam papers and assessments.',
    href: '/countdown',
    icon: <Clock className="h-6 w-6" />,
    accentColor: 'from-sky-500 to-blue-600',
    badge: 'Essential',
  },
  {
    id: 'calculator',
    label: 'Grade Calculator',
    description: 'Predict, calculate, and target your subject grades with ease.',
    href: '/calculator',
    icon: <Calculator className="h-6 w-6" />,
    accentColor: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'timetable',
    label: 'Study Timetable',
    description: 'Schedule revision slots and manage your weekly study plan.',
    href: '/timetable',
    icon: <CalendarDays className="h-6 w-6" />,
    accentColor: 'from-indigo-500 to-violet-600',
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro Timer',
    description: 'Maintain high focus with customizable study and break intervals.',
    href: '/pomodoro',
    icon: <Timer className="h-6 w-6" />,
    accentColor: 'from-rose-500 to-pink-600',
    badge: 'Popular',
  },
];

export default function ToolsHubPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background-card to-accent/5 p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Wrench className="h-3.5 w-3.5" />
            Productivity Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Study Tools &amp; Calculators
          </h1>
          <p className="text-sm text-foreground-muted leading-relaxed">
            Essential interactive tools designed to keep your revision structured, track exam timelines, and maximize daily focus.
          </p>
        </div>
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className={cn(
              'group relative flex flex-col justify-between p-5 rounded-2xl border border-border',
              'bg-background-card hover:bg-background-secondary hover:border-border-hover',
              'transition-all duration-200 shadow-xs hover:shadow-md'
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className={cn(
                    'inline-flex items-center justify-center p-3 rounded-xl',
                    'bg-gradient-to-br text-white shadow-sm',
                    tool.accentColor
                  )}
                >
                  {tool.icon}
                </div>
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
              <span>Open Tool</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
