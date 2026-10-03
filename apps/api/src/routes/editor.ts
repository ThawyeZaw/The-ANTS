import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import {
  createDb,
  reviewQueue,
  versionHistory,
  profiles,
} from '@the-ants/db';
import { createAuthMiddleware, createModeratorMiddleware } from '../middleware/session';

export function createEditorRoutes(getDb: (c?: any) => ReturnType<typeof createDb>) {
  const router = new Hono();
  const requireAuth = createAuthMiddleware((c) => getDb(c));
  const requireModerator = createModeratorMiddleware((c) => getDb(c));

  // 1. Get review queue (Guarded: Main Contributor / Admin only)
  router.get('/review-queue', requireModerator, async (c) => {
    const db = getDb(c);

    const queue = await db.query.reviewQueue.findMany({
      orderBy: [desc(reviewQueue.submitted_at)],
      with: {
        // contributor info
      },
    });

    return c.json({ success: true, queue });
  });

  // 2. Submit content proposal (Guarded: Authenticated users)
  router.post('/submit', requireAuth, async (c) => {
    const db = getDb(c);
    const sessionUser = c.get('sessionUser');
    const body = await c.req.json();

    const SubmitSchema = z.object({
      contributorId: z.string().uuid().optional(),
      submissionType: z.enum(['curriculum', 'exam', 'subject', 'topic', 'calculator', 'countdown']),
      entityId: z.string().uuid(),
      submittedData: z.record(z.string(), z.any()),
      isUpdate: z.boolean().optional().default(false),
      publishedEntityId: z.string().uuid().optional(),
    });

    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { contributorId: requestedContributorId, submissionType, entityId, submittedData, isUpdate, publishedEntityId } =
      parsed.data;

    const effectiveContributorId =
      sessionUser.roles.includes('admin') && requestedContributorId ? requestedContributorId : sessionUser.id;

    const [item] = await db
      .insert(reviewQueue)
      .values({
        contributor_id: effectiveContributorId,
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

  // 3. Review submission (Approve / Reject) (Guarded: Main Contributor / Admin only)
  router.post('/review', requireModerator, async (c) => {
    const db = getDb(c);
    const sessionUser = c.get('sessionUser');
    const reviewerId = sessionUser.id;
    const body = await c.req.json();

    const ReviewSchema = z.object({
      queueId: z.string().uuid(),
      action: z.enum(['approve', 'reject']),
      feedback: z.record(z.string(), z.any()).optional(),
    });

    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { queueId, action, feedback } = parsed.data;

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
