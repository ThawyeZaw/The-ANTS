// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Server Bridge Client (replaces legacy Supabase server client)
// ──────────────────────────────────────────────────────────────────────────────

import { createClient as createBrowserClient, type AppSupabaseClient } from './client';

export async function createClient(): Promise<AppSupabaseClient> {
  return createBrowserClient();
}

export function createAdminClient(): AppSupabaseClient {
  return createBrowserClient();
}
