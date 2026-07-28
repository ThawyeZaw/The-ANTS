// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — QStash-Triggered Queue Processor
//
// POST /api/qstash/process-notifications
//
// Called by Upstash QStash when a scheduled notification batch is due.
// Replaces the unreliable GitHub Actions cron-based polling pattern.
//
// Flow:
//   1. Verify x-cron-secret header (same auth as old cron endpoint)
//   2. Fetch up to 30 pending items from notification_queue
//   3. Send each message via Telegram API with 50ms delay between them
//   4. If more pending items exist, chain another QStash trigger in 1 second
//      (ensures we never exceed Telegram's 30 messages/second limit)
//
// This runs 100% server-side — works even when user's browser is closed.
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { scheduleQStashMessage } from '@/lib/qstash';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const BATCH_SIZE = 30;         // Telegram's per-second rate limit
const RATE_LIMIT_MS = 50;      // ~20 msgs/sec (safe under Telegram's 30/s)
const MAX_RETRIES = 3;
const CHAIN_DELAY_S = 1;       // seconds before the next chained batch

// ── Dynamic import to avoid bundling supabase-admin in edge ──

async function getAdminSupabase() {
  const { createAdminClient } = await import('@/lib/supabase/server');
  return await createAdminClient();
}

// ── Telegram sender ──────────────────────────────────────────────────────────

async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<{ ok: boolean; retryAfter?: number; errorText?: string }> {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });

    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const retryAfter = body?.parameters?.retry_after ?? 5;
      return { ok: false, retryAfter, errorText: 'Rate limited (429)' };
    }

    if (!res.ok) {
      const errorText = await res.text();
      return { ok: false, errorText: `${res.status}: ${errorText}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, errorText: String(err) };
  }
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

  // ── 1. Fetch pending items ──
  const { data: items, error: fetchError } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error('[qstash-process] Fetch error:', fetchError);
    return NextResponse.json(
      { error: 'Failed to fetch queue items', detail: fetchError.message },
      { status: 500 }
    );
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No pending items' });
  }

  // ── 2. Mark as processing ──
  const itemIds = items.map((i: { id: string }) => i.id);
  const { error: markError } = await supabase
    .from('notification_queue')
    .update({ status: 'processing' })
    .in('id', itemIds);

  if (markError) {
    console.error('[qstash-process] Mark-as-processing error:', markError);
  }

  // ── 3. Send messages with rate limiting ──
  let sent = 0;
  let failed = 0;

  for (const item of items as Array<{
    id: string;
    telegram_chat_id: string;
    message_text: string;
    retry_count: number;
    user_id: string;
  }>) {
    // ── Fetch user's timezone ──
    let userTimezone = 'Asia/Yangon';
    if (item.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', item.user_id)
        .single();
      if ((profile as any)?.timezone) {
        userTimezone = (profile as any).timezone;
      }
    }

    const messageText = `${item.message_text}\n\n🕐 This reminder is in ${userTimezone} timezone`;
    const result = await sendTelegramMessage(item.telegram_chat_id, messageText);

    if (result.ok) {
      await supabase
        .from('notification_queue')
        .update({ status: 'sent' })
        .eq('id', item.id);
      sent++;
    } else {
      const newRetryCount = (item.retry_count ?? 0) + 1;
      const isPermanent = newRetryCount >= MAX_RETRIES;

      await supabase
        .from('notification_queue')
        .update({
          status: isPermanent ? 'failed' : 'pending',
          retry_count: newRetryCount,
          error_log: result.errorText ?? 'Unknown error',
        })
        .eq('id', item.id);

      failed++;

      if (result.retryAfter) {
        const waitSec = result.retryAfter;
        console.warn(
          `[qstash-process] Rate limited — waiting ${waitSec}s`
        );
        await new Promise((r) => setTimeout(r, waitSec * 1000));
      }
    }

    // Rate limit: delay between messages
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  const elapsed = Date.now() - startTime;
  console.log(
    `[qstash-process] Batch ${items.length} items → ${sent} sent, ${failed} failed in ${elapsed}ms`
  );

  // ── 4. Chain next batch if more pending items exist ──
  let chained = false;
  if (items.length === BATCH_SIZE) {
    // There might be more items — check
    const { count } = await supabase
      .from('notification_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('scheduled_for', now);

    if (count && count > 0) {
      const result = await scheduleQStashMessage({ delay: CHAIN_DELAY_S });
      chained = result !== null;
      if (chained) {
        console.log(`[qstash-process] Chained next batch in ${CHAIN_DELAY_S}s (${count} remaining)`);
      } else {
        console.warn('[qstash-process] Failed to chain next batch');
      }
    }
  }

  return NextResponse.json({
    processed: items.length,
    sent,
    failed,
    chained,
    elapsed_ms: elapsed,
    timestamp: now,
  });
}
