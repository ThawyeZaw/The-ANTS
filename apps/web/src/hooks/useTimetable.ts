'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  TimetableEvent,
  TimetableView,
  TimetableFilters,
  TimetableEventFormData,
  TimetableEventType,
  RecurrenceRule,
} from '@/types/timetable';
import type { Json } from '@/types/supabase';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ALL_EVENT_TYPES, DEFAULT_TIMETABLE_FILTERS } from '@/constants/timetable';
import {
  actionEnqueueTimetableReminders,
  actionClearSourceQueue,
} from '@/actions/notifications';
import { expandRecurringEvents } from '@/lib/timetable/recurrence';

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

/** Returns the Monday of the week containing the given date */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns the first day of the month containing the given date */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Returns the last day of the month containing the given date */
function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Format a date as YYYY-MM-DD */
export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse "YYYY-MM-DD" + "HH:MM" into a UTC ISO string */
export function combineDateTime(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

// ---------------------------------------------------------------------------
// Undo/Redo History
//
// Client-only snapshot history. Every mutation records the affected event's
// full state BEFORE and AFTER, so undo/redo can restore the row and keep the
// Telegram reminder queue in sync with whichever time is now active.
// ---------------------------------------------------------------------------

/** Mutable columns of a timetable event, captured for undo/redo. */
interface EventSnapshot {
  id: string;
  title: string;
  description: string | null;
  event_type: TimetableEventType;
  subject: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  color_code: string;
  is_todo: boolean;
  is_completed: boolean;
  completed_at: string | null;
  reminder_minutes: number | null;
}

interface HistoryEntry {
  /** Full state before the action — null when the event was created by it. */
  before: EventSnapshot | null;
  /** Full state after the action — null when the event was deleted by it. */
  after: EventSnapshot | null;
}

/** The DB stores reminder_minutes even though the TS interface omits it. */
type EventWithReminder = TimetableEvent & { reminder_minutes?: number | null };

function toSnapshot(e: TimetableEvent): EventSnapshot {
  const withReminder = e as EventWithReminder;
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? null,
    event_type: e.event_type,
    subject: e.subject ?? null,
    location: e.location ?? null,
    start_time: e.start_time,
    end_time: e.end_time,
    all_day: e.all_day,
    is_recurring: e.is_recurring,
    recurrence_rule: e.recurrence_rule,
    color_code: e.color_code,
    is_todo: e.is_todo,
    is_completed: e.is_completed,
    completed_at: e.completed_at,
    reminder_minutes: withReminder.reminder_minutes ?? null,
  };
}

// ---------------------------------------------------------------------------
// useTimetable Hook
// ---------------------------------------------------------------------------

export interface UseTimetableReturn {
  view: TimetableView;
  currentDate: Date;
  filters: TimetableFilters;
  events: TimetableEvent[];
  isLoading: boolean;
  weekStart: Date;
  monthStart: Date;
  monthEnd: Date;
  navigate: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  goToDate: (date: Date) => void;
  setView: (view: TimetableView) => void;
  setFilters: (filters: TimetableFilters) => void;
  toggleEventTypeFilter: (type: TimetableEventType) => void;
  getEventsForDay: (date: Date) => TimetableEvent[];
  getEventsForWeek: (weekStart: Date) => TimetableEvent[];
  getEventsForMonth: (month: Date) => TimetableEvent[];
  createEvent: (data: TimetableEventFormData) => Promise<{ success: boolean; error?: string }>;
  updateEvent: (id: string, data: TimetableEventFormData) => Promise<{ success: boolean; error?: string }>;
  deleteEvent: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleComplete: (id: string) => Promise<{ success: boolean; error?: string }>;
  moveEvent: (id: string, newStart: string, newEnd: string | null) => Promise<{ success: boolean; error?: string }>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  integrationCounts: { exams: number; assignments: number; clubEvents: number; milestones: number };
}

