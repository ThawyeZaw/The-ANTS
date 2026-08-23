// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Shared Notification Queue Processor
// ──────────────────────────────────────────────────────────────────────────────

import { eq, and, lte, inArray } from 'drizzle-orm';
import { getDb, notificationQueue } from '@/lib/db';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const STALE_PROCESSING_MS = 10 * 60 * 1000; // 10 minutes
const MAX_RETRIES = 3;
export const EARLY_CLAIM_MS = 5_000;

export interface ProcessQueueOptions {
  limit?: number;
}

export interface ProcessQueueResult {
  claimed: number;
  sent: number;
  failed: number;
  recovered: number;
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

  // 2. Fetch due pending rows
  const claimCutoff = new Date(Date.now() + EARLY_CLAIM_MS);
  let dueItems: any[] = [];
  try {
    dueItems = await db.query.notificationQueue.findMany({
      where: and(
        eq(notificationQueue.status, 'pending'),
        lte(notificationQueue.scheduled_for, claimCutoff),
        lte(notificationQueue.attempts, MAX_RETRIES)
      ),
      limit,
    });
  } catch (err) {
    console.error('[notification-processor] Fetch error:', err);
    return { claimed: 0, sent: 0, failed: 0, recovered };
  }

  if (dueItems.length === 0) {
    return { claimed: 0, sent: 0, failed: 0, recovered };
  }

  // 3. Mark as processing
  const itemIds = dueItems.map((i) => i.id);
  await db
    .update(notificationQueue)
    .set({ status: 'processing', updated_at: now })
    .where(inArray(notificationQueue.id, itemIds));

  let sent = 0;
  let failed = 0;

  for (const item of dueItems) {
    const payload = (item.payload || {}) as any;
    const chatId = payload?.chat_id || payload?.telegram_chat_id;
    const text = payload?.message || payload?.text || payload?.title || 'New notification from The ANTS';

    if (!chatId) {
      failed++;
      continue;
    }

    const res = await sendTelegramMessage(chatId, text);
    if (res.ok) {
      sent++;
      await db
        .update(notificationQueue)
        .set({ status: 'sent', sent_at: new Date(), updated_at: new Date() })
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

  return { claimed: dueItems.length, sent, failed, recovered };
}
