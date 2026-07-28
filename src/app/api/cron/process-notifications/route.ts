// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Notification Queue Processor (Cron Endpoint)
//
// GET /api/cron/process-notifications
//
// Processes the notification_queue table in batches:
//   1. Fetches up to 25 pending items whose scheduled_for <= now()
//   2. Marks them as 'processing'
//   3. Sends each message via the Telegram Bot API
//   4. Rate limits at ~20 msgs/sec (safe under Telegram's 30/s limit)
//   5. Handles HTTP 429 (Retry-After) gracefully
//   6. Updates status to 'sent' or 'failed', increments retry_count
//
// Called every minute by GitHub Actions cron workflow.
// Protected by x-cron-secret header matching CRON_SECRET env var.
//
// This runs 100% server-side — works even when user's browser is closed.
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const BATCH_SIZE = 25;
const RATE_LIMIT_MS = 50; // ~20 msgs/sec (Telegram limit: 30/s)
const MAX_RETRIES = 3;

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

  // ── 1. Fetch pending items ──
  const { data: items, error: fetchError } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error('[process-notifications] Fetch error:', fetchError);
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
    console.error('[process-notifications] Mark-as-processing error:', markError);
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
          `[process-notifications] Rate limited — waiting ${waitSec}s`
        );
        await new Promise((r) => setTimeout(r, waitSec * 1000));
      }
    }

    // Rate limit: delay between messages
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log(
    `[process-notifications] Batch complete: ${sent} sent, ${failed} failed (of ${items.length})`
  );

  return NextResponse.json({
    processed: items.length,
    sent,
    failed,
    timestamp: now,
  });
}
