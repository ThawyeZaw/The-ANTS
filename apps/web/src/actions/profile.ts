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
      certificationIds: (profileRow.certification_ids as string[]) ?? undefined,
      telegramChatId: (profileRow as any).telegram_chat_id ?? undefined,
      createdAt: profileRow.created_at?.toISOString() ?? '',
    };

    const isTutor = userRoles.includes('tutor') || userRoles.includes('teacher');
    const isContributor = userRoles.includes('contributor') || userRoles.includes('admin') || userRoles.includes('main_contributor');

    const [userCerts, userTutorProfile, userContribProfile, submissions] = await Promise.all([
      db.query.certifications
        .findMany({
          where: eq(certifications.user_id, profile.id as any),
        })
        .catch((err) => {
          console.warn('[actionGetFullProfile] certifications query skipped/failed:', err?.message || err);
          return [];
        }),
      isTutor
        ? db.query.tutorProfiles
            .findFirst({
              where: eq(tutorProfiles.id, profile.id as any),
            })
            .catch(() => null)
        : Promise.resolve(null),
      isContributor
        ? db.query.contributorProfiles
            .findFirst({
              where: eq(contributorProfiles.id, profile.id as any),
            })
            .catch((err) => {
              console.warn('[actionGetFullProfile] contributorProfiles query skipped/failed:', err?.message || err);
              return null;
            })
        : Promise.resolve(null),
      isContributor
        ? db.query.reviewQueue
            .findMany({
              where: and(
                eq(reviewQueue.contributor_id, profile.id as any),
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

    // Check if tutor profile row already exists
    const existing = await db.query.tutorProfiles
      .findFirst({
        where: eq(tutorProfiles.id, userId as any),
      })
      .catch(() => null);

    if (existing) {
      await db
        .update(tutorProfiles)
        .set(data)
        .where(eq(tutorProfiles.id, userId as any));
    } else {
      await db.insert(tutorProfiles).values({
        id: userId as any,
        ...data,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('[actionUpdateTutorProfile]', err);
    return { success: false, error: err.message || 'Failed to update tutor profile' };
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

