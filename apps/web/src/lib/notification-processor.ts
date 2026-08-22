// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Shared Notification Queue Processor
//
// Used by BOTH Next.js processor endpoints so they can never drift apart:
//   - POST /api/qstash/process-notifications (QStash-triggered)
//   - GET  /api/cron/process-notifications   (GitHub Actions cron fallback)
//
// Hardening added for time-sensitive reminders:
//   1. Stale-processing recovery — rows stuck in 'processing' for more than 10
//      minutes (crash / server restart after the claim) are reset to 'pending'
//      before processing begins, so no reminder is permanently stranded.
//   2. Atomic claim — a batch is claimed with `status='pending'` in the UPDATE
//      predicate and `returning` the claimed rows. Two concurrently running
//      processors can never both send the same row, which prevents duplicate
//      Telegram messages and makes processing idempotent.
//   3. Batch timezone fetch — user timezones are loaded in a single query
//      instead of a per-item N+1 lookup.
//   4. Rate limiting (~20 msgs/sec, safe under Telegram's 30/s limit) with
//      429 Retry-After backoff and retry_count-based retry/backoff logic.
// ──────────────────────────────────────────────────────────────────────────────

type SupabaseClient<_T = any> = any;
type Database = any;
type SupabaseAny = any;

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const STALE_PROCESSING_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MS = 50; // ~20 msgs/sec (Telegram limit: 30/s)
const MAX_RETRIES = 3;

/**
 * Claim-ahead window: rows due within the next 5 seconds are treated as
 * claimable. This lets triggers fire a few seconds EARLY (see EARLY_FIRE_MS
 * in src/actions/notifications.ts) so the message lands exactly on time or
 * slightly earlier — never late. It also absorbs processing latency.
 */
export const EARLY_CLAIM_MS = 5_000;

export interface ProcessQueueOptions {
  /** Max rows to claim & send in this run (default: 25). */
  limit?: number;
}

export interface ProcessQueueResult {
  /** Rows claimed and processed in this run. */
  claimed: number;
  /** Rows sent successfully. */
  sent: number;
  /** Rows that failed (retried or marked failed). */
  failed: number;
  /** Stale 'processing' rows recovered back to 'pending'. */
  recovered: number;
}

interface QueueRow {
  id: string;
  telegram_chat_id: string;
  message_text: string;
  retry_count: number | null;
  user_id: string | null;
}

// ── Telegram sender ──────────────────────────────────────────────────────────

async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<{ ok: boolean; retryAfter?: number; errorText?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: false, errorText: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
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

// ── Main entry point ─────────────────────────────────────────────────────────

export async function processNotificationQueue(
  supabase: SupabaseClient<Database>,
  options: ProcessQueueOptions = {}
): Promise<ProcessQueueResult> {
  const limit = options.limit ?? 25;
  const db = supabase as SupabaseAny;
  const nowIso = new Date().toISOString();
  let recovered = 0;

  // ── 0. Stale-processing recovery ──
  // Rows left in 'processing' by a crashed/restarted processor are reset to
  // 'pending' so they get another delivery attempt. Uses updated_at (set on
  // every status transition) so legitimately in-flight batches are untouched.
  const staleCutoff = new Date(Date.now() - STALE_PROCESSING_MS).toISOString();
  const { data: recoveredRows, error: recoverError } = await db
    .from('notification_queue')
    .update({ status: 'pending', updated_at: nowIso })
    .eq('status', 'processing')
    .lt('updated_at', staleCutoff)
    .select('id');

  if (recoverError) {
    console.error('[notification-processor] Stale-recovery error:', recoverError);
  } else {
    recovered = recoveredRows?.length ?? 0;
    if (recovered > 0) {
      console.log(
        `[notification-processor] Recovered ${recovered} stale processing row(s)`
      );
    }
  }

  // ── 1. Fetch due pending rows ──
  // `claimCutoff` extends the deadline by EARLY_CLAIM_MS so rows that are due
  // "in the next few seconds" are claimed now — the trigger fired early, so we
  // deliver on time or slightly before the scheduled moment.
  const claimCutoff = new Date(Date.now() + EARLY_CLAIM_MS).toISOString();
  const { data: candidates, error: fetchError } = await db
    .from('notification_queue')
    .select('id, telegram_chat_id, message_text, retry_count, user_id')
    .eq('status', 'pending')
    .lte('scheduled_for', claimCutoff)
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (fetchError) {
    console.error('[notification-processor] Fetch error:', fetchError);
    throw fetchError;
  }

  if (!candidates || candidates.length === 0) {
    return { claimed: 0, sent: 0, failed: 0, recovered };
  }

  // ── 2. Atomic claim ──
  // Only rows still 'pending' are claimed. If another processor already
  // claimed a row (status='processing') or sent it, the UPDATE predicate
  // filters it out, so duplicate sends are impossible.
  const candidateIds = candidates.map((row: QueueRow) => row.id);
  const { data: claimedRows, error: claimError } = await db
    .from('notification_queue')
    .update({ status: 'processing', updated_at: nowIso })
    .in('id', candidateIds)
    .eq('status', 'pending')
    .select('id, telegram_chat_id, message_text, retry_count, user_id');

  if (claimError) {
    console.error('[notification-processor] Claim error:', claimError);
    throw claimError;
  }

  const rows = (claimedRows ?? []) as QueueRow[];
  if (rows.length === 0) {
    return { claimed: 0, sent: 0, failed: 0, recovered };
  }

  // ── 3. Batch-fetch user timezones (kills the per-item N+1) ──
  const userIds = Array.from(
    new Set(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id)))
  );
  const timezoneById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, timezone')
      .in('id', userIds);
    for (const profile of profiles ?? []) {
      if (profile?.timezone) timezoneById.set(profile.id, profile.timezone);
    }
  }

  // ── 4. Send messages with rate limiting ──
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const userTimezone = row.user_id
      ? (timezoneById.get(row.user_id) ?? 'Asia/Yangon')
      : 'Asia/Yangon';
    const messageText = `${row.message_text}\n\n🕐 This reminder is in ${userTimezone} timezone`;
    const result = await sendTelegramMessage(row.telegram_chat_id, messageText);

    if (result.ok) {
      await db
        .from('notification_queue')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', row.id);
      sent++;
    } else {
      const newRetryCount = (row.retry_count ?? 0) + 1;
      const isPermanent = newRetryCount >= MAX_RETRIES;

      await db
        .from('notification_queue')
        .update({
          status: isPermanent ? 'failed' : 'pending',
          retry_count: newRetryCount,
          error_log: result.errorText ?? 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      failed++;

      if (result.retryAfter) {
        const retryAfter = result.retryAfter;
        console.warn(
          `[notification-processor] Rate limited — waiting ${retryAfter}s`
        );
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
      }
    }

    // Rate limit: delay between messages
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  return { claimed: rows.length, sent, failed, recovered };
}
