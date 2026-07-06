'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Supabase Auth Server Actions
// Server-side auth operations: login, signup, logout, password reset.
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
      // emailRedirectTo for production email confirmation
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

export async function resetPasswordAction(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
