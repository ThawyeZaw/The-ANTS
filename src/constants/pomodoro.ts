// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Pomodoro Timer Constants & Types
// PPP-owned: types, defaults, sound presets, encouragement quotes, storage keys
// Types are co-located here per the build spec; usePomodoro.ts imports from here.
// ──────────────────────────────────────────────────────────────────────────────

// ── Core Types ─────────────────────────────────────────────────────────────

export type TimerPhase = 'focus' | 'short_break' | 'long_break';
export type SoundKey = 'rain' | 'brown_noise' | 'cafe' | 'forest' | null;

export interface PomodoroSettings {
  focusMinutes: number;          // 5–120, default 25
  shortBreakMinutes: number;     // 1–30, default 5
  longBreakMinutes: number;      // 5–60, default 15
  cyclesBeforeLongBreak: number; // default 4
  soundKey: SoundKey;
  volume: number;                // 0–1, default 0.4
  autoStartNext: boolean;        // default false
}

export interface ActiveSessionSnapshot {
  phase: TimerPhase;
  isPaused: boolean;
  endsAt: number | null;             // epoch ms; null when paused
  remainingMsWhenPaused: number | null;
  cyclesCompletedToday: number;
  sessionLabel: string | null;
}

export interface PomodoroDailyEntry {
  date: string;           // 'YYYY-MM-DD', local time
  focusMinutes: number;
  sessionsCompleted: number;
}

export interface PomodoroStatsLog {
  entries: PomodoroDailyEntry[]; // keep last 30 days max
  currentStreak: number;
  longestStreak: number;
  allTimeFocusMinutes: number;
}

// ── Duration Bounds & Defaults ────────────────────────────────────────────

export const POMODORO_DEFAULTS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  soundKey: null,
  volume: 0.4,
  autoStartNext: false,
};

export const DURATION_BOUNDS = {
  focus: { min: 5, max: 120 },
  shortBreak: { min: 1, max: 30 },
  longBreak: { min: 5, max: 60 },
} as const;

// ── Sound Presets ──────────────────────────────────────────────────────────

export interface SoundPreset {
  key: SoundKey;
  label: string;
  description: string;
}

export const SOUND_PRESETS: SoundPreset[] = [
  { key: 'rain', label: 'Rainfall', description: 'Soft, steady rain — like studying by the window during monsoon' },
  { key: 'brown_noise', label: 'Deep Focus', description: 'Warm, low-frequency rumble that masks distractions' },
  { key: 'cafe', label: 'Cafe Ambience', description: 'Gentle murmur — the quiet hum of a Yangon teashop' },
  { key: 'forest', label: 'Forest Calm', description: 'Slow, airy breeze through trees — peaceful and grounding' },
];

// ── Encouragement Quotes ───────────────────────────────────────────────────
// Short, real lines tailored for IGCSE / A-Level students in Myanmar.
// No corporate-sounding generic copy.

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

// ── localStorage Keys (namespaced to avoid collisions) ─────────────────────

export const STORAGE_KEYS = {
  settings: 'ants-pomodoro-settings',
  session: 'ants-pomodoro-session',
  stats: 'ants-pomodoro-stats',
} as const;
