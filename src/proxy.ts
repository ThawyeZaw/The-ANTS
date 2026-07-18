// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Next.js Root Proxy (replaces deprecated middleware)
// ──────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch (e) {
    console.error('Proxy error:', e)
    // On failure, allow the request through — better than a 500
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
