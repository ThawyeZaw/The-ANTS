'use client';

import { Brain, Coffee, BatteryFull } from 'lucide-react';
import type { TimerPhase, PomodoroSettings } from '@/constants/pomodoro';
import { cn } from '@/lib/utils';

interface ModeTab {
  phase: TimerPhase;
  label: string;
  icon: React.ReactNode;
  color: string;
  minutesKey: keyof Pick<PomodoroSettings, 'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes'>;
}

const MODES: ModeTab[] = [
  {
    phase: 'focus',
    label: 'Focus',
    icon: <Brain size={14} strokeWidth={2.25} />,
    color: '#f59e0b',
    minutesKey: 'focusMinutes',
  },
  {
    phase: 'short_break',
    label: 'Break',
    icon: <Coffee size={14} strokeWidth={2.25} />,
    color: '#10b981',
    minutesKey: 'shortBreakMinutes',
  },
  {
    phase: 'long_break',
    label: 'Long',
    icon: <BatteryFull size={14} strokeWidth={2.25} />,
    color: '#818cf8',
    minutesKey: 'longBreakMinutes',
  },
];

interface ModeTabsProps {
  phase: TimerPhase;
  settings: PomodoroSettings;
  onSwitch: (phase: TimerPhase) => void;
  className?: string;
  surface?: 'theme' | 'stage';
}

export default function ModeTabs({
  phase,
  settings,
  onSwitch,
  className,
  surface = 'theme',
}: ModeTabsProps) {
  const onStage = surface === 'stage';

  return (
    <div
      className={cn('flex flex-wrap items-center justify-center gap-2 overflow-visible sm:gap-3', className)}
      role="radiogroup"
      aria-label="Timer mode"
    >
      {MODES.map((mode) => {
        const isActive = phase === mode.phase;
        return (
          <button
            key={mode.phase}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => !isActive && onSwitch(mode.phase)}
            className={cn(
              'flex min-w-0 items-center justify-center gap-1 overflow-visible rounded-full px-2.5 py-1.5 text-[11px] font-bold leading-normal transition-colors duration-200 focus-ring sm:gap-1.5 sm:px-4 sm:py-2 sm:text-xs',
              !isActive && !onStage && 'text-foreground-muted',
              isActive && !onStage && 'bg-background-secondary text-foreground',
              isActive && onStage && 'bg-white/15',
              onStage && 'pomo-read',
            )}
            style={{
              color: isActive
                ? mode.color
                : onStage
                  ? 'rgba(255,255,255,0.78)'
                  : undefined,
            }}
          >
            <span className="shrink-0">{mode.icon}</span>
            <span>{mode.label}</span>
            <span className="hidden tabular-nums opacity-70 sm:inline">
              {settings[mode.minutesKey]}m
            </span>
          </button>
        );
      })}
    </div>
  );
}
