// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Telegram Webhook Handler (D1 / Drizzle)
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { processTelegramUpdate } from '@/lib/telegram/process-update';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function GET(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'status';

  try {
    if (action === 'set') {
      // Guard webhook management with the cron secret — otherwise anyone
      // could repoint or delete the bot's webhook.
      if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const webhookUrl = searchParams.get('url') ?? `${req.nextUrl.origin}/api/telegram/webhook`;
      const setRes = await fetch(`${TELEGRAM_API}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: CRON_SECRET,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: false,
        }),
      });
      const setData = await setRes.json();
      return NextResponse.json({ action: 'setWebhook', url: webhookUrl, result: setData });
    }

    if (action === 'delete') {
      if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const delRes = await fetch(`${TELEGRAM_API}/deleteWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drop_pending_updates: false }),
      });
      const delData = await delRes.json();
      return NextResponse.json({ action: 'deleteWebhook', result: delData });
    }

    if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const infoRes = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const infoData = await infoRes.json();
    return NextResponse.json({
      action: 'status',
      botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? '(not set)',
      expectedUrl: `${req.nextUrl.origin}/api/telegram/webhook`,
      webhookInfo: infoData,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'Telegram bot token not configured' }, { status: 500 });
  }

  // Telegram sends our secret_token back as a header on every update —
  // fail-closed: reject anything that isn't a genuine Telegram delivery with secret token.
  if (!CRON_SECRET || req.headers.get('x-telegram-bot-api-secret-token') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    await processTelegramUpdate(BOT_TOKEN, body);
  } catch (err) {
    console.error('[telegram] webhook process error:', err);
  }

  return NextResponse.json({ ok: true });
}
