// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — QStash-Triggered Queue Processor (Neon Drizzle DB)
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { scheduleQStashMessage } from '@/lib/qstash';
import {
  processNotificationQueue,
  type ProcessQueueResult,
} from '@/lib/notification-processor';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 30;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  const secret = req.headers.get('x-cron-secret');
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    console.warn('[qstash-process] Unauthorized request — x-cron-secret mismatch');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!BOT_TOKEN) {
    console.error('[qstash-process] TELEGRAM_BOT_TOKEN not configured');
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }

  const now = new Date().toISOString();

  let result: ProcessQueueResult;
  try {
    result = await processNotificationQueue(null as any, { limit: BATCH_SIZE });
  } catch (err) {
    console.error('[qstash-process] Processing error:', err);
    return NextResponse.json(
      { error: 'Failed to process queue', detail: String(err) },
      { status: 500 }
    );
  }

  const elapsed = Date.now() - startTime;
  return NextResponse.json({
    processed: result.claimed,
    sent: result.sent,
    failed: result.failed,
    recovered: result.recovered,
    chained: false,
    elapsed_ms: elapsed,
    timestamp: now,
  });
}
