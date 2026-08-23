'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Role & User Server Actions (Neon Drizzle DB)
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
    const primaryRole = roles[0] || 'student';

    await db
      .update(profiles)
      .set({
        roles,
        role: primaryRole,
        updated_at: new Date(),
      })
      .where(eq(profiles.id, userId as any));

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

/**
 * Fetches all user profiles from DB.
 */
export async function getAllUsers() {
  try {
    const db = getDb();
    const rows = await db.query.profiles.findMany({
      orderBy: [desc(profiles.created_at)],
    });

    return rows.map((row: any) => ({
      ...row,
      roles: row.roles && row.roles.length > 0 ? row.roles : [row.role || 'student'],
      createdAt: row.created_at,
      isVerified: true,
    }));
  } catch (err) {
    console.error('[getAllUsers]', err);
    return [];
  }
}
