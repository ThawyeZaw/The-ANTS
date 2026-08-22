// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Middleware Session Bridge
// ──────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request });
}
