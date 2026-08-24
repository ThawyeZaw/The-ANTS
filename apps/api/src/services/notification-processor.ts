import { eq, and, lte, asc, inArray } from 'drizzle-orm';
import { createDb, notificationQueue } from '@the-ants/db';

const BATCH_SIZE = 25;
const MAX_RETRIES = 3;
const SEND_SPACING_MS = 40; // ~25 msgs/sec — under Telegram's 30/sec cap

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processNotificationQueue(
  db: ReturnType<typeof createDb>,
  botToken: string
): Promise<{ processed: number; successCount: number; failCount: number; rateLimited: number }> {
  if (!botToken) {
    return { processed: 0, successCount: 0, failCount: 0, rateLimited: 0 };
  }

  const now = new Date();

  // 1. Recover stale processing rows (> 10 mins old)
  const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
  await db
    .update(notificationQueue)
    .set({ status: 'pending', updated_at: now })
    .where(
      and(
        eq(notificationQueue.status, 'processing'),
        lte(notificationQueue.updated_at, staleThreshold)
      )
    );

  // 2. Atomically claim due rows (pending → processing) and return them.
  //    Outer status guard is re-evaluated after lock waits → no double-claims
  //    between the Worker cron and any concurrent trigger.
  const dueWhere = and(
    eq(notificationQueue.status, 'pending'),
    lte(notificationQueue.scheduled_for, now),
    lte(notificationQueue.attempts, MAX_RETRIES)
  );

  const claimedItems = await db
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
            .limit(BATCH_SIZE)
        )
      )
    )
    .returning();

  if (claimedItems.length === 0) {
    return { processed: 0, successCount: 0, failCount: 0, rateLimited: 0 };
  }

  let successCount = 0;
  let failCount = 0;
  let rateLimited = 0;

  // 3. Send each message with pacing
  for (let i = 0; i < claimedItems.length; i++) {
    if (i > 0) await sleep(SEND_SPACING_MS);

    const item = claimedItems[i];
    const payload = (item.payload || {}) as any;
    const chatId = payload?.chat_id || payload?.telegram_chat_id;
    const text = payload?.message || payload?.text || payload?.title || 'New notification from The ANTS';

    if (!chatId) {
      failCount++;
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

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      if (res.status === 429) {
        // Rate limited — reschedule after retry_without without burning an attempt
        const body: any = await res.json().catch(() => ({}));
        const retryAfter = body?.parameters?.retry_after ?? 5;
        rateLimited++;
        await db
          .update(notificationQueue)
          .set({
            status: 'pending',
            scheduled_for: new Date(Date.now() + (retryAfter + 1) * 1000),
            last_error: 'Rate limited (429)',
            updated_at: new Date(),
          })
          .where(eq(notificationQueue.id, item.id));
        continue;
      }

      const json: any = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.description || `HTTP ${res.status}`);
      }

      // Mark as sent
      await db
        .update(notificationQueue)
        .set({
          status: 'sent',
          sent_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(notificationQueue.id, item.id));

      successCount++;
    } catch (err: any) {
      failCount++;
      const nextAttempts = (item.attempts || 0) + 1;
      const finalFailed = nextAttempts >= MAX_RETRIES;

      await db
        .update(notificationQueue)
        .set({
          status: finalFailed ? 'failed' : 'pending',
          attempts: nextAttempts,
          last_error: err.message || 'Unknown error',
          updated_at: new Date(),
        })
        .where(eq(notificationQueue.id, item.id));
    }
  }

  return { processed: claimedItems.length, successCount, failCount, rateLimited };
}
