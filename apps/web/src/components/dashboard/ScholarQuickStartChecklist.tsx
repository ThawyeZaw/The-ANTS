'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  GraduationCap,
  Calculator,
  Timer,
  Clock,
  BookOpen,
  Sparkles,
  ChevronRight,
  X,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistTask {
  id: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  xp: number;
}

const TASKS: ChecklistTask[] = [
  {
    id: 'enroll-subjects',
    title: 'Enroll your Cambridge or Edexcel subjects',
    description: 'Add your IGCSE or A-Level courses to activate your syllabus trackers.',
    href: '/curriculum',
    actionLabel: 'Browse Curriculums',
    icon: GraduationCap,
    xp: 20,
  },
  {
    id: 'try-calculator',
    title: 'Predict your target grade boundaries',
    description: 'Use the Grade Calculator to see raw thresholds and UMS requirements.',
    href: '/calculator',
    actionLabel: 'Open Calculator',
    icon: Calculator,
    xp: 20,
  },
  {
    id: 'try-pomodoro',
    title: 'Start a 25-minute Pomodoro focus block',
    description: 'Build your study streak with timed deep-work and ambient audio.',
    href: '/pomodoro',
    actionLabel: 'Launch Pomodoro',
    icon: Timer,
    xp: 20,
  },
  {
    id: 'set-countdown',
    title: 'Set an exam or target test countdown',
    description: 'Track days remaining until your official exam papers or IELTS.',
    href: '/countdown',
    actionLabel: 'Add Countdown',
    icon: Clock,
    xp: 20,
  },
  {
    id: 'track-topic',
    title: 'Check off your first syllabus subtopic',
    description: 'Open a subject workspace and mark a concept as understood.',
    href: '/curriculum',
    actionLabel: 'View Topics',
    icon: BookOpen,
    xp: 20,
  },
];

interface ScholarQuickStartChecklistProps {
  userId: string;
  onXpAwarded?: (newTotalXp: number) => void;
}

export function ScholarQuickStartChecklist({ userId, onXpAwarded }: ScholarQuickStartChecklistProps) {
  const storageKey = `ants_scholar_checklist_${userId}`;
  const dismissedKey = `ants_scholar_checklist_dismissed_${userId}`;

  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedCompleted = localStorage.getItem(storageKey);
      if (savedCompleted) {
        setCompletedIds(JSON.parse(savedCompleted));
      }
      const savedDismissed = localStorage.getItem(dismissedKey);
      if (savedDismissed === 'true') {
        setDismissed(true);
      }
    } catch {
      // ignore storage errors
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey, dismissedKey]);

  const toggleTask = (taskId: string) => {
    const isNowDone = !completedIds.includes(taskId);
    const updated = isNowDone
      ? [...completedIds, taskId]
      : completedIds.filter((id) => id !== taskId);

    setCompletedIds(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(dismissedKey, 'true');
    } catch {
      // ignore
    }
  };

  if (!isLoaded || dismissed) return null;

  const completedCount = completedIds.length;
  const totalTasks = TASKS.length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);
  const allDone = completedCount === totalTasks;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-background-card p-5 sm:p-6 shadow-xs transition-all duration-200">
      {/* Background ambient accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Getting Started Checklist
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
              Launch Your Academic Headquarters
            </h2>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-xl leading-relaxed">
              Complete these 5 quick steps to personalize your study hub, calibrate your targets, and earn up to <span className="font-mono font-bold text-primary">+150 XP</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            title="Dismiss checklist"
            className="p-1.5 rounded-xl text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              {completedCount} of {totalTasks} steps completed
            </span>
            <span className="font-mono font-bold text-primary tabular-nums">
              {progressPercent}% · +{completedCount * 20 + (allDone ? 50 : 0)} XP
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-background-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* All tasks completed celebration */}
        {allDone && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 animate-fade-in text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">All Quick-Start Steps Completed! 🎉</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400/80">
                  You earned +150 XP and unlocked the full study cockpit. You can dismiss this card at any time.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="shrink-0 rounded-xl bg-emerald-600 dark:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        )}

        {/* Tasks List */}
        <div className="divide-y divide-border/60 rounded-2xl border border-border bg-background-secondary/40 overflow-hidden">
          {TASKS.map((task) => {
            const isDone = completedIds.includes(task.id);
            const Icon = task.icon;

            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-center justify-between gap-3 p-3.5 sm:p-4 transition-colors',
                  isDone ? 'bg-background-secondary/20 opacity-75' : 'hover:bg-background-secondary/60'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="shrink-0 p-1 text-foreground-muted hover:text-primary transition-colors cursor-pointer"
                    aria-label={`Mark "${task.title}" as ${isDone ? 'incomplete' : 'complete'}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-primary fill-primary/15" />
                    ) : (
                      <Circle className="h-5 w-5 text-foreground-muted/60" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn('text-sm font-semibold text-foreground truncate', isDone && 'line-through text-foreground-muted')}>
                        {task.title}
                      </p>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-primary/10 text-primary">
                        +{task.xp} XP
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted truncate mt-0.5">
                      {task.description}
                    </p>
                  </div>
                </div>

                <Link
                  href={task.href}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-border bg-background-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary hover:shadow-xs transition-all"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">{task.actionLabel}</span>
                  <ChevronRight className="h-3 w-3 opacity-60" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
