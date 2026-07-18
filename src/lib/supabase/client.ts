// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Browser-side Supabase Client
// ──────────────────────────────────────────────────────────────────────────────

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AppSupabaseClient = SupabaseClient<Database> | null

export function createClient(): AppSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) return null

  return createBrowserClient<Database>(url, key)
}
