// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro & Exam Timer Constants & Types
// ──────────────────────────────────────────────────────────────────────────────

import type { VibeId } from '@/constants/pomodoro-vibes';

export type TimerPhase = 'focus' | 'short_break' | 'long_break' | 'past_paper';
export type TimerMode = 'pomodoro' | 'past_paper';

export interface PastPaperSessionConfig {
  board: 'CAIE' | 'Edexcel';
  curriculumId: string;
  subjectCode: string;
  subjectName: string;
  paperNumber: string;
  paperName: string;
  durationMinutes: number;
  totalMarks?: number;
  strictMode?: boolean;
}

export type ChimeSoundId = 'bowl' | 'bell' | 'marimba' | 'minimal';

export interface FocusDurationOption {
  minutes: number;
  label: string;
  tag: string;
}

export const FOCUS_DURATION_OPTIONS: FocusDurationOption[] = [
  { minutes: 15, label: '15 min', tag: 'Quick Sprint' },
  { minutes: 20, label: '20 min', tag: 'Short Focus' },
  { minutes: 25, label: '25 min', tag: 'Standard' },
  { minutes: 30, label: '30 min', tag: 'Steady Work' },
  { minutes: 45, label: '45 min', tag: 'Academic' },
  { minutes: 50, label: '50 min', tag: 'Deep Work' },
  { minutes: 60, label: '60 min', tag: '1 Hour Block' },
  { minutes: 90, label: '90 min', tag: 'Extended' },
];

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  vibeId: VibeId | null;
  volume: number;
  autoStartNext: boolean;
  notifyChime: boolean;
  chimeSound: ChimeSoundId;
  examAlertChime: boolean;
  voiceAlerts: boolean;
  strictExamMode: boolean;
  customWallpaperUrl?: string | null;
}

export interface ActiveSessionSnapshot {
  phase: TimerPhase;
  timerMode: TimerMode;
  isPaused: boolean;
  endsAt: number | null;
  remainingMsWhenPaused: number | null;
  cyclesCompletedToday: number;
  sessionLabel: string | null;
  focusStartedAt: number | null;
  /** Server-issued token for XP-eligible focus blocks */
  focusToken: string | null;
  pastPaperConfig?: PastPaperSessionConfig | null;
  warningsTriggered?: { fifteenMin: boolean; fiveMin: boolean };
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
  vibeId: 'library',
  volume: 0.4,
  autoStartNext: false,
  notifyChime: true,
  chimeSound: 'bowl',
  examAlertChime: true,
  voiceAlerts: false,
  strictExamMode: false,
  customWallpaperUrl: null,
};

export const DURATION_BOUNDS = {
  focus: { min: 5, max: 120 },
  shortBreak: { min: 1, max: 30 },
  longBreak: { min: 5, max: 60 },
  pastPaper: { min: 15, max: 240 },
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
  activePastPaper: 'ants-pomodoro-active-past-paper',
} as const;

const SOUND_KEY_TO_VIBE: Record<string, VibeId> = {
  rain: 'rain',
  brown_noise: 'library',
  cafe: 'cafe',
  forest: 'forest',
  'deep-focus': 'library',
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
    chimeSound:
      typeof r.chimeSound === 'string' && ['bowl', 'bell', 'marimba', 'minimal'].includes(r.chimeSound)
        ? (r.chimeSound as ChimeSoundId)
        : POMODORO_DEFAULTS.chimeSound,
    examAlertChime:
      typeof r.examAlertChime === 'boolean' ? r.examAlertChime : POMODORO_DEFAULTS.examAlertChime,
    voiceAlerts:
      typeof r.voiceAlerts === 'boolean' ? r.voiceAlerts : POMODORO_DEFAULTS.voiceAlerts,
    strictExamMode:
      typeof r.strictExamMode === 'boolean' ? r.strictExamMode : POMODORO_DEFAULTS.strictExamMode,
    customWallpaperUrl:
      typeof r.customWallpaperUrl === 'string' ? r.customWallpaperUrl : null,
  };
}
