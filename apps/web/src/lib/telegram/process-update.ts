import { getDb, profiles, notificationPreferences, notificationQueue } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import {
  isSignedLinkStartArg,
  verifyTelegramLinkStartArg,
} from '@/lib/telegram/link-token';
import {
  buildExamsMessage,
  buildNextMessage,
  buildTodayMessage,
  getProfileUserIdByChatId,
} from '@/lib/telegram/bot-commands';
import {
  examReminderKeyboard,
  TELEGRAM_REMINDER_SNOOZE_MINUTES,
  timetableReminderKeyboard,
} from '@/lib/telegram/reminder-keyboard';
import { actionSendWelcomeMessage } from '@/actions/telegram';

const TELEGRAM_API = (token: string) => `https://api.telegram.org/bot${token}`;

export async function sendTelegramHtml(
  botToken: string,
  chatId: number,
  text: string,
  extra?: { reply_markup?: Record<string, unknown> }
) {
  await fetch(`${TELEGRAM_API(botToken)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...extra,
    }),
  });
}

async function answerCallback(botToken: string, callbackQueryId: string, text: string) {
  await fetch(`${TELEGRAM_API(botToken)}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
  });
}

async function linkTelegramChat(username: string, chatId: number): Promise<{ ok: boolean; userId?: string }> {
  const db = getDb();
  const normalized = username.toLowerCase();
  const user = await db.query.profiles.findFirst({
    where: sql`lower(${profiles.username}) = ${normalized}`,
  });
  if (!user) return { ok: false };

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

  return { ok: true, userId: user.id as string };
}

async function unlinkTelegramChat(chatId: number) {
  const db = getDb();
  const linked = await db.query.notificationPreferences.findFirst({
    where: sql`json_extract(${notificationPreferences.channels}, '$.telegram_chat_id') = ${String(chatId)}`,
  });

  if (linked) {
    await db
      .update(notificationPreferences)
      .set({ telegram_enabled: false, channels: {}, updated_at: new Date() })
      .where(eq(notificationPreferences.user_id, linked.user_id as any));

    await db
      .update(profiles)
      .set({ telegram_chat_id: null, updated_at: new Date() })
      .where(eq(profiles.id, linked.user_id as any));
  }
}

type StartResolve = { username: string } | { error: string };

function resolveStartUsername(arg: string): StartResolve {
  if (isSignedLinkStartArg(arg)) {
    const verified = verifyTelegramLinkStartArg(arg);
    if (!verified.ok) {
      return { error: 'Link expired or invalid — open Settings and tap Link Telegram again.' };
    }
    return { username: verified.username };
  }
  return {
    error: 'Direct username linking is disabled for security. Open Settings → Telegram and tap "Connect Telegram" to link safely.',
  };
}

async function handleSnooze(chatId: number, kind: string, sourceId: string) {
  const userId = await getProfileUserIdByChatId(chatId);
  if (!userId) return;

  const db = getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId as any),
    columns: { telegram_chat_id: true },
  });
  if (!profile?.telegram_chat_id) return;

  const minutes = TELEGRAM_REMINDER_SNOOZE_MINUTES;
  const keyboard =
    kind === 'exam' ? examReminderKeyboard(sourceId) : timetableReminderKeyboard(sourceId);

  await db.insert(notificationQueue).values({
    user_id: userId as any,
    channel: 'telegram',
    payload: {
      chat_id: profile.telegram_chat_id,
      telegram_chat_id: profile.telegram_chat_id,
      message:
        `⏰ <b>Snoozed reminder</b>\n\n` +
        `We will remind you again in <b>${minutes} minutes</b>.`,
      source_type: kind === 'exam' ? 'exam_countdown' : 'timetable_event',
      source_id: sourceId,
      reply_markup: keyboard,
    },
    scheduled_for: new Date(Date.now() + minutes * 60 * 1000),
    status: 'pending',
  });
}

