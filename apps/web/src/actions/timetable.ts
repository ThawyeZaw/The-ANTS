'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Timetable Server Actions (Neon Drizzle DB)
// ──────────────────────────────────────────────────────────────────────────────

import type { TimetableEvent, TimetableEventFormData } from '@/types/timetable';
import { getDb, timetableEvents } from '@/lib/db';
import { eq, and, gte, lte } from 'drizzle-orm';
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
    const db = getDb();
    const conditions = [
      eq(timetableEvents.user_id, userId),
      gte(timetableEvents.start_time, rangeStart),
      lte(timetableEvents.start_time, rangeEnd),
    ];

    if (!showExternalEvents) {
      conditions.push(eq(timetableEvents.event_source, 'user'));
    }

    const data = await db.query.timetableEvents.findMany({
      where: and(...conditions),
      orderBy: (events, { asc }) => [asc(events.start_time)],
    });

    const events: TimetableEvent[] = data.map((e) => ({
      id: e.id,
      user_id: e.user_id,
      title: e.title,
      description: e.description ?? undefined,
      event_type: (e.event_type as any) ?? 'study',
      subject: e.subject ?? undefined,
      location: e.location ?? undefined,
      start_time: e.start_time.toISOString(),
      end_time: e.end_time.toISOString(),
      all_day: e.all_day ?? false,
      is_recurring: e.is_recurring ?? false,
      recurrence_rule: e.recurrence_rule as any,
      color_code: e.color_code ?? '#3B82F6',
      is_todo: e.is_todo ?? false,
      is_completed: e.is_completed ?? false,
      completed_at: e.completed_at?.toISOString() ?? null,
      event_source: (e.event_source as any) ?? 'user',
      source_id: e.source_id ?? null,
      metadata: (e.metadata as any) ?? {},
      created_at: e.created_at?.toISOString() ?? new Date().toISOString(),
    }));

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
    const db = getDb();
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
      endIso = new Date(`${date}T23:59:59`).toISOString();
    } else if (time_mode === 'deadline') {
      endIso = combineDateTime(date, end_time);
      startIso = endIso;
    }

    const startDate = startIso ? new Date(startIso) : new Date();
    const endDate = endIso ? new Date(endIso) : new Date(startDate.getTime() + 3600000);

    const [newEvent] = await db
      .insert(timetableEvents)
      .values({
        user_id: userId,
        title: rest.title,
        description: rest.description,
        event_type: rest.event_type as any,
        subject: rest.subject,
        location: rest.location,
        start_time: startDate,
        end_time: endDate,
        all_day: allDay,
        is_recurring: rest.is_recurring ?? false,
        recurrence_rule: rest.recurrence_rule as any,
        color_code: rest.color_code,
        is_todo: rest.is_todo ?? false,
        is_completed: false,
        completed_at: null,
        event_source: 'user',
        source_id: null,
        metadata: rest.metadata as any,
      })
      .returning();

    const formatted: TimetableEvent = {
      id: newEvent.id,
      user_id: newEvent.user_id,
      title: newEvent.title,
      description: newEvent.description ?? undefined,
      event_type: (newEvent.event_type as any) ?? 'study',
      subject: newEvent.subject ?? undefined,
      location: newEvent.location ?? undefined,
      start_time: newEvent.start_time.toISOString(),
      end_time: newEvent.end_time.toISOString(),
      all_day: newEvent.all_day ?? false,
      is_recurring: newEvent.is_recurring ?? false,
      recurrence_rule: newEvent.recurrence_rule as any,
      color_code: newEvent.color_code ?? '#3B82F6',
      is_todo: newEvent.is_todo ?? false,
      is_completed: newEvent.is_completed ?? false,
      completed_at: newEvent.completed_at?.toISOString() ?? null,
      event_source: (newEvent.event_source as any) ?? 'user',
      source_id: newEvent.source_id ?? null,
      metadata: (newEvent.metadata as any) ?? {},
      created_at: newEvent.created_at?.toISOString() ?? new Date().toISOString(),
    };

    return { success: true, event: formatted };
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
    const db = getDb();
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
      endIso = new Date(`${date}T23:59:59`).toISOString();
    } else if (time_mode === 'deadline') {
      endIso = combineDateTime(date, end_time);
      startIso = endIso;
    }

    const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
    const updatePayload: any = {
      title: rest.title,
      description: rest.description,
      event_type: rest.event_type as any,
      subject: rest.subject,
      location: rest.location,
      all_day: allDay,
      is_recurring: rest.is_recurring,
      recurrence_rule: rest.recurrence_rule as any,
      color_code: rest.color_code,
      is_todo: rest.is_todo,
      metadata: rest.metadata as any,
    };

    if (startIso) updatePayload.start_time = new Date(startIso);
    if (endIso) updatePayload.end_time = new Date(endIso);

    const [updated] = await db
      .update(timetableEvents)
      .set(updatePayload)
      .where(and(eq(timetableEvents.id, baseId), eq(timetableEvents.user_id, userId)))
      .returning();

    if (!updated) return { success: false, error: 'Event not found or unauthorized' };

    const formatted: TimetableEvent = {
      id: updated.id,
      user_id: updated.user_id,
      title: updated.title,
      description: updated.description ?? undefined,
      event_type: (updated.event_type as any) ?? 'study',
      subject: updated.subject ?? undefined,
      location: updated.location ?? undefined,
      start_time: updated.start_time.toISOString(),
      end_time: updated.end_time.toISOString(),
      all_day: updated.all_day ?? false,
      is_recurring: updated.is_recurring ?? false,
      recurrence_rule: updated.recurrence_rule as any,
      color_code: updated.color_code ?? '#3B82F6',
      is_todo: updated.is_todo ?? false,
      is_completed: updated.is_completed ?? false,
      completed_at: updated.completed_at?.toISOString() ?? null,
      event_source: (updated.event_source as any) ?? 'user',
      source_id: updated.source_id ?? null,
      metadata: (updated.metadata as any) ?? {},
      created_at: updated.created_at?.toISOString() ?? new Date().toISOString(),
    };

    return { success: true, event: formatted };
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
  try {
    const db = getDb();
    const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
    await db
      .delete(timetableEvents)
      .where(and(eq(timetableEvents.id, baseId), eq(timetableEvents.user_id, userId)));
    return { success: true };
  } catch (err) {
    return { success: false, error: `Failed to delete event: ${String(err)}` };
  }
}

