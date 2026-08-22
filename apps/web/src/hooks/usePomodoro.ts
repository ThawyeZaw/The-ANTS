'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — usePomodoro Hook
// PPP-owned: absolute-timestamp-based timer core.
// Survives tab throttling, backgrounding, and page remounts without drifting.
// All persistence via localStorage with graceful in-memory fallback.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  TimerPhase,
  PomodoroSettings,
  ActiveSessionSnapshot,
  PomodoroDailyEntry,
  PomodoroStatsLog,
} from '@/constants/pomodoro';
import {
  POMODORO_DEFAULTS,
  DURATION_BOUNDS,
  STORAGE_KEYS,
} from '@/constants/pomodoro';
import { startSound, setVolume, stopSound, disposeAudio, playChime } from '@/lib/pomodoro/audio-engine';

// ── Helpers ─────────────────────────────────────────────────────────────────

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently degrade
  }
}

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getPhaseDurationMs(phase: TimerPhase, settings: PomodoroSettings): number {
  switch (phase) {
    case 'focus':
      return settings.focusMinutes * 60 * 1000;
    case 'short_break':
      return settings.shortBreakMinutes * 60 * 1000;
    case 'long_break':
      return settings.longBreakMinutes * 60 * 1000;
  }
}

function clampDuration(phase: TimerPhase, value: number): number {
  const phaseToKey: Record<TimerPhase, 'focus' | 'shortBreak' | 'longBreak'> = {
    focus: 'focus',
    short_break: 'shortBreak',
    long_break: 'longBreak',
  };
  const bounds = DURATION_BOUNDS[phaseToKey[phase]];
  return Math.max(bounds.min, Math.min(bounds.max, value));
}

