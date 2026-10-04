'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  syncScholarChecklist,
  type ScholarChecklistTaskId,
} from '@/actions/scholar-checklist';
import { useGamificationFeedback } from '@/components/gamification/GamificationFeedbackProvider';

interface ChecklistTask {
  id: ScholarChecklistTaskId;
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
  const dismissedKey = `ants_scholar_checklist_dismissed_${userId}`;
  const { handleAwardResult } = useGamificationFeedback();

  const [dismissed, setDismissed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [completedMap, setCompletedMap] = useState<Record<ScholarChecklistTaskId, boolean>>({
    'enroll-subjects': false,
    'try-calculator': false,
    'try-pomodoro': false,
    'set-countdown': false,
    'track-topic': false,
  });

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const { progress, lastAward } = await syncScholarChecklist();
      setCompletedMap(progress.tasks);
      if (lastAward) {
        handleAwardResult(lastAward);
        if (lastAward.totalXp != null) onXpAwarded?.(lastAward.totalXp);
      }
    } catch {
      // keep last known state
    } finally {
      setSyncing(false);
    }
  }, [handleAwardResult, onXpAwarded]);

  useEffect(() => {
    try {
      if (localStorage.getItem(dismissedKey) === 'true') setDismissed(true);
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }, [dismissedKey]);

  useEffect(() => {
    if (!isLoaded || dismissed) return;
    void refresh();
  }, [isLoaded, dismissed, refresh]);

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(`ants_checklist_collapsed_${userId}`) === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(`ants_checklist_collapsed_${userId}`, String(next));
    } catch {}
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

  const completedCount = TASKS.filter((t) => completedMap[t.id]).length;
  const totalTasks = TASKS.length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);
  const allDone = completedCount === totalTasks;

  // Auto-hide once all tasks are complete
  if (allDone) return null;

  if (collapsed) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-background-card px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs font-semibold text-foreground truncate">
            Quick-Start Checklist: <span className="font-normal text-foreground-muted">{completedCount}/{totalTasks} done</span>
          </p>
          <span className="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 shrink-0">
            {progressPercent}%
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={toggleCollapse}
            className="text-xs font-semibold text-primary hover:underline px-2 py-1"
          >
            Show
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            title="Dismiss checklist"
            aria-label="Dismiss checklist"
            className="p-1 rounded-lg text-foreground-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-background-card p-5 sm:p-6 shadow-xs transition-all duration-200">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative z-10 space-y-4">
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
              Complete these 5 steps in the app — progress syncs automatically. Earn up to{' '}
              <span className="font-mono font-bold text-primary">+150 XP</span>.
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleCollapse}
              className="text-xs font-semibold text-foreground-muted hover:text-foreground px-2 py-1 rounded-lg hover:bg-background-secondary transition-colors"
            >
              Minimize
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              title="Dismiss checklist"
              aria-label="Dismiss checklist"
              className="p-1.5 rounded-xl text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-2">
              {completedCount} of {totalTasks} steps completed
              {syncing && <Loader2 className="h-3 w-3 animate-spin text-foreground-muted" />}
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

        {allDone && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 animate-fade-in text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">All Quick-Start Steps Completed!</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400/80">
                  +150 XP awarded. You can dismiss this card anytime.
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

        <div className="divide-y divide-border/60 rounded-2xl border border-border bg-background-secondary/40 overflow-hidden">
          {TASKS.map((task) => {
            const isDone = completedMap[task.id];
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
                  <span className="shrink-0 p-1" aria-hidden>
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-primary fill-primary/15" />
                    ) : (
                      <Circle className="h-5 w-5 text-foreground-muted/60" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={cn(
                          'text-sm font-semibold text-foreground truncate',
                          isDone && 'line-through text-foreground-muted'
                        )}
                      >
                        {task.title}
                      </p>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-primary/10 text-primary">
                        +{task.xp} XP
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted truncate mt-0.5">{task.description}</p>
                  </div>
                </div>

                <Link
                  href={task.href}
                  onClick={() => setTimeout(() => void refresh(), 1500)}
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
