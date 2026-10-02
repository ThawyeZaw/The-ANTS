'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useTimetable Hook (Server Actions / D1)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  TimetableEvent,
  TimetableView,
  TimetableFilters,
  TimetableEventFormData,
  TimetableEventType,
  RecurrenceRule,
} from '@/types/timetable';
import { ALL_EVENT_TYPES, DEFAULT_TIMETABLE_FILTERS } from '@/constants/timetable';
import {
  actionGetTimetableEvents,
  actionCreateTimetableEvent,
  actionUpdateTimetableEvent,
  actionDeleteTimetableEvent,
  actionToggleTimetableEventComplete,
} from '@/actions/timetable';
import {
  listExamCountdownsForUser,
  updateExamCountdown,
  deleteExamCountdown,
} from '@/actions/exam-data';
import { expandRecurringEvents } from '@/lib/timetable/recurrence';
import type { AwardXpResult } from '@/lib/gamification/types';

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function combineDateTime(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

// ---------------------------------------------------------------------------
// Undo/Redo History
// ---------------------------------------------------------------------------

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
  before: EventSnapshot | null;
  after: EventSnapshot | null;
}

function toSnapshot(e: TimetableEvent): EventSnapshot {
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
    reminder_minutes: e.reminder_minutes ?? ((e.metadata as any)?.reminder_minutes as number) ?? null,
  };
}

function examCountdownToEvent(exam: {
  id: string;
  user_id: string;
  title: string;
  exam_date: string;
  color_code?: string | null;
  paper_name?: string | null;
  exam_board?: string | null;
  is_mock?: boolean;
  created_at?: string;
}): TimetableEvent {
  const start = new Date(exam.exam_date);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    id: `exam-${exam.id}`,
    user_id: exam.user_id,
    title: exam.paper_name ? `${exam.title} (${exam.paper_name})` : exam.title,
    description: exam.exam_board ? `${exam.exam_board} exam` : 'Exam countdown',
    event_type: 'exam',
    subject: exam.paper_name ?? null,
    location: null,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    all_day: false,
    is_recurring: false,
    recurrence_rule: null,
    color_code: exam.color_code || '#EF4444',
    is_todo: false,
    is_completed: false,
    completed_at: null,
    event_source: 'exam_countdown',
    source_id: exam.id,
    reminder_minutes: null,
    metadata: {
      exam_board: exam.exam_board,
      paper_name: exam.paper_name,
      is_mock: exam.is_mock,
      event_source: 'exam_countdown',
      source_id: exam.id,
    },
    created_at: exam.created_at || new Date().toISOString(),
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
  toggleComplete: (id: string) => Promise<{ success: boolean; error?: string; gamification?: AwardXpResult }>;
  moveEvent: (id: string, newStart: string, newEnd: string | null) => Promise<{ success: boolean; error?: string }>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  integrationCounts: { exams: number; assignments: number; clubEvents: number; milestones: number };
}

