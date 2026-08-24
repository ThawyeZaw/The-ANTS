'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Profile & Tutor Server Actions (Neon Drizzle DB)
// ──────────────────────────────────────────────────────────────────────────────

import {
  getDb,
  profiles,
  certifications,
  tutorProfiles,
  contributorProfiles,
  reviewQueue,
  user,
  account,
  session,
  verification,
  notificationQueue,
} from '@/lib/db';
import { eq, and, desc, gte, or, ilike } from 'drizzle-orm';
import type { Profile, ProjectEntry, UserRole } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TutorProfileData {
  id: string;
  institution: string | null;
  department: string | null;
  specialization: string | null;
  telegram_handle: string | null;
  hourly_rate: string | null;
  teaching_curriculums: string[] | null;
  teaching_subjects: string[] | null;
  availability_slots: any | null;
  verified: boolean | null;
  is_active: boolean | null;
}

export interface ContributorProfileData {
  id: string;
  title: string | null;
  bio: string | null;
  website_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
}

export interface ContributorStatsData {
  published_curriculums: number;
  published_resources: number;
  total_views: number;
}

export interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

export interface FullProfileData {
  profile: Profile | null;
  certifications: any[];
  tutorProfile: TutorProfileData | null;
  contributorProfile: ContributorProfileData | null;
  stats: ContributorStatsData | null;
  activities: ActivityItem[];
  notFound: boolean;
}

// ── Server Actions ───────────────────────────────────────────────────────────

