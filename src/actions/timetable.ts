'use server';

// ──────────────────────────────────────────────────────────────────────────────
// Timetable Server Actions
// Currently pass-through wrappers around the mock database.
// Ready for Supabase binding: replace the mock imports with Supabase client calls.
// ──────────────────────────────────────────────────────────────────────────────

import type { TimetableEvent, TimetableEventFormData } from '@/types/timetable';
import {
  createTimetableEvent,
  updateTimetableEvent,
  deleteTimetableEvent,
  toggleTimetableEventComplete,
  moveTimetableEvent,
  getIntegratedTimetableEvents,
} from '@/lib/mock/timetable';
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
    const events = getIntegratedTimetableEvents(userId, rangeStart, rangeEnd, { showExternalEvents });
    return { success: true, events };
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

    const result = createTimetableEvent(userId, {
      ...rest,
      start_time: startIso,
      end_time: endIso,
      all_day: allDay,
      is_completed: false,
      completed_at: null,
      event_source: 'user',
      source_id: null,
    });

    return result;
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
    return updateTimetableEvent(baseId, userId, {
      ...rest,
      start_time: startIso,
      end_time: endIso,
      all_day: allDay,
    });
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
  const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
  return deleteTimetableEvent(baseId, userId);
}

// ---------------------------------------------------------------------------
// Toggle Complete
// ---------------------------------------------------------------------------

export async function toggleEventCompleteAction(
  eventId: string,
  userId: string
): Promise<{ success: true; event: TimetableEvent } | { success: false; error: string }> {
  return toggleTimetableEventComplete(eventId, userId);
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
  return moveTimetableEvent(eventId, userId, newStartTime, newEndTime);
}
