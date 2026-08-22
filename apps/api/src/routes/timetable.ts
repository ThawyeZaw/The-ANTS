import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import {
  createDb,
  timetableEvents,
  examCountdowns,
  assignments,
  classroomMembers,
  clubEvents,
  clubMilestones,
  clubMembers,
} from '@the-ants/db';
import type { TimetableEventDTO } from '@the-ants/shared-types';

export function createTimetableRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // ── Original RLS Policy: timetable_events_owner_all ────────────────────────
  // Replaces Supabase RLS: USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
  
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

  // 2. Integrated Timetable (Joins exam countdowns, assignments, club events, club milestones)
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

    // Stream 3: Classrooms user belongs to -> Assignments
    const memberships = await db.query.classroomMembers.findMany({
      where: eq(classroomMembers.user_id, userId),
    });
    const classroomIds = memberships.map((m) => m.classroom_id);

    let assignmentEvents: typeof assignments.$inferSelect[] = [];
    if (classroomIds.length > 0) {
      assignmentEvents = await db.query.assignments.findMany({
        where: and(
          inArray(assignments.classroom_id, classroomIds),
          gte(assignments.due_date, startDate),
          lte(assignments.due_date, endDate)
        ),
      });
    }

    // Stream 4: Clubs user belongs to -> Club Events & Milestones
    const clubMemberships = await db.query.clubMembers.findMany({
      where: eq(clubMembers.user_id, userId),
    });
    const clubIds = clubMemberships.map((m) => m.club_id);

    let clubEventsList: typeof clubEvents.$inferSelect[] = [];
    let clubMilestonesList: typeof clubMilestones.$inferSelect[] = [];

    if (clubIds.length > 0) {
      clubEventsList = await db.query.clubEvents.findMany({
        where: and(
          inArray(clubEvents.club_id, clubIds),
          gte(clubEvents.start_time, startDate),
          lte(clubEvents.start_time, endDate)
        ),
      });

      clubMilestonesList = await db.query.clubMilestones.findMany({
        where: and(
          inArray(clubMilestones.club_id, clubIds),
          gte(clubMilestones.target_date, startDate),
          lte(clubMilestones.target_date, endDate)
        ),
      });
    }

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
      ...assignmentEvents.map((asg) => ({
        id: `asg-${asg.id}`,
        user_id: userId,
        title: `Assignment Due: ${asg.title}`,
        event_type: 'assignment',
        start_time: (asg.due_date || new Date()).toISOString(),
        end_time: (asg.due_date || new Date()).toISOString(),
        all_day: false,
        color_code: '#F59E0B',
        metadata: { classroom_id: asg.classroom_id, total_points: asg.total_points },
        is_virtual: true,
        source_type: 'assignment' as const,
      })),
      ...clubEventsList.map((ce) => ({
        id: `club-evt-${ce.id}`,
        user_id: userId,
        title: `Club: ${ce.title}`,
        event_type: 'club_event',
        start_time: ce.start_time.toISOString(),
        end_time: (ce.end_time || new Date(ce.start_time.getTime() + 3600000)).toISOString(),
        all_day: false,
        color_code: '#3B82F6',
        metadata: { club_id: ce.club_id, location: ce.location, meeting_url: ce.meeting_url },
        is_virtual: true,
        source_type: 'club_event' as const,
      })),
      ...clubMilestonesList.map((cm) => ({
        id: `club-ms-${cm.id}`,
        user_id: userId,
        title: `Milestone: ${cm.title}`,
        event_type: 'club_milestone',
        start_time: (cm.target_date || new Date()).toISOString(),
        end_time: (cm.target_date || new Date()).toISOString(),
        all_day: true,
        color_code: '#8B5CF6',
        metadata: { club_id: cm.club_id, is_completed: cm.is_completed },
        is_virtual: true,
        source_type: 'club_milestone' as const,
      })),
    ];

    combined.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return c.json({ success: true, events: combined });
  });

  // 3. Create timetable event
  router.post('/events', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const EventSchema = z.object({
      userId: z.string().uuid(),
      title: z.string().min(1),
      eventType: z.string().optional().default('study'),
      startTime: z.string(),
      endTime: z.string(),
      allDay: z.boolean().optional().default(false),
      isRecurring: z.boolean().optional().default(false),
      recurrencePattern: z.record(z.string(), z.any()).optional(),
      colorCode: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional().default({}),
    });

    const parsed = EventSchema.safeParse(body);
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
        recurrence_pattern: recurrencePattern,
        color_code: colorCode,
        metadata,
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
      title: z.string().optional(),
      eventType: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      allDay: z.boolean().optional(),
      isRecurring: z.boolean().optional(),
      recurrencePattern: z.record(z.string(), z.any()).optional(),
      colorCode: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    });

    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, startTime, endTime, ...rest } = parsed.data;

    // Verify ownership
    const existing = await db.query.timetableEvents.findFirst({
      where: and(eq(timetableEvents.id, eventId), eq(timetableEvents.user_id, userId)),
    });

    if (!existing) {
      return c.json({ error: 'Event not found or unauthorized' }, 404);
    }

    const updateData: Partial<typeof timetableEvents.$inferInsert> = { ...rest };
    if (startTime) updateData.start_time = new Date(startTime);
    if (endTime) updateData.end_time = new Date(endTime);

    const [updatedEvent] = await db
      .update(timetableEvents)
      .set(updateData)
      .where(eq(timetableEvents.id, eventId))
      .returning();

    return c.json({ success: true, event: updatedEvent });
  });

  // 5. Delete timetable event
  router.delete('/events/:id', async (c) => {
    const db = getDb();
    const eventId = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    // Verify ownership
    const existing = await db.query.timetableEvents.findFirst({
      where: and(eq(timetableEvents.id, eventId), eq(timetableEvents.user_id, userId)),
    });

    if (!existing) {
      return c.json({ error: 'Event not found or unauthorized' }, 404);
    }

    await db.delete(timetableEvents).where(eq(timetableEvents.id, eventId));

    return c.json({ success: true, eventId });
  });

  return router;
}