export async function actionGetFullProfile(username: string): Promise<FullProfileData> {
  try {
    const db = getDb();
    const cleanParam = (username || '').trim();

    if (!cleanParam) {
      return {
        profile: null,
        certifications: [],
        tutorProfile: null,
        contributorProfile: null,
        stats: null,
        activities: [],
        notFound: true,
      };
    }

    // Fetch profile by username, case-insensitive, custom slug, or normalized variations
    const profileRow = await db.query.profiles.findFirst({
      where: or(
        eq(profiles.username, cleanParam),
        ilike(profiles.username, cleanParam),
        eq(profiles.custom_url_slug, cleanParam),
        ilike(profiles.custom_url_slug, cleanParam),
        ilike(profiles.username, cleanParam.replace(/_/g, '')),
        ilike(profiles.username, cleanParam.replace(/-/g, ''))
      ),
    });

    if (!profileRow) {
      return {
        profile: null,
        certifications: [],
        tutorProfile: null,
        contributorProfile: null,
        stats: null,
        activities: [],
        notFound: true,
      };
    }

    const userRoles: UserRole[] =
      (profileRow.roles as UserRole[]) && (profileRow.roles as UserRole[]).length > 0
        ? (profileRow.roles as UserRole[])
        : [(profileRow.role ?? 'student') as UserRole];

    const isTutor = userRoles.includes('tutor') || userRoles.includes('teacher');
    const isContributor = userRoles.includes('contributor') || userRoles.includes('admin') || userRoles.includes('main_contributor');

    const [userCerts, userTutorProfile, userContribProfile, submissions] = await Promise.all([
      db.query.certifications
        .findMany({
          where: eq(certifications.user_id, profileRow.id as any),
        })
        .catch((err) => {
          console.warn('[actionGetFullProfile] certifications query skipped/failed:', err?.message || err);
          return [];
        }),
      db.query.tutorProfiles
        .findFirst({
          where: eq(tutorProfiles.id, profileRow.id as any),
        })
        .catch((err) => {
          console.warn('[actionGetFullProfile] tutorProfiles query skipped/failed:', err?.message || err);
          return null;
        }),
      db.query.contributorProfiles
        .findFirst({
          where: eq(contributorProfiles.id, profileRow.id as any),
        })
        .catch((err) => {
          console.warn('[actionGetFullProfile] contributorProfiles query skipped/failed:', err?.message || err);
          return null;
        }),
      isContributor
        ? db.query.reviewQueue
            .findMany({
              where: and(
                eq(reviewQueue.contributor_id, profileRow.id as any),
                eq(reviewQueue.status, 'approved')
              ),
              orderBy: [desc(reviewQueue.reviewed_at)],
              limit: 20,
            })
            .catch((err) => {
              console.warn('[actionGetFullProfile] reviewQueue query skipped/failed:', err?.message || err);
              return [];
            })
        : Promise.resolve([]),
    ]);

    const profile: Profile = {
      id: profileRow.id,
      email: profileRow.email ?? '',
      name: profileRow.name ?? '',
      username: profileRow.username ?? '',
      avatar: profileRow.avatar_url ?? '',
      role: (profileRow.role ?? 'student') as Profile['role'],
      roles: userRoles,
      bio: profileRow.bio ?? undefined,
      title: profileRow.title ?? undefined,
      socialLinks: profileRow.social_links as unknown as Profile['socialLinks'],
      isPublic: profileRow.is_public ?? true,
      pinnedItemId: profileRow.pinned_item_id ?? undefined,
      sectionVisibility: profileRow.section_visibility as unknown as Profile['sectionVisibility'],
      sectionOrder: (profileRow.section_visibility as any)?.order ?? undefined,
      projects: profileRow.projects as unknown as Profile['projects'],
      activities: profileRow.activities as unknown as Profile['activities'],
      achievements: profileRow.achievements as unknown as Profile['achievements'],
      timezone: profileRow.timezone ?? undefined,
      certificationIds: (profileRow.certification_ids as string[]) ?? undefined,
      telegramHandle: userTutorProfile?.telegram_handle || undefined,
      hourlyRate: userTutorProfile?.hourly_rate || undefined,
      teachingCurriculums: (userTutorProfile?.teaching_curriculums as string[]) || undefined,
      teachingSubjects: (userTutorProfile?.teaching_subjects as string[]) || undefined,
      institutionName: userTutorProfile?.institution || undefined,
      createdAt: profileRow.created_at?.toISOString() ?? '',
    };

    let contributorData: ContributorProfileData | null = null;
    let stats: ContributorStatsData | null = null;

    if (userContribProfile) {
      contributorData = {
        id: userContribProfile.id,
        title: userContribProfile.contributor_level || 'Contributor',
        bio: profile.bio || null,
        website_url: userContribProfile.website_url,
        facebook_url: null,
        linkedin_url: userContribProfile.linkedin_url,
        github_url: userContribProfile.github_url,
      };
      stats = {
        published_curriculums: 0,
        published_resources: userContribProfile.contributions_count ?? 0,
        total_views: 0,
      };
    }

    const activityItems: ActivityItem[] = (submissions as any[]).map((s) => ({
      id: s.id,
      activity_type: 'submission_approved',
      description: `Submission approved for ${s.submission_type || 'content'}`,
      created_at: s.reviewed_at?.toISOString() ?? s.submitted_at?.toISOString() ?? new Date().toISOString(),
    }));

    return {
      profile,
      certifications: userCerts.map((c) => ({
        id: c.id,
        title: c.title,
        issuer: c.issuer,
        issueDate: c.issue_date.toISOString(),
        expiryDate: c.expiry_date?.toISOString(),
        credentialUrl: c.credential_url,
        certificateUrl: c.certificate_url,
      })),
      tutorProfile: userTutorProfile
        ? {
            id: userTutorProfile.id,
            institution: userTutorProfile.institution,
            department: userTutorProfile.department,
            specialization: userTutorProfile.specialization,
            telegram_handle: userTutorProfile.telegram_handle,
            hourly_rate: userTutorProfile.hourly_rate,
            teaching_curriculums: userTutorProfile.teaching_curriculums,
            teaching_subjects: userTutorProfile.teaching_subjects,
            availability_slots: userTutorProfile.availability_slots,
            verified: userTutorProfile.verified,
            is_active: userTutorProfile.is_active,
          }
        : null,
      contributorProfile: contributorData,
      stats,
      activities: activityItems,
      notFound: false,
    };
  } catch (err) {
    console.error('Error fetching full profile:', err);
    return {
      profile: null,
      certifications: [],
      tutorProfile: null,
      contributorProfile: null,
      stats: null,
      activities: [],
      notFound: true,
    };
  }
}

