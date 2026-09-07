'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — usePomodoro Hook
// Absolute-timestamp timer. Settings, session, and stats persist in localStorage.
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
  normalizeSettings,
} from '@/constants/pomodoro';
import {
  startVibeSound,
  setVolume,
  stopSound,
  disposeAudio,
  playChime,
} from '@/lib/pomodoro/audio-engine';

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
    /* degrade */
  }
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  const map: Record<TimerPhase, 'focus' | 'shortBreak' | 'longBreak'> = {
    focus: 'focus',
    short_break: 'shortBreak',
    long_break: 'longBreak',
  };
  const bounds = DURATION_BOUNDS[map[phase]];
  return Math.max(bounds.min, Math.min(bounds.max, value));
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

function computeStreak(entries: PomodoroDailyEntry[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };
  const today = todayKey();
  const yesterday = daysAgoKey(1);
  const hasToday = entries.some((e) => e.date === today);
  const hasYesterday = entries.some((e) => e.date === yesterday);
  if (!hasToday && !hasYesterday) {
    return { currentStreak: 0, longestStreak: computeLongestStreak(entries) };
  }
  let currentStreak = 0;
  for (let i = 0; i < 365; i++) {
    const date = daysAgoKey(i);
    if (entries.some((e) => e.date === date)) currentStreak++;
    else break;
  }
  const longestStreak = computeLongestStreak(entries);
  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

function emptyStats(): PomodoroStatsLog {
  return { entries: [], currentStreak: 0, longestStreak: 0, allTimeFocusMinutes: 0 };
}

function defaultSession(settings: PomodoroSettings): ActiveSessionSnapshot {
  return {
    phase: 'focus',
    isPaused: true,
    endsAt: null,
    remainingMsWhenPaused: getPhaseDurationMs('focus', settings),
    cyclesCompletedToday: 0,
    sessionLabel: null,
    focusStartedAt: null,
  };
}

function normalizeSession(
  stored: ActiveSessionSnapshot | null,
  settings: PomodoroSettings,
): ActiveSessionSnapshot {
  if (!stored) return defaultSession(settings);

  if (stored.endsAt !== null && stored.endsAt <= Date.now()) {
    if (stored.phase === 'focus') {
      logCompletedFocusStandalone(settings);
      const newCycle = stored.cyclesCompletedToday + 1;
      const nextPhase =
        newCycle % settings.cyclesBeforeLongBreak === 0 ? 'long_break' : 'short_break';
      return {
        phase: nextPhase,
        isPaused: true,
        endsAt: null,
        remainingMsWhenPaused: getPhaseDurationMs(nextPhase, settings),
        cyclesCompletedToday: newCycle,
        sessionLabel: stored.sessionLabel,
        focusStartedAt: null,
      };
    }
    return {
      phase: 'focus',
      isPaused: true,
      endsAt: null,
      remainingMsWhenPaused: getPhaseDurationMs('focus', settings),
      cyclesCompletedToday: stored.cyclesCompletedToday,
      sessionLabel: stored.sessionLabel,
      focusStartedAt: null,
    };
  }

  return {
    ...stored,
    focusStartedAt: stored.focusStartedAt ?? null,
    sessionLabel: stored.sessionLabel ?? null,
  };
}

export interface UsePomodoroReturn {
  phase: TimerPhase;
  remainingMs: number;
  totalMs: number;
  isPaused: boolean;
  isRunning: boolean;
  cyclesCompletedToday: number;
  sessionLabel: string | null;
  settings: PomodoroSettings;
  stats: PomodoroStatsLog;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  switchPhase: (phase: TimerPhase) => void;
  updateSettings: (partial: Partial<PomodoroSettings>) => void;
  setSessionLabel: (label: string | null) => void;
}

export function usePomodoro(): UsePomodoroReturn {
  const [settings, setSettingsState] = useState<PomodoroSettings>(() =>
    normalizeSettings(safeGetItem(STORAGE_KEYS.settings, POMODORO_DEFAULTS)),
  );
  const [session, setSessionState] = useState<ActiveSessionSnapshot>(() => {
    const settings = normalizeSettings(safeGetItem(STORAGE_KEYS.settings, POMODORO_DEFAULTS));
    return normalizeSession(safeGetItem(STORAGE_KEYS.session, null), settings);
  });
  const [stats, setStatsState] = useState<PomodoroStatsLog>(() =>
    safeGetItem(STORAGE_KEYS.stats, emptyStats()),
  );

  const sessionRef = useRef(session);
  const settingsRef = useRef(settings);
  const statsRef = useRef(stats);
  const notificationGrantedRef = useRef(false);

  sessionRef.current = session;
  settingsRef.current = settings;
  statsRef.current = stats;

  const persistSession = useCallback((s: ActiveSessionSnapshot) => {
    safeSetItem(STORAGE_KEYS.session, s);
  }, []);

  const persistSettings = useCallback((s: PomodoroSettings) => {
    safeSetItem(STORAGE_KEYS.settings, s);
  }, []);

  const persistStats = useCallback((s: PomodoroStatsLog) => {
    safeSetItem(STORAGE_KEYS.stats, s);
  }, []);

  const logCompletedFocusLocally = useCallback(() => {
      const focusMinutes = settingsRef.current.focusMinutes;

      const s = { ...statsRef.current, entries: [...statsRef.current.entries] };
      const today = todayKey();
      const existingIdx = s.entries.findIndex((e) => e.date === today);
      if (existingIdx >= 0) {
        s.entries[existingIdx] = {
          ...s.entries[existingIdx],
          focusMinutes: s.entries[existingIdx].focusMinutes + focusMinutes,
          sessionsCompleted: s.entries[existingIdx].sessionsCompleted + 1,
        };
      } else {
        s.entries.push({ date: today, focusMinutes, sessionsCompleted: 1 });
      }
      if (s.entries.length > 30) s.entries = s.entries.slice(-30);
      s.allTimeFocusMinutes += focusMinutes;
      const streaks = computeStreak(s.entries);
      s.currentStreak = streaks.currentStreak;
      s.longestStreak = streaks.longestStreak;
      persistStats(s);
      setStatsState(s);
      statsRef.current = s;
    },
    [persistStats],
  );

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handlePhaseCompleteRef = useRef<() => void>(() => {});
  const startTickRef = useRef<() => void>(() => {});

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
      if (current.endsAt - Date.now() <= 0) {
        clearTick();
        handlePhaseCompleteRef.current();
      } else {
        setSessionState((prev) => ({ ...prev }));
      }
    }, 200);
  }, [clearTick]);

  startTickRef.current = startTick;

  const handlePhaseComplete = useCallback(() => {
    const current = sessionRef.current;
    const settings = settingsRef.current;

    if (settings.notifyChime) playChime();

    if (current.phase === 'focus') {
      logCompletedFocusLocally();

      if (notificationGrantedRef.current) {
        try {
          new Notification('Focus session complete!', {
            body: 'Great work. Time for a break.',
            icon: '/icons/icon-192.png',
          });
        } catch {
          /* ignore */
        }
      }

      const newCycle = current.cyclesCompletedToday + 1;
      const nextPhase =
        newCycle % settings.cyclesBeforeLongBreak === 0 ? 'long_break' : 'short_break';
      const newSession: ActiveSessionSnapshot = {
        phase: nextPhase,
        isPaused: !settings.autoStartNext,
        endsAt: settings.autoStartNext ? Date.now() + getPhaseDurationMs(nextPhase, settings) : null,
        remainingMsWhenPaused: settings.autoStartNext
          ? null
          : getPhaseDurationMs(nextPhase, settings),
        cyclesCompletedToday: newCycle,
        sessionLabel: current.sessionLabel,
        focusStartedAt: null,
      };
      setSessionState(newSession);
      sessionRef.current = newSession;
      persistSession(newSession);
      if (settings.autoStartNext) startTickRef.current();
      else {
        clearTick();
        stopSound();
      }
      return;
    }

    if (notificationGrantedRef.current) {
      try {
        new Notification('Break over!', {
          body: 'Ready to focus again?',
          icon: '/icons/icon-192.png',
        });
      } catch {
        /* ignore */
      }
    }

    const newSession: ActiveSessionSnapshot = {
      phase: 'focus',
      isPaused: !settings.autoStartNext,
      endsAt: settings.autoStartNext ? Date.now() + getPhaseDurationMs('focus', settings) : null,
      remainingMsWhenPaused: settings.autoStartNext
        ? null
        : getPhaseDurationMs('focus', settings),
      cyclesCompletedToday: current.cyclesCompletedToday,
      sessionLabel: current.sessionLabel,
      focusStartedAt: settings.autoStartNext ? Date.now() : null,
    };
    setSessionState(newSession);
    sessionRef.current = newSession;
    persistSession(newSession);
    if (settings.autoStartNext) startTickRef.current();
    else {
      clearTick();
      stopSound();
    }
  }, [logCompletedFocusLocally, persistSession, clearTick]);

  handlePhaseCompleteRef.current = handlePhaseComplete;

  const start = useCallback(() => {
    const s = sessionRef.current;
    const settings = settingsRef.current;
    const remaining =
      s.isPaused && s.remainingMsWhenPaused !== null
        ? s.remainingMsWhenPaused
        : getPhaseDurationMs(s.phase, settings);

    const newSession: ActiveSessionSnapshot = {
      ...s,
      isPaused: false,
      endsAt: Date.now() + remaining,
      remainingMsWhenPaused: null,
      focusStartedAt:
        s.phase === 'focus' ? s.focusStartedAt ?? Date.now() : s.focusStartedAt,
    };

    setSessionState(newSession);
    sessionRef.current = newSession;
    persistSession(newSession);
    startTick();

    if (
      !notificationGrantedRef.current &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      void Notification.requestPermission().then((perm) => {
        notificationGrantedRef.current = perm === 'granted';
      });
    }

    if (settings.vibeId) {
      startVibeSound(settings.vibeId, settings.volume);
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
    stopSound();
  }, [clearTick, persistSession]);

  const switchPhase = useCallback(
    (newPhase: TimerPhase) => {
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
        focusStartedAt: null,
      };
      setSessionState(newSession);
      sessionRef.current = newSession;
      persistSession(newSession);
    },
    [clearTick, persistSession],
  );

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
      focusStartedAt: null,
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
        if (partial.focusMinutes !== undefined) {
          next.focusMinutes = clampDuration('focus', partial.focusMinutes);
        }
        if (partial.shortBreakMinutes !== undefined) {
          next.shortBreakMinutes = clampDuration('short_break', partial.shortBreakMinutes);
        }
        if (partial.longBreakMinutes !== undefined) {
          next.longBreakMinutes = clampDuration('long_break', partial.longBreakMinutes);
        }
        if (partial.volume !== undefined) {
          const wasSilent = prev.volume <= 0;
          setVolume(partial.volume);
          if (next.volume <= 0) {
            stopSound();
          } else if (wasSilent && next.vibeId) {
            startVibeSound(next.vibeId, next.volume);
          }
        }
        if (partial.vibeId !== undefined) {
          if (partial.vibeId && next.volume > 0) {
            startVibeSound(partial.vibeId, next.volume);
          } else if (!partial.vibeId) {
            stopSound();
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

  const [displayMs, setDisplayMs] = useState(() => {
    if (session.endsAt !== null) return Math.max(0, session.endsAt - Date.now());
    return session.remainingMsWhenPaused ?? getPhaseDurationMs(session.phase, settings);
  });

  useEffect(() => {
    if (!session.isPaused && session.endsAt !== null) {
      const id = setInterval(() => {
        setDisplayMs(Math.max(0, (sessionRef.current.endsAt ?? Date.now()) - Date.now()));
      }, 200);
      return () => clearInterval(id);
    }
    setDisplayMs(session.remainingMsWhenPaused ?? getPhaseDurationMs(session.phase, settings));
  }, [session.isPaused, session.endsAt, session.remainingMsWhenPaused, session.phase, settings]);

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

function logCompletedFocusStandalone(
  settings: PomodoroSettings,
): void {
  try {
    const s = safeGetItem(STORAGE_KEYS.stats, emptyStats());
    const today = todayKey();
    const focusMinutes = settings.focusMinutes;
    const existingIdx = s.entries.findIndex((e) => e.date === today);
    if (existingIdx >= 0) {
      s.entries[existingIdx].focusMinutes += focusMinutes;
      s.entries[existingIdx].sessionsCompleted += 1;
    } else {
      s.entries.push({ date: today, focusMinutes, sessionsCompleted: 1 });
    }
    if (s.entries.length > 30) s.entries = s.entries.slice(-30);
    s.allTimeFocusMinutes += focusMinutes;
    const streaks = computeStreak(s.entries);
    s.currentStreak = streaks.currentStreak;
    s.longestStreak = streaks.longestStreak;
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
