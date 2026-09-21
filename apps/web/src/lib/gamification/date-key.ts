/** Browser-local calendar date as YYYY-MM-DD. */
export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Calendar date in an IANA timezone (falls back to UTC). */
export function dateKeyInTimeZone(timeZone: string | null | undefined, date = new Date()): string {
  const tz = timeZone && timeZone.trim() ? timeZone : 'UTC';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    /* invalid tz */
  }
  return date.toISOString().slice(0, 10);
}

export function daysBetweenDateKeys(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T12:00:00`);
  const to = new Date(`${toKey}T12:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function yesterdayDateKey(todayKey: string): string {
  const d = new Date(`${todayKey}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
}