const HELP_TEXT =
  'ℹ️ <b>The ANTs bot</b>\n\n' +
  '<code>/today</code> — today’s timetable\n' +
  '<code>/next</code> — next upcoming events\n' +
  '<code>/exams</code> — exam countdowns\n' +
  '<code>/help</code> — this message\n' +
  '<code>/stop</code> — unlink account';

export async function processTelegramUpdate(botToken: string, body: Record<string, unknown>) {
  const callback = body.callback_query as Record<string, unknown> | undefined;
  if (callback?.id && callback.data) {
    const chatId = (callback.message as any)?.chat?.id as number | undefined;
    const data = String(callback.data);
    if (chatId && data.startsWith('snooze:')) {
      const [, kind, sourceId] = data.split(':');
      if (kind && sourceId) {
        await handleSnooze(chatId, kind, sourceId);
        await answerCallback(botToken, String(callback.id), `Snoozed ${TELEGRAM_REMINDER_SNOOZE_MINUTES}m`);
      }
    }
    return;
  }

  const message = body.message as Record<string, unknown> | undefined;
  if (!message?.text) return;

  const chatId = (message.chat as { id: number }).id;
  const text = String(message.text).trim();

  if (text.startsWith('/start')) {
    const arg = text.split(/\s+/)[1]?.trim();
    if (!arg) {
      await sendTelegramHtml(
        botToken,
        chatId,
        '👋 <b>Welcome to The ANTs Notification Bot!</b>\n\n' +
          'Link your account from <b>Settings → Telegram</b> (secure one-tap link).\n\n' +
          HELP_TEXT
      );
      return;
    }

    const resolved = resolveStartUsername(arg);
    if ('error' in resolved && resolved.error) {
      await sendTelegramHtml(botToken, chatId, `❌ ${resolved.error}`);
      return;
    }
    if (!('username' in resolved)) return;

    const user = await getDb().query.profiles.findFirst({
      where: sql`lower(${profiles.username}) = ${resolved.username.toLowerCase()}`,
    });
    if (!user) {
      await sendTelegramHtml(
        botToken,
        chatId,
        `❌ No account found for <b>@${resolved.username}</b>. Check your username in Settings.`
      );
      return;
    }

    const linked = await linkTelegramChat(resolved.username, chatId);
    if (!linked.ok || !linked.userId) {
      await sendTelegramHtml(botToken, chatId, '❌ Could not link your account. Try again later.');
      return;
    }

    await sendTelegramHtml(
      botToken,
      chatId,
      `✅ <b>Connected!</b> Linked to <b>@${resolved.username}</b>.\n\n` +
        `Timetable + exam reminders will arrive here. Try <code>/today</code> or <code>/help</code>.`
    );
    void actionSendWelcomeMessage(String(chatId), linked.userId);
    return;
  }

  if (text.startsWith('/stop')) {
    await unlinkTelegramChat(chatId);
    await sendTelegramHtml(
      botToken,
      chatId,
      '🛑 <b>Unlinked.</b> Reconnect anytime from Settings → Telegram.'
    );
    return;
  }

  if (text.startsWith('/help')) {
    await sendTelegramHtml(botToken, chatId, HELP_TEXT);
    return;
  }

  if (text.startsWith('/today')) {
    const msg = await buildTodayMessage(chatId);
    await sendTelegramHtml(
      botToken,
      chatId,
      msg ?? '❌ Link your account first via Settings → Telegram.'
    );
    return;
  }

  if (text.startsWith('/next')) {
    const msg = await buildNextMessage(chatId);
    await sendTelegramHtml(
      botToken,
      chatId,
      msg ?? '❌ Link your account first via Settings → Telegram.'
    );
    return;
  }

  if (text.startsWith('/exams')) {
    const msg = await buildExamsMessage(chatId);
    await sendTelegramHtml(
      botToken,
      chatId,
      msg ?? '❌ Link your account first via Settings → Telegram.'
    );
    return;
  }

  await sendTelegramHtml(botToken, chatId, `❓ Unknown command.\n\n${HELP_TEXT}`);
}
