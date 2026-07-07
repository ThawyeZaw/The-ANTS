'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Role Upgrade Server Actions
// All role-upgrade operations live here:
//   - submitRoleUpgradeRequest   (user-facing: insert into role_upgrade_requests)
//   - approveRoleUpgrade         (main contributor: update profiles.role + request status)
//   - rejectRoleUpgrade          (main contributor: update request status)
//   - getPendingUpgradeRequests  (main contributor dashboard: all pending requests)
//   - getUserUpgradeRequests     (user settings: current user's request history)
// ──────────────────────────────────────────────────────────────────────────────

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  /** Joined from profiles */
  user_name?: string;
  user_email?: string;
}

// ── User-facing: Submit Upgrade Request ──────────────────────────────────────

/**
 * Inserts a new role_upgrade_requests row for the currently authenticated user.
 * Enforces: no duplicate pending request.
 */
export async function submitRoleUpgradeRequest(
  requestedRole: UserRole,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  // Fetch current profile role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Could not fetch your profile.' };
  }

  // Check for existing pending request
  const { data: existing } = await supabase
    .from('role_upgrade_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'You already have a pending upgrade request.' };
  }

  // Insert the request
  const { error: insertError } = await supabase
    .from('role_upgrade_requests')
    .insert({
      user_id: user.id,
      current_role: profile.role as UserRole,
      requested_role: requestedRole,
      reason: reason ?? null,
      status: 'pending',
    });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true };
}

// ── Main Contributor: Approve Upgrade ────────────────────────────────────────

/**
 * Approves a role upgrade request:
 *   1. Updates profiles.role to the requested role (service_role bypasses RLS + trigger)
 *   2. Marks the request as approved
 *
 * Uses createAdminClient() — must only be called from a server action, never exposed to client.
 */
export async function approveRoleUpgrade(
  requestId: string,
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  // Verify the caller is a main_contributor
  const userClient = await createClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  const { data: callerProfile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'main_contributor') {
    return { success: false, error: 'Only main contributors can approve upgrade requests.' };
  }

  // Use admin client to bypass the check_role_update trigger (which guards client-side updates)
  const admin = await createAdminClient();

  // 1. Update the user's role
  const { error: profileError } = await admin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // 2. Mark the request as approved
  const { error: requestError } = await admin
    .from('role_upgrade_requests')
    .update({
      status: 'approved',
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (requestError) {
    return { success: false, error: requestError.message };
  }

  return { success: true };
}

// ── Main Contributor: Reject Upgrade ─────────────────────────────────────────

/**
 * Rejects a role upgrade request. Uses service_role to update status.
 */
export async function rejectRoleUpgrade(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  // Verify the caller is a main_contributor
  const userClient = await createClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  const { data: callerProfile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'main_contributor') {
    return { success: false, error: 'Only main contributors can reject upgrade requests.' };
  }

  const admin = await createAdminClient();

  const { error } = await admin
    .from('role_upgrade_requests')
    .update({
      status: 'rejected',
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ── Main Contributor: List Pending Requests ───────────────────────────────────

/**
 * Fetches all pending role_upgrade_requests, joined with the requester's profile.
 * Uses service_role to read across all users.
 */
export async function getPendingUpgradeRequests(): Promise<RoleUpgradeRequest[]> {
  const admin = await createAdminClient();

  const { data, error } = await admin
    .from('role_upgrade_requests')
    .select(`
      id,
      user_id,
      current_role,
      requested_role,
      reason,
      status,
      reviewer_id,
      created_at,
      reviewed_at,
      profiles!role_upgrade_requests_user_id_fkey (
        name,
        email
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getPendingUpgradeRequests]', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    current_role: row.current_role as UserRole,
    requested_role: row.requested_role as UserRole,
    reason: row.reason,
    status: row.status,
    reviewer_id: row.reviewer_id,
    created_at: row.created_at,
    reviewed_at: row.reviewed_at,
    user_name: row.profiles?.name ?? 'Unknown',
    user_email: row.profiles?.email ?? '',
  }));
}

// ── User-facing: List Own Requests ───────────────────────────────────────────

/**
 * Fetches the current user's own upgrade requests (all statuses).
 */
export async function getUserUpgradeRequests(): Promise<RoleUpgradeRequest[]> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await supabase
    .from('role_upgrade_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getUserUpgradeRequests]', error);
    return [];
  }

  return (data ?? []) as RoleUpgradeRequest[];
}

// ── Main Contributor: Direct Role Change ──────────────────────────────────────

/**
 * Directly changes a user's role (no upgrade request needed).
 * Uses createAdminClient() to bypass RLS and the check_role_update trigger.
 * Only callable by main_contributor.
 */
export async function changeUserRole(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  // Verify the caller is a main_contributor
  const userClient = await createClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  const { data: callerProfile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'main_contributor') {
    return { success: false, error: 'Only main contributors can change user roles.' };
  }

  // Use admin client to bypass the check_role_update trigger
  const admin = await createAdminClient();

  const { error } = await admin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ── Main Contributor: Fetch all users ────────────────────────────────────────

/**
 * Fetches all profiles using the service_role client (bypasses RLS).
 * Merges with Supabase Auth users to determine if they are verified.
 * Used by the Users Table on the add-contributor page.
 */
export async function getAllUsers() {
  const admin = await createAdminClient();

  const [{ data: profiles, error: profileError }, { data: authData, error: authError }] = await Promise.all([
    admin.from('profiles').select('*').order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 })
  ]);

  if (profileError) {
    console.error('[getAllUsers]', profileError);
    return [];
  }

  // Create a map of auth users
  const authUsersMap = new Map((authData?.users || []).map((u: any) => [u.id, u]));

  return (profiles ?? []).map((row: any) => {
    const authUser = authUsersMap.get(row.id);
    return {
      ...row,
      createdAt: row.created_at, // FIX: Map snake_case to camelCase for the frontend
      isVerified: !!authUser?.confirmed_at
    };
  });
}
