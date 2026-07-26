// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Telegram Webhook Setup (one-time)
//
// GET /api/telegram/setup  — Registers the webhook URL with Telegram.
//                             Visit this once after deploying to production.
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

  // First, check current webhook status
  const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const info = await infoRes.json();

  // Register the webhook
  const setRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
  );
  const setResult = await setRes.json();

  return NextResponse.json({
    webhook_url: webhookUrl,
    previous: info?.result ?? null,
    result: setResult,
  });
}
