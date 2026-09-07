// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro Timer Constants & Types
// ──────────────────────────────────────────────────────────────────────────────

import type { VibeId } from '@/constants/pomodoro-vibes';

export type TimerPhase = 'focus' | 'short_break' | 'long_break';

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  vibeId: VibeId | null;
  volume: number;
  autoStartNext: boolean;
  notifyChime: boolean;
}

export interface ActiveSessionSnapshot {
  phase: TimerPhase;
  isPaused: boolean;
  endsAt: number | null;
  remainingMsWhenPaused: number | null;
  cyclesCompletedToday: number;
  sessionLabel: string | null;
  focusStartedAt: number | null;
}

export interface PomodoroDailyEntry {
  date: string;
  focusMinutes: number;
  sessionsCompleted: number;
}

export interface PomodoroStatsLog {
  entries: PomodoroDailyEntry[];
  currentStreak: number;
  longestStreak: number;
  allTimeFocusMinutes: number;
}

export const POMODORO_DEFAULTS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  vibeId: 'rain',
  volume: 0.4,
  autoStartNext: false,
  notifyChime: true,
};

export const DURATION_BOUNDS = {
  focus: { min: 5, max: 120 },
  shortBreak: { min: 1, max: 30 },
  longBreak: { min: 5, max: 60 },
} as const;

export const FOCUS_QUOTES: string[] = [
  'One question at a time. You have got this.',
  'Future you is already grateful.',
  'Deep work now, free mind later.',
  'Every session counts. Stack the wins.',
  'Your A* starts with this focus block.',
  'Progress, not perfection.',
  'Small steps, big results.',
  'The hard part is starting — and you already did.',
  'Stay steady. The exam hall will feel easy after this.',
  'Focus is a skill. You are training it right now.',
  'Cambridge does not scare you. You are prepared.',
  'Rest is part of the process. Take your break guilt-free.',
];

export const STORAGE_KEYS = {
  settings: 'ants-pomodoro-settings',
  session: 'ants-pomodoro-session',
  stats: 'ants-pomodoro-stats',
} as const;

const SOUND_KEY_TO_VIBE: Record<string, VibeId> = {
  rain: 'rain',
  brown_noise: 'deep-focus',
  cafe: 'cafe',
  forest: 'forest',
};

/** Migrate legacy settings that used soundKey → vibeId */
export function normalizeSettings(raw: unknown): PomodoroSettings {
  if (!raw || typeof raw !== 'object') return { ...POMODORO_DEFAULTS };
  const r = raw as Record<string, unknown>;
  let vibeId: VibeId | null = null;
  if (typeof r.vibeId === 'string' || r.vibeId === null) {
    vibeId = (r.vibeId as VibeId | null) ?? null;
  } else if (typeof r.soundKey === 'string') {
    vibeId = SOUND_KEY_TO_VIBE[r.soundKey] ?? null;
  }

  return {
    focusMinutes:
      typeof r.focusMinutes === 'number' ? r.focusMinutes : POMODORO_DEFAULTS.focusMinutes,
    shortBreakMinutes:
      typeof r.shortBreakMinutes === 'number'
        ? r.shortBreakMinutes
        : POMODORO_DEFAULTS.shortBreakMinutes,
    longBreakMinutes:
      typeof r.longBreakMinutes === 'number'
        ? r.longBreakMinutes
        : POMODORO_DEFAULTS.longBreakMinutes,
    cyclesBeforeLongBreak:
      typeof r.cyclesBeforeLongBreak === 'number'
        ? r.cyclesBeforeLongBreak
        : POMODORO_DEFAULTS.cyclesBeforeLongBreak,
    vibeId,
    volume: typeof r.volume === 'number' ? r.volume : POMODORO_DEFAULTS.volume,
    autoStartNext:
      typeof r.autoStartNext === 'boolean' ? r.autoStartNext : POMODORO_DEFAULTS.autoStartNext,
    notifyChime:
      typeof r.notifyChime === 'boolean' ? r.notifyChime : POMODORO_DEFAULTS.notifyChime,
  };
}
