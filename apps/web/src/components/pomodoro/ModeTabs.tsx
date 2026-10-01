'use client';

import { Brain, Coffee, BatteryFull } from 'lucide-react';
import type { TimerPhase, PomodoroSettings } from '@/constants/pomodoro';
import FocusDurationDropdown from '@/components/pomodoro/FocusDurationDropdown';
import { cn } from '@/lib/utils';

interface ModeTabsProps {
  phase: TimerPhase;
  settings: PomodoroSettings;
  onSwitch: (phase: TimerPhase) => void;
  onUpdateSettings?: (partial: Partial<PomodoroSettings>) => void;
  className?: string;
  surface?: 'theme' | 'stage';
}

export default function ModeTabs({
  phase,
  settings,
  onSwitch,
  onUpdateSettings,
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
      {/* Focus tab with custom glassmorphic duration dropdown */}
      <div
        className={cn(
          'flex min-w-0 items-center justify-center rounded-full transition-all duration-200',
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
        <button
          type="button"
          role="radio"
          aria-checked={phase === 'focus'}
          onClick={() => phase !== 'focus' && onSwitch('focus')}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold sm:px-3.5 sm:py-2 focus:outline-none"
        >
          <Brain className="h-3.5 w-3.5 shrink-0" />
          <span>Focus</span>
        </button>

        {/* Vertical divider */}
        <span
          className={cn(
            'h-3.5 w-[1px] shrink-0 opacity-25',
            onStage ? 'bg-white' : 'bg-current',
          )}
          aria-hidden
        />

        {/* Custom glassmorphic focus duration dropdown */}
        <div className="px-1">
          <FocusDurationDropdown
            value={settings.focusMinutes}
            onChange={(mins) => {
              onUpdateSettings?.({ focusMinutes: mins });
              if (phase !== 'focus') {
                onSwitch('focus');
              }
            }}
            surface={surface}
            variant="inline"
          />
        </div>
      </div>

      {/* Short Break */}
      <button
        type="button"
        role="radio"
        aria-checked={phase === 'short_break'}
        onClick={() => phase !== 'short_break' && onSwitch('short_break')}
        className={cn(
          'flex min-w-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-200 focus-ring sm:px-4 sm:py-2',
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
          'flex min-w-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-200 focus-ring sm:px-4 sm:py-2',
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
    </div>
  );
}
