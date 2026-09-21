'use server';

import { getDb, pomodoroSessions, pomodoroUserSettings, userXpLedger } from '@/lib/db';
import { and, desc, eq, gt } from 'drizzle-orm';
import type {
  PomodoroDailyEntry,
  PomodoroSettings,
  PomodoroStatsLog,
  TimerPhase,
} from '@/constants/pomodoro';
import { normalizeSettings } from '@/constants/pomodoro';
import { awardXp, XP_AMOUNTS, type AwardXpResult } from '@/lib/gamification/award';
import { requireSessionUser } from '@/lib/auth-session';

export interface PomodoroSessionInput {
  durationMinutes: number;
  sessionType: TimerPhase;
  startedAt: string;
  completedAt: string;
  notes?: string | null;
  /** Server-issued focus token from beginPomodoroFocusAction (required for XP). */
  focusToken?: string;
}

const POMODORO_XP_MIN_MINUTES = 25;
const POMODORO_XP_AMOUNT = XP_AMOUNTS.pomodoro;
const POMODORO_XP_COOLDOWN_MS = 20 * 60 * 1000;
const POMODORO_MIN_ELAPSED_MS = (POMODORO_XP_MIN_MINUTES - 1) * 60 * 1000;
const POMODORO_MAX_ELAPSED_MS = 3 * 60 * 60 * 1000;

function dateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

  const today = dateKeyFromIso(new Date().toISOString());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dateKeyFromIso(yesterdayDate.toISOString());
  const hasToday = entries.some((e) => e.date === today);
  const hasYesterday = entries.some((e) => e.date === yesterday);

  if (!hasToday && !hasYesterday) {
    return { currentStreak: 0, longestStreak: computeLongestStreak(entries) };
  }

  let currentStreak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKeyFromIso(d.toISOString());
    if (entries.some((e) => e.date === key)) currentStreak++;
    else break;
  }

  const longestStreak = computeLongestStreak(entries);
  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

function aggregateStatsFromSessions(
  sessions: Array<{ duration_minutes: number; started_at: Date | string | null; session_type: string | null }>,
): PomodoroStatsLog {
  const byDate = new Map<string, PomodoroDailyEntry>();

  for (const session of sessions) {
    if (session.session_type !== 'focus' || !session.started_at) continue;
    const started =
      session.started_at instanceof Date ? session.started_at : new Date(session.started_at);
    const date = dateKeyFromIso(started.toISOString());
    const existing = byDate.get(date);
    if (existing) {
      existing.focusMinutes += session.duration_minutes;
      existing.sessionsCompleted += 1;
    } else {
      byDate.set(date, {
        date,
        focusMinutes: session.duration_minutes,
        sessionsCompleted: 1,
      });
    }
  }

  const entries = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const trimmed = entries.length > 30 ? entries.slice(-30) : entries;
  const allTimeFocusMinutes = sessions
    .filter((s) => s.session_type === 'focus')
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  const streaks = computeStreak(trimmed);

  return {
    entries: trimmed,
    allTimeFocusMinutes,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
  };
}

/** Start a server-tracked focus block. XP is only granted when completing with this token. */
export async function beginPomodoroFocusAction(
  userId: string
): Promise<{ success: true; focusToken: string } | { success: false; error: string }> {
  try {
    const guard = await requireSessionUser(userId);
    if (!guard.ok) return { success: false, error: guard.error };

    const db = getDb();
    const focusToken = crypto.randomUUID();
    await db.insert(pomodoroSessions).values({
      id: focusToken,
      user_id: userId,
      duration_minutes: 0,
      session_type: 'focus',
      started_at: new Date(),
      completed_at: null,
      notes: null,
    });

    return { success: true, focusToken };
  } catch (err) {
    return { success: false, error: `Failed to start focus session: ${String(err)}` };
  }
}

export async function fetchPomodoroDataAction(userId: string): Promise<
  | {
      success: true;
      settings: PomodoroSettings | null;
      stats: PomodoroStatsLog;
    }
  | { success: false; error: string }
