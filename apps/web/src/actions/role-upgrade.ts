'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Role & User Server Actions (D1 / Drizzle)
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, profiles } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import type { UserRole } from '@/types';

export interface RoleUpgradeRequest {
  id: string;
  user_id: string;
  current_role: UserRole;
  requested_role: UserRole;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  user_name?: string;
  user_email?: string;
}

export async function submitRoleUpgradeRequest(
  requestedRole: UserRole,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function approveRoleUpgrade(
  requestId: string,
  reviewerId: string
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function rejectRoleUpgrade(
  requestId: string,
  reviewerId: string,
  feedback?: string
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function getPendingUpgradeRequests(): Promise<RoleUpgradeRequest[]> {
  return [];
}

export async function getUserUpgradeRequests(userId?: string): Promise<RoleUpgradeRequest[]> {
  return [];
}

/**
 * Directly updates a user's multi-roles array (admin operation).
 */
export async function actionUpdateUserRoles(
  userId: string,
  roles: UserRole[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const primaryRole = roles[0] ?? 'student';
    await db
      .update(profiles)
      .set({
        role: primaryRole,
        roles,
        updated_at: new Date(),
      })
      .where(eq(profiles.id, userId));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update user roles' };
  }
}

/**
 * Directly changes a user's primary role (admin operation).
 */
export async function changeUserRole(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  return actionUpdateUserRoles(userId, [newRole]);
}

/** Bootstrap helper: promote a user to admin by email (platform ops). */
export async function actionPromoteUserToAdminByEmail(
  email: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { success: false, error: 'Email is required.' };
  }

  try {
    const db = getDb();
    const row = await db.query.profiles.findFirst({
      where: eq(profiles.email, normalized),
    });

    if (!row) {
      return { success: false, error: `No profile found for ${normalized}` };
    }

    const roles: UserRole[] = ['admin'];

    await db
      .update(profiles)
      .set({
        role: 'admin',
        roles,
        is_public: true,
        updated_at: new Date(),
      })
      .where(eq(profiles.id, row.id as any));

    return { success: true, userId: row.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to promote user.' };
  }
}

/**
 * Fetches all user profiles from DB.
 */
export async function getAllUsers() {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        name: profiles.name,
        role: profiles.role,
        roles: profiles.roles,
        is_public: profiles.is_public,
        created_at: profiles.created_at,
      })
      .from(profiles)
      .orderBy(desc(profiles.created_at));

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      username: row.email.split('@')[0] ?? row.name,
      avatar: '',
      role: row.role as UserRole,
      roles: (row.roles ?? [row.role]) as UserRole[],
      is_public: row.is_public,
      created_at: row.created_at?.toISOString?.() ?? new Date().toISOString(),
      createdAt: row.created_at?.toISOString?.() ?? new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[getAllUsers]', err);
    return [];
  }
}
