'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  TimetableEvent,
  TimetableView,
  TimetableFilters,
  TimetableEventFormData,
  TimetableEventType,
} from '@/types/timetable';
import type { Json } from '@/types/supabase';
import { createClient } from '@/lib/supabase/client';
import { ALL_EVENT_TYPES, DEFAULT_TIMETABLE_FILTERS } from '@/constants/timetable';

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
  integrationCounts: { exams: number; assignments: number; clubEvents: number; milestones: number };
}

export function useTimetable(userId: string): UseTimetableReturn {
  const supabase = createClient();
  if (!supabase) return;
  const [view, setViewState] = useState<TimetableView>('week');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [filters, setFilters] = useState<TimetableFilters>(DEFAULT_TIMETABLE_FILTERS);
  const [allEvents, setAllEvents] = useState<TimetableEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
        .gte('start_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString());

      if (!cancelled) {
        if (error) console.error('Failed to load timetable events:', error);
        else setAllEvents((data ?? []) as TimetableEvent[]);
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, rangeStart.toISOString(), rangeEnd.toISOString(), filters.showExternalEvents, refreshKey, supabase]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

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
      return new Date(t).toISOString().startsWith(dateStr.replace(/-/g, '-'));
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
      const { time_mode, date, start_time, end_time, recurrence_rule, ...rest } = data;
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

      const { error } = await supabase.from('timetable_events').insert({
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
      });
      refresh();
      return error ? { success: false, error: error.message } : { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [userId, refresh, supabase]);

  const updateEvent = useCallback(async (eventId: string, data: TimetableEventFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { time_mode, date, start_time, end_time, recurrence_rule, ...rest } = data;
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
      const { error } = await supabase.from('timetable_events').update({
        ...rest,
        recurrence_rule: (recurrence_rule ?? null) as unknown as Json,
        start_time: startIso,
        end_time: endIso,
        all_day: allDay,
      }).eq('id', baseId);
      refresh();
      return error ? { success: false, error: error.message } : { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [userId, refresh, supabase]);

  const deleteEvent = useCallback(async (eventId: string): Promise<{ success: boolean; error?: string }> => {
    const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
    const { error } = await supabase.from('timetable_events').delete().eq('id', baseId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  const toggleComplete = useCallback(async (eventId: string): Promise<{ success: boolean; error?: string }> => {
    const { data: existing } = await supabase.from('timetable_events').select('is_completed').eq('id', eventId).single();
    const newVal = !(existing?.is_completed ?? false);
    const { error } = await supabase.from('timetable_events').update({
      is_completed: newVal,
      completed_at: newVal ? new Date().toISOString() : null,
    }).eq('id', eventId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  const moveEvent = useCallback(async (eventId: string, newStart: string, newEnd: string | null): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.from('timetable_events').update({
      start_time: newStart,
      end_time: newEnd,
    }).eq('id', eventId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

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
    integrationCounts,
  };
}
