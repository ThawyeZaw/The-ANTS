import { eq, and, lte, or, inArray } from 'drizzle-orm';
import { createDb, notificationQueue, profiles } from '@the-ants/db';

const BATCH_SIZE = 25;
const MAX_RETRIES = 3;

export async function processNotificationQueue(
  db: ReturnType<typeof createDb>,
  botToken: string
): Promise<{ processed: number; successCount: number; failCount: number }> {
  if (!botToken) {
    return { processed: 0, successCount: 0, failCount: 0 };
  }

  const now = new Date();

  // 1. Recover stale processing rows (> 10 mins old)
  const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
  await db
    .update(notificationQueue)
    .set({ status: 'pending' })
    .where(
      and(
        eq(notificationQueue.status, 'processing'),
        lte(notificationQueue.updated_at, staleThreshold)
      )
    );

  // 2. Fetch pending items due for sending
  const pendingItems = await db.query.notificationQueue.findMany({
    where: and(
      eq(notificationQueue.status, 'pending'),
      lte(notificationQueue.scheduled_for, now),
      lte(notificationQueue.attempts, MAX_RETRIES)
    ),
    limit: BATCH_SIZE,
  });

  if (pendingItems.length === 0) {
    return { processed: 0, successCount: 0, failCount: 0 };
  }

  const itemIds = pendingItems.map((i) => i.id);

  // 3. Mark as processing
  await db
    .update(notificationQueue)
    .set({ status: 'processing', updated_at: now })
    .where(inArray(notificationQueue.id, itemIds));

  let successCount = 0;
  let failCount = 0;

  // 4. Send each message
  for (const item of pendingItems) {
    try {
      const payload = item.payload as any;
      const chatId = payload?.chat_id || payload?.telegram_chat_id;
      const text = payload?.message || payload?.text || payload?.title || 'New notification from The ANTS';

      if (!chatId) {
        throw new Error('No Telegram chat ID provided in payload');
      }

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

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

  return { processed: pendingItems.length, successCount, failCount };
}
