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
      const setPayload: Record<string, any> = {
        updated_at: new Date(),
      };

      if (updates.name !== undefined) setPayload.name = updates.name;
      if (updates.title !== undefined) setPayload.title = updates.title;
      if (updates.bio !== undefined) setPayload.bio = updates.bio;
      if (updates.avatar !== undefined || updates.avatar_url !== undefined) {
        setPayload.avatar_url = updates.avatar || updates.avatar_url;
      }
      if (updates.isPublic !== undefined || updates.is_public !== undefined) {
        setPayload.is_public = updates.isPublic !== undefined ? updates.isPublic : updates.is_public;
      }
      if (updates.telegramHandle !== undefined || updates.telegram_handle !== undefined) {
        const handle = updates.telegramHandle || updates.telegram_handle;
        setPayload.telegram_handle = typeof handle === 'string' ? handle.replace('@', '').trim() : handle;
      }
      if (updates.hourlyRate !== undefined || updates.hourly_rate !== undefined) {
        setPayload.hourly_rate = updates.hourlyRate || updates.hourly_rate;
      }
      if (updates.teachingCurriculums !== undefined || updates.teaching_curriculums !== undefined) {
        setPayload.teaching_curriculums = updates.teachingCurriculums || updates.teaching_curriculums;
      }
      if (updates.teachingSubjects !== undefined || updates.teaching_subjects !== undefined) {
        setPayload.teaching_subjects = updates.teachingSubjects || updates.teaching_subjects;
      }
      if (updates.socialLinks !== undefined || updates.social_links !== undefined) {
        setPayload.social_links = updates.socialLinks || updates.social_links;
      }
      if (updates.projects !== undefined) setPayload.projects = updates.projects;
      if (updates.activities !== undefined) setPayload.activities = updates.activities;
      if (updates.achievements !== undefined) setPayload.achievements = updates.achievements;
      if (updates.academicGrades !== undefined || updates.academic_grades !== undefined) {
        setPayload.academic_grades = updates.academicGrades || updates.academic_grades;
      }
      if (updates.pinnedItemId !== undefined || updates.pinned_item_id !== undefined) {
        setPayload.pinned_item_id = updates.pinnedItemId || updates.pinned_item_id;
      }
      if (updates.sectionVisibility !== undefined || updates.section_visibility !== undefined) {
        setPayload.section_visibility = updates.sectionVisibility || updates.section_visibility;
      }
      if (updates.theme !== undefined) setPayload.theme = updates.theme;
      if (updates.spacing !== undefined) setPayload.spacing = updates.spacing;
      if (updates.width !== undefined) setPayload.width = updates.width;
      if (updates.sectionLayout !== undefined || updates.section_layout !== undefined) {
        setPayload.section_layout = updates.sectionLayout || updates.section_layout;
      }
      if (updates.preferredName !== undefined || updates.preferred_name !== undefined) {
        setPayload.preferred_name = updates.preferredName || updates.preferred_name;
      }
      if (updates.institutionName !== undefined || updates.institution_name !== undefined) {
        setPayload.institution_name = updates.institutionName || updates.institution_name;
      }
      if (updates.timezone !== undefined) setPayload.timezone = updates.timezone;

      await db
        .update(profiles)
        .set(setPayload)
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
