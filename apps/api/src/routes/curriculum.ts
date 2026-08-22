import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import {
  createDb,
  curriculums,
  subjects,
  topics,
  userCurriculums,
  topicProgress,
  resources,
} from '@the-ants/db';

export function createCurriculumRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. Get all curriculums with subjects and topics
  // RLS replacement: curriculums_public_read
  router.get('/', async (c) => {
    const db = getDb();
    const allCurriculums = await db.query.curriculums.findMany({
      with: {
        subjects: {
          with: {
            topics: true,
          },
        },
      },
    });

    return c.json({ success: true, curriculums: allCurriculums });
  });

  // 2. Get user enrolled curriculums
  router.get('/user-curriculums', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const enrolled = await db.query.userCurriculums.findMany({
      where: eq(userCurriculums.user_id, userId),
      with: {
        curriculum: {
          with: {
            subjects: true,
          },
        },
      },
    });

    return c.json({ success: true, userCurriculums: enrolled });
  });

  // 3. Enroll user in curriculum
  router.post('/enroll', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const EnrollSchema = z.object({
      userId: z.string().uuid(),
      curriculumId: z.string().uuid(),
    });

    const parsed = EnrollSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, curriculumId } = parsed.data;

    const existing = await db.query.userCurriculums.findFirst({
      where: and(
        eq(userCurriculums.user_id, userId),
        eq(userCurriculums.curriculum_id, curriculumId)
      ),
    });

    if (existing) {
      return c.json({ success: true, enrollment: existing });
    }

    const [enrollment] = await db
      .insert(userCurriculums)
      .values({
        user_id: userId,
        curriculum_id: curriculumId,
      })
      .returning();

    return c.json({ success: true, enrollment }, 201);
  });

  // 4. Get topic progress
  // RLS replacement: topic_progress_owner_all
  router.get('/progress', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const progress = await db.query.topicProgress.findMany({
      where: eq(topicProgress.user_id, userId),
    });

    return c.json({ success: true, progress });
  });

  // 5. Update topic progress
  router.post('/progress', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const ProgressSchema = z.object({
      userId: z.string().uuid(),
      topicId: z.string().uuid(),
      status: z.enum(['not_started', 'in_progress', 'completed']),
      notes: z.string().optional(),
    });

    const parsed = ProgressSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, topicId, status, notes } = parsed.data;

    const existing = await db.query.topicProgress.findFirst({
      where: and(eq(topicProgress.user_id, userId), eq(topicProgress.topic_id, topicId)),
    });

    if (existing) {
      const [updated] = await db
        .update(topicProgress)
        .set({
          status,
          notes: notes !== undefined ? notes : existing.notes,
          last_studied_at: new Date(),
          completed_at: status === 'completed' ? new Date() : null,
        })
        .where(eq(topicProgress.id, existing.id))
        .returning();

      return c.json({ success: true, progress: updated });
    }

    const [created] = await db
      .insert(topicProgress)
      .values({
        user_id: userId,
        topic_id: topicId,
        status,
        notes,
        last_studied_at: new Date(),
        completed_at: status === 'completed' ? new Date() : null,
      })
      .returning();

    return c.json({ success: true, progress: created }, 201);
  });

  return router;
}
