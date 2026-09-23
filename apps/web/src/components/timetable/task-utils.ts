import type { TimetableEvent } from '@/types/timetable';

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function eventBaseId(id: string): string {
  return id.includes('::') ? id.split('::')[0] : id;
}

export function eventSortTime(event: TimetableEvent): number {
  const anchor = event.start_time || event.end_time;
  return anchor ? new Date(anchor).getTime() : 0;
}

export function formatClock(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** TickTick-style meta line, e.g. "Sep 24, 16:30". */
export function taskWhenLabel(event: TimetableEvent): string {
  const anchor = event.start_time || event.end_time;
  if (!anchor) return 'All day';
  const date = new Date(anchor);
  if (Number.isNaN(date.getTime())) return 'All day';
  const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (event.all_day) return day;
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day}, ${time}`;
}

export function formatTimeRange(event: TimetableEvent): string {
  if (event.all_day || !event.start_time) return 'All day';
  const start = formatClock(event.start_time);
  const end = event.end_time ? formatClock(event.end_time) : '';
  return end ? `${start} – ${end}` : start;
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function repeatLabel(event: TimetableEvent): string | null {
  if (!event.is_recurring || !event.recurrence_rule) return null;
  const rule = event.recurrence_rule;
  if (rule.frequency === 'daily') return 'Every day';
  if (rule.frequency === 'monthly') return 'Every month';
  if (rule.frequency === 'weekly') {
    const days = rule.days_of_week ?? [];
    const weekdays = [1, 2, 3, 4, 5];
    if (days.length === 5 && weekdays.every((d) => days.includes(d))) return 'Weekdays';
    return 'Every week';
  }
  return 'Repeats';
}

/** One row per task. Repeating tasks keep the next upcoming day. */
export function representativeTasks(events: TimetableEvent[], today = new Date()): TimetableEvent[] {
  const todayMs = startOfDay(today).getTime();
  const groups = new Map<string, TimetableEvent[]>();
  for (const event of events) {
    const id = eventBaseId(event.id);
    const list = groups.get(id) ?? [];
    list.push(event);
    groups.set(id, list);
  }

  const picked: TimetableEvent[] = [];
  for (const list of groups.values()) {
    const sorted = [...list].sort((a, b) => eventSortTime(a) - eventSortTime(b));
    const upcoming = sorted.find((event) => eventSortTime(event) >= todayMs && !event.is_completed);
    picked.push(upcoming ?? sorted.find((event) => eventSortTime(event) >= todayMs) ?? sorted[sorted.length - 1]);
  }
  return picked;
}

export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const TASK_COLOURS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
];