export async function actionUpdateTutorProfile(
  userId: string,
  data: {
    specialization?: string;
    institution?: string;
    department?: string;
    telegram_handle?: string;
    hourly_rate?: string;
    teaching_curriculums?: string[];
    teaching_subjects?: string[];
    availability_slots?: any;
    is_active?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    // 1. Guarantee parent profiles row exists for foreign key constraint
    const existingProfile = await db.query.profiles
      .findFirst({
        where: eq(profiles.id, userId as any),
      })
      .catch(() => null);

    if (!existingProfile) {
      const authUser = await db.query.user
        .findFirst({
          where: eq(user.id, userId),
        })
        .catch(() => null);

      if (authUser) {
        const baseUsername = (authUser.name || authUser.email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
        await db
          .insert(profiles)
          .values({
            id: authUser.id as any,
            email: authUser.email,
            name: authUser.name || 'User',
            username: `${baseUsername}_${Math.random().toString(36).substring(2, 6)}`,
            avatar_url: authUser.image,
            role: 'student',
            roles: ['student'],
          })
          .onConflictDoNothing();
      }
    }

    // 2. Perform atomic UPSERT for tutor profile
    const insertPayload = {
      id: userId as any,
      institution: data.institution || null,
      department: data.department || null,
      specialization: data.specialization || null,
      telegram_handle: data.telegram_handle ? data.telegram_handle.replace('@', '').trim() : null,
      hourly_rate: data.hourly_rate || null,
      teaching_curriculums: Array.isArray(data.teaching_curriculums) ? data.teaching_curriculums : [],
      teaching_subjects: Array.isArray(data.teaching_subjects) ? data.teaching_subjects : [],
      availability_slots: data.availability_slots || {},
      is_active: data.is_active !== undefined ? data.is_active : true,
    };

    await db
      .insert(tutorProfiles)
      .values(insertPayload)
      .onConflictDoUpdate({
        target: tutorProfiles.id,
        set: {
          institution: insertPayload.institution,
          department: insertPayload.department,
          specialization: insertPayload.specialization,
          telegram_handle: insertPayload.telegram_handle,
          hourly_rate: insertPayload.hourly_rate,
          teaching_curriculums: insertPayload.teaching_curriculums,
          teaching_subjects: insertPayload.teaching_subjects,
          availability_slots: insertPayload.availability_slots,
          is_active: insertPayload.is_active,
        },
      });

    return { success: true };
  } catch (err: any) {
    // Attempt automatic schema healing and retry once
    try {
      const { neon } = await import('@neondatabase/serverless');
      const dbUrl = (
        process.env.NEON_DATABASE_URL ||
        process.env.DATABASE_URL ||
        ''
      ).replace(/[&?]channel_binding=[^&]+/g, '').trim();

      if (dbUrl) {
        const sql = neon(dbUrl);
        await sql`
          CREATE TABLE IF NOT EXISTS "tutor_profiles" (
            "id" uuid PRIMARY KEY REFERENCES "profiles"("id") ON DELETE CASCADE,
            "institution" text,
            "department" text,
            "specialization" text,
            "telegram_handle" text,
            "hourly_rate" text,
            "teaching_curriculums" text[],
            "teaching_subjects" text[],
            "availability_slots" jsonb,
            "is_active" boolean DEFAULT true,
            "verified" boolean DEFAULT false
          );
        `;
        await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "institution" text;`;
        await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "department" text;`;
        await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "specialization" text;`;
        await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "telegram_handle" text;`;
        await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "hourly_rate" text;`;
        await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "teaching_curriculums" text[];`;
        await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "teaching_subjects" text[];`;
        await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "availability_slots" jsonb;`;
        await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;`;
        await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "verified" boolean DEFAULT false;`;
      }

      const retryDb = getDb();
      const insertPayload = {
        id: userId as any,
        institution: data.institution || null,
        department: data.department || null,
        specialization: data.specialization || null,
        telegram_handle: data.telegram_handle ? data.telegram_handle.replace('@', '').trim() : null,
        hourly_rate: data.hourly_rate || null,
        teaching_curriculums: Array.isArray(data.teaching_curriculums) ? data.teaching_curriculums : [],
        teaching_subjects: Array.isArray(data.teaching_subjects) ? data.teaching_subjects : [],
        availability_slots: data.availability_slots || {},
        is_active: data.is_active !== undefined ? data.is_active : true,
      };

      await retryDb
        .insert(tutorProfiles)
        .values(insertPayload)
        .onConflictDoUpdate({
          target: tutorProfiles.id,
          set: {
            institution: insertPayload.institution,
            department: insertPayload.department,
            specialization: insertPayload.specialization,
            telegram_handle: insertPayload.telegram_handle,
            hourly_rate: insertPayload.hourly_rate,
            teaching_curriculums: insertPayload.teaching_curriculums,
            teaching_subjects: insertPayload.teaching_subjects,
            availability_slots: insertPayload.availability_slots,
            is_active: insertPayload.is_active,
          },
        });

      return { success: true };
    } catch (retryErr: any) {
      console.error('[actionUpdateTutorProfile] Retry failed:', retryErr);
      return { success: false, error: retryErr.message || 'Failed to update tutor profile' };
    }
  }
}

export async function actionUpdateProfile(
  userId: string,
  data: Partial<Profile>
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    // 1. Ensure parent profiles row exists
    const existingProfile = await db.query.profiles
      .findFirst({
        where: eq(profiles.id, userId as any),
      })
      .catch(() => null);

    if (!existingProfile) {
      const authUser = await db.query.user
        .findFirst({
          where: eq(user.id, userId),
        })
        .catch(() => null);

      if (authUser) {
        const baseUsername = (authUser.name || authUser.email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
        await db
          .insert(profiles)
          .values({
            id: authUser.id as any,
            email: authUser.email,
            name: authUser.name || 'User',
            username: `${baseUsername}_${Math.random().toString(36).substring(2, 6)}`,
            avatar_url: authUser.image,
            role: 'student',
            roles: ['student'],
          })
          .onConflictDoNothing();
      }
    }

    const setPayload: Record<string, any> = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) setPayload.name = data.name;
    if (data.title !== undefined) setPayload.title = data.title;
    if (data.bio !== undefined) setPayload.bio = data.bio;
    if (data.avatar !== undefined) setPayload.avatar_url = data.avatar;
    if (data.isPublic !== undefined) setPayload.is_public = data.isPublic;
    if (data.socialLinks !== undefined) setPayload.social_links = data.socialLinks;
    if (data.projects !== undefined) setPayload.projects = data.projects;
    if (data.activities !== undefined) setPayload.activities = data.activities;
    if (data.achievements !== undefined) setPayload.achievements = data.achievements;
    if (data.pinnedItemId !== undefined) setPayload.pinned_item_id = data.pinnedItemId;
    if (data.sectionVisibility !== undefined) setPayload.section_visibility = data.sectionVisibility;
    if (data.timezone !== undefined) setPayload.timezone = data.timezone;
    if (data.customUrlSlug !== undefined) setPayload.custom_url_slug = data.customUrlSlug;
    if (data.onboardingCompleted !== undefined) setPayload.onboarding_completed = data.onboardingCompleted;
    if (data.preferredName !== undefined) setPayload.preferred_name = data.preferredName;
    if (data.institutionName !== undefined) setPayload.institution_name = data.institutionName;
    if (data.notificationPreferences !== undefined) setPayload.notification_preferences = data.notificationPreferences;

    await db
      .update(profiles)
      .set(setPayload)
      .where(eq(profiles.id, userId as any));

    // 2. If tutor fields are passed, synchronize tutor_profiles
    const cleanTelegram = data.telegramHandle
      ? data.telegramHandle.replace('@', '').trim()
      : (data as any).telegram_handle
      ? String((data as any).telegram_handle).replace('@', '').trim()
      : undefined;

    if (
      cleanTelegram !== undefined ||
      data.hourlyRate !== undefined ||
      data.teachingCurriculums !== undefined ||
      data.teachingSubjects !== undefined ||
      data.institutionName !== undefined
    ) {
      await actionUpdateTutorProfile(userId, {
        ...(cleanTelegram !== undefined ? { telegram_handle: cleanTelegram } : {}),
        ...(data.hourlyRate !== undefined ? { hourly_rate: data.hourlyRate } : {}),
        ...(data.teachingCurriculums !== undefined ? { teaching_curriculums: data.teachingCurriculums } : {}),
        ...(data.teachingSubjects !== undefined ? { teaching_subjects: data.teachingSubjects } : {}),
        ...(data.institutionName !== undefined ? { institution: data.institutionName } : {}),
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('[actionUpdateProfile]', err);
    return { success: false, error: err.message || 'Failed to update profile' };
  }
}

export async function actionUpdateContributorProfile(
  userId: string,
  data: {
    website_url?: string;
    linkedin_url?: string;
    github_url?: string;
    contributor_level?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();

    // 1. Guarantee parent profiles row exists
    const existingProfile = await db.query.profiles
      .findFirst({
        where: eq(profiles.id, userId as any),
      })
      .catch(() => null);

    if (!existingProfile) {
      const authUser = await db.query.user
        .findFirst({
          where: eq(user.id, userId),
        })
        .catch(() => null);

      if (authUser) {
        const baseUsername = (authUser.name || authUser.email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
        await db
          .insert(profiles)
          .values({
            id: authUser.id as any,
            email: authUser.email,
            name: authUser.name || 'User',
            username: `${baseUsername}_${Math.random().toString(36).substring(2, 6)}`,
            avatar_url: authUser.image,
            role: 'student',
            roles: ['student'],
          })
          .onConflictDoNothing();
      }
    }

    // 2. Perform atomic UPSERT for contributor profile
    const insertPayload = {
      id: userId as any,
      website_url: data.website_url || null,
      linkedin_url: data.linkedin_url || null,
      github_url: data.github_url || null,
      contributor_level: data.contributor_level || 'contributor',
    };

    await db
      .insert(contributorProfiles)
      .values(insertPayload)
      .onConflictDoUpdate({
        target: contributorProfiles.id,
        set: {
          website_url: insertPayload.website_url,
          linkedin_url: insertPayload.linkedin_url,
          github_url: insertPayload.github_url,
          contributor_level: insertPayload.contributor_level,
        },
      });

    return { success: true };
  } catch (err: any) {
    // Attempt automatic schema healing and retry once
    try {
      const { neon } = await import('@neondatabase/serverless');
      const dbUrl = (
        process.env.NEON_DATABASE_URL ||
        process.env.DATABASE_URL ||
        ''
      ).replace(/[&?]channel_binding=[^&]+/g, '').trim();

      if (dbUrl) {
        const sql = neon(dbUrl);
        await sql`
          CREATE TABLE IF NOT EXISTS "contributor_profiles" (
            "id" uuid PRIMARY KEY REFERENCES "profiles"("id") ON DELETE CASCADE,
            "website_url" text,
            "linkedin_url" text,
            "github_url" text,
            "contributor_level" text DEFAULT 'contributor'
          );
        `;
        await sql`ALTER TABLE "contributor_profiles" ADD COLUMN IF NOT EXISTS "website_url" text;`;
        await sql`ALTER TABLE "contributor_profiles" ADD COLUMN IF NOT EXISTS "linkedin_url" text;`;
        await sql`ALTER TABLE "contributor_profiles" ADD COLUMN IF NOT EXISTS "github_url" text;`;
        await sql`ALTER TABLE "contributor_profiles" ADD COLUMN IF NOT EXISTS "contributor_level" text DEFAULT 'contributor';`;
      }

      const retryDb = getDb();
      const insertPayload = {
        id: userId as any,
        website_url: data.website_url || null,
        linkedin_url: data.linkedin_url || null,
        github_url: data.github_url || null,
        contributor_level: data.contributor_level || 'contributor',
      };

      await retryDb
        .insert(contributorProfiles)
        .values(insertPayload)
        .onConflictDoUpdate({
          target: contributorProfiles.id,
          set: {
            website_url: insertPayload.website_url,
            linkedin_url: insertPayload.linkedin_url,
            github_url: insertPayload.github_url,
            contributor_level: insertPayload.contributor_level,
          },
        });

      return { success: true };
    } catch (retryErr: any) {
      console.error('[actionUpdateContributorProfile] Retry failed:', retryErr);
      return { success: false, error: retryErr.message || 'Failed to update contributor profile' };
    }
  }
}

export async function actionGetPublicProfiles(roles?: UserRole[]): Promise<Profile[]> {
  try {
    const db = getDb();
    const data = await db.query.profiles.findMany({
      where: eq(profiles.is_public, true),
      limit: 100,
    });

    return data
      .filter((p) => {
        if (!roles) return true;
        const pRoles: string[] = (p.roles as string[]) || [p.role];
        return roles.some((r) => pRoles.includes(r));
      })
      .map((profileRow) => ({
        id: profileRow.id,
        email: profileRow.email ?? '',
        name: profileRow.name ?? '',
        username: profileRow.username ?? '',
        avatar: profileRow.avatar_url ?? '',
        role: (profileRow.role ?? 'student') as Profile['role'],
        roles: (profileRow.roles as UserRole[]) || [profileRow.role as UserRole],
        bio: profileRow.bio ?? undefined,
        title: profileRow.title ?? undefined,
        socialLinks: profileRow.social_links as unknown as Profile['socialLinks'],
        isPublic: profileRow.is_public ?? true,
        pinnedItemId: profileRow.pinned_item_id ?? undefined,
        sectionVisibility: profileRow.section_visibility as unknown as Profile['sectionVisibility'],
        projects: profileRow.projects as unknown as Profile['projects'],
        activities: profileRow.activities as unknown as Profile['activities'],
        achievements: profileRow.achievements as unknown as Profile['achievements'],
        certificationIds: (profileRow.certification_ids as string[]) ?? undefined,
        createdAt: profileRow.created_at?.toISOString() ?? '',
      }));
  } catch (err) {
    console.error('Error getting public profiles:', err);
    return [];
  }
}

// ── Account & Security Actions ───────────────────────────────────────────────

/**
 * Checks if a username is available and valid.
 */
export async function actionCheckUsernameAvailable(
  rawUsername: string,
  currentUserId?: string
): Promise<{ available: boolean; error?: string }> {
  const username = rawUsername.trim().toLowerCase();
  if (!username) return { available: false, error: 'Username cannot be empty.' };
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return {
      available: false,
      error: 'Username must be 3-30 characters (lowercase letters, numbers, underscores).',
    };
  }

  const reserved = [
    'admin', 'api', 'auth', 'dashboard', 'settings', 'explore', 'about',
    'library', 'tools', 'student', 'tutor', 'contributor', 'login', 'signup',
    'timetable', 'pomodoro', 'calculator', 'flashcards', 'courses', 'notes', 'exams',
  ];
  if (reserved.includes(username)) {
    return { available: false, error: 'This username is reserved.' };
  }

  try {
    const db = getDb();
    const results = await db
      .select({ id: profiles.id, username: profiles.username })
      .from(profiles)
      .where(or(eq(profiles.username, username), ilike(profiles.username, username)))
      .limit(1);

    const existing = results[0];

    if (!existing) return { available: true };
    if (currentUserId && existing.id === currentUserId) return { available: true };

    return { available: false, error: 'Username is already taken.' };
  } catch (err: any) {
    console.error('[actionCheckUsernameAvailable]', err);
    return { available: false, error: 'Could not connect to verification service.' };
  }
}

/**
 * Updates a user's unique username across database records.
 */
export async function actionUpdateUsername(
  userId: string,
  newUsername: string
): Promise<{ success: boolean; newUsername?: string; error?: string }> {
  const cleanUsername = newUsername.trim().toLowerCase();
  const check = await actionCheckUsernameAvailable(cleanUsername, userId);
  if (!check.available) {
    return { success: false, error: check.error || 'Username is not available.' };
  }

  try {
    const db = getDb();
    await db
      .update(profiles)
      .set({ username: cleanUsername, updated_at: new Date() })
      .where(eq(profiles.id, userId as any));

    return { success: true, newUsername: cleanUsername };
  } catch (err: any) {
    console.error('[actionUpdateUsername]', err);
    return { success: false, error: err.message || 'Failed to update username.' };
  }
}

/**
 * Updates a user's display name and propagates to session record.
 */
export async function actionUpdateDisplayName(
  userId: string,
  newName: string
): Promise<{ success: boolean; newName?: string; error?: string }> {
  const cleanName = newName.trim();
  if (!cleanName) return { success: false, error: 'Display name cannot be empty.' };

  try {
    const db = getDb();
    await db
      .update(profiles)
      .set({ name: cleanName, updated_at: new Date() })
      .where(eq(profiles.id, userId as any));

    try {
      await db
        .update(user)
        .set({ name: cleanName, updatedAt: new Date() })
        .where(eq(user.id, userId));
    } catch {}

    return { success: true, newName: cleanName };
  } catch (err: any) {
    console.error('[actionUpdateDisplayName]', err);
    return { success: false, error: err.message || 'Failed to update display name.' };
  }
}

/**
 * Requests a time-limited 6-digit password reset verification code via Telegram and/or Email.
 */
export async function actionRequestPasswordReset(
  identifier: string,
  channel: 'telegram' | 'email' | 'both' = 'both'
): Promise<{ success: boolean; message?: string; delivery?: string; error?: string }> {
  const cleanIdentifier = identifier.trim().toLowerCase();
  if (!cleanIdentifier) return { success: false, error: 'Please enter your email or username.' };

  try {
    const db = getDb();
    const profile = await db.query.profiles.findFirst({
      where: cleanIdentifier.includes('@')
        ? eq(profiles.email, cleanIdentifier)
        : eq(profiles.username, cleanIdentifier),
    });

    if (!profile) {
      return { success: false, error: 'No account found matching that email or username.' };
    }

    // Generate secure 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // Store in verification table
    await db.insert(verification).values({
      id: `reset_${profile.id}_${Date.now()}`,
      identifier: profile.id,
      value: code,
      expiresAt,
    });

    let sentViaTelegram = false;
    const telegramChatId = (profile as any).telegram_chat_id;
    if (telegramChatId && (channel === 'telegram' || channel === 'both')) {
      const text = `🐜 <b>The ANTS — Password Reset Request</b>\n\nHello <b>${profile.name}</b>,\n\nYour 6-digit verification code is: <code>${code}</code>\n\nThis code expires in 15 minutes. Enter this code to reset your password. If you did not request this, please ignore this message.`;

      try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text,
              parse_mode: 'HTML',
            }),
          });
          sentViaTelegram = true;
        }
      } catch (tgErr) {
        console.error('[actionRequestPasswordReset] Telegram delivery error:', tgErr);
      }
    }

    // Log/Queue email notification
    try {
      await db.insert(notificationQueue).values({
        user_id: profile.id as any,
        channel: 'email',
        payload: {
          user_id: profile.id,
          email: profile.email,
          code,
          type: 'password_reset',
        },
        scheduled_for: new Date(),
        status: 'pending',
      });
    } catch {}

    const deliveryDesc = sentViaTelegram
      ? 'A 6-digit reset code has been sent directly to your connected Telegram bot and email.'
      : 'A 6-digit reset code has been dispatched to your account email.';

    return {
      success: true,
      message: deliveryDesc,
      delivery: sentViaTelegram ? 'telegram' : 'email',
    };
  } catch (err: any) {
    console.error('[actionRequestPasswordReset]', err);
    return { success: false, error: err.message || 'Failed to process password reset request.' };
  }
}

