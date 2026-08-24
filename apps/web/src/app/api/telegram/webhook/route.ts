// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Telegram Webhook Handler (Neon Drizzle DB)
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { getDb, profiles, notificationPreferences } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

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
  try {
    const db = getDb();
    const user = await db.query.profiles.findFirst({
      where: eq(profiles.username, username),
    });
    return user ? { id: user.id, username: user.username, role: user.role } : null;
  } catch {
    return null;
  }
}

async function linkTelegramChat(username: string, chatId: number) {
  try {
    const db = getDb();
    const user = await db.query.profiles.findFirst({
      where: eq(profiles.username, username),
    });
    if (!user) return false;

    // Primary linkage: profiles.telegram_chat_id is what the notification
    // enqueue pipeline reads. Keep notification_preferences in sync too so
    // the settings UI and telegram_enabled flag stay accurate.
    await db
      .update(profiles)
      .set({ telegram_chat_id: String(chatId), updated_at: new Date() })
      .where(eq(profiles.id, user.id as any));

    const existing = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.user_id, user.id as any),
    });

    if (existing) {
      await db
        .update(notificationPreferences)
        .set({
          telegram_enabled: true,
          channels: { telegram_chat_id: String(chatId) },
          updated_at: new Date(),
        })
        .where(eq(notificationPreferences.user_id, user.id as any));
    } else {
      await db.insert(notificationPreferences).values({
        user_id: user.id as any,
        telegram_enabled: true,
        channels: { telegram_chat_id: String(chatId) },
      });
    }
    return true;
  } catch {
    return false;
  }
}

async function unlinkTelegramChat(chatId: number) {
  try {
    const db = getDb();
    const linked = await db.query.notificationPreferences.findFirst({
      where: sql`${notificationPreferences.channels}->>'telegram_chat_id' = ${String(chatId)}`,
    });

    if (linked) {
      await db
        .update(notificationPreferences)
        .set({
          telegram_enabled: false,
          channels: {},
          updated_at: new Date(),
        })
        .where(eq(notificationPreferences.user_id, linked.user_id as any));

      await db
        .update(profiles)
        .set({ telegram_chat_id: null, updated_at: new Date() })
        .where(eq(profiles.id, linked.user_id as any));
    }
    return true;
  } catch {
    return false;
  }
}

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
          allowed_updates: ['message'],
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
  // reject anything that isn't a genuine Telegram delivery.
  if (CRON_SECRET && req.headers.get('x-telegram-bot-api-secret-token') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const message = body.message;
  if (!message || !message.text) {
    return NextResponse.json({ ok: true });
  }

  const chatId: number = message.chat.id;
  const text: string = message.text.trim();

  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    const usernameArg = parts[1]?.trim();

    if (!usernameArg) {
      await sendMessage(
        chatId,
        '👋 <b>Welcome to The ANTs Notification Bot!</b>\n\n' +
          'To link your account, go to <b>The ANTs Settings → Notification Settings</b> and click "Link Telegram", or type:\n\n' +
          '<code>/start &lt;your_username&gt;</code>'
      );
      return NextResponse.json({ ok: true });
    }

    const user = await getUserByUsername(usernameArg);
    if (!user) {
      await sendMessage(
        chatId,
        `❌ No account found for username <b>@${usernameArg}</b>.\n\nPlease check your username in The ANTs profile settings.`
      );
      return NextResponse.json({ ok: true });
    }

    const success = await linkTelegramChat(usernameArg, chatId);
    if (success) {
      await sendMessage(
        chatId,
        `✅ <b>Connected successfully!</b>\n\nYour Telegram account is now linked to <b>@${usernameArg}</b>.\n\nYou will receive timely reminders for timetable events and exam countdowns.`
      );
    } else {
      await sendMessage(chatId, '❌ An error occurred while linking your account. Please try again later.');
    }

    return NextResponse.json({ ok: true });
  }

  if (text.startsWith('/stop')) {
    await unlinkTelegramChat(chatId);
    await sendMessage(
      chatId,
      '🛑 <b>Notifications paused.</b>\n\nYour Telegram chat has been unlinked from The ANTs.\n\nTo reconnect anytime, visit your Settings page.'
    );
    return NextResponse.json({ ok: true });
  }

  await sendMessage(
    chatId,
    '❓ <b>Unknown command</b>\n\nAvailable commands:\n• <code>/start &lt;username&gt;</code> — Link account\n• <code>/stop</code> — Unlink account'
  );

  return NextResponse.json({ ok: true });
}
