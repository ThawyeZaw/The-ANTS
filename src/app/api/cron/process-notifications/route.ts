// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Notification Queue Processor (Cron Endpoint)
//
// GET /api/cron/process-notifications
//
// Processes the notification_queue table in batches.
// Delegates queue processing to the shared processor
// (src/lib/notification-processor.ts), which provides:
//   - stale-processing recovery (rows stuck in 'processing' > 10 min)
//   - atomic row claiming (prevents duplicate Telegram sends)
//   - batch timezone loading (no N+1)
//   - rate-limited Telegram delivery with retries and 429 backoff
//
// Called every minute by GitHub Actions cron workflow. Kept as a fallback
// alongside the QStash-triggered endpoint.
// Protected by x-cron-secret header matching CRON_SECRET env var.
//
// This runs 100% server-side — works even when user's browser is closed.
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import {
  processNotificationQueue,
  type ProcessQueueResult,
} from '@/lib/notification-processor';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;

const BATCH_SIZE = 25;

// ── Dynamic import to avoid bundling supabase-admin in edge ──

async function getAdminSupabase() {
  const { createAdminClient } = await import('@/lib/supabase/server');
  return await createAdminClient();
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // ── Auth guard ──
  const secret = req.headers.get('x-cron-secret');

  if (!CRON_SECRET || secret !== CRON_SECRET) {
    console.warn('[process-notifications] Unauthorized request — x-cron-secret mismatch');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!BOT_TOKEN) {
    console.error('[process-notifications] TELEGRAM_BOT_TOKEN not configured');
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }

  const supabase = await getAdminSupabase();
  const now = new Date().toISOString();

  // ── Process a batch (recovery + atomic claim + send) ──
  let result: ProcessQueueResult;
  try {
    result = await processNotificationQueue(supabase, { limit: BATCH_SIZE });
  } catch (err) {
    console.error('[process-notifications] Processing error:', err);
    return NextResponse.json(
      { error: 'Failed to process queue', detail: String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    processed: result.claimed,
    sent: result.sent,
    failed: result.failed,
    recovered: result.recovered,
    timestamp: now,
  });
}
