import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, gte, lte } from 'drizzle-orm';
import {
  createDb,
  timetableEvents,
  examCountdowns,
} from '@the-ants/db';
import type { TimetableEventDTO } from '@the-ants/shared-types';

export function createTimetableRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. Get user timetable events
  router.get('/events', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const conditions = [eq(timetableEvents.user_id, userId)];
    if (startDate) {
      conditions.push(gte(timetableEvents.start_time, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(timetableEvents.start_time, new Date(endDate)));
    }

    const events = await db.query.timetableEvents.findMany({
      where: and(...conditions),
      orderBy: (events, { asc }) => [asc(events.start_time)],
    });

    return c.json({ success: true, events });
  });

  // 2. Integrated Timetable (Joins personal events + exam countdowns)
  router.get('/integrated', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');
    const startDateStr = c.req.query('startDate');
    const endDateStr = c.req.query('endDate');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const startDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 86400000);
    const endDate = endDateStr ? new Date(endDateStr) : new Date(Date.now() + 90 * 86400000);

    // Stream 1: User personal timetable events
    const personalEvents = await db.query.timetableEvents.findMany({
      where: and(
        eq(timetableEvents.user_id, userId),
        gte(timetableEvents.start_time, startDate),
        lte(timetableEvents.start_time, endDate)
      ),
    });

    // Stream 2: Exam countdowns
    const examsList = await db.query.examCountdowns.findMany({
      where: and(
        eq(examCountdowns.user_id, userId),
        gte(examCountdowns.exam_date, startDate),
        lte(examCountdowns.exam_date, endDate)
      ),
    });

    // Combine into unified TimetableEventDTO list
    const combined: TimetableEventDTO[] = [
      ...personalEvents.map((e) => ({
        id: e.id,
        user_id: e.user_id,
        title: e.title,
        event_type: e.event_type,
        start_time: e.start_time.toISOString(),
        end_time: e.end_time.toISOString(),
        all_day: e.all_day,
        is_recurring: e.is_recurring,
        recurrence_pattern: e.recurrence_pattern as any,
        color_code: e.color_code,
        metadata: e.metadata as any,
        created_at: e.created_at?.toISOString(),
        is_virtual: false,
        source_type: 'timetable' as const,
      })),
      ...examsList.map((ex) => ({
        id: `exam-${ex.id}`,
        user_id: ex.user_id,
        title: `Exam: ${ex.title} ${ex.paper_name ? `(${ex.paper_name})` : ''}`,
        event_type: 'exam',
        start_time: ex.exam_date.toISOString(),
        end_time: new Date(ex.exam_date.getTime() + 7200000).toISOString(),
        all_day: false,
        color_code: ex.color_code || '#EF4444',
        metadata: { exam_board: ex.exam_board, target_grade: ex.target_grade, is_mock: ex.is_mock },
        is_virtual: true,
        source_type: 'exam' as const,
      })),
    ];

    // Sort by start_time ascending
    combined.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return c.json({ success: true, events: combined });
  });

  // 3. Create timetable event
  router.post('/events', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const CreateSchema = z.object({
      userId: z.string().uuid(),
      title: z.string().min(1),
      eventType: z.string().default('study'),
      startTime: z.string(),
      endTime: z.string(),
      allDay: z.boolean().default(false),
      isRecurring: z.boolean().default(false),
      recurrencePattern: z.any().optional(),
      colorCode: z.string().optional(),
      metadata: z.any().optional(),
    });

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const {
      userId,
      title,
      eventType,
      startTime,
      endTime,
      allDay,
      isRecurring,
      recurrencePattern,
      colorCode,
      metadata,
    } = parsed.data;

    const [newEvent] = await db
      .insert(timetableEvents)
      .values({
        user_id: userId,
        title,
        event_type: eventType,
        start_time: new Date(startTime),
        end_time: new Date(endTime),
        all_day: allDay,
        is_recurring: isRecurring,
        recurrence_pattern: recurrencePattern || null,
        color_code: colorCode || null,
        metadata: metadata || {},
      })
      .returning();

    return c.json({ success: true, event: newEvent }, 201);
  });

  // 4. Update timetable event
  router.put('/events/:id', async (c) => {
    const db = getDb();
    const eventId = c.req.param('id');
    const body = await c.req.json();

    const UpdateSchema = z.object({
      userId: z.string().uuid(),
      title: z.string().min(1).optional(),
      eventType: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      allDay: z.boolean().optional(),
      isRecurring: z.boolean().optional(),
      recurrencePattern: z.any().optional(),
      colorCode: z.string().optional(),
      metadata: z.any().optional(),
    });

    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const {
      userId,
      title,
      eventType,
      startTime,
      endTime,
      allDay,
      isRecurring,
      recurrencePattern,
      colorCode,
      metadata,
    } = parsed.data;

    // Check ownership
    const existing = await db.query.timetableEvents.findFirst({
      where: and(eq(timetableEvents.id, eventId), eq(timetableEvents.user_id, userId)),
    });

    if (!existing) {
      return c.json({ error: 'Event not found or unauthorized' }, 404);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (eventType !== undefined) updateData.event_type = eventType;
    if (startTime !== undefined) updateData.start_time = new Date(startTime);
    if (endTime !== undefined) updateData.end_time = new Date(endTime);
    if (allDay !== undefined) updateData.all_day = allDay;
    if (isRecurring !== undefined) updateData.is_recurring = isRecurring;
    if (recurrencePattern !== undefined) updateData.recurrence_pattern = recurrencePattern;
    if (colorCode !== undefined) updateData.color_code = colorCode;
    if (metadata !== undefined) updateData.metadata = metadata;

    const [updated] = await db
      .update(timetableEvents)
      .set(updateData)
      .where(eq(timetableEvents.id, eventId))
      .returning();

    return c.json({ success: true, event: updated });
  });

  // 5. Delete timetable event
  router.delete('/events/:id', async (c) => {
    const db = getDb();
    const eventId = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId query parameter is required' }, 400);
    }

    const existing = await db.query.timetableEvents.findFirst({
      where: and(eq(timetableEvents.id, eventId), eq(timetableEvents.user_id, userId)),
    });

    if (!existing) {
      return c.json({ error: 'Event not found or unauthorized' }, 404);
    }

    await db.delete(timetableEvents).where(eq(timetableEvents.id, eventId));

    return c.json({ success: true, deletedId: eventId });
  });

  return router;
}
