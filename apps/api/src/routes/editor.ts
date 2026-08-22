import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import {
  createDb,
  reviewQueue,
  versionHistory,
  profiles,
} from '@the-ants/db';

export function createEditorRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. Get review queue (Guarded: Main Contributor only)
  // RLS replacement: review_queue_main_contributor_all
  router.get('/review-queue', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });

    if (!userProfile || userProfile.role !== 'main_contributor') {
      return c.json({ error: 'Unauthorized: Only main_contributors can access the review queue' }, 403);
    }

    const queue = await db.query.reviewQueue.findMany({
      orderBy: [desc(reviewQueue.submitted_at)],
      with: {
        // contributor info
      },
    });

    return c.json({ success: true, queue });
  });

  // 2. Submit content proposal
  // RLS replacement: review_queue_contributor_insert
  router.post('/submit', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const SubmitSchema = z.object({
      contributorId: z.string().uuid(),
      submissionType: z.enum(['note', 'deck', 'curriculum', 'question']),
      entityId: z.string().uuid(),
      submittedData: z.record(z.string(), z.any()),
      isUpdate: z.boolean().optional().default(false),
      publishedEntityId: z.string().uuid().optional(),
    });

    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { contributorId, submissionType, entityId, submittedData, isUpdate, publishedEntityId } =
      parsed.data;

    const [item] = await db
      .insert(reviewQueue)
      .values({
        contributor_id: contributorId,
        submission_type: submissionType,
        entity_id: entityId,
        submitted_data: submittedData,
        is_update: isUpdate,
        published_entity_id: publishedEntityId,
        status: 'pending',
      })
      .returning();

    return c.json({ success: true, item }, 201);
  });

  // 3. Review submission (Approve / Reject)
  router.post('/review', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const ReviewSchema = z.object({
      reviewerId: z.string().uuid(),
      queueId: z.string().uuid(),
      action: z.enum(['approve', 'reject']),
      feedback: z.record(z.string(), z.any()).optional(),
    });

    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { reviewerId, queueId, action, feedback } = parsed.data;

    const reviewer = await db.query.profiles.findFirst({
      where: eq(profiles.id, reviewerId),
    });

    if (!reviewer || reviewer.role !== 'main_contributor') {
      return c.json({ error: 'Unauthorized: Only main_contributors can review items' }, 403);
    }

    const item = await db.query.reviewQueue.findFirst({
      where: eq(reviewQueue.id, queueId),
    });

    if (!item) {
      return c.json({ error: 'Submission not found' }, 404);
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await db
      .update(reviewQueue)
      .set({
        status: newStatus,
        reviewer_id: reviewerId,
        feedback: feedback as any,
        reviewed_at: new Date(),
      })
      .where(eq(reviewQueue.id, queueId));

    return c.json({ success: true, queueId, status: newStatus });
  });

  return router;
}
