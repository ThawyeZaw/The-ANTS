'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Timetable Server Actions (D1 / Drizzle)
// ──────────────────────────────────────────────────────────────────────────────

import type { TimetableEvent, TimetableEventFormData } from '@/types/timetable';
import { getDb, timetableEvents } from '@/lib/db';
import { eq, and, gte, lte } from 'drizzle-orm';

function combineDateTime(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

function formatDbEvent(e: any): TimetableEvent {
  const meta = (e.metadata as Record<string, any>) ?? {};
  return {
    id: e.id,
    user_id: e.user_id,
    title: e.title,
    description: meta.description ?? undefined,
    event_type: (e.event_type as any) ?? 'study',
    subject: meta.subject ?? undefined,
    location: meta.location ?? undefined,
    start_time: e.start_time ? (e.start_time instanceof Date ? e.start_time.toISOString() : new Date(e.start_time).toISOString()) : new Date().toISOString(),
    end_time: e.end_time ? (e.end_time instanceof Date ? e.end_time.toISOString() : new Date(e.end_time).toISOString()) : new Date().toISOString(),
    all_day: e.all_day ?? false,
    is_recurring: e.is_recurring ?? false,
    recurrence_rule: (e.recurrence_pattern || meta.recurrence_rule) as any,
    color_code: e.color_code ?? '#3B82F6',
    is_todo: meta.is_todo ?? false,
    is_completed: meta.is_completed ?? false,
    completed_at: meta.completed_at ?? null,
    event_source: (meta.event_source as any) ?? 'user',
    source_id: meta.source_id ?? null,
    metadata: meta,
    created_at: e.created_at ? (e.created_at instanceof Date ? e.created_at.toISOString() : new Date(e.created_at).toISOString()) : new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function fetchTimetableEventsAction(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date,
  _showExternalEvents = true
): Promise<{ success: true; events: TimetableEvent[] } | { success: false; error: string }> {
  try {
    const db = getDb();
    const conditions = [
      eq(timetableEvents.user_id, userId),
      gte(timetableEvents.start_time, rangeStart),
      lte(timetableEvents.start_time, rangeEnd),
    ];

    const data = await db.query.timetableEvents.findMany({
      where: and(...conditions),
      orderBy: (events, { asc }) => [asc(events.start_time)],
    });

    const events: TimetableEvent[] = data.map(formatDbEvent);

    return { success: true, events };
  } catch (err) {
    return { success: false, error: `Failed to fetch events: ${String(err)}` };
  }
}

export async function actionGetTimetableEvents(userId: string): Promise<TimetableEvent[]> {
  try {
    const db = getDb();
    const data = await db.query.timetableEvents.findMany({
      where: eq(timetableEvents.user_id, userId),
      orderBy: (events, { asc }) => [asc(events.start_time)],
    });

    return data.map(formatDbEvent);
  } catch (err) {
    console.error('Failed to get timetable events:', err);
    return [];
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
        event_type: rest.event_type as any,
        start_time: startDate,
        end_time: endDate,
        all_day: allDay,
        is_recurring: rest.is_recurring ?? false,
        recurrence_pattern: rest.recurrence_rule as any,
        color_code: rest.color_code,
        metadata: {
          description: rest.description,
          location: rest.location,
          subject: rest.subject,
          reminder_minutes: rest.reminder_minutes,
          is_todo: rest.is_todo ?? false,
          is_completed: false,
          completed_at: null,
          event_source: 'user',
          source_id: null,
        } as any,
      })
      .returning();

    return { success: true, event: formatDbEvent(newEvent) };
  } catch (err) {
    return { success: false, error: `Failed to create event: ${String(err)}` };
  }
}

export async function actionCreateTimetableEvent(
  userId: string,
  data: Partial<TimetableEvent> & { metadata?: any }
): Promise<{ success: boolean; event?: TimetableEvent; error?: string }> {
  try {
    const db = getDb();
    const startDate = data.start_time ? new Date(data.start_time) : new Date();
    const endDate = data.end_time ? new Date(data.end_time) : new Date(startDate.getTime() + 3600000);

    const [newEvent] = await db
      .insert(timetableEvents)
      .values({
        user_id: userId,
        title: data.title || 'Untitled Event',
        event_type: (data.event_type as any) ?? 'study',
        start_time: startDate,
        end_time: endDate,
        all_day: data.all_day ?? false,
        is_recurring: data.is_recurring ?? false,
        recurrence_pattern: data.recurrence_rule as any,
        color_code: data.color_code ?? '#3B82F6',
        metadata: {
          ...(data.metadata || {}),
          description: data.description || (data.metadata?.description as string) || null,
          subject: data.subject || (data.metadata?.subject as string) || null,
          location: data.location || (data.metadata?.location as string) || null,
          is_todo: data.is_todo ?? false,
          is_completed: false,
          completed_at: null,
          event_source: 'user',
          source_id: null,
        } as any,
      })
      .returning();

    return { success: true, event: formatDbEvent(newEvent) };
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
      event_type: rest.event_type as any,
      all_day: allDay,
      is_recurring: rest.is_recurring,
      recurrence_pattern: rest.recurrence_rule as any,
      color_code: rest.color_code,
      metadata: {
        description: rest.description,
        location: rest.location,
        subject: rest.subject,
        reminder_minutes: rest.reminder_minutes,
        is_todo: rest.is_todo,
      } as any,
    };

    if (startIso) updatePayload.start_time = new Date(startIso);
    if (endIso) updatePayload.end_time = new Date(endIso);

    const [updated] = await db
      .update(timetableEvents)
      .set(updatePayload)
      .where(and(eq(timetableEvents.id, baseId), eq(timetableEvents.user_id, userId)))
      .returning();

    if (!updated) return { success: false, error: 'Event not found or unauthorized' };

    return { success: true, event: formatDbEvent(updated) };
  } catch (err) {
    return { success: false, error: `Failed to update event: ${String(err)}` };
  }
}

