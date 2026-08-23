import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb, profiles } from '@the-ants/db';

export function createProfileRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. Get profile for a user
  router.get('/me', async (c) => {
    const db = getDb();
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'Missing userId parameter' }, 400);
    }

    try {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId as any),
      });

      if (!profile) {
        return c.json({ profile: null }, 404);
      }

      return c.json({ profile });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // 2. Update profile
  router.put('/me', async (c) => {
    const db = getDb();
    const body = await c.req.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return c.json({ error: 'Missing userId' }, 400);
    }

    try {
      await db
        .update(profiles)
        .set({
          ...updates,
          updated_at: new Date(),
        })
        .where(eq(profiles.id, userId as any));

      const updated = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId as any),
      });

      return c.json({ profile: updated });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // 3. Get all public profiles (for Explore & Tutor Directory)
  router.get('/public', async (c) => {
    const db = getDb();
    const roleFilter = c.req.query('role');

    try {
      const publicProfiles = await db.query.profiles.findMany({
        where: eq(profiles.is_public, true),
        limit: 100,
      });

      const filtered = roleFilter
        ? publicProfiles.filter((p) => {
            const roles: string[] = (p.roles as string[]) || [p.role];
            return roles.includes(roleFilter);
          })
        : publicProfiles;

      return c.json({ success: true, profiles: filtered });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // 4. Get public profile by username
  router.get('/:username', async (c) => {
    const db = getDb();
    const username = c.req.param('username');

    try {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.username, username),
      });

      if (!profile) {
        return c.json({ profile: null }, 404);
      }

      return c.json({ success: true, profile });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  return router;
}
