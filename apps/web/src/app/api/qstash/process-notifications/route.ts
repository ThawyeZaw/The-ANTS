// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — QStash-Triggered Queue Processor
//
// POST /api/qstash/process-notifications
//
// Called by Upstash QStash when a scheduled notification batch is due.
// Delegates queue processing to the shared processor
// (src/lib/notification-processor.ts), which provides:
//   - stale-processing recovery (rows stuck in 'processing' > 10 min)
//   - atomic row claiming (prevents duplicate Telegram sends)
//   - batch timezone loading (no N+1)
//   - rate-limited Telegram delivery with retries and 429 backoff
//
// If more due rows remain after this batch, it chains another QStash trigger
// in 1 second so Telegram's 30 msg/sec limit is never exceeded.
//
// Protected by x-cron-secret header matching CRON_SECRET env var.
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { scheduleQStashMessage } from '@/lib/qstash';
import {
  processNotificationQueue,
  EARLY_CLAIM_MS,
  type ProcessQueueResult,
} from '@/lib/notification-processor';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;

const BATCH_SIZE = 30;         // Telegram's per-second rate limit
const CHAIN_DELAY_S = 1;       // seconds before the next chained batch

// ── Dynamic import to avoid bundling supabase-admin in edge ──

async function getAdminSupabase() {
  const { createAdminClient } = await import('@/lib/supabase/server');
  return await createAdminClient();
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // ── Auth guard ──
  const secret = req.headers.get('x-cron-secret');

  if (!CRON_SECRET || secret !== CRON_SECRET) {
    console.warn('[qstash-process] Unauthorized request — x-cron-secret mismatch');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!BOT_TOKEN) {
    console.error('[qstash-process] TELEGRAM_BOT_TOKEN not configured');
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }

  const supabase = await getAdminSupabase();
  const now = new Date().toISOString();

  // ── Process a batch (recovery + atomic claim + send) ──
  let result: ProcessQueueResult;
  try {
    result = await processNotificationQueue(supabase, { limit: BATCH_SIZE });
  } catch (err) {
    console.error('[qstash-process] Processing error:', err);
    return NextResponse.json(
      { error: 'Failed to process queue', detail: String(err) },
      { status: 500 }
    );
  }

  // ── Chain next batch if more pending items exist ──
  let chained = false;
  if (result.claimed === BATCH_SIZE) {
    // There might be more items — check (same claim-ahead window as the processor)
    const claimCutoff = new Date(Date.now() + EARLY_CLAIM_MS).toISOString();
    const { count } = await supabase
      .from('notification_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('scheduled_for', claimCutoff);

    if (count && count > 0) {
      const scheduled = await scheduleQStashMessage({ delay: CHAIN_DELAY_S });
      chained = scheduled !== null;
      if (chained) {
        console.log(`[qstash-process] Chained next batch in ${CHAIN_DELAY_S}s (${count} remaining)`);
      } else {
        console.warn('[qstash-process] Failed to chain next batch');
      }
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(
    `[qstash-process] Batch ${result.claimed} claimed → ${result.sent} sent, ${result.failed} failed in ${elapsed}ms`
  );

  return NextResponse.json({
    processed: result.claimed,
    sent: result.sent,
    failed: result.failed,
    recovered: result.recovered,
    chained,
    elapsed_ms: elapsed,
    timestamp: now,
  });
}
