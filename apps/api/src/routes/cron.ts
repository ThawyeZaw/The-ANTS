import { Hono } from 'hono';
import { processNotificationQueue } from '../services/notification-processor';
import { createDb } from '@the-ants/db';

export function createCronRoutes(getDb: () => ReturnType<typeof createDb>) {
  const router = new Hono();

  router.post('/process-queue', async (c) => {
    const cronSecret = c.req.header('x-cron-secret') || c.req.header('authorization')?.replace('Bearer ', '');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return c.json({ error: 'Unauthorized: Invalid cron secret' }, 401);
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    const db = getDb();

    const result = await processNotificationQueue(db, botToken);
    return c.json({ success: true, ...result });
  });

  return router;
}
