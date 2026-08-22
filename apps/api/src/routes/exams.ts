import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import {
  createDb,
  exams,
  examCountdowns,
  gradeBoundaries,
  gradeEntries,
  examSchedules,
  profiles,
} from '@the-ants/db';

export function createExamRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. List public exams
  // RLS replacement: exams_public_read
  router.get('/', async (c) => {
    const db = getDb();
    const subjectId = c.req.query('subjectId');
    const board = c.req.query('board');

    let conditions: any[] = [];
    if (subjectId) conditions.push(eq(exams.subject_id, subjectId));
    if (board) conditions.push(eq(exams.exam_board, board));

    const result = await db.query.exams.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(exams.created_at)],
      with: {
        subject: true,
        curriculum: true,
        gradeBoundaries: true,
      },
    });

    return c.json({ success: true, exams: result });
  });

  // 2. Get user exam countdowns
  // RLS replacement: exam_countdowns_owner_all
  router.get('/countdowns', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const countdowns = await db.query.examCountdowns.findMany({
      where: eq(examCountdowns.user_id, userId),
      orderBy: (cd, { asc }) => [asc(cd.exam_date)],
    });

    return c.json({ success: true, countdowns });
  });

  // 3. Create countdown
  router.post('/countdowns', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const CountdownSchema = z.object({
      userId: z.string().uuid(),
      title: z.string().min(1),
      examDate: z.string(),
      examId: z.string().uuid().optional(),
      subjectId: z.string().uuid().optional(),
      examBoard: z.string().optional(),
      paperName: z.string().optional(),
      colorCode: z.string().optional(),
      targetGrade: z.string().optional(),
      isMock: z.boolean().optional().default(false),
      isPinned: z.boolean().optional().default(false),
    });

    const parsed = CountdownSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const {
      userId,
      title,
      examDate,
      examId,
      subjectId,
      examBoard,
      paperName,
      colorCode,
      targetGrade,
      isMock,
      isPinned,
    } = parsed.data;

    const [newCountdown] = await db
      .insert(examCountdowns)
      .values({
        user_id: userId,
        title,
        exam_date: new Date(examDate),
        exam_id: examId,
        subject_id: subjectId,
        exam_board: examBoard,
        paper_name: paperName,
        color_code: colorCode,
        target_grade: targetGrade,
        is_mock: isMock,
        is_pinned: isPinned,
      })
      .returning();

    return c.json({ success: true, countdown: newCountdown }, 201);
  });

  // 4. Delete countdown
  router.delete('/countdowns/:id', async (c) => {
    const db = getDb();
    const id = c.req.param('id');
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const existing = await db.query.examCountdowns.findFirst({
      where: and(eq(examCountdowns.id, id), eq(examCountdowns.user_id, userId)),
    });

    if (!existing) {
      return c.json({ error: 'Countdown not found or unauthorized' }, 404);
    }

    await db.delete(examCountdowns).where(eq(examCountdowns.id, id));

    return c.json({ success: true, id });
  });

  // 5. User Grade Entries
  // RLS replacement: grade_entries_owner_all
  router.get('/grades', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const entries = await db.query.gradeEntries.findMany({
      where: eq(gradeEntries.user_id, userId),
      orderBy: [desc(gradeEntries.exam_date)],
    });

    return c.json({ success: true, grades: entries });
  });

  // 6. Record Grade Entry
  router.post('/grades', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const GradeSchema = z.object({
      userId: z.string().uuid(),
      subjectId: z.string().uuid(),
      examId: z.string().uuid().optional(),
      score: z.number(),
      maxScore: z.number(),
      grade: z.string().optional(),
      examDate: z.string().optional(),
      notes: z.string().optional(),
    });

    const parsed = GradeSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, subjectId, examId, score, maxScore, grade, examDate, notes } = parsed.data;
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    const [newEntry] = await db
      .insert(gradeEntries)
      .values({
        user_id: userId,
        subject_id: subjectId,
        exam_id: examId,
        score,
        max_score: maxScore,
        percentage,
        grade,
        exam_date: examDate ? new Date(examDate) : new Date(),
        notes,
      })
      .returning();

    return c.json({ success: true, entry: newEntry }, 201);
  });

  return router;
}