export function useTimetable(userId: string): UseTimetableReturn {
  const [view, setViewState] = useState<TimetableView>('week');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [filters, setFilters] = useState<TimetableFilters>(DEFAULT_TIMETABLE_FILTERS);
  const [allEvents, setAllEvents] = useState<TimetableEvent[]>([]);
  const [examCount, setExamCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
        const s = new Date(weekStart);
        const e = new Date(weekStart);
        e.setDate(e.getDate() + 6);
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
      case 'list': {
        const today = new Date();
        const s = new Date(Math.min(today.getTime(), monthStart.getTime(), weekStart.getTime()));
        s.setDate(s.getDate() - 14);
        s.setHours(0, 0, 0, 0);
        const e = new Date(Math.max(today.getTime(), monthEnd.getTime()));
        e.setDate(e.getDate() + 45);
        e.setHours(23, 59, 59, 999);
        return [s, e];
      }
    }
  }, [view, currentDate, weekStart, monthStart, monthEnd]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const [data, exams] = await Promise.all([
          actionGetTimetableEvents(userId),
          listExamCountdownsForUser(userId).catch(() => []),
        ]);
        if (cancelled) return;

        const expandedEvents: TimetableEvent[] = [];
        for (const ev of data) {
          const instances = expandRecurringEvents(ev, rangeStart, rangeEnd);
          expandedEvents.push(...instances);
        }

        const examEvents = (exams || [])
          .filter((exam) => {
            if (!exam.exam_date) return false;
            const t = new Date(exam.exam_date).getTime();
            return t >= rangeStart.getTime() - 7 * 86400000 && t <= rangeEnd.getTime() + 7 * 86400000;
          })
          .map((exam) =>
            examCountdownToEvent({
              id: exam.id as string,
              user_id: exam.user_id as string,
              title: (exam.title as string) || 'Exam',
              exam_date: exam.exam_date as string,
              color_code: (exam.color_code as string | null) ?? null,
              paper_name: (exam.paper_name as string | null) ?? null,
              exam_board: (exam.exam_board as string | null) ?? null,
              is_mock: Boolean(exam.is_mock),
              created_at: exam.created_at as string | undefined,
            })
          );

        setExamCount(examEvents.length);
        setAllEvents([...expandedEvents, ...examEvents]);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load timetable events:', err);
          setAllEvents([]);
          setExamCount(0);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, rangeStart.toISOString(), rangeEnd.toISOString(), refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const recordHistory = useCallback((entry: HistoryEntry) => {
    setHistory((h) => [...h, entry]);
    setRedoStack([]);
  }, []);

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      setCurrentDate((prev) => {
        const d = new Date(prev);
        const delta = direction === 'next' ? 1 : -1;
        switch (view) {
          case 'day':
            d.setDate(d.getDate() + delta);
            break;
          case 'week':
            d.setDate(d.getDate() + delta * 7);
            break;
          case 'month':
            d.setMonth(d.getMonth() + delta);
            break;
          case 'list':
            d.setDate(d.getDate() + delta * 7);
            break;
        }
        return d;
      });
    },
    [view]
  );

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);
  const goToDate = useCallback((date: Date) => setCurrentDate(date), []);
  const setView = useCallback((v: TimetableView) => {
    setViewState(v);
    try {
      window.localStorage.setItem('ants-timetable-view', v);
    } catch {
      /* ignore private mode */
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ants-timetable-view');
      if (saved === 'day' || saved === 'week' || saved === 'month' || saved === 'list') {
        setViewState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleEventTypeFilter = useCallback((type: TimetableEventType) => {
    setFilters((prev) => {
      const current = prev.eventTypes;
      const isActive = current.includes(type);
      return { ...prev, eventTypes: isActive ? current.filter((t) => t !== type) : [...current, type] };
    });
  }, []);

  const events = useMemo(() => {
    return allEvents.filter((e) => {
      if (!filters.eventTypes.includes(e.event_type)) return false;
      if (!filters.showCompleted && e.is_completed) return false;
      if (!filters.showExternalEvents && e.event_source !== 'user') return false;
      return true;
    });
  }, [allEvents, filters]);

  const getEventsForDay = useCallback(
    (date: Date): TimetableEvent[] => {
      const dateStr = formatDateLocal(date);
      return events.filter((e) => {
        const t = e.start_time || e.end_time;
        if (!t) return e.all_day;
        return formatDateLocal(new Date(t)) === dateStr;
      });
    },
    [events]
  );

  const getEventsForWeek = useCallback(
    (wStart: Date): TimetableEvent[] => {
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 6);
      wEnd.setHours(23, 59, 59, 999);
      return events.filter((e) => {
        const t = e.start_time || e.end_time;
        if (!t) return true;
        const d = new Date(t);
        return d >= wStart && d <= wEnd;
      });
    },
    [events]
  );

  const getEventsForMonth = useCallback(
    (month: Date): TimetableEvent[] => {
      const mStart = getMonthStart(month);
      const mEnd = getMonthEnd(month);
      return events.filter((e) => {
        const t = e.start_time || e.end_time;
        if (!t) return true;
        const d = new Date(t);
        return d >= mStart && d <= mEnd;
      });
    },
    [events]
  );

  const createEvent = useCallback(
    async (data: TimetableEventFormData): Promise<{ success: boolean; error?: string }> => {
      try {
        const { time_mode, date, start_time, end_time, recurrence_rule, reminder_minutes, ...rest } = data;
        let startIso: string = new Date().toISOString();
        let endIso: string = new Date(Date.now() + 3600000).toISOString();
        let allDay = false;

        if (time_mode === 'timed') {
          startIso = combineDateTime(date, start_time);
          endIso = combineDateTime(date, end_time);
        } else if (time_mode === 'all_day') {
          allDay = true;
          startIso = new Date(`${date}T00:00:00`).toISOString();
          endIso = new Date(`${date}T23:59:59`).toISOString();
        } else if (time_mode === 'deadline') {
          endIso = combineDateTime(date, end_time);
          startIso = endIso;
        }

        const res = await actionCreateTimetableEvent(userId, {
          title: rest.title,
          event_type: rest.event_type,
          start_time: startIso,
          end_time: endIso,
          all_day: allDay,
          is_recurring: rest.is_recurring,
          recurrence_rule: recurrence_rule ?? null,
          color_code: rest.color_code,
          is_todo: true,
          metadata: {
            description: rest.description,
            location: rest.location,
            subject: rest.subject,
            reminder_minutes,
            is_todo: true,
          },
        });

        if (res.success && res.event) {
          recordHistory({ before: null, after: toSnapshot(res.event) });
          refresh();
          return { success: true };
        }
        return { success: false, error: res.error || 'Failed to create event' };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
    [userId, refresh, recordHistory]
  );

  const updateEvent = useCallback(
    async (eventId: string, data: TimetableEventFormData): Promise<{ success: boolean; error?: string }> => {
      try {
        const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
        const existing = allEvents.find((e) => e.id === eventId || e.id === baseId || e.id === `exam-${baseId}`);

        if (existing?.event_source === 'exam_countdown' && existing.source_id) {
          const startIso =
            data.time_mode === 'all_day'
              ? new Date(`${data.date}T09:00:00`).toISOString()
              : combineDateTime(data.date, data.time_mode === 'deadline' ? data.end_time : data.start_time);
          const res = await updateExamCountdown({
            userId,
            countdownId: existing.source_id,
            title: data.title,
            examDate: startIso,
          });
          if (res.success) {
            refresh();
            return { success: true };
          }
          return { success: false, error: res.error || 'Failed to update exam' };
        }

        const { time_mode, date, start_time, end_time, recurrence_rule, reminder_minutes, ...rest } = data;
        let startIso: string = new Date().toISOString();
        let endIso: string = new Date(Date.now() + 3600000).toISOString();
        let allDay = false;

        if (time_mode === 'timed') {
          startIso = combineDateTime(date, start_time);
          endIso = combineDateTime(date, end_time);
        } else if (time_mode === 'all_day') {
          allDay = true;
          startIso = new Date(`${date}T00:00:00`).toISOString();
          endIso = new Date(`${date}T23:59:59`).toISOString();
        } else if (time_mode === 'deadline') {
          endIso = combineDateTime(date, end_time);
          startIso = endIso;
        }

        const res = await actionUpdateTimetableEvent(userId, baseId, {
          title: rest.title,
          event_type: rest.event_type,
          start_time: startIso,
          end_time: endIso,
          all_day: allDay,
          is_recurring: rest.is_recurring,
          recurrence_rule: recurrence_rule ?? null,
          color_code: rest.color_code,
          is_todo: true,
          metadata: {
            description: rest.description,
            location: rest.location,
            subject: rest.subject,
            reminder_minutes,
            is_todo: true,
          },
        });

        if (res.success && res.event) {
          refresh();
          return { success: true };
        }
        return { success: false, error: res.error || 'Failed to update event' };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
    [userId, refresh, allEvents]
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      const baseId = id.includes('::') ? id.split('::')[0] : id;
      const existing = allEvents.find((e) => e.id === id || e.id === baseId);

      if (existing?.event_source === 'exam_countdown' && existing.source_id) {
        const res = await deleteExamCountdown(userId, existing.source_id);
        if (res.success) {
          refresh();
          return { success: true };
        }
        return { success: false, error: (res as { error?: string }).error || 'Failed to remove exam' };
      }

      const res = await actionDeleteTimetableEvent(userId, baseId);
      if (res.success) {
        refresh();
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to delete event' };
    },
    [userId, refresh, allEvents]
  );

  const toggleComplete = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string; gamification?: AwardXpResult }> => {
      const baseId = id.includes('::') ? id.split('::')[0] : id;
      const instanceDate = id.includes('::') ? id.split('::')[1] : null;
      const ev = allEvents.find((e) => e.id === id);
      const isCompleted = !ev?.is_completed;
      const res = await actionToggleTimetableEventComplete(
        userId,
        baseId,
        isCompleted,
        ev?.is_recurring ? instanceDate : null
      );
      if (res.success) {
        refresh();
        return { success: true, gamification: res.gamification };
      }
      return { success: false, error: res.error || 'Failed to toggle complete' };
    },
    [userId, allEvents, refresh]
  );

  const moveEvent = useCallback(
    async (id: string, newStart: string, newEnd: string | null): Promise<{ success: boolean; error?: string }> => {
      const baseId = id.includes('::') ? id.split('::')[0] : id;
      const ev = allEvents.find((e) => e.id === baseId || e.id === id);
      if (!ev) return { success: false, error: 'Event not found' };

      if (ev.event_source === 'exam_countdown' && ev.source_id) {
        const res = await updateExamCountdown({
          userId,
          countdownId: ev.source_id,
          examDate: newStart,
        });
        if (res.success) {
          refresh();
          return { success: true };
        }
        return { success: false, error: res.error || 'Failed to move exam' };
      }

      const res = await actionUpdateTimetableEvent(userId, baseId, {
        start_time: newStart,
        end_time: newEnd || new Date(new Date(newStart).getTime() + 3600000).toISOString(),
      });

      if (res.success) {
        refresh();
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to move event' };
    },
    [userId, allEvents, refresh]
  );

  const undo = useCallback(async () => {
    // Undo helper
  }, []);

  const redo = useCallback(async () => {
    // Redo helper
  }, []);

  return {
    view,
    currentDate,
    filters,
    events,
    isLoading,
    weekStart,
    monthStart,
    monthEnd,
    navigate,
    goToToday,
    goToDate,
    setView,
    setFilters,
    toggleEventTypeFilter,
    getEventsForDay,
    getEventsForWeek,
    getEventsForMonth,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleComplete,
    moveEvent,
    undo,
    redo,
    canUndo,
    canRedo,
    integrationCounts: { exams: examCount, assignments: 0, clubEvents: 0, milestones: 0 },
  };
}
