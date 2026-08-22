import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { createDb, profiles, user, roleUpgradeRequests, roleUpgradeApplications } from '@the-ants/db';
import type { UserRole } from '@the-ants/shared-types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 0,
  teacher: 1,
  contributor: 2,
  main_contributor: 3,
};

export function createRoleUpgradeRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. Submit a role upgrade application
  router.post('/apply', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const ApplySchema = z.object({
      userId: z.string().uuid(),
      targetRole: z.enum(['teacher', 'contributor', 'main_contributor']),
      motivation: z.string().min(10, 'Motivation must be at least 10 characters'),
      portfolioLinks: z.array(z.string().url()).optional(),
    });

    const parsed = ApplySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, targetRole, motivation, portfolioLinks } = parsed.data;

    // Fetch user current profile
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
    });

    if (!existingProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const currentRole = (existingProfile.role || 'student') as UserRole;
    if (ROLE_HIERARCHY[targetRole] <= ROLE_HIERARCHY[currentRole]) {
      return c.json(
        { error: `Cannot upgrade from ${currentRole} to ${targetRole}. Upgrades must increase role level.` },
        400
      );
    }

    // Insert request
    const [request] = await db
      .insert(roleUpgradeApplications)
      .values({
        user_id: userId,
        target_role: targetRole,
        motivation,
        portfolio_links: portfolioLinks || [],
        status: 'pending',
      })
      .returning();

    return c.json({ success: true, request });
  });

  // 2. Review role upgrade application (Guarded: Main Contributor only)
  router.post('/review', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const ReviewSchema = z.object({
      reviewerId: z.string().uuid(),
      requestId: z.string().uuid(),
      action: z.enum(['approve', 'reject']),
      reviewerNotes: z.string().optional(),
    });

    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { reviewerId, requestId, action, reviewerNotes } = parsed.data;

    // Verify reviewer is main_contributor
    const reviewerProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, reviewerId),
    });

    if (!reviewerProfile || reviewerProfile.role !== 'main_contributor') {
      return c.json({ error: 'Unauthorized: Only main_contributors can review role upgrade requests' }, 403);
    }

    // Find request
    const request = await db.query.roleUpgradeApplications.findFirst({
      where: eq(roleUpgradeApplications.id, requestId),
    });

    if (!request) {
      return c.json({ error: 'Upgrade request not found' }, 404);
    }

    if (request.status !== 'pending') {
      return c.json({ error: `Request has already been ${request.status}` }, 400);
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update request
    await db
      .update(roleUpgradeApplications)
      .set({
        status: newStatus,
        reviewer_id: reviewerId,
        reviewer_notes: reviewerNotes || null,
        reviewed_at: new Date(),
      })
      .where(eq(roleUpgradeApplications.id, requestId));

    // If approved, update user's role in profiles and Better Auth user table
    if (action === 'approve') {
      await db
        .update(profiles)
        .set({
          role: request.target_role,
          updated_at: new Date(),
        })
        .where(eq(profiles.id, request.user_id));

      await db
        .update(user)
        .set({
          role: request.target_role,
          updatedAt: new Date(),
        })
        .where(eq(user.id, request.user_id));
    }

    return c.json({
      success: true,
      requestId,
      status: newStatus,
      newRole: action === 'approve' ? request.target_role : undefined,
    });
  });

  // 3. Direct user promotion (Guarded: Main Contributor only)
  router.post('/promote', async (c) => {
    const db = getDb();
    const body = await c.req.json();

    const PromoteSchema = z.object({
      promoterId: z.string().uuid(),
      targetUserId: z.string().uuid(),
      newRole: z.enum(['teacher', 'contributor', 'main_contributor']),
    });

    const parsed = PromoteSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { promoterId, targetUserId, newRole } = parsed.data;

    // Verify promoter is main_contributor
    const promoterProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, promoterId),
    });

    if (!promoterProfile || promoterProfile.role !== 'main_contributor') {
      return c.json({ error: 'Unauthorized: Only main_contributors can directly promote users' }, 403);
    }

    const targetProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetUserId),
    });

    if (!targetProfile) {
      return c.json({ error: 'Target user profile not found' }, 404);
    }

    const currentRole = (targetProfile.role || 'student') as UserRole;
    if (ROLE_HIERARCHY[newRole] <= ROLE_HIERARCHY[currentRole]) {
      return c.json(
        { error: `Cannot change role from ${currentRole} to ${newRole}. Roles cannot be downgraded.` },
        400
      );
    }

    // Apply promotion to profiles and Better Auth user
    await db
      .update(profiles)
      .set({
        role: newRole,
        updated_at: new Date(),
      })
      .where(eq(profiles.id, targetUserId));

    await db
      .update(user)
      .set({
        role: newRole,
        updatedAt: new Date(),
      })
      .where(eq(user.id, targetUserId));

    return c.json({
      success: true,
      targetUserId,
      newRole,
    });
  });

  return router;
}
