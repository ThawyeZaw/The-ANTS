'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro ModeTabs
// Segmented pill buttons to switch between Focus / Short Break / Long Break.
// ──────────────────────────────────────────────────────────────────────────────

import { Brain, Coffee, BatteryFull } from 'lucide-react';
import type { TimerPhase, PomodoroSettings } from '@/constants/pomodoro';

interface ModeTab {
  phase: TimerPhase;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  minutesKey: keyof Pick<PomodoroSettings, 'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes'>;
}

const MODES: ModeTab[] = [
  {
    phase: 'focus',
    label: 'Focus',
    shortLabel: 'Focus',
    icon: <Brain size={14} />,
    color: '#6366F1',
    minutesKey: 'focusMinutes',
  },
  {
    phase: 'short_break',
    label: 'Short Break',
    shortLabel: 'Break',
    icon: <Coffee size={14} />,
    color: '#10B981',
    minutesKey: 'shortBreakMinutes',
  },
  {
    phase: 'long_break',
    label: 'Long Break',
    shortLabel: 'Long',
    icon: <BatteryFull size={14} />,
    color: '#06B6D4',
    minutesKey: 'longBreakMinutes',
  },
];

interface ModeTabsProps {
  phase: TimerPhase;
  settings: PomodoroSettings;
  onSwitch: (phase: TimerPhase) => void;
}

export default function ModeTabs({ phase, settings, onSwitch }: ModeTabsProps) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-2xl border"
      style={{
        backgroundColor: 'var(--background-secondary)',
        borderColor: 'var(--border)',
      }}
      role="radiogroup"
      aria-label="Timer mode"
    >
      {MODES.map((mode) => {
        const isActive = phase === mode.phase;
        return (
          <button
            key={mode.phase}
            role="radio"
            aria-checked={isActive}
            onClick={() => !isActive && onSwitch(mode.phase)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 focus-ring"
            style={{
              color: isActive ? mode.color : 'var(--foreground-muted)',
              backgroundColor: isActive ? `${mode.color}18` : 'transparent',
              boxShadow: isActive ? `0 0 0 1px ${mode.color}40` : 'none',
            }}
          >
            {mode.icon}
            <span className="hidden sm:inline">{mode.label}</span>
            <span className="sm:hidden">{mode.shortLabel}</span>
            <span
              className="hidden sm:inline text-[10px] opacity-50 ml-0.5 tabular-nums"
              style={{ color: isActive ? mode.color : 'inherit' }}
            >
              {settings[mode.minutesKey]}m
            </span>
          </button>
        );
      })}
    </div>
  );
}
