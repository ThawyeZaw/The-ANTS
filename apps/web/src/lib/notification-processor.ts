// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Shared Notification Queue Processor
//
// Guarantees:
// 1. Atomic claiming — a single UPDATE ... WHERE id IN (subquery) RETURNING
//    flips pending → processing, so concurrent triggers (Worker cron + manual)
//    can never claim (and double-send) the same row.
// 2. Rate-safe pacing — sends are spaced ~25 msg/sec, safely under the
//    Telegram bot limit of 30 msg/second.
// 3. 429-aware backoff — a rate-limited message is rescheduled by Telegram's
//    retry_after without burning a retry attempt.
// ──────────────────────────────────────────────────────────────────────────────

import { eq, and, lte, asc, inArray } from 'drizzle-orm';
import { getDb, notificationQueue } from '@/lib/db';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const STALE_PROCESSING_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RETRIES = 3;
export const EARLY_CLAIM_MS = 5_000;
const SEND_SPACING_MS = 40; // ~25 msgs/sec — under Telegram's 30/sec cap

export interface ProcessQueueOptions {
  limit?: number;
}

export interface ProcessQueueResult {
  claimed: number;
  sent: number;
  failed: number;
  recovered: number;
  rateLimited: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export async function processNotificationQueue(
  _unusedClient?: any,
  options: ProcessQueueOptions = {}
): Promise<ProcessQueueResult> {
  const limit = options.limit ?? 25;
  const db = getDb();
  const now = new Date();
  let recovered = 0;

  // 1. Recover stale processing rows
  const staleCutoff = new Date(Date.now() - STALE_PROCESSING_MS);
  try {
    const staleResult = await db
      .update(notificationQueue)
      .set({ status: 'pending', updated_at: now })
      .where(
        and(
          eq(notificationQueue.status, 'processing'),
          lte(notificationQueue.updated_at, staleCutoff)
        )
      )
      .returning();
    recovered = staleResult.length;
  } catch (err) {
    console.error('[notification-processor] Stale-recovery error:', err);
  }

  // 2. Atomically claim due rows (pending → processing) and return them.
  //    The outer status='pending' guard is re-evaluated by SQLite after any
  //    lock wait, so a concurrent processor can never claim the same row.
  const claimCutoff = new Date(Date.now() + EARLY_CLAIM_MS);
  const dueWhere = and(
    eq(notificationQueue.status, 'pending'),
    lte(notificationQueue.scheduled_for, claimCutoff),
    lte(notificationQueue.attempts, MAX_RETRIES)
  );

  let claimedItems: any[] = [];
  try {
    claimedItems = await db
      .update(notificationQueue)
      .set({ status: 'processing', updated_at: now })
      .where(
        and(
          dueWhere,
          inArray(
            notificationQueue.id,
            db
              .select({ id: notificationQueue.id })
              .from(notificationQueue)
              .where(dueWhere)
              .orderBy(asc(notificationQueue.scheduled_for))
              .limit(limit)
          )
        )
      )
      .returning();
  } catch (err) {
    console.error('[notification-processor] Claim error:', err);
    return { claimed: 0, sent: 0, failed: 0, recovered, rateLimited: 0 };
  }

  if (claimedItems.length === 0) {
    return { claimed: 0, sent: 0, failed: 0, recovered, rateLimited: 0 };
  }

  let sent = 0;
  let failed = 0;
  let rateLimited = 0;

  for (let i = 0; i < claimedItems.length; i++) {
    // Pacing: space sends out so a burst never exceeds ~25 msgs/sec
    if (i > 0) await sleep(SEND_SPACING_MS);

    const item = claimedItems[i];
    const payload = (item.payload || {}) as any;
    const chatId = payload?.chat_id || payload?.telegram_chat_id;
    const text = payload?.message || payload?.text || payload?.title || 'New notification from The ANTS';

    if (!chatId) {
      failed++;
      await db
        .update(notificationQueue)
        .set({
          status: 'failed',
          last_error: 'No Telegram chat ID in payload',
          updated_at: new Date(),
        })
        .where(eq(notificationQueue.id, item.id));
      continue;
    }

    const res = await sendTelegramMessage(chatId, text);

    if (res.ok) {
      sent++;
      await db
        .update(notificationQueue)
        .set({ status: 'sent', sent_at: new Date(), updated_at: new Date() })
        .where(eq(notificationQueue.id, item.id));
    } else if (res.retryAfter) {
      // Rate limited — reschedule after Telegram's retry_after window.
      // This is transient, so don't burn a retry attempt.
      rateLimited++;
      await db
        .update(notificationQueue)
        .set({
          status: 'pending',
          scheduled_for: new Date(Date.now() + (res.retryAfter + 1) * 1000),
          last_error: res.errorText || 'Rate limited (429)',
          updated_at: new Date(),
        })
        .where(eq(notificationQueue.id, item.id));
    } else {
      failed++;
      const nextAttempts = (item.attempts || 0) + 1;
      await db
        .update(notificationQueue)
        .set({
          status: nextAttempts >= MAX_RETRIES ? 'failed' : 'pending',
          attempts: nextAttempts,
          last_error: res.errorText || 'Failed to deliver message',
          updated_at: new Date(),
        })
        .where(eq(notificationQueue.id, item.id));
    }
  }

  return { claimed: claimedItems.length, sent, failed, recovered, rateLimited };
}
