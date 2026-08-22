import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, inArray, desc } from 'drizzle-orm';
import {
  createDb,
  classrooms,
  classroomMembers,
  assignments,
  assignmentSubmissions,
  quizzes,
  discussionTopics,
  classroomResources,
} from '@the-ants/db';

export function createClassroomRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. List user classrooms
  // RLS replacement: classrooms_teacher_all & classrooms_member_select
  router.get('/', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const memberships = await db.query.classroomMembers.findMany({
      where: eq(classroomMembers.user_id, userId),
      with: {
        classroom: true,
      },
    });

    const teacherRooms = await db.query.classrooms.findMany({
      where: eq(classrooms.teacher_id, userId),
    });

    const roomMap = new Map();
    teacherRooms.forEach((r) => roomMap.set(r.id, r));
    memberships.forEach((m) => {
      if (m.classroom) roomMap.set(m.classroom.id, m.classroom);
    });

    return c.json({ success: true, classrooms: Array.from(roomMap.values()) });
  });

  // 2. Get single classroom with related data
  router.get('/:id', async (c) => {
    const db = getDb();
    const classroomId = c.req.param('id');
    const userId = c.req.query('userId');

    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, classroomId),
      with: {
        teacher: true,
        members: {
          with: { user: true },
        },
        assignments: {
          orderBy: [desc(assignments.created_at)],
        },
        quizzes: true,
        discussions: {
          orderBy: [desc(discussionTopics.created_at)],
        },
        resources: true,
      },
    });

    if (!classroom) {
      return c.json({ error: 'Classroom not found' }, 404);
    }

    // Access check: teacher or member
    const isTeacher = classroom.teacher_id === userId;
    const isMember = classroom.members.some((m) => m.user_id === userId);

    if (userId && !isTeacher && !isMember) {
      return c.json({ error: 'Unauthorized to access this classroom' }, 403);
    }

    return c.json({ success: true, classroom });
  });

  // 3. Create classroom
  // RLS replacement: classrooms_teacher_all
  router.post('/', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const CreateClassroomSchema = z.object({
      teacherId: z.string().uuid(),
      name: z.string().min(1),
      description: z.string().optional(),
      code: z.string().min(4).max(10).optional(),
    });

    const parsed = CreateClassroomSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { teacherId, name, description, code } = parsed.data;
    const roomCode = code || Math.random().toString(36).substring(2, 8).toUpperCase();

    const [newRoom] = await db
      .insert(classrooms)
      .values({
        teacher_id: teacherId,
        name,
        description,
        code: roomCode,
      })
      .returning();

    // Auto-add teacher as member with role teacher
    await db.insert(classroomMembers).values({
      classroom_id: newRoom.id,
      user_id: teacherId,
      role: 'teacher',
    });

    return c.json({ success: true, classroom: newRoom }, 201);
  });

  // 4. Join classroom by code
  // RLS replacement: classroom_members_insert
  router.post('/join', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const JoinSchema = z.object({
      userId: z.string().uuid(),
      code: z.string().min(1),
    });

    const parsed = JoinSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, code } = parsed.data;

    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.code, code.toUpperCase().trim()),
    });

    if (!classroom) {
      return c.json({ error: 'Invalid classroom code' }, 404);
    }

    // Check if already member
    const existing = await db.query.classroomMembers.findFirst({
      where: and(eq(classroomMembers.classroom_id, classroom.id), eq(classroomMembers.user_id, userId)),
    });

    if (existing) {
      return c.json({ error: 'You are already a member of this classroom' }, 400);
    }

    const [membership] = await db
      .insert(classroomMembers)
      .values({
        classroom_id: classroom.id,
        user_id: userId,
        role: 'student',
      })
      .returning();

    return c.json({ success: true, classroom, membership });
  });

  // 5. Create assignment
  // RLS replacement: assignments_teacher_manage
  router.post('/:id/assignments', async (c) => {
    const db = getDb();
    const classroomId = c.req.param('id');
    const body = await c.req.json();

    const AssignmentSchema = z.object({
      userId: z.string().uuid(),
      title: z.string().min(1),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      totalPoints: z.number().default(100),
      attachmentUrls: z.array(z.string().url()).optional(),
    });

    const parsed = AssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, title, description, dueDate, totalPoints, attachmentUrls } = parsed.data;

    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, classroomId),
    });

    if (!classroom || classroom.teacher_id !== userId) {
      return c.json({ error: 'Unauthorized: Only the teacher can issue assignments' }, 403);
    }

    const [assignment] = await db
      .insert(assignments)
      .values({
        classroom_id: classroomId,
        created_by: userId,
        title,
        description,
        due_date: dueDate ? new Date(dueDate) : null,
        total_points: totalPoints,
        attachment_urls: attachmentUrls || [],
      })
      .returning();

    return c.json({ success: true, assignment }, 201);
  });

  return router;
}
