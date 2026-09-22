'use client';

import {
  Timer,
  GraduationCap,
  BookMarked,
  Calculator,
  Clock,
  StickyNote,
  Layers,
  HelpCircle,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURES: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}> = [
  {
    icon: Calculator,
    title: 'Grade calculator',
    description: 'Predict overall grades and UMS marks against official thresholds.',
  },
  {
    icon: Clock,
    title: 'Pomodoro timer',
    description: 'Timed deep-work intervals linked to your revision subjects.',
  },
  {
    icon: GraduationCap,
    title: 'Curriculum hub',
    description: 'Enroll CAIE and Edexcel subjects and track syllabus progress.',
  },
  {
    icon: BookMarked,
    title: 'Past papers',
    description: 'Practice and record component marks against official boundaries.',
  },
  {
    icon: Timer,
    title: 'Smart timetable',
    description: 'Time-blocking weekly scheduler with integrated todo tasks.',
  },
  {
    icon: Send,
    title: 'Exam countdown',
    description: 'Live precision timers for Cambridge, Edexcel & custom tests.',
  },
  {
    icon: StickyNote,
    title: 'Syllabus notes',
    description: 'In-app revision notes currently in active creation.',
    badge: 'Soon',
  },
  {
    icon: Layers,
    title: 'Flashcards',
    description: 'Spaced-repetition card decks in active development.',
    badge: 'Soon',
  },
  {
    icon: HelpCircle,
    title: 'Quizzes',
    description: 'Interactive self-check quizzes coming to your enrolled subjects.',
    badge: 'Soon',
  },
];

/** Compact 3×3 feature grid — titles only; descriptions on hover via title. */
export function FeatureGrid({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2.5', className)}>
      <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
        Your Academic Toolkit
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              title={feature.description}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background-card px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </div>
                <p className="truncate text-xs font-semibold text-foreground">
                  {feature.title}
                </p>
              </div>
              {feature.badge && (
                <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {feature.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
