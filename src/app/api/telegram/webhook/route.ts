// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Telegram Webhook Handler
// Receives updates from Telegram (messages sent to @TheANTS_bot).
//
// Supported commands:
//   /start <username>  — Link a Telegram chat to a user profile.
//   /stop              — Unlink the chat from the user profile.
//
// NOTE: telegram_chat_id was added via migration after auto-generated Supabase
// types were created. `as any` casts are used where needed.
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ── Helpers ────────────────────────────────────────────────────────────────────

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
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

// ── POST Handler ───────────────────────────────────────────────────────────────

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

  // Extract message fields
  const message = body.message as Record<string, unknown> | undefined;
  if (!message?.text || !message?.chat) {
    return NextResponse.json({ ok: true });
  }

  const text = (message.text as string).trim();
  const chat = message.chat as Record<string, unknown>;
  const chatId = chat.id as number;

  // ── /start <username> ──
  if (text.startsWith('/start')) {
    const param = text.replace('/start', '').trim();

    if (!param) {
      await sendMessage(
        chatId,
        '👋 <b>Welcome to The ANTs Bot!</b>\n\n' +
          'Link your account:\n<code>/start your_username</code>\n\n' +
          'Commands:\n/start &lt;username&gt; — Link account\n/stop — Unlink account'
      );
      return NextResponse.json({ ok: true });
    }

    const user = await getUserByUsername(param);

    if (!user) {
      await sendMessage(chatId, `❌ User <b>@${param}</b> not found.\nCheck your username and try again.`);
      return NextResponse.json({ ok: true });
    }

    if (user.telegram_chat_id) {
      await sendMessage(
        chatId,
        `⚠️ <b>@${param}</b> is already linked.\nSend /stop from the old chat first.`
      );
      return NextResponse.json({ ok: true });
    }

    const linked = await linkTelegramChat(param, chatId);

    if (linked) {
      await sendMessage(
        chatId,
        '✅ Linked! You\'ll now receive alerts here.\n\n' +
          'Configure what you want in Settings → Telegram Alerts.\n/stop to unlink.'
      );
    } else {
      await sendMessage(chatId, '❌ Linking failed. Try again later.');
    }

    return NextResponse.json({ ok: true });
  }

  // ── /stop ──
  if (text === '/stop') {
    const unlinked = await unlinkTelegramChat(chatId);

    if (unlinked) {
      await sendMessage(
        chatId,
        '👋 Unlinked. You\'ll no longer receive alerts here.\n\n' +
          'Re-link anytime with /start your_username.'
      );
    } else {
      await sendMessage(chatId, '❌ This chat wasn\'t linked to any account.');
    }

    return NextResponse.json({ ok: true });
  }

  // ── Unknown / non-command text ──
  await sendMessage(
    chatId,
    'This bot only sends notifications from the-ants.org.\n\n' +
      'To link your account:\n<code>/start your_username</code>\n\n' +
      'Commands:\n/start — Link account\n/stop — Unlink'
  );

  return NextResponse.json({ ok: true });
}