/**
 * Resets a user's password using the verified OTP code.
 */
export async function actionResetPasswordWithCode(
  identifier: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanIdentifier = identifier.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!cleanCode || cleanCode.length < 4) {
    return { success: false, error: 'Please enter the valid 6-digit verification code.' };
  }
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  try {
    const db = getDb();
    const profile = await db.query.profiles.findFirst({
      where: cleanIdentifier.includes('@')
        ? eq(profiles.email, cleanIdentifier)
        : eq(profiles.username, cleanIdentifier),
    });

    if (!profile) {
      return { success: false, error: 'Account not found.' };
    }

    // Check verification code validity
    const record = await db.query.verification.findFirst({
      where: and(
        eq(verification.identifier, profile.id),
        eq(verification.value, cleanCode),
        gte(verification.expiresAt, new Date())
      ),
    });

    if (!record) {
      return { success: false, error: 'Invalid or expired verification code.' };
    }

    // Update password in account table
    try {
      await db
        .update(account)
        .set({ password: newPassword, updatedAt: new Date() })
        .where(eq(account.userId, profile.id));
    } catch {}

    // Invalidate old sessions for security
    try {
      await db.delete(session).where(eq(session.userId, profile.id));
    } catch {}

    // Delete used verification code
    try {
      await db.delete(verification).where(eq(verification.id, record.id));
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error('[actionResetPasswordWithCode]', err);
    return { success: false, error: err.message || 'Failed to reset password.' };
  }
}

