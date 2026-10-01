'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — usePomodoro Hook
// Dual-mode: Adaptive Pomodoro + Past Paper Exam Simulator.
// Absolute-timestamp timer with Web Audio synthesis & Cambridge/Edexcel alerts.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  TimerPhase,
  TimerMode,
  PastPaperSessionConfig,
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
  beginPomodoroFocusAction,
  fetchPomodoroDataAction,
  logPomodoroSessionAction,
  savePomodoroSettingsAction,
} from '@/actions/pomodoro';
import { useGamificationFeedback } from '@/components/gamification/GamificationFeedbackProvider';
import {
  startVibeSound,
  setVolume,
  stopSound,
  disposeAudio,
  playChime,
  playExamWarningChime,
} from '@/lib/pomodoro/audio-engine';

const PARTIAL_SESSION_MIN_MS = 15_000;
const SETTINGS_SAVE_DEBOUNCE_MS = 800;

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

export function getTimerDurationMs(
  phase: TimerPhase,
  settings: PomodoroSettings,
  pastPaper?: PastPaperSessionConfig | null,
): number {
  if (phase === 'past_paper') {
    return (pastPaper?.durationMinutes ?? 90) * 60 * 1000;
  }
  switch (phase) {
    case 'focus':
      return settings.focusMinutes * 60 * 1000;
    case 'short_break':
      return settings.shortBreakMinutes * 60 * 1000;
    case 'long_break':
      return settings.longBreakMinutes * 60 * 1000;
  }
}

function getElapsedMs(
  session: ActiveSessionSnapshot,
  settings: PomodoroSettings,
): number {
  const total = getTimerDurationMs(session.phase, settings, session.pastPaperConfig);
  const remaining =
    !session.isPaused && session.endsAt !== null
      ? Math.max(0, session.endsAt - Date.now())
      : (session.remainingMsWhenPaused ?? total);
  return Math.max(0, total - remaining);
}

function elapsedMinutes(
  session: ActiveSessionSnapshot,
  settings: PomodoroSettings,
): number {
  const elapsed = getElapsedMs(session, settings);
  if (elapsed < PARTIAL_SESSION_MIN_MS) return 0;
  return Math.max(1, Math.round(elapsed / 60_000));
}

function applyLocalFocusLog(
  stats: PomodoroStatsLog,
  focusMinutes: number,
): PomodoroStatsLog {
  const s = { ...stats, entries: [...stats.entries] };
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
  return s;
}

