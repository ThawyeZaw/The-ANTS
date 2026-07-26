// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Telegram Webhook Setup (one-time)
//
// GET /api/telegram/setup  — Deletes any existing webhook, then registers a
//                             clean one. Visit once after deploying.
//
// Protected by CRON_SECRET to prevent abuse.
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }

  // Derive the base URL from the request
  const url = new URL(req.url);
  const webhookUrl = `${url.protocol}//${url.host}/api/telegram/webhook`;

  // 1. Check current webhook status
  const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const info = await infoRes.json();

  // 2. Delete any existing webhook
  const deleteRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
  const deleteResult = await deleteRes.json();

  // 3. Register the clean webhook (with drop_pending_updates to clear stale queue)
  const setRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
  );
  const setResult = await setRes.json();

  return NextResponse.json({
    webhook_url: webhookUrl,
    previous: info?.result ?? null,
    delete: deleteResult,
    result: setResult,
  });
}
