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
}> = [
  {
    icon: Timer,
    title: 'Exam countdown',
    description: 'Live timers for every paper on your Myanmar timetable.',
  },
  {
    icon: GraduationCap,
    title: 'Curriculum hub',
    description: 'Enroll CAIE and Edexcel subjects and track syllabus progress.',
  },
  {
    icon: BookMarked,
    title: 'Past papers',
    description: 'Practice and record scores against official boundaries.',
  },
  {
    icon: Calculator,
    title: 'Grade calculator',
    description: 'Predict overall grades from component marks and UMS.',
  },
  {
    icon: Clock,
    title: 'Pomodoro',
    description: 'Focused study sessions linked to your subjects.',
  },
  {
    icon: StickyNote,
    title: 'Notes',
    description: 'Capture syllabus notes in-app as you revise.',
  },
  {
    icon: Layers,
    title: 'Flashcards',
    description: 'Spaced-repetition cards for quick recall.',
  },
  {
    icon: HelpCircle,
    title: 'Quizzes',
    description: 'Self-check quizzes rebuilt for your enrolled subjects.',
  },
  {
    icon: Send,
    title: 'Telegram reminders',
    description: 'Exam countdown alerts delivered to Telegram.',
  },
];

/** Compact 3×3 feature grid — titles only; descriptions on hover via title. */
export function FeatureGrid({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2.5', className)}>
      <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
        What you get
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              title={feature.description}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-background-card px-3 py-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </div>
              <p className="truncate text-xs font-semibold text-foreground">
                {feature.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
