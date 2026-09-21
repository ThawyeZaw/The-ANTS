import { daysBetweenDateKeys, yesterdayDateKey } from './date-key';

function utcDateKey(value: Date | string): string | null {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Prefer the stamped local key; fall back to last_activity_date (UTC) for pre-migration rows. */
export function resolveActivityDateKey(
  lastActivityDateKey: string | null | undefined,
  lastActivityDate?: Date | string | null
): string | null {
  if (lastActivityDateKey) return lastActivityDateKey;
  if (!lastActivityDate) return null;
  return utcDateKey(lastActivityDate);
}

export function computeNextStreak(
  lastActivityDateKey: string | null | undefined,
  storedCurrentStreak: number,
  todayKey: string,
  lastActivityDate?: Date | string | null
): { currentStreak: number; longestStreak: number } {
  const key = resolveActivityDateKey(lastActivityDateKey, lastActivityDate);

  if (!key) {
    const next = Math.max(1, storedCurrentStreak || 1);
    return { currentStreak: next, longestStreak: next };
  }

  if (key === todayKey) {
    const kept = Math.max(1, storedCurrentStreak);
    return { currentStreak: kept, longestStreak: kept };
  }

  const yesterday = yesterdayDateKey(todayKey);
  if (key === yesterday) {
    const next = Math.max(1, storedCurrentStreak) + 1;
    return { currentStreak: next, longestStreak: next };
  }

  return { currentStreak: 1, longestStreak: 1 };
}

/** Display streak — broken if last activity was 2+ local days ago. */
export function displayStreak(
  lastActivityDateKey: string | null | undefined,
  storedCurrentStreak: number,
  todayKey: string,
  lastActivityDate?: Date | string | null
): number {
  if (storedCurrentStreak <= 0) return 0;

  const key = resolveActivityDateKey(lastActivityDateKey, lastActivityDate);
  if (!key) return storedCurrentStreak;

  const diff = daysBetweenDateKeys(key, todayKey);
  if (diff <= 1) return storedCurrentStreak;
  return 0;
}