// ---------------------------------------------------------------------------
// Toggle Complete
// ---------------------------------------------------------------------------

export async function toggleEventCompleteAction(
  eventId: string,
  userId: string
): Promise<{ success: true; event: TimetableEvent } | { success: false; error: string }> {
  try {
    const db = getDb();
    const existing = await db.query.timetableEvents.findFirst({
      where: and(eq(timetableEvents.id, eventId), eq(timetableEvents.user_id, userId)),
    });

    if (!existing) return { success: false, error: 'Event not found' };

    const newVal = !existing.is_completed;
    const [updated] = await db
      .update(timetableEvents)
      .set({
        is_completed: newVal,
        completed_at: newVal ? new Date() : null,
      })
      .where(eq(timetableEvents.id, eventId))
      .returning();

    const formatted: TimetableEvent = {
      id: updated.id,
      user_id: updated.user_id,
      title: updated.title,
      description: updated.description ?? undefined,
      event_type: (updated.event_type as any) ?? 'study',
      subject: updated.subject ?? undefined,
      location: updated.location ?? undefined,
      start_time: updated.start_time.toISOString(),
      end_time: updated.end_time.toISOString(),
      all_day: updated.all_day ?? false,
      is_recurring: updated.is_recurring ?? false,
      recurrence_rule: updated.recurrence_rule as any,
      color_code: updated.color_code ?? '#3B82F6',
      is_todo: updated.is_todo ?? false,
      is_completed: updated.is_completed ?? false,
      completed_at: updated.completed_at?.toISOString() ?? null,
      event_source: (updated.event_source as any) ?? 'user',
      source_id: updated.source_id ?? null,
      metadata: (updated.metadata as any) ?? {},
      created_at: updated.created_at?.toISOString() ?? new Date().toISOString(),
    };

    return { success: true, event: formatted };
  } catch (err) {
    return { success: false, error: `Failed to toggle event: ${String(err)}` };
  }
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
  try {
    const db = getDb();
    const [updated] = await db
      .update(timetableEvents)
      .set({
        start_time: new Date(newStartTime),
        end_time: newEndTime ? new Date(newEndTime) : new Date(new Date(newStartTime).getTime() + 3600000),
      })
      .where(and(eq(timetableEvents.id, eventId), eq(timetableEvents.user_id, userId)))
      .returning();

    if (!updated) return { success: false, error: 'Event not found' };

    const formatted: TimetableEvent = {
      id: updated.id,
      user_id: updated.user_id,
      title: updated.title,
      description: updated.description ?? undefined,
      event_type: (updated.event_type as any) ?? 'study',
      subject: updated.subject ?? undefined,
      location: updated.location ?? undefined,
      start_time: updated.start_time.toISOString(),
      end_time: updated.end_time.toISOString(),
      all_day: updated.all_day ?? false,
      is_recurring: updated.is_recurring ?? false,
      recurrence_rule: updated.recurrence_rule as any,
      color_code: updated.color_code ?? '#3B82F6',
      is_todo: updated.is_todo ?? false,
      is_completed: updated.is_completed ?? false,
      completed_at: updated.completed_at?.toISOString() ?? null,
      event_source: (updated.event_source as any) ?? 'user',
      source_id: updated.source_id ?? null,
      metadata: (updated.metadata as any) ?? {},
      created_at: updated.created_at?.toISOString() ?? new Date().toISOString(),
    };

    return { success: true, event: formatted };
  } catch (err) {
    return { success: false, error: `Failed to move event: ${String(err)}` };
  }
}
