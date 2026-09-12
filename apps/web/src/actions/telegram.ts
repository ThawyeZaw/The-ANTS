'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Telegram Server Actions (D1 / Drizzle)
// Real-time Telegram messaging and notifications pipeline.
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, profiles, timetableEvents, examCountdowns, notificationQueue, notificationPreferences } from '@/lib/db';
import { eq, and, gte, lte, asc } from 'drizzle-orm';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN) {
    console.error('[telegram] TELEGRAM_BOT_TOKEN not configured');
    return null;
  }

  const delays = [1000, 2000, 4000];
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        return data;
      }
      lastError = data;
      console.error(`[telegram] sendMessage attempt ${attempt + 1} failed:`, JSON.stringify(data));
    } catch (err) {
      lastError = err;
      console.error(`[telegram] sendMessage attempt ${attempt + 1} fetch error:`, err);
    }

    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
  }

  // Log final failure to database for administrative auditing
  try {
    const db = getDb();
    const notifPref = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.channels, chatId as any),
    });
    if (notifPref?.user_id) {
      await db.insert(notificationQueue).values({
        user_id: notifPref.user_id,
        channel: 'telegram',
        payload: {
          telegram_chat_id: chatId,
          message: text,
          error_log: JSON.stringify(lastError || 'Max retries exceeded'),
        },
        scheduled_for: new Date(),
        status: 'failed',
        last_error: JSON.stringify(lastError || 'Max retries exceeded'),
      });
    }
  } catch (logErr) {
    console.error('[telegram] Failed to log Telegram failure to notification_queue:', logErr);
  }

  return null;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Welcome Message ──────────────────────────────────────────────────────────

/**
 * Sends a rich welcome message to a Telegram chat after a user links their account.
 */
export async function actionSendWelcomeMessage(telegramChatId: string, userId: string) {
  try {
    const db = getDb();

    // 1. Fetch user profile
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId as any),
    });

    if (!profile) {
      console.error('[telegram] User profile not found for welcome message:', userId);
      return { success: false, error: 'User profile not found' };
    }

    const displayName = profile.name || profile.username || 'there';

    // 2. Fetch upcoming deadlines
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [upcomingEvents, upcomingExams] = await Promise.all([
      db.query.timetableEvents.findMany({
        where: and(
          eq(timetableEvents.user_id, userId),
          gte(timetableEvents.start_time, now),
          lte(timetableEvents.start_time, twoWeeksLater)
        ),
        orderBy: [asc(timetableEvents.start_time)],
        limit: 3,
      }),
      db.query.examCountdowns.findMany({
        where: and(
          eq(examCountdowns.user_id, userId),
          gte(examCountdowns.exam_date, now),
          lte(examCountdowns.exam_date, twoWeeksLater)
        ),
        orderBy: [asc(examCountdowns.exam_date)],
        limit: 3,
      }),
    ]);

    const allDeadlines: string[] = [];

    if (upcomingEvents?.length) {
      for (const ev of upcomingEvents) {
        const d = new Date(ev.start_time);
        const loc = (ev.metadata as any)?.location;
        allDeadlines.push(`📅 ${formatDate(d)} ${formatTime(d)} — ${ev.title}${loc ? ` @ ${loc}` : ''}`);
      }
    }

    if (upcomingExams?.length) {
      for (const e of upcomingExams) {
        const d = new Date(e.exam_date);
        allDeadlines.push(`📝 ${formatDate(d)} — Exam: ${e.title || 'Exam'}`);
      }
    }

    let deadlinesSection = '';
    if (allDeadlines.length > 0) {
      deadlinesSection = `\n\n📌 <b>Your upcoming deadlines</b> (next 2 weeks):\n${allDeadlines.join('\n')}`;
    } else {
      deadlinesSection = '\n\n📌 No upcoming deadlines in the next 2 weeks. Enjoy the calm! 🎉';
    }

    const message =
      `👋 <b>Welcome to The ANTs, ${displayName}!</b>\n\n` +
      `You\'re all set to receive Telegram notifications. Here\'s what you can do:\n\n` +
      `📅 <b>Timetable</b> — Schedule events, set reminders, stay organised\n` +
      `🎯 <b>Exams</b> — Track countdowns, calculate grades, log results\n` +
      `📚 <b>Lessons</b> — Track your confidence topic by topic across the syllabus\n` +
      `🍅 <b>Pomodoro</b> — Focus timers with custom intervals` +
      deadlinesSection +
      `\n\n` +
      `🚀 <b>Getting started</b>:\n` +
      `• Set your curricula in Courses → Enrol\n` +
      `• Create your timetable in Dashboard → Timetable\n` +
      `• Configure alert preferences in Settings → Telegram Alerts\n\n` +
      `Need help? Visit the ANTs dashboard or contact support.`;

    const result = await sendTelegramMessage(telegramChatId, message);

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send welcome message' };
  }
}
