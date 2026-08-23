// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Notification Queue Processor (Cron Endpoint) (Neon Drizzle DB)
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import {
  processNotificationQueue,
  type ProcessQueueResult,
} from '@/lib/notification-processor';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 25;

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');

  if (!CRON_SECRET || secret !== CRON_SECRET) {
    console.warn('[process-notifications] Unauthorized request — x-cron-secret mismatch');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!BOT_TOKEN) {
    console.error('[process-notifications] TELEGRAM_BOT_TOKEN not configured');
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }

  const now = new Date().toISOString();

  let result: ProcessQueueResult;
  try {
    result = await processNotificationQueue(null as any, { limit: BATCH_SIZE });
  } catch (err) {
    console.error('[process-notifications] Processing error:', err);
    return NextResponse.json(
      { error: 'Failed to process queue', detail: String(err) },
      { status: 500 }
    );
  }

  console.log(
    `[process-notifications] Batch complete: ${result.sent} sent, ${result.failed} failed, ${result.recovered} recovered (of ${result.claimed} claimed)`
  );

  return NextResponse.json({
    processed: result.claimed,
    sent: result.sent,
    failed: result.failed,
    recovered: result.recovered,
    timestamp: now,
  });
}