export async function actionUpdateTimetableEvent(
  userId: string,
  eventId: string,
  data: Partial<TimetableEvent> & { metadata?: any }
): Promise<{ success: boolean; event?: TimetableEvent; error?: string }> {
  try {
    const db = getDb();
    const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
    const updatePayload: any = {};

    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.event_type !== undefined) updatePayload.event_type = data.event_type as any;
    if (data.all_day !== undefined) updatePayload.all_day = data.all_day;
    if (data.is_recurring !== undefined) updatePayload.is_recurring = data.is_recurring;
    if (data.recurrence_rule !== undefined) updatePayload.recurrence_pattern = data.recurrence_rule as any;
    if (data.color_code !== undefined) updatePayload.color_code = data.color_code;
    if (data.metadata !== undefined) updatePayload.metadata = data.metadata as any;
    if (data.start_time) updatePayload.start_time = new Date(data.start_time);
    if (data.end_time) updatePayload.end_time = new Date(data.end_time);

    const [updated] = await db
      .update(timetableEvents)
      .set(updatePayload)
      .where(and(eq(timetableEvents.id, baseId), eq(timetableEvents.user_id, userId)))
      .returning();

    if (!updated) return { success: false, error: 'Event not found or unauthorized' };

    return { success: true, event: formatDbEvent(updated) };
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

export async function actionDeleteTimetableEvent(
  userId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  return deleteEventAction(eventId, userId);
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
    const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
    const existing = await db.query.timetableEvents.findFirst({
      where: and(eq(timetableEvents.id, baseId), eq(timetableEvents.user_id, userId)),
    });

    if (!existing) return { success: false, error: 'Event not found' };

    const currentMeta = (existing.metadata as Record<string, any>) ?? {};
    const newVal = !currentMeta.is_completed;
    const updatedMeta = {
      ...currentMeta,
      is_completed: newVal,
      completed_at: newVal ? new Date().toISOString() : null,
    };

    const [updated] = await db
      .update(timetableEvents)
      .set({
        metadata: updatedMeta,
      })
      .where(eq(timetableEvents.id, baseId))
      .returning();

    return { success: true, event: formatDbEvent(updated) };
  } catch (err) {
    return { success: false, error: `Failed to toggle event: ${String(err)}` };
  }
}

export async function actionToggleTimetableEventComplete(
  userId: string,
  eventId: string,
  isCompleted?: boolean
): Promise<{ success: boolean; event?: TimetableEvent; error?: string }> {
  try {
    const db = getDb();
    const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
    const existing = await db.query.timetableEvents.findFirst({
      where: and(eq(timetableEvents.id, baseId), eq(timetableEvents.user_id, userId)),
    });

    if (!existing) return { success: false, error: 'Event not found' };

    const currentMeta = (existing.metadata as Record<string, any>) ?? {};
    const newVal = isCompleted !== undefined ? isCompleted : !currentMeta.is_completed;
    const updatedMeta = {
      ...currentMeta,
      is_completed: newVal,
      completed_at: newVal ? new Date().toISOString() : null,
    };

    const [updated] = await db
      .update(timetableEvents)
      .set({
        metadata: updatedMeta,
      })
      .where(eq(timetableEvents.id, baseId))
      .returning();

    return { success: true, event: formatDbEvent(updated) };
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
    const baseId = eventId.includes('::') ? eventId.split('::')[0] : eventId;
    const [updated] = await db
      .update(timetableEvents)
      .set({
        start_time: new Date(newStartTime),
        end_time: newEndTime ? new Date(newEndTime) : new Date(new Date(newStartTime).getTime() + 3600000),
      })
      .where(and(eq(timetableEvents.id, baseId), eq(timetableEvents.user_id, userId)))
      .returning();

    if (!updated) return { success: false, error: 'Event not found' };

    return { success: true, event: formatDbEvent(updated) };
  } catch (err) {
    return { success: false, error: `Failed to move event: ${String(err)}` };
  }
}

export const actionMoveTimetableEvent = moveEventAction;
