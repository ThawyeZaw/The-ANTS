'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Supabase Auth Server Actions
// Server-side auth operations: login, signup, logout, password reset, admin invite.
// ──────────────────────────────────────────────────────────────────────────────

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/types';

export async function signInAction(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signUpAction(
  email: string,
  password: string,
  name: string
) {
  const supabase = await createClient();
  const username = email.split('@')[0];

  // The handle_new_user trigger auto-creates a profile row with role='student'
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, username },
      emailRedirectTo: `${getSiteUrl()}/auth/confirm`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/** Derive the canonical site URL for auth redirects. */
function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // Vercel auto-sets VERCEL_URL (without protocol) on preview/production deployments
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export async function resetPasswordAction(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/update-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Admin invite — sends a magic-link email to the new user so they can set their
 * own password. Uses the service_role client (bypasses RLS). The profile row is
 * pre-seeded with name and role so the dashboard reflects them immediately.
 *
 * Called only by the main-contributor /add-contributor page.
 */
export async function inviteUserAction(
  email: string,
  name: string,
  role: UserRole
) {
  const admin = await createAdminClient();
  const username = email.split('@')[0];

  // 1. Send the invite email via Supabase Admin API
  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      data: { name, username },
      redirectTo: `${getSiteUrl()}/auth/update-password`,
    }
  );

  if (inviteError) {
    return { success: false, error: inviteError.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { success: false, error: 'Invite succeeded but no user ID returned.' };
  }

  // 2. Pre-seed the profiles row with the provided name and role.
  //    The handle_new_user trigger may have already created a 'student' row;
  //    upsert ensures we set the correct role without a race condition.
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      name,
      username,
      role,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  return { success: true, userId };
}
