import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, asc } from 'drizzle-orm';
import {
  createDb,
  curriculums,
  subjects,
  topics,
  userCurriculums,
  topicProgress,
} from '@the-ants/db';
import { remember } from '../lib/memory-cache';

const CATALOG_TTL_MS = 60_000;

export function createCurriculumRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // Catalog only (no topics). Pass includeTopics=1 only for lesson trackers.
  router.get('/', async (c) => {
    const includeTopics = c.req.query('includeTopics') === '1';
    const db = getDb();
    const payload = await remember(`curriculum:${includeTopics ? 'topics' : 'catalog'}`, CATALOG_TTL_MS, async () => {
      const rows = await db.query.curriculums.findMany({
        columns: { id: true, name: true, code: true, description: true, icon_url: true },
        with: {
          subjects: {
            columns: {
              id: true,
              curriculum_id: true,
              name: true,
              code: true,
              description: true,
              color_code: true,
            },
            ...(includeTopics
              ? {
                  with: {
                    topics: {
                      columns: {
                        id: true,
                        subject_id: true,
                        name: true,
                        description: true,
                        order_index: true,
                      },
                    },
                  },
                }
              : {}),
          },
        },
      });
      return { success: true as const, curriculums: rows };
    });

    c.header('Cache-Control', 'public, max-age=60');
    return c.json(payload);
  });

  router.get('/topics', async (c) => {
    const subjectId = c.req.query('subjectId');
    if (!subjectId) {
      return c.json({ error: 'subjectId is required' }, 400);
    }

    const db = getDb();
    const rows = await db
      .select({
        id: topics.id,
        subject_id: topics.subject_id,
        name: topics.name,
        description: topics.description,
        order_index: topics.order_index,
      })
      .from(topics)
      .where(eq(topics.subject_id, subjectId))
      .orderBy(asc(topics.order_index));

    return c.json({ success: true, topics: rows });
  });

  // Enrollment rows only — do not nest every subject in the board
  router.get('/user-curriculums', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const enrolled = await db
      .select({
        id: userCurriculums.id,
        user_id: userCurriculums.user_id,
        curriculum_id: userCurriculums.curriculum_id,
        created_at: userCurriculums.created_at,
      })
      .from(userCurriculums)
      .where(eq(userCurriculums.user_id, userId));

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
      columns: {
        id: true,
        topic_id: true,
        status: true,
        last_studied_at: true,
        completed_at: true,
        notes: true,
      },
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