function computeStreak(entries: PomodoroDailyEntry[]): { currentStreak: number; longestStreak: number } {
  if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let currentStreak = 0;
  let longestStreak = 0;
  const today = todayKey();

  // Check if today or yesterday has an entry
  const hasToday = entries.some((e) => e.date === today);
  const yesterday = daysAgoKey(1);
  const hasYesterday = entries.some((e) => e.date === yesterday);

  if (!hasToday && !hasYesterday) {
    return { currentStreak: 0, longestStreak: computeLongestStreak(entries) };
  }

  // Walk backwards from today
  let checkDate = hasToday ? today : yesterday;
  currentStreak = 0;
  for (let i = 0; i < 365; i++) {
    const date = daysAgoKey(i);
    const found = entries.some((e) => e.date === date);
    if (found) {
      currentStreak++;
    } else {
      break;
    }
  }

  longestStreak = computeLongestStreak(entries);
  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

function computeLongestStreak(entries: PomodoroDailyEntry[]): number {
  if (entries.length === 0) return 0;

  const dates = [...new Set(entries.map((e) => e.date))].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

// ── Next Phase Logic ────────────────────────────────────────────────────────

function getNextPhase(currentPhase: TimerPhase, cyclesCompletedToday: number, settings: PomodoroSettings): TimerPhase {
  if (currentPhase === 'short_break' || currentPhase === 'long_break') {
    return 'focus';
  }
  // currentPhase is 'focus'
  const nextCycle = cyclesCompletedToday + 1;
  if (nextCycle % settings.cyclesBeforeLongBreak === 0) {
    return 'long_break';
  }
  return 'short_break';
}

// ── Hook ────────────────────────────────────────────────────────────────────

export interface UsePomodoroReturn {
  // Timer state
  phase: TimerPhase;
  remainingMs: number;
  totalMs: number;
  isPaused: boolean;
  isRunning: boolean;
  cyclesCompletedToday: number;
  sessionLabel: string | null;

  // Settings
  settings: PomodoroSettings;

  // Stats
  stats: PomodoroStatsLog;

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  switchPhase: (phase: TimerPhase) => void;
  updateSettings: (partial: Partial<PomodoroSettings>) => void;
  setSessionLabel: (label: string | null) => void;
}

export function usePomodoro(): UsePomodoroReturn {
  // ── Load persisted state ───────────────────────────────────────────────
  const [settings, setSettingsState] = useState<PomodoroSettings>(() =>
    safeGetItem(STORAGE_KEYS.settings, POMODORO_DEFAULTS),
  );
  const [session, setSessionState] = useState<ActiveSessionSnapshot>(() => {
    const stored = safeGetItem<ActiveSessionSnapshot | null>(STORAGE_KEYS.session, null);
    if (!stored) {
      return {
        phase: 'focus',
        isPaused: true,
        endsAt: null,
        remainingMsWhenPaused: getPhaseDurationMs('focus', safeGetItem(STORAGE_KEYS.settings, POMODORO_DEFAULTS)),
        cyclesCompletedToday: 0,
        sessionLabel: null,
      };
    }

    // If the timer has an endsAt in the past, resolve the missed transition
    if (stored.endsAt !== null && stored.endsAt <= Date.now()) {
      // Timer finished while we were away — resolve it
      const settings = safeGetItem(STORAGE_KEYS.settings, POMODORO_DEFAULTS);
      if (stored.phase === 'focus') {
        // Log completed focus session
        logCompletedFocus(settings, stored.cyclesCompletedToday, stored.sessionLabel);
        const newCycle = stored.cyclesCompletedToday + 1;
        const nextPhase = (newCycle % settings.cyclesBeforeLongBreak === 0) ? 'long_break' : 'short_break';
        return {
          phase: nextPhase,
          isPaused: true,
          endsAt: null,
          remainingMsWhenPaused: getPhaseDurationMs(nextPhase, settings),
          cyclesCompletedToday: newCycle,
          sessionLabel: null,
        };
      }
      // Break finished — move to focus
      return {
        phase: 'focus',
        isPaused: true,
        endsAt: null,
        remainingMsWhenPaused: getPhaseDurationMs('focus', settings),
        cyclesCompletedToday: stored.cyclesCompletedToday,
        sessionLabel: null,
      };
    }

    // endsAt is in the future — resume seamlessly
    return stored;
  });

  const [stats, setStatsState] = useState<PomodoroStatsLog>(() =>
    safeGetItem(STORAGE_KEYS.stats, {
      entries: [],
      currentStreak: 0,
      longestStreak: 0,
      allTimeFocusMinutes: 0,
    }),
  );

  // Refs for values that the interval callback needs but shouldn't trigger re-renders
  const sessionRef = useRef(session);
  const settingsRef = useRef(settings);
  const statsRef = useRef(stats);
  const notificationGrantedRef = useRef(false);

  // Keep refs in sync
  sessionRef.current = session;
  settingsRef.current = settings;
  statsRef.current = stats;

  // ── Persist helpers ────────────────────────────────────────────────────
  const persistSession = useCallback((s: ActiveSessionSnapshot) => {
    safeSetItem(STORAGE_KEYS.session, s);
  }, []);

  const persistSettings = useCallback((s: PomodoroSettings) => {
    safeSetItem(STORAGE_KEYS.settings, s);
  }, []);

  const persistStats = useCallback((s: PomodoroStatsLog) => {
    safeSetItem(STORAGE_KEYS.stats, s);
  }, []);

  // ── Stats logging ──────────────────────────────────────────────────────
  const logCompletedFocusLocally = useCallback(
    (cyclesCompleted: number, label: string | null) => {
      const s = { ...statsRef.current };
      const today = todayKey();
      const focusMinutes = settingsRef.current.focusMinutes;

      // Find or create today's entry
      const existingIdx = s.entries.findIndex((e) => e.date === today);
      if (existingIdx >= 0) {
        s.entries[existingIdx].focusMinutes += focusMinutes;
        s.entries[existingIdx].sessionsCompleted += 1;
      } else {
        s.entries.push({
          date: today,
          focusMinutes,
          sessionsCompleted: 1,
        });
      }

      // Keep last 30 days max
      if (s.entries.length > 30) {
        s.entries = s.entries.slice(-30);
      }

      s.allTimeFocusMinutes += focusMinutes;

      // Recompute streaks
      const { currentStreak, longestStreak } = computeStreak(s.entries);
      s.currentStreak = currentStreak;
      s.longestStreak = longestStreak;

      persistStats(s);
      setStatsState(s);
      statsRef.current = s;
    },
    [persistStats],
  );

  // ── Timer tick ─────────────────────────────────────────────────────────
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    tickRef.current = setInterval(() => {
      const current = sessionRef.current;
      if (current.endsAt === null) {
        clearTick();
        return;
      }

      const remaining = Math.max(0, current.endsAt - Date.now());

      if (remaining <= 0) {
        // Phase complete — transition
        clearTick();
        handlePhaseComplete();
        return;
      }

      // Update remainingMs in state (we use the session.endsAt, not a counter)
      setSessionState((prev) => ({
        ...prev,
        // We don't store remainingMs in state — it's derived from endsAt
      }));
    }, 200); // 200ms interval for smooth UI updates
  }, [clearTick]);

  const handlePhaseComplete = useCallback(() => {
    const current = sessionRef.current;
    const settings = settingsRef.current;

    // Play completion chime if enabled
    if (settings.notifyChime) {
      playChime();
    }

    if (current.phase === 'focus') {
      // Log completed focus session
      logCompletedFocusLocally(current.cyclesCompletedToday, current.sessionLabel);

      // Fire notification if granted
      if (notificationGrantedRef.current) {
        try {
          new Notification('Focus session complete!', {
            body: 'Great work. Time for a break.',
            icon: '/icons/icon-192.png',
          });
        } catch { /* silently degrade */ }
      }

      const newCycle = current.cyclesCompletedToday + 1;
      const nextPhase = (newCycle % settings.cyclesBeforeLongBreak === 0) ? 'long_break' : 'short_break';

      const newSession: ActiveSessionSnapshot = {
        phase: nextPhase,
        isPaused: settings.autoStartNext ? false : true,
        endsAt: settings.autoStartNext ? Date.now() + getPhaseDurationMs(nextPhase, settings) : null,
        remainingMsWhenPaused: settings.autoStartNext ? null : getPhaseDurationMs(nextPhase, settings),
        cyclesCompletedToday: newCycle,
        sessionLabel: null,
      };

      setSessionState(newSession);
      sessionRef.current = newSession;
      persistSession(newSession);

      if (settings.autoStartNext) {
        startTick();
      } else {
        clearTick();
      }
    } else {
      // Break completed — move to focus
      if (notificationGrantedRef.current) {
        try {
          new Notification('Break over!', {
            body: 'Ready to focus again?',
            icon: '/icons/icon-192.png',
          });
        } catch { /* silently degrade */ }
      }

      const newSession: ActiveSessionSnapshot = {
        phase: 'focus',
        isPaused: settings.autoStartNext ? false : true,
        endsAt: settings.autoStartNext ? Date.now() + getPhaseDurationMs('focus', settings) : null,
        remainingMsWhenPaused: settings.autoStartNext ? null : getPhaseDurationMs('focus', settings),
        cyclesCompletedToday: current.cyclesCompletedToday,
        sessionLabel: null,
      };

      setSessionState(newSession);
      sessionRef.current = newSession;
      persistSession(newSession);

      if (settings.autoStartNext) {
        startTick();
      } else {
        clearTick();
      }
    }
  }, [logCompletedFocusLocally, persistSession, startTick, clearTick]);

  // ── Public Actions ─────────────────────────────────────────────────────

  const start = useCallback(() => {
    const s = sessionRef.current;
    const settings = settingsRef.current;
    const remaining = s.isPaused && s.remainingMsWhenPaused !== null
      ? s.remainingMsWhenPaused
      : getPhaseDurationMs(s.phase, settings);

    const newSession: ActiveSessionSnapshot = {
      ...s,
      isPaused: false,
      endsAt: Date.now() + remaining,
      remainingMsWhenPaused: null,
    };

    setSessionState(newSession);
    sessionRef.current = newSession;
    persistSession(newSession);
    startTick();

    // Request notification permission on first user gesture
    if (!notificationGrantedRef.current && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        notificationGrantedRef.current = perm === 'granted';
      });
    }

    // Start ambient sound if configured
    if (settings.soundKey) {
      startSound(settings.soundKey, settings.volume);
    }
  }, [persistSession, startTick]);

  const pause = useCallback(() => {
    const current = sessionRef.current;
    if (current.isPaused || current.endsAt === null) return;

    clearTick();
    const remaining = Math.max(0, current.endsAt - Date.now());

    const newSession: ActiveSessionSnapshot = {
      ...current,
      isPaused: true,
      endsAt: null,
      remainingMsWhenPaused: remaining,
    };

    setSessionState(newSession);
    sessionRef.current = newSession;
    persistSession(newSession);

    // Stop sound when paused
    stopSound();
  }, [clearTick, persistSession]);

  const switchPhase = useCallback((newPhase: TimerPhase) => {
    clearTick();
    stopSound();
    const s = sessionRef.current;
    const settings = settingsRef.current;
    const durationMs = getPhaseDurationMs(newPhase, settings);

    const newSession: ActiveSessionSnapshot = {
      ...s,
      phase: newPhase,
      isPaused: true,
      endsAt: null,
      remainingMsWhenPaused: durationMs,
    };

    setSessionState(newSession);
    sessionRef.current = newSession;
    persistSession(newSession);
  }, [clearTick, persistSession]);

  const resume = useCallback(() => {
    start();
  }, [start]);

  const reset = useCallback(() => {
    clearTick();
    const s = sessionRef.current;
    const settings = settingsRef.current;
    const durationMs = getPhaseDurationMs(s.phase, settings);

    const newSession: ActiveSessionSnapshot = {
      ...s,
      isPaused: true,
      endsAt: null,
      remainingMsWhenPaused: durationMs,
    };

    setSessionState(newSession);
    sessionRef.current = newSession;
    persistSession(newSession);

    stopSound();
  }, [clearTick, persistSession]);

  const updateSettings = useCallback(
    (partial: Partial<PomodoroSettings>) => {
      setSettingsState((prev) => {
        const next = { ...prev, ...partial };
        // Clamp durations
        if (partial.focusMinutes !== undefined) {
          next.focusMinutes = clampDuration('focus', partial.focusMinutes);
        }
        if (partial.shortBreakMinutes !== undefined) {
          next.shortBreakMinutes = clampDuration('short_break', partial.shortBreakMinutes);
        }
        if (partial.longBreakMinutes !== undefined) {
          next.longBreakMinutes = clampDuration('long_break', partial.longBreakMinutes);
        }
        // Update audio volume
        if (partial.volume !== undefined) {
          setVolume(partial.volume);
        }
        // Update soundscape
        if (partial.soundKey !== undefined) {
          const s = sessionRef.current;
          if (partial.soundKey && !s.isPaused && s.endsAt !== null) {
            startSound(partial.soundKey, next.volume);
          }
        }
        persistSettings(next);
        settingsRef.current = next;
        return next;
      });
    },
    [persistSettings],
  );

  const setSessionLabel = useCallback(
    (label: string | null) => {
      setSessionState((prev) => {
        const next = { ...prev, sessionLabel: label };
        sessionRef.current = next;
        persistSession(next);
        return next;
      });
    },
    [persistSession],
  );

  // ── Derived values ─────────────────────────────────────────────────────
  const [displayMs, setDisplayMs] = useState(() => {
    const s = session;
    if (s.endsAt !== null) {
      return Math.max(0, s.endsAt - Date.now());
    }
    return s.remainingMsWhenPaused ?? getPhaseDurationMs(s.phase, settings);
  });

  // UI tick for smooth display
  useEffect(() => {
    if (!session.isPaused && session.endsAt !== null) {
      const id = setInterval(() => {
        setDisplayMs(Math.max(0, sessionRef.current.endsAt! - Date.now()));
      }, 200);
      return () => clearInterval(id);
    } else {
      setDisplayMs(session.remainingMsWhenPaused ?? getPhaseDurationMs(session.phase, settings));
    }
  }, [session.isPaused, session.endsAt, session.remainingMsWhenPaused, session.phase, settings]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTick();
      disposeAudio();
    };
  }, [clearTick]);

  return {
    phase: session.phase,
    remainingMs: displayMs,
    totalMs: getPhaseDurationMs(session.phase, settings),
    isPaused: session.isPaused,
    isRunning: !session.isPaused && session.endsAt !== null,
    cyclesCompletedToday: session.cyclesCompletedToday,
    sessionLabel: session.sessionLabel,
    settings,
    stats,
    start,
    pause,
    resume,
    reset,
    switchPhase,
    updateSettings,
    setSessionLabel,
  };
}

// ── Standalone log function (used on mount when resolving missed transitions) ──
function logCompletedFocus(
  settings: PomodoroSettings,
  cyclesCompleted: number,
  _label: string | null,
): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.stats);
    const s: PomodoroStatsLog = stored
      ? JSON.parse(stored)
      : { entries: [], currentStreak: 0, longestStreak: 0, allTimeFocusMinutes: 0 };

    const today = todayKey();
    const focusMinutes = settings.focusMinutes;

    const existingIdx = s.entries.findIndex((e) => e.date === today);
    if (existingIdx >= 0) {
      s.entries[existingIdx].focusMinutes += focusMinutes;
      s.entries[existingIdx].sessionsCompleted += 1;
    } else {
      s.entries.push({ date: today, focusMinutes, sessionsCompleted: 1 });
    }

    if (s.entries.length > 30) {
      s.entries = s.entries.slice(-30);
    }

    s.allTimeFocusMinutes += focusMinutes;
    const { currentStreak, longestStreak } = computeStreak(s.entries);
    s.currentStreak = currentStreak;
    s.longestStreak = longestStreak;

    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(s));
  } catch {
    // Silently degrade
  }
}