> {
  try {
    const db = getDb();
    const [settingsRow, sessions] = await Promise.all([
      db.query.pomodoroUserSettings.findFirst({
        where: eq(pomodoroUserSettings.user_id, userId),
      }),
      db.query.pomodoroSessions.findMany({
        where: and(eq(pomodoroSessions.user_id, userId), eq(pomodoroSessions.session_type, 'focus')),
        orderBy: [desc(pomodoroSessions.started_at)],
        limit: 500,
      }),
    ]);

    const settings = settingsRow?.settings
      ? normalizeSettings(settingsRow.settings)
      : null;
    const stats = aggregateStatsFromSessions(sessions);

    return { success: true, settings, stats };
  } catch (err) {
    return { success: false, error: `Failed to fetch pomodoro data: ${String(err)}` };
  }
}

export async function savePomodoroSettingsAction(
  userId: string,
  settings: PomodoroSettings,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const db = getDb();
    await db
      .insert(pomodoroUserSettings)
      .values({
        user_id: userId,
        settings: settings as unknown as Record<string, unknown>,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: pomodoroUserSettings.user_id,
        set: {
          settings: settings as unknown as Record<string, unknown>,
          updated_at: new Date(),
        },
      });

    return { success: true };
  } catch (err) {
    return { success: false, error: `Failed to save pomodoro settings: ${String(err)}` };
  }
}

export async function logPomodoroSessionAction(
  userId: string,
  input: PomodoroSessionInput,
): Promise<
  | { success: true; gamification?: AwardXpResult }
  | { success: false; error: string }
> {
  if (input.durationMinutes <= 0) return { success: true };

  try {
    const guard = await requireSessionUser(userId);
    if (!guard.ok) return { success: false, error: guard.error };

    const db = getDb();
    const now = new Date();
    let sessionId = crypto.randomUUID();
    let gamification: AwardXpResult | undefined;

    if (input.focusToken && input.sessionType === 'focus') {
      const pending = await db.query.pomodoroSessions.findFirst({
        where: and(
          eq(pomodoroSessions.id, input.focusToken),
          eq(pomodoroSessions.user_id, userId),
          eq(pomodoroSessions.session_type, 'focus')
        ),
      });

      if (pending && !pending.completed_at && pending.started_at) {
        const started =
          pending.started_at instanceof Date
            ? pending.started_at
            : new Date(pending.started_at);
        const elapsedMs = now.getTime() - started.getTime();

        await db
          .update(pomodoroSessions)
          .set({
            duration_minutes: input.durationMinutes,
            completed_at: now,
            notes: input.notes ?? null,
          })
          .where(eq(pomodoroSessions.id, input.focusToken));

        sessionId = input.focusToken;

        if (
          elapsedMs >= POMODORO_MIN_ELAPSED_MS &&
          elapsedMs <= POMODORO_MAX_ELAPSED_MS &&
          input.durationMinutes >= POMODORO_XP_MIN_MINUTES
        ) {
          const cooldownSince = new Date(Date.now() - POMODORO_XP_COOLDOWN_MS);
          const recent = await db.query.userXpLedger.findFirst({
            where: and(
              eq(userXpLedger.user_id, userId),
              eq(userXpLedger.source, 'pomodoro'),
              gt(userXpLedger.earned_at, cooldownSince)
            ),
          });
          if (!recent) {
            gamification = await awardXp(
              userId,
              POMODORO_XP_AMOUNT,
              'pomodoro',
              sessionId,
              'Completed 25-minute focus block'
            );
          }
        }
      }
    } else {
      await db.insert(pomodoroSessions).values({
        id: sessionId,
        user_id: userId,
        duration_minutes: input.durationMinutes,
        session_type: input.sessionType,
        started_at: new Date(input.startedAt),
        completed_at: new Date(input.completedAt),
        notes: input.notes ?? null,
      });
    }

    return { success: true, gamification };
  } catch (err) {
    return { success: false, error: `Failed to log pomodoro session: ${String(err)}` };
  }
}