export function useTimetable(userId: string): UseTimetableReturn {
  const supabase = createClient()!;
  const [view, setViewState] = useState<TimetableView>('week');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [filters, setFilters] = useState<TimetableFilters>(DEFAULT_TIMETABLE_FILTERS);
  const [allEvents, setAllEvents] = useState<TimetableEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Undo/redo stacks (client-only, cleared on refresh)
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const canUndo = history.length > 0;
  const canRedo = redoStack.length > 0;

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const monthStart = useMemo(() => getMonthStart(currentDate), [currentDate]);
  const monthEnd = useMemo(() => getMonthEnd(currentDate), [currentDate]);

  const [rangeStart, rangeEnd] = useMemo(() => {
    switch (view) {
      case 'day': {
        const s = new Date(currentDate);
        s.setHours(0, 0, 0, 0);
        const e = new Date(currentDate);
        e.setHours(23, 59, 59, 999);
        return [s, e];
      }
      case 'week': {
        const s = new Date(weekStart);
        const e = new Date(weekStart);
        e.setDate(e.getDate() + 6);
        e.setHours(23, 59, 59, 999);
        return [s, e];
      }
      case 'month': {
        const s = new Date(monthStart);
        s.setDate(s.getDate() - 7);
        const e = new Date(monthEnd);
        e.setDate(e.getDate() + 7);
        return [s, e];
      }
    }
  }, [view, currentDate, weekStart, monthStart, monthEnd]);

  // Load events from Supabase whenever range or filters change
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('timetable_events')
        .select('*')
        .eq('user_id', userId)
        .or(`and(start_time.gte.${rangeStart.toISOString()},start_time.lte.${rangeEnd.toISOString()}),is_recurring.eq.true`);

      if (!cancelled) {
        if (error || !data) {
          if (error && error.code !== 'PGRST116') console.error('Failed to load timetable events from DB:', error);
          setAllEvents([]);
        } else {
          const expandedEvents: TimetableEvent[] = [];
          for (const ev of data as TimetableEvent[]) {
            const instances = expandRecurringEvents(ev, rangeStart, rangeEnd);
            expandedEvents.push(...instances);
          }
          setAllEvents(expandedEvents);
        }
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, rangeStart.toISOString(), rangeEnd.toISOString(), filters.showExternalEvents, refreshKey, supabase]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // ── Undo/redo helpers ──

  /** Push a mutation onto the undo stack and clear the redo stack. */
  const recordHistory = useCallback((entry: HistoryEntry) => {
    setHistory(h => [...h, entry]);
    setRedoStack([]);
  }, []);

  /** Re-sync the Telegram reminder queue for a snapshot (enqueue or clear). */
  const syncTimetableReminder = useCallback(async (s: EventSnapshot) => {
    if (s.start_time) {
      await actionEnqueueTimetableReminders(
        userId,
        s.id,
        s.title,
        s.location,
        s.start_time,
        s.reminder_minutes,
        s.is_recurring,
        s.recurrence_rule
      );
    } else {
      await actionClearSourceQueue('timetable_event', s.id);
    }
  }, [userId]);

  /**
   * Write a snapshot back to the DB.
   * - null snapshot → delete the row and clear its reminder queue.
   * - snapshot → upsert the row and re-sync its reminder queue.
   * `fallbackId` is the row to delete when snapshot is null.
   */
  const applySnapshot = useCallback(async (snapshot: EventSnapshot | null, fallbackId: string) => {
    if (!snapshot) {
      await supabase.from('timetable_events').delete().eq('id', fallbackId);
      await actionClearSourceQueue('timetable_event', fallbackId);
      return;
    }
    const { error } = await supabase
      .from('timetable_events')
      .upsert({
        id: snapshot.id,
        user_id: userId,
        title: snapshot.title,
        description: snapshot.description,
        event_type: snapshot.event_type,
        subject: snapshot.subject,
        location: snapshot.location,
        start_time: snapshot.start_time,
        end_time: snapshot.end_time,
        all_day: snapshot.all_day,
        is_recurring: snapshot.is_recurring,
        recurrence_rule: snapshot.recurrence_rule as unknown as Json,
        color_code: snapshot.color_code,
        is_todo: snapshot.is_todo,
        is_completed: snapshot.is_completed,
        completed_at: snapshot.completed_at,
        reminder_minutes: snapshot.reminder_minutes,
      }, { onConflict: 'id' });
    if (error) {
      console.error('[useTimetable] Undo/redo restore failed:', error);
      return;
    }
    await syncTimetableReminder(snapshot);
  }, [userId, supabase, syncTimetableReminder]);

  /** Revert the most recent mutation. */
  const undo = useCallback(async () => {
    const entry = history[history.length - 1];
    if (!entry) return;
    setHistory(history.slice(0, -1));
    setRedoStack(r => [...r, entry]);
    const eventId = entry.before?.id ?? entry.after?.id;
    if (!eventId) return;
    await applySnapshot(entry.before, eventId);
    refresh();
  }, [history, applySnapshot, refresh]);

  /** Re-apply the last undone mutation. */
  const redo = useCallback(async () => {
    const entry = redoStack[redoStack.length - 1];
    if (!entry) return;
    setRedoStack(redoStack.slice(0, -1));
    setHistory(h => [...h, entry]);
    const eventId = entry.before?.id ?? entry.after?.id;
    if (!eventId) return;
    await applySnapshot(entry.after, eventId);
    refresh();
  }, [redoStack, applySnapshot, refresh]);

  // Navigation
  const navigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      const delta = direction === 'next' ? 1 : -1;
      switch (view) {
        case 'day': d.setDate(d.getDate() + delta); break;
        case 'week': d.setDate(d.getDate() + delta * 7); break;
        case 'month': d.setMonth(d.getMonth() + delta); break;
      }
      return d;
    });
  }, [view]);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);
  const goToDate = useCallback((date: Date) => setCurrentDate(date), []);
  const setView = useCallback((v: TimetableView) => setViewState(v), []);

  const toggleEventTypeFilter = useCallback((type: TimetableEventType) => {
    setFilters(prev => {
      const current = prev.eventTypes;
      const isActive = current.includes(type);
      return { ...prev, eventTypes: isActive ? current.filter(t => t !== type) : [...current, type] };
    });
  }, []);

  // Client-side filters
  const events = useMemo(() => {
    return allEvents.filter(e => {
      if (!filters.eventTypes.includes(e.event_type)) return false;
      if (!filters.showCompleted && e.is_todo && e.is_completed) return false;
      return true;
    });
  }, [allEvents, filters]);

  // View selectors
  const getEventsForDay = useCallback((date: Date): TimetableEvent[] => {
    const dateStr = formatDateLocal(date);
    return events.filter(e => {
      const t = e.start_time || e.end_time;
      if (!t) return e.all_day;
      return formatDateLocal(new Date(t)) === dateStr;
    });
  }, [events]);

  const getEventsForWeek = useCallback((wStart: Date): TimetableEvent[] => {
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 6);
    wEnd.setHours(23, 59, 59, 999);
    return events.filter(e => {
      const t = e.start_time || e.end_time;
      if (!t) return true;
      const d = new Date(t);
      return d >= wStart && d <= wEnd;
    });
  }, [events]);

  const getEventsForMonth = useCallback((month: Date): TimetableEvent[] => {
    const mStart = getMonthStart(month);
    const mEnd = getMonthEnd(month);
    return events.filter(e => {
      const t = e.start_time || e.end_time;
      if (!t) return true;
      const d = new Date(t);
      return d >= mStart && d <= mEnd;
    });
  }, [events]);

  // CRUD
  const createEvent = useCallback(async (data: TimetableEventFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { time_mode, date, start_time, end_time, recurrence_rule, reminder_minutes, ...rest } = data;
      let startIso: string | null = null;
      let endIso: string | null = null;
      let allDay = false;

      if (time_mode === 'timed') {
        startIso = combineDateTime(date, start_time);
        endIso = combineDateTime(date, end_time);
      } else if (time_mode === 'all_day') {
        allDay = true;
        startIso = new Date(`${date}T00:00:00`).toISOString();
      } else if (time_mode === 'deadline') {
        endIso = combineDateTime(date, end_time);
      }

      const { data: event, error } = await supabase.from('timetable_events').insert({
        user_id: userId,
        ...rest,
        recurrence_rule: (recurrence_rule ?? null) as unknown as Json,
        start_time: startIso,
        end_time: endIso,
        all_day: allDay,
        is_completed: false,
        completed_at: null,
        event_source: 'user',
        source_id: null,
        reminder_minutes,
      } as any).select().single();
      if (error) return { success: false, error: error.message };
      refresh();

      // Record for undo (create → undo deletes the event)
      if (event) recordHistory({ before: null, after: toSnapshot(event as TimetableEvent) });

      // Enqueue Telegram reminder into notification_queue
      if (startIso && reminder_minutes != null) {
        await actionEnqueueTimetableReminders(
          userId,
          (event as any).id,
          rest.title ?? '',
          rest.location ?? null,
          startIso,
          reminder_minutes,
          rest.is_recurring,
          recurrence_rule
        );
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [userId, refresh, supabase, recordHistory]);

  const updateEvent = useCallback(async (eventId: string, data: TimetableEventFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { time_mode, date, start_time, end_time, recurrence_rule, reminder_minutes, ...rest } = data;
      let startIso: string | null = null;
      let endIso: string | null = null;
      let allDay = false;

      if (time_mode === 'timed') {
        startIso = combineDateTime(date, start_time);
        endIso = combineDateTime(date, end_time);
      } else if (time_mode === 'all_day') {
        allDay = true;
        startIso = new Date(`${date}T00:00:00`).toISOString();
      } else if (time_mode === 'deadline') {
        endIso = combineDateTime(date, end_time);
      }

      const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
      const { data: existing } = await supabase
        .from('timetable_events')
        .select('*')
        .eq('id', baseId)
        .single();
      const { error } = await supabase.from('timetable_events').update({
        ...rest,
        recurrence_rule: (recurrence_rule ?? null) as unknown as Json,
        start_time: startIso,
        end_time: endIso,
        all_day: allDay,
        reminder_minutes,
      } as any).eq('id', baseId);
      if (error) return { success: false, error: error.message };
      refresh();

      // Record for undo (edit → undo restores the previous state)
      if (existing) {
        const beforeSnap = toSnapshot(existing as TimetableEvent);
        recordHistory({
          before: beforeSnap,
          after: {
            ...beforeSnap,
            title: rest.title,
            description: rest.description || null,
            event_type: rest.event_type,
            subject: rest.subject || null,
            location: rest.location || null,
            start_time: startIso,
            end_time: endIso,
            all_day: allDay,
            is_recurring: rest.is_recurring,
            recurrence_rule: recurrence_rule ?? null,
            color_code: rest.color_code,
            is_todo: rest.is_todo,
            reminder_minutes,
          },
        });
      }

      // Enqueue or clear Telegram reminder
      if (startIso && reminder_minutes != null) {
        await actionEnqueueTimetableReminders(
          userId,
          baseId,
          rest.title ?? '',
          rest.location ?? null,
          startIso,
          reminder_minutes,
          rest.is_recurring,
          recurrence_rule
        );
      } else {
        await actionClearSourceQueue('timetable_event', baseId);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [userId, refresh, supabase, recordHistory]);

  const deleteEvent = useCallback(async (eventId: string): Promise<{ success: boolean; error?: string }> => {
    const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
    const { data: existing } = await supabase
      .from('timetable_events')
      .select('*')
      .eq('id', baseId)
      .single();
    const { error } = await supabase.from('timetable_events').delete().eq('id', baseId);
    if (error) return { success: false, error: error.message };
    refresh();
    // Record for undo (delete → undo re-creates the event)
    if (existing) recordHistory({ before: toSnapshot(existing as TimetableEvent), after: null });
    // Clear pending queue items
    actionClearSourceQueue('timetable_event', baseId);
    return { success: true };
  }, [refresh, supabase, recordHistory]);

  const toggleComplete = useCallback(async (eventId: string): Promise<{ success: boolean; error?: string }> => {
    const { data: existing } = await supabase
      .from('timetable_events')
      .select('*')
      .eq('id', eventId)
      .single();
    const newVal = !(existing?.is_completed ?? false);
    const completedAt = newVal ? new Date().toISOString() : null;
    const { error } = await supabase.from('timetable_events').update({
      is_completed: newVal,
      completed_at: completedAt,
    }).eq('id', eventId);
    if (error) return { success: false, error: error.message };
    refresh();
    // Record for undo (toggle → undo flips completion back)
    if (existing) {
      recordHistory({
        before: toSnapshot(existing as TimetableEvent),
        after: toSnapshot({ ...existing, is_completed: newVal, completed_at: completedAt } as TimetableEvent),
      });
    }
    return { success: true };
  }, [refresh, supabase, recordHistory]);

  const moveEvent = useCallback(async (eventId: string, newStart: string, newEnd: string | null): Promise<{ success: boolean; error?: string }> => {
    // Fetch the event first so we can record history and re-sync its reminder.
    const { data: existing } = await supabase
      .from('timetable_events')
      .select('*')
      .eq('id', eventId)
      .single();
    const { error } = await supabase.from('timetable_events').update({
      start_time: newStart,
      end_time: newEnd,
    }).eq('id', eventId);
    if (error) return { success: false, error: error.message };
    refresh();

    if (existing) {
      const moved = { ...existing, start_time: newStart, end_time: newEnd };
      recordHistory({ before: toSnapshot(existing as TimetableEvent), after: toSnapshot(moved as TimetableEvent) });
      // Keep the Telegram reminder in sync with the new time (drag & drop).
      await syncTimetableReminder(toSnapshot(moved as TimetableEvent));
    }
    return { success: true };
  }, [refresh, supabase, recordHistory, syncTimetableReminder]);

  // Integration counts for banner
  const integrationCounts = useMemo(() => {
    const exams = allEvents.filter(e => e.event_source === 'exam_countdown').length;
    const assignments = allEvents.filter(e => e.event_source === 'assignment').length;
    const clubEvents = allEvents.filter(e => e.event_source === 'club_event').length;
    const milestones = allEvents.filter(e => e.event_source === 'club_milestone').length;
    return { exams, assignments, clubEvents, milestones };
  }, [allEvents]);

  return {
    view, currentDate, filters, events, isLoading,
    weekStart, monthStart, monthEnd,
    navigate, goToToday, goToDate, setView,
    setFilters, toggleEventTypeFilter,
    getEventsForDay, getEventsForWeek, getEventsForMonth,
    createEvent, updateEvent, deleteEvent, toggleComplete, moveEvent,
    undo, redo, canUndo, canRedo,
    integrationCounts,
  };
}
