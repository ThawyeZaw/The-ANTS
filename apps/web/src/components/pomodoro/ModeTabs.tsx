'use client';

import { Brain, Coffee, BatteryFull, GraduationCap, Settings2 } from 'lucide-react';
import type { TimerPhase, PomodoroSettings, PastPaperSessionConfig } from '@/constants/pomodoro';
import { cn } from '@/lib/utils';

interface ModeTabsProps {
  phase: TimerPhase;
  settings: PomodoroSettings;
  pastPaperConfig?: PastPaperSessionConfig;
  onSwitch: (phase: TimerPhase) => void;
  onOpenPaperPicker?: () => void;
  className?: string;
  surface?: 'theme' | 'stage';
}

export default function ModeTabs({
  phase,
  settings,
  pastPaperConfig,
  onSwitch,
  onOpenPaperPicker,
  className,
  surface = 'theme',
}: ModeTabsProps) {
  const onStage = surface === 'stage';

  return (
    <div
      className={cn('flex flex-wrap items-center justify-center gap-1.5 overflow-visible sm:gap-2', className)}
      role="radiogroup"
      aria-label="Timer mode"
    >
      {/* Focus */}
      <button
        type="button"
        role="radio"
        aria-checked={phase === 'focus'}
        onClick={() => phase !== 'focus' && onSwitch('focus')}
        className={cn(
          'flex min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 focus-ring sm:px-4 sm:py-2',
          phase === 'focus'
            ? onStage
              ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/40 shadow-sm'
              : 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30'
            : onStage
              ? 'text-white/75 hover:bg-white/10 hover:text-white'
              : 'text-foreground-muted hover:bg-foreground/5 hover:text-foreground',
          onStage && 'pomo-read',
        )}
      >
        <Brain className="h-3.5 w-3.5 shrink-0" />
        <span>Focus</span>
        <span className="opacity-70 font-mono text-[11px]">{settings.focusMinutes}m</span>
      </button>

      {/* Short Break */}
      <button
        type="button"
        role="radio"
        aria-checked={phase === 'short_break'}
        onClick={() => phase !== 'short_break' && onSwitch('short_break')}
        className={cn(
          'flex min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 focus-ring sm:px-4 sm:py-2',
          phase === 'short_break'
            ? onStage
              ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-400/40 shadow-sm'
              : 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30'
            : onStage
              ? 'text-white/75 hover:bg-white/10 hover:text-white'
              : 'text-foreground-muted hover:bg-foreground/5 hover:text-foreground',
          onStage && 'pomo-read',
        )}
      >
        <Coffee className="h-3.5 w-3.5 shrink-0" />
        <span>Break</span>
        <span className="opacity-70 font-mono text-[11px]">{settings.shortBreakMinutes}m</span>
      </button>

      {/* Long Break */}
      <button
        type="button"
        role="radio"
        aria-checked={phase === 'long_break'}
        onClick={() => phase !== 'long_break' && onSwitch('long_break')}
        className={cn(
          'flex min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 focus-ring sm:px-4 sm:py-2',
          phase === 'long_break'
            ? onStage
              ? 'bg-indigo-500/25 text-indigo-300 ring-1 ring-indigo-400/40 shadow-sm'
              : 'bg-indigo-500/15 text-indigo-500 ring-1 ring-indigo-500/30'
            : onStage
              ? 'text-white/75 hover:bg-white/10 hover:text-white'
              : 'text-foreground-muted hover:bg-foreground/5 hover:text-foreground',
          onStage && 'pomo-read',
        )}
      >
        <BatteryFull className="h-3.5 w-3.5 shrink-0" />
        <span>Long</span>
        <span className="opacity-70 font-mono text-[11px]">{settings.longBreakMinutes}m</span>
      </button>

      {/* Past Paper Exam Mode */}
      <div className="flex items-center">
        <button
          type="button"
          role="radio"
          aria-checked={phase === 'past_paper'}
          onClick={() => phase !== 'past_paper' && onSwitch('past_paper')}
          className={cn(
            'flex min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 focus-ring sm:px-4 sm:py-2',
            phase === 'past_paper'
              ? onStage
                ? 'bg-cyan-500/30 text-cyan-200 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-500/20'
                : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/40'
              : onStage
                ? 'text-cyan-300/80 hover:bg-white/10 hover:text-cyan-200'
                : 'text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/10',
            onStage && 'pomo-read',
          )}
        >
          <GraduationCap className="h-3.5 w-3.5 shrink-0" />
          <span>Past Paper</span>
          {pastPaperConfig && (
            <span className="font-mono text-[11px] opacity-80">
              {pastPaperConfig.durationMinutes}m
            </span>
          )}
        </button>

        {phase === 'past_paper' && onOpenPaperPicker && (
          <button
            type="button"
            onClick={onOpenPaperPicker}
            title="Configure exam paper"
            className={cn(
              'ml-1 flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-105 focus-ring',
              onStage ? 'text-white/80 hover:bg-white/15' : 'text-foreground-muted hover:bg-foreground/10',
            )}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
