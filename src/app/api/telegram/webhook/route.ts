// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Telegram Webhook Handler
// Receives updates from Telegram (messages sent to @TheANTS_bot).
//
// Supported commands:
//   /start <username>  — Link a Telegram chat to a user profile.
//   /stop              — Unlink the chat from the user profile.
//
// GET  /api/telegram/webhook  — Set up or check webhook registration
// POST /api/telegram/webhook  — Handle incoming Telegram updates
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ── Helpers ────────────────────────────────────────────────────────────────────

async function sendMessage(chatId: number, text: string) {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error('[telegram] sendMessage failed:', JSON.stringify(data));
    }
    return data;
  } catch (err) {
    console.error('[telegram] sendMessage fetch error:', err);
  }
}

async function getUserByUsername(username: string) {
  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase
    .from('profiles')
    .select('id, username, telegram_chat_id, role')
    .eq('username', username)
    .maybeSingle() as any);
  return data as { id: string; username: string; telegram_chat_id: string | null; role: string } | null;
}

async function linkTelegramChat(username: string, chatId: number) {
  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from('profiles')
    .update({
      telegram_chat_id: String(chatId),
      notification_preferences: {
        timetable:   { enabled: true, reminders: [0, 10, 30, 60, 1440, 4320, 10080] },
        assignments: { enabled: true, reminders: [60, 1440, 4320, 10080] },
        exams:       { enabled: true, reminders: [1440, 4320, 10080] },
        quizzes:     { enabled: true, reminders: [60, 1440] },
      },
    } as any)
    .eq('username', username));

  return !error;
}

async function unlinkTelegramChat(chatId: number) {
  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await ((supabase
    .from('profiles') as any)
    .update({ telegram_chat_id: null })
    .eq('telegram_chat_id', String(chatId)));

  return !error;
}

// ── GET: Webhook Setup / Status ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'status';
  const cronSecret = process.env.CRON_SECRET;

  try {
    if (action === 'set' || action === 'delete') {
      const secretHeader = req.headers.get('x-cron-secret') || searchParams.get('secret');
      if (cronSecret && secretHeader !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized: Secret key mismatch' }, { status: 401 });
      }
    }

    if (action === 'set') {
      // Register the webhook
      const webhookUrl = searchParams.get('url') ?? `${req.nextUrl.origin}/api/telegram/webhook`;
      const setRes = await fetch(`${TELEGRAM_API}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message'],
          drop_pending_updates: false,
        }),
      });
      const setData = await setRes.json();
      return NextResponse.json({
        action: 'setWebhook',
        url: webhookUrl,
        result: setData,
      });
    }

    if (action === 'delete') {
      const delRes = await fetch(`${TELEGRAM_API}/deleteWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drop_pending_updates: false }),
      });
      const delData = await delRes.json();
      return NextResponse.json({ action: 'deleteWebhook', result: delData });
    }

    // Default: check webhook status
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

// ── POST: Handle Incoming Messages ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'Telegram bot token not configured' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[telegram] webhook received:', JSON.stringify(body).slice(0, 500));

  // Extract message fields
  const message = body.message as Record<string, unknown> | undefined;
  if (!message?.text || !message?.chat) {
    // Could be a non-text update (e.g., /start without params, sticker, etc.)
    // Still acknowledge so Telegram doesn't retry
    return NextResponse.json({ ok: true });
  }

  const text = (message.text as string).trim();
  const chat = message.chat as Record<string, unknown>;
  const chatId = chat.id as number;

  console.log(`[telegram] message from chat ${chatId}: "${text}"`);

  // ── /start <username> ──
  if (text.startsWith('/start')) {
    const param = text.replace('/start', '').trim();

    if (!param) {
      await sendMessage(
        chatId,
        '👋 <b>Welcome to The ANTs Bot!</b>\n\n' +
          'Link your ANTs account:\n<code>/start your_username</code>\n\n' +
          'Commands:\n/start &lt;username&gt; — Link account\n/stop — Unlink account'
      );
      return NextResponse.json({ ok: true });
    }

    const user = await getUserByUsername(param);

    if (!user) {
      await sendMessage(chatId, `❌ User <b>@${param}</b> not found.\n\nMake sure:\n• Your username is correct\n• You have set a username in Settings → Profile`);
      return NextResponse.json({ ok: true });
    }

    if (user.telegram_chat_id) {
      await sendMessage(
        chatId,
        `⚠️ <b>@${param}</b> is already linked to another Telegram chat.\n\nSend /stop from the old chat first, or contact support.`
      );
      return NextResponse.json({ ok: true });
    }

    const linked = await linkTelegramChat(param, chatId);

    if (linked) {
      await sendMessage(
        chatId,
        `✅ <b>Linked!</b> Welcome, @${param}.\n\n` +
          'You\'ll now receive alerts here for:\n' +
          '• Timetable events\n' +
          '• Assignment deadlines\n' +
          '• Exam countdowns\n' +
          '• Quiz due dates\n\n' +
          'Configure what you want in Settings → Telegram Alerts.\n\n' +
          'Send /stop anytime to unlink.'
      );
    } else {
      await sendMessage(chatId, '❌ Linking failed. Please try again later or contact support.');
    }

    return NextResponse.json({ ok: true });
  }

  // ── /stop ──
  if (text === '/stop') {
    const unlinked = await unlinkTelegramChat(chatId);

    if (unlinked) {
      await sendMessage(
        chatId,
        '👋 <b>Unlinked.</b>\n\nYou\'ll no longer receive alerts here.\n\nRe-link anytime with /start your_username.'
      );
    } else {
      await sendMessage(chatId, '❌ This chat wasn\'t linked to any ANTs account.');
    }

    return NextResponse.json({ ok: true });
  }

  // ── Unknown / non-command text ──
  await sendMessage(
    chatId,
    'This bot sends notifications from <b>The ANTs</b>.\n\n' +
      'To link your account:\n<code>/start your_username</code>\n\n' +
      'Commands:\n/start — Link account\n/stop — Unlink'
  );

  return NextResponse.json({ ok: true });
}
