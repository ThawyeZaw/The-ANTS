import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, arrayContains, or, sql, type SQL } from 'drizzle-orm';
import type { AnyColumn } from 'drizzle-orm';
import { createDb, profiles } from '@the-ants/db';
import {
  canHavePublicProfile,
  canViewPublicProfile,
  normalizeProfileRoles,
} from '@the-ants/shared-types';

/** Case-insensitive equality for D1/SQLite (Postgres ILIKE is unsupported). */
function iEqual(column: AnyColumn, value: string): SQL {
  return sql`lower(${column}) = ${value.toLowerCase()}`;
}

export function createProfileRoutes(getDb: (c?: unknown) => ReturnType<typeof createDb>) {
  const router = new Hono();

  // 1. Get profile for a user
  router.get('/me', async (c) => {
    const db = getDb(c);
    const userId = c.req.query('userId');
    const email = c.req.query('email');

    if (!userId && !email) {
      return c.json({ error: 'Missing userId or email parameter' }, 400);
    }

    try {
      const profile = await db.query.profiles.findFirst({
        where: userId
          ? eq(profiles.id, userId as any)
          : eq(profiles.email, email as string),
      });

      if (!profile && userId && email) {
        const byEmail = await db.query.profiles.findFirst({
          where: eq(profiles.email, email),
        });
        if (byEmail) return c.json({ profile: byEmail });
      }

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
    const db = getDb(c);

    // Permissive schema: preserves the camelCase/snake_case alias contract while
    // validating types and stripping unknown fields (prevents mass-assignment).
    const UpdateSchema = z
      .object({
        userId: z.string().uuid(),
        name: z.string().optional(),
        title: z.string().nullable().optional(),
        bio: z.string().nullable().optional(),
        avatar: z.string().nullable().optional(),
        avatar_url: z.string().nullable().optional(),
        isPublic: z.boolean().optional(),
        is_public: z.boolean().optional(),
        telegramHandle: z.string().optional(),
        telegram_handle: z.string().optional(),
        hourlyRate: z.union([z.string(), z.number()]).nullable().optional(),
        hourly_rate: z.union([z.string(), z.number()]).nullable().optional(),
        teachingCurriculums: z.array(z.string()).optional(),
        teaching_curriculums: z.array(z.string()).optional(),
        teachingSubjects: z.array(z.string()).optional(),
        teaching_subjects: z.array(z.string()).optional(),
        socialLinks: z.unknown().optional(),
        social_links: z.unknown().optional(),
        projects: z.unknown().optional(),
        activities: z.unknown().optional(),
        achievements: z.unknown().optional(),
        academicGrades: z.unknown().optional(),
        academic_grades: z.unknown().optional(),
        pinnedItemId: z.string().nullable().optional(),
        pinned_item_id: z.string().nullable().optional(),
        sectionVisibility: z.unknown().optional(),
        section_visibility: z.unknown().optional(),
        theme: z.string().optional(),
        spacing: z.string().optional(),
        width: z.string().optional(),
        sectionLayout: z.string().optional(),
        section_layout: z.string().optional(),
        preferredName: z.string().optional(),
        preferred_name: z.string().optional(),
        institutionName: z.string().optional(),
        institution_name: z.string().optional(),
        timezone: z.string().optional(),
      })
      .strip();

    const body = await c.req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { userId, ...updates } = parsed.data;

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
    const db = getDb(c);
    const roleFilter = c.req.query('role');

    try {
      // Role filter is applied in SQL BEFORE the limit so results are not truncated.
      const publicProfiles = await db.query.profiles.findMany({
        where: roleFilter
          ? and(eq(profiles.is_public, true), arrayContains(profiles.roles, [roleFilter]))
          : eq(profiles.is_public, true),
        limit: 100,
      });

      const filtered = publicProfiles.filter((row) =>
        canHavePublicProfile(normalizeProfileRoles(row.roles as any, row.role))
      );

      return c.json({ success: true, profiles: filtered });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // 4. Get public profile by username
  router.get('/:username', async (c) => {
    const db = getDb(c);
    const username = c.req.param('username');

    try {
      const profile = await db.query.profiles.findFirst({
        where: or(
          iEqual(profiles.username, username),
          iEqual(profiles.custom_url_slug, username)
        ),
      });

      if (!profile) {
        return c.json({ profile: null }, 404);
      }

      const roles = normalizeProfileRoles(profile.roles as any, profile.role);
      const visibility = canViewPublicProfile({
        roles,
        isPublic: profile.is_public ?? false,
        profileUserId: profile.id,
      });

      if (!visibility.allowed) {
        return c.json({ profile: null, unavailableReason: visibility.reason }, 404);
      }

      return c.json({ success: true, profile });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  return router;
}