function clampDuration(phase: TimerPhase, value: number): number {
  if (phase === 'past_paper') {
    return Math.max(DURATION_BOUNDS.pastPaper.min, Math.min(DURATION_BOUNDS.pastPaper.max, value));
  }
  const map: Record<'focus' | 'short_break' | 'long_break', 'focus' | 'shortBreak' | 'longBreak'> = {
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

const DEFAULT_PAST_PAPER: PastPaperSessionConfig = {
  board: 'CAIE',
  curriculumId: 'curr-caie-igcse',
  subjectCode: '0580',
  subjectName: 'Mathematics',
  paperNumber: 'Paper 2',
  paperName: 'Paper 2 (Extended)',
  durationMinutes: 90,
  totalMarks: 70,
  strictMode: false,
};

function defaultSession(settings: PomodoroSettings): ActiveSessionSnapshot {
  return {
    phase: 'focus',
    timerMode: 'pomodoro',
    isPaused: true,
    endsAt: null,
    remainingMsWhenPaused: getTimerDurationMs('focus', settings, null),
    cyclesCompletedToday: 0,
    sessionLabel: null,
    focusStartedAt: null,
    focusToken: null,
    pastPaperConfig: DEFAULT_PAST_PAPER,
    warningsTriggered: { fifteenMin: false, fiveMin: false },
  };
}

function normalizeSession(
  stored: ActiveSessionSnapshot | null,
  settings: PomodoroSettings,
): ActiveSessionSnapshot {
  if (!stored) return defaultSession(settings);

  const pastPaperConfig = stored.pastPaperConfig ?? DEFAULT_PAST_PAPER;
  const rawPhase = stored.phase ?? 'focus';
  const phase = rawPhase === 'past_paper' ? 'focus' : rawPhase;
  const timerMode = 'pomodoro';

  if (stored.endsAt !== null && stored.endsAt <= Date.now()) {
    if (phase === 'focus' || phase === 'past_paper') {
      const minutes = phase === 'past_paper' ? pastPaperConfig.durationMinutes : settings.focusMinutes;
      logCompletedStandalone(minutes);
      if (phase === 'past_paper') {
        return {
          phase: 'past_paper',
          timerMode: 'past_paper',
          isPaused: true,
          endsAt: null,
          remainingMsWhenPaused: getTimerDurationMs('past_paper', settings, pastPaperConfig),
          cyclesCompletedToday: stored.cyclesCompletedToday + 1,
          sessionLabel: stored.sessionLabel,
          focusStartedAt: null,
          focusToken: null,
          pastPaperConfig,
          warningsTriggered: { fifteenMin: false, fiveMin: false },
        };
      }
      const newCycle = stored.cyclesCompletedToday + 1;
      const nextPhase =
        newCycle % settings.cyclesBeforeLongBreak === 0 ? 'long_break' : 'short_break';
      return {
        phase: nextPhase,
        timerMode: 'pomodoro',
        isPaused: true,
        endsAt: null,
        remainingMsWhenPaused: getTimerDurationMs(nextPhase, settings, null),
        cyclesCompletedToday: newCycle,
        sessionLabel: stored.sessionLabel,
        focusStartedAt: null,
        focusToken: null,
        pastPaperConfig,
        warningsTriggered: { fifteenMin: false, fiveMin: false },
      };
    }
    return {
      phase: 'focus',
      timerMode: 'pomodoro',
      isPaused: true,
      endsAt: null,
      remainingMsWhenPaused: getTimerDurationMs('focus', settings, null),
      cyclesCompletedToday: stored.cyclesCompletedToday,
      sessionLabel: stored.sessionLabel,
      focusStartedAt: null,
      focusToken: null,
      pastPaperConfig,
      warningsTriggered: { fifteenMin: false, fiveMin: false },
    };
  }

  return {
    ...stored,
    timerMode,
    phase,
    pastPaperConfig,
    warningsTriggered: stored.warningsTriggered ?? { fifteenMin: false, fiveMin: false },
    focusStartedAt: stored.focusStartedAt ?? null,
    focusToken: stored.focusToken ?? null,
    sessionLabel: stored.sessionLabel ?? null,
  };
}

export interface UsePomodoroReturn {
  phase: TimerPhase;
  timerMode: TimerMode;
  remainingMs: number;
  totalMs: number;
  isPaused: boolean;
  isRunning: boolean;
  cyclesCompletedToday: number;
  sessionLabel: string | null;
  settings: PomodoroSettings;
  stats: PomodoroStatsLog;
  pastPaperConfig: PastPaperSessionConfig;
  activeExamAlert: '15m' | '5m' | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  switchPhase: (phase: TimerPhase) => void;
  switchTimerMode: (mode: TimerMode) => void;
  configurePastPaper: (config: Partial<PastPaperSessionConfig>) => void;
  updateSettings: (partial: Partial<PomodoroSettings>) => void;
  setSessionLabel: (label: string | null) => void;
  setCustomWallpaper: (url: string | null) => void;
}

export function usePomodoro(userId?: string | null): UsePomodoroReturn {
  const { handleAwardResult } = useGamificationFeedback();
  const [settings, setSettingsState] = useState<PomodoroSettings>(() =>
    normalizeSettings(safeGetItem(STORAGE_KEYS.settings, POMODORO_DEFAULTS)),
  );
  const [session, setSessionState] = useState<ActiveSessionSnapshot>(() => {
    const s = normalizeSettings(safeGetItem(STORAGE_KEYS.settings, POMODORO_DEFAULTS));
    return normalizeSession(safeGetItem(STORAGE_KEYS.session, null), s);
  });
  const [stats, setStatsState] = useState<PomodoroStatsLog>(() =>
    safeGetItem(STORAGE_KEYS.stats, emptyStats()),
  );
  const [activeExamAlert, setActiveExamAlert] = useState<'15m' | '5m' | null>(null);

  const sessionRef = useRef(session);
  const settingsRef = useRef(settings);
  const statsRef = useRef(stats);
  const notificationGrantedRef = useRef(false);
  const userIdRef = useRef(userId);
  const settingsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteLoadedRef = useRef(false);

  userIdRef.current = userId;
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

  const scheduleSettingsSave = useCallback((next: PomodoroSettings) => {
    const uid = userIdRef.current;
    if (!uid) return;
    if (settingsSaveTimerRef.current) clearTimeout(settingsSaveTimerRef.current);
    settingsSaveTimerRef.current = setTimeout(() => {
      void savePomodoroSettingsAction(uid, next);
    }, SETTINGS_SAVE_DEBOUNCE_MS);
  }, []);

  const logSessionComplete = useCallback(
    (durationMinutes: number, sessionSnapshot: ActiveSessionSnapshot) => {
      if (durationMinutes <= 0) return;

      const elapsedMs = getElapsedMs(sessionSnapshot, settingsRef.current);
      const startedAt =
        sessionSnapshot.focusStartedAt ?? Date.now() - Math.max(elapsedMs, durationMinutes * 60_000);
      const completedAt = Date.now();

      const nextStats = applyLocalFocusLog(statsRef.current, durationMinutes);
      persistStats(nextStats);
      setStatsState(nextStats);
      statsRef.current = nextStats;

      const uid = userIdRef.current;
      if (!uid) return;

      const isExam = sessionSnapshot.phase === 'past_paper';
      const notes = isExam && sessionSnapshot.pastPaperConfig
        ? `[${sessionSnapshot.pastPaperConfig.board} ${sessionSnapshot.pastPaperConfig.subjectCode} ${sessionSnapshot.pastPaperConfig.paperNumber}] ${sessionSnapshot.sessionLabel || 'Mock Exam'}`
        : sessionSnapshot.sessionLabel;

      void logPomodoroSessionAction(uid, {
        durationMinutes,
        sessionType: sessionSnapshot.phase,
        startedAt: new Date(startedAt).toISOString(),
        completedAt: new Date(completedAt).toISOString(),
        notes,
        focusToken: sessionSnapshot.focusToken ?? undefined,
      }).then((res) => {
        if (res.success && res.gamification) {
          handleAwardResult(res.gamification);
        }
      });
    },
    [persistStats, handleAwardResult],
  );

  const logPartialSessionIfNeeded = useCallback(
    (sessionSnapshot: ActiveSessionSnapshot) => {
      if (sessionSnapshot.phase === 'focus' || sessionSnapshot.phase === 'past_paper') {
        const minutes = elapsedMinutes(sessionSnapshot, settingsRef.current);
        if (minutes >= 5) {
          logSessionComplete(minutes, sessionSnapshot);
        }
      }
    },
    [logSessionComplete],
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

      const remaining = current.endsAt - Date.now();



      if (remaining <= 0) {
        clearTick();
        handlePhaseCompleteRef.current();
      } else {
        setSessionState((prev) => ({ ...prev }));
      }
    }, 200);
  }, [clearTick, persistSession]);

  startTickRef.current = startTick;

  const handlePhaseComplete = useCallback(() => {
    const current = sessionRef.current;
    const settings = settingsRef.current;

    if (settings.notifyChime) playChime(settings.chimeSound);

    // ── Past Paper Exam Complete ──
    if (current.phase === 'past_paper') {
      const duration = current.pastPaperConfig?.durationMinutes ?? 90;
      logSessionComplete(duration, current);

      if (notificationGrantedRef.current) {
        try {
          new Notification('Past Paper Exam Complete!', {
            body: 'Pens down! You have completed your scheduled paper.',
            icon: '/icons/icon-192.png',
          });
        } catch {
          /* ignore */
        }
      }

      const totalMs = getTimerDurationMs('past_paper', settings, current.pastPaperConfig);
      const newSession: ActiveSessionSnapshot = {
        ...current,
        isPaused: true,
        endsAt: null,
        remainingMsWhenPaused: totalMs,
        cyclesCompletedToday: current.cyclesCompletedToday + 1,
        focusStartedAt: null,
        warningsTriggered: { fifteenMin: false, fiveMin: false },
      };
      setSessionState(newSession);
      sessionRef.current = newSession;
      persistSession(newSession);
      clearTick();
      stopSound();
      return;
    }

    // ── Pomodoro Focus Complete ──
    if (current.phase === 'focus') {
      logSessionComplete(settings.focusMinutes, current);

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
      const nextPhase: TimerPhase =
        newCycle % settings.cyclesBeforeLongBreak === 0 ? 'long_break' : 'short_break';
      const newSession: ActiveSessionSnapshot = {
        ...current,
        phase: nextPhase,
        isPaused: !settings.autoStartNext,
        endsAt: settings.autoStartNext ? Date.now() + getTimerDurationMs(nextPhase, settings, null) : null,
        remainingMsWhenPaused: settings.autoStartNext
          ? null
          : getTimerDurationMs(nextPhase, settings, null),
        cyclesCompletedToday: newCycle,
        focusStartedAt: null,
        focusToken: null,
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

    // ── Break Complete ──
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
      ...current,
      phase: 'focus',
      isPaused: !settings.autoStartNext,
      endsAt: settings.autoStartNext ? Date.now() + getTimerDurationMs('focus', settings, null) : null,
      remainingMsWhenPaused: settings.autoStartNext
        ? null
        : getTimerDurationMs('focus', settings, null),
      focusStartedAt: settings.autoStartNext ? Date.now() : null,
      focusToken: null,
    };
    setSessionState(newSession);
    sessionRef.current = newSession;
    persistSession(newSession);
    if (settings.autoStartNext) {
      const uid = userIdRef.current;
      if (uid) {
        void beginPomodoroFocusAction(uid).then((res) => {
          if (!res.success) return;
          const withToken: ActiveSessionSnapshot = {
            ...sessionRef.current,
            focusToken: res.focusToken,
          };
          setSessionState(withToken);
          sessionRef.current = withToken;
          persistSession(withToken);
        });
      }
      startTickRef.current();
    } else {
      clearTick();
      stopSound();
    }
  }, [logSessionComplete, persistSession, clearTick]);

  handlePhaseCompleteRef.current = handlePhaseComplete;

  const start = useCallback(() => {
    const s = sessionRef.current;
    const settings = settingsRef.current;
    const remaining =
      s.isPaused && s.remainingMsWhenPaused !== null
        ? s.remainingMsWhenPaused
        : getTimerDurationMs(s.phase, settings, s.pastPaperConfig);

    const isStartingFocus = s.phase === 'focus';
    const isStartingExam = s.phase === 'past_paper';

    const newSession: ActiveSessionSnapshot = {
      ...s,
      isPaused: false,
      endsAt: Date.now() + remaining,
      remainingMsWhenPaused: null,
      focusStartedAt: isStartingFocus || isStartingExam ? s.focusStartedAt ?? Date.now() : s.focusStartedAt,
    };

    setSessionState(newSession);
    sessionRef.current = newSession;
    persistSession(newSession);
    startTick();

    if (isStartingFocus && !newSession.focusToken) {
      const uid = userIdRef.current;
      if (uid) {
        void beginPomodoroFocusAction(uid).then((res) => {
          if (!res.success) return;
          const withToken: ActiveSessionSnapshot = {
            ...sessionRef.current,
            focusToken: res.focusToken,
          };
          setSessionState(withToken);
          sessionRef.current = withToken;
          persistSession(withToken);
        });
      }
    }

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

      if ((s.phase === 'focus' || s.phase === 'past_paper') && newPhase !== s.phase) {
        logPartialSessionIfNeeded(s);
      }

      const durationMs = getTimerDurationMs(newPhase, settings, s.pastPaperConfig);
      const newSession: ActiveSessionSnapshot = {
        ...s,
        phase: newPhase,
        timerMode: newPhase === 'past_paper' ? 'past_paper' : 'pomodoro',
        isPaused: true,
        endsAt: null,
        remainingMsWhenPaused: durationMs,
        focusStartedAt: null,
        focusToken: null,
        warningsTriggered: { fifteenMin: false, fiveMin: false },
      };
      setSessionState(newSession);
      sessionRef.current = newSession;
      persistSession(newSession);
    },
    [clearTick, persistSession, logPartialSessionIfNeeded],
  );

  const switchTimerMode = useCallback(
    (mode: TimerMode) => {
      if (mode === 'past_paper') {
        switchPhase('past_paper');
      } else {
        switchPhase('focus');
      }
    },
    [switchPhase],
  );

  const configurePastPaper = useCallback(
    (partial: Partial<PastPaperSessionConfig>) => {
      setSessionState((prev) => {
        const nextConfig: PastPaperSessionConfig = {
          ...(prev.pastPaperConfig ?? DEFAULT_PAST_PAPER),
          ...partial,
        };
        const durationMs = nextConfig.durationMinutes * 60 * 1000;
        const next: ActiveSessionSnapshot = {
          ...prev,
          pastPaperConfig: nextConfig,
          remainingMsWhenPaused: prev.isPaused && prev.phase === 'past_paper' ? durationMs : prev.remainingMsWhenPaused,
          warningsTriggered: { fifteenMin: false, fiveMin: false },
        };
        sessionRef.current = next;
        persistSession(next);
        return next;
      });
    },
    [persistSession],
  );

  const resume = useCallback(() => {
    start();
  }, [start]);

  const reset = useCallback(() => {
    clearTick();
    const s = sessionRef.current;
    const settings = settingsRef.current;

    if (s.phase === 'focus' || s.phase === 'past_paper') {
      logPartialSessionIfNeeded(s);
    }

    const durationMs = getTimerDurationMs(s.phase, settings, s.pastPaperConfig);
    const newSession: ActiveSessionSnapshot = {
      ...s,
      isPaused: true,
      endsAt: null,
      remainingMsWhenPaused: durationMs,
      focusStartedAt: null,
      focusToken: null,
      warningsTriggered: { fifteenMin: false, fiveMin: false },
    };
    setSessionState(newSession);
    sessionRef.current = newSession;
    persistSession(newSession);
    stopSound();
  }, [clearTick, persistSession, logPartialSessionIfNeeded]);

  const updateSettings = useCallback(
    (partial: Partial<PomodoroSettings>) => {
      setSettingsState((prev) => {
        const next = { ...prev, ...partial };
        if (partial.focusMinutes !== undefined) {
          next.focusMinutes = clampDuration('focus', partial.focusMinutes);
          // If currently in focus phase and paused, update remainingMs immediately to match new duration
          if (sessionRef.current.phase === 'focus' && sessionRef.current.isPaused) {
            const nextDuration = next.focusMinutes * 60 * 1000;
            const updated = {
              ...sessionRef.current,
              remainingMsWhenPaused: nextDuration,
            };
            sessionRef.current = updated;
            setSessionState(updated);
            persistSession(updated);
          }
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
          } else if (wasSilent && next.vibeId && !sessionRef.current.isPaused) {
            startVibeSound(next.vibeId, next.volume);
          }
        }
        if (partial.vibeId !== undefined) {
          if (partial.vibeId && next.volume > 0 && !sessionRef.current.isPaused) {
            startVibeSound(partial.vibeId, next.volume);
          } else if (!partial.vibeId) {
            stopSound();
          }
        }
        persistSettings(next);
        settingsRef.current = next;
        scheduleSettingsSave(next);
        return next;
      });
    },
    [persistSettings, scheduleSettingsSave],
  );

  const setCustomWallpaper = useCallback(
    (url: string | null) => {
      updateSettings({ customWallpaperUrl: url });
    },
    [updateSettings],
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
    return session.remainingMsWhenPaused ?? getTimerDurationMs(session.phase, settings, session.pastPaperConfig);
  });

  useEffect(() => {
    if (!session.isPaused && session.endsAt !== null) {
      const id = setInterval(() => {
        setDisplayMs(Math.max(0, (sessionRef.current.endsAt ?? Date.now()) - Date.now()));
      }, 200);
      return () => clearInterval(id);
    }
    setDisplayMs(session.remainingMsWhenPaused ?? getTimerDurationMs(session.phase, settings, session.pastPaperConfig));
  }, [session.isPaused, session.endsAt, session.remainingMsWhenPaused, session.phase, session.pastPaperConfig, settings]);

  useEffect(() => {
    if (!userId) {
      remoteLoadedRef.current = false;
      return;
    }

    let cancelled = false;

    void fetchPomodoroDataAction(userId).then((result) => {
      if (cancelled || !result.success) return;
      remoteLoadedRef.current = true;

      if (result.settings) {
        setSettingsState(result.settings);
        settingsRef.current = result.settings;
        persistSettings(result.settings);
      } else {
        void savePomodoroSettingsAction(userId, settingsRef.current);
      }

      setStatsState(result.stats);
      statsRef.current = result.stats;
      persistStats(result.stats);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, persistSettings, persistStats]);

  useEffect(() => {
    return () => {
      clearTick();
      disposeAudio();
      if (settingsSaveTimerRef.current) clearTimeout(settingsSaveTimerRef.current);
    };
  }, [clearTick]);

  return {
    phase: session.phase,
    timerMode: session.timerMode ?? (session.phase === 'past_paper' ? 'past_paper' : 'pomodoro'),
    remainingMs: displayMs,
    totalMs: getTimerDurationMs(session.phase, settings, session.pastPaperConfig),
    isPaused: session.isPaused,
    isRunning: !session.isPaused && session.endsAt !== null,
    cyclesCompletedToday: session.cyclesCompletedToday,
    sessionLabel: session.sessionLabel,
    settings,
    stats,
    pastPaperConfig: session.pastPaperConfig ?? DEFAULT_PAST_PAPER,
    activeExamAlert,
    start,
    pause,
    resume,
    reset,
    switchPhase,
    switchTimerMode,
    configurePastPaper,
    updateSettings,
    setSessionLabel,
    setCustomWallpaper,
  };
}

function logCompletedStandalone(focusMinutes: number): void {
  try {
    const s = safeGetItem(STORAGE_KEYS.stats, emptyStats());
    const today = todayKey();
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
