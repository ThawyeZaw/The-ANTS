'use server';

/**
 * @deprecated This file is deprecated. All timetable CRUD is handled directly
 * by useTimetable.ts hook using the Supabase client. Keep this file for
 * reference only; no new code should import from here.
 */

import type { TimetableEvent, TimetableEventFormData } from '@/types/timetable';
import { createClient } from '@/lib/supabase/server';
import { combineDateTime } from '@/hooks/useTimetable';

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function fetchTimetableEventsAction(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date,
  showExternalEvents = true
): Promise<{ success: true; events: TimetableEvent[] } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('timetable_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', rangeStart.toISOString())
      .lte('start_time', rangeEnd.toISOString());

    if (!showExternalEvents) {
      query = query.eq('event_source', 'user');
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, events: (data as TimetableEvent[]) ?? [] };
  } catch (err) {
    return { success: false, error: `Failed to fetch events: ${String(err)}` };
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createEventAction(
  userId: string,
  data: TimetableEventFormData
): Promise<{ success: true; event: TimetableEvent } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const { time_mode, date, start_time, end_time, ...rest } = data;

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
      start_time: startIso,
      end_time: endIso,
      all_day: allDay,
      is_completed: false,
      completed_at: null,
      event_source: 'user',
      source_id: null,
    }).select().single();

    if (error || !event) return { success: false, error: error?.message ?? 'Failed to create event' };
    return { success: true, event: event as TimetableEvent };
  } catch (err) {
    return { success: false, error: `Failed to create event: ${String(err)}` };
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateEventAction(
  eventId: string,
  userId: string,
  data: TimetableEventFormData
): Promise<{ success: true; event: TimetableEvent } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const { time_mode, date, start_time, end_time, ...rest } = data;
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
    const { data: event, error } = await supabase.from('timetable_events').update({
      ...rest,
      start_time: startIso,
      end_time: endIso,
      all_day: allDay,
    }).eq('id', baseId).select().single();

    if (error || !event) return { success: false, error: error?.message ?? 'Failed to update event' };
    return { success: true, event: event as TimetableEvent };
  } catch (err) {
    return { success: false, error: `Failed to update event: ${String(err)}` };
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteEventAction(
  eventId: string,
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
  const { error } = await supabase.from('timetable_events').delete().eq('id', baseId);
  return error ? { success: false, error: error.message } : { success: true };
}

// ---------------------------------------------------------------------------
// Toggle Complete
// ---------------------------------------------------------------------------

export async function toggleEventCompleteAction(
  eventId: string,
  userId: string
): Promise<{ success: true; event: TimetableEvent } | { success: false; error: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('timetable_events')
    .select('is_completed').eq('id', eventId).single();

  const newVal = !(existing?.is_completed ?? false);
  const { data: event, error } = await supabase.from('timetable_events').update({
    is_completed: newVal,
    completed_at: newVal ? new Date().toISOString() : null,
  }).eq('id', eventId).select().single();

  if (error || !event) return { success: false, error: error?.message ?? 'Failed to toggle' };
  return { success: true, event: event as TimetableEvent };
}

// ---------------------------------------------------------------------------
// Move (Drag-and-Drop)
// ---------------------------------------------------------------------------

export async function moveEventAction(
  eventId: string,
  userId: string,
  newStartTime: string,
  newEndTime: string | null
): Promise<{ success: true; event: TimetableEvent } | { success: false; error: string }> {
  const supabase = await createClient();
  const { data: event, error } = await supabase.from('timetable_events').update({
    start_time: newStartTime,
    end_time: newEndTime,
  }).eq('id', eventId).select().single();

  if (error || !event) return { success: false, error: error?.message ?? 'Failed to move event' };
  return { success: true, event: event as TimetableEvent };
}
