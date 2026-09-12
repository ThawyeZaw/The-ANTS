import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { createDb, profiles, user, roleUpgradeRequests } from '@the-ants/db';
import type { UserRole } from '@the-ants/shared-types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 0,
  teacher: 1,
  tutor: 1,
  contributor: 2,
  main_contributor: 3,
  admin: 4,
};

export function createRoleUpgradeRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. Submit a role upgrade application (Deprecated — Role assignments are managed by Admins)
  router.post('/apply', async (c) => {
    return c.json(
      {
        error: 'Self-service role application is retired. User roles are assigned directly by platform administrators via the Admin Portal.',
        deprecated: true,
      },
      410
    );
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

    // Verify reviewer is main_contributor / admin
    const reviewerProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, reviewerId),
    });

    if (!reviewerProfile || (reviewerProfile.role !== 'main_contributor' && reviewerProfile.role !== 'admin')) {
      return c.json({ error: 'Unauthorized: Only main_contributors/admins can review role upgrade requests' }, 403);
    }

    // Find request
    const request = await db.query.roleUpgradeRequests.findFirst({
      where: eq(roleUpgradeRequests.id, requestId),
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
      .update(roleUpgradeRequests)
      .set({
        status: newStatus,
        reviewer_id: reviewerId,
        reviewed_at: new Date(),
      })
      .where(eq(roleUpgradeRequests.id, requestId));

    // If approved, update user's role in profiles and Better Auth user table
    if (action === 'approve') {
      const existingUser = await db.query.profiles.findFirst({
        where: eq(profiles.id, request.user_id),
      });

      const updatedRoles = Array.from(
        new Set([...(existingUser?.roles || [existingUser?.role || 'student']), request.requested_role])
      );

      await db
        .update(profiles)
        .set({
          role: request.requested_role,
          roles: updatedRoles,
          updated_at: new Date(),
        })
        .where(eq(profiles.id, request.user_id));

      await db
        .update(user)
        .set({
          role: request.requested_role,
          updatedAt: new Date(),
        })
        .where(eq(user.id, request.user_id));
    }

    return c.json({
      success: true,
      requestId,
      status: newStatus,
      newRole: action === 'approve' ? request.requested_role : undefined,
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

    // Verify promoter is main_contributor / admin
    const promoterProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, promoterId),
    });

    if (!promoterProfile || (promoterProfile.role !== 'main_contributor' && promoterProfile.role !== 'admin')) {
      return c.json({ error: 'Unauthorized: Only main_contributors/admins can directly promote users' }, 403);
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

    const updatedRoles = Array.from(
      new Set([...(targetProfile.roles || [targetProfile.role || 'student']), newRole])
    );

    // Apply promotion to profiles and Better Auth user
    await db
      .update(profiles)
      .set({
        role: newRole,
        roles: updatedRoles,
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

  router.get('/users', async (c) => {
    const db = getDb();
    try {
      const rows = await db
        .select({
          id: profiles.id,
          email: profiles.email,
          name: profiles.name,
          username: profiles.username,
          avatar_url: profiles.avatar_url,
          created_at: profiles.created_at,
          role: profiles.role,
          roles: profiles.roles,
        })
        .from(profiles)
        .orderBy(desc(profiles.created_at));
      return c.json({
        users: rows.map((row) => ({
          ...row,
          roles: row.roles && (row.roles as string[]).length > 0 ? row.roles : [row.role || 'student'],
          createdAt: row.created_at,
          isVerified: true,
        })),
      });
    } catch (err: any) {
      return c.json({ error: err?.message || 'Failed to list users' }, 500);
    }
  });

  router.put('/roles', async (c) => {
    const db = getDb();
    const body = await c.req.json();
    const parsed = z
      .object({
        userId: z.string().uuid(),
        roles: z.array(z.string()).min(1),
      })
      .safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, roles } = parsed.data;
    const primaryRole = roles[0] || 'student';

    try {
      await db
        .update(profiles)
        .set({
          roles,
          role: primaryRole,
          updated_at: new Date(),
        })
        .where(eq(profiles.id, userId as any));

      await db
        .update(user)
        .set({
          role: primaryRole,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ error: err?.message || 'Failed to update user roles' }, 500);
    }
  });

  return router;
}
