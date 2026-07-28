'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Telegram Server Actions
//
// These server actions interact directly with the Telegram Bot API to send
// real-time messages to users (not via the notification_queue cron pipeline).
// ──────────────────────────────────────────────────────────────────────────────

import { createAdminClient } from '@/lib/supabase/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN) {
    console.error('[telegram] TELEGRAM_BOT_TOKEN not configured');
    return null;
  }

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
    return null;
  }
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
 * Sends a rich welcome message to a Telegram chat after a user links their
 * account. Includes personalised greeting, feature highlights, upcoming
 * deadlines summary, and getting-started instructions.
 */
export async function actionSendWelcomeMessage(telegramChatId: string, userId: string) {
  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // ── 1. Fetch user profile ────────────────────────────────────────────────
  const { data: profile } = await db
    .from('profiles')
    .select('id, name, username')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    console.error('[telegram] User profile not found for welcome message:', userId);
    return { success: false, error: 'User profile not found' };
  }

  const displayName = profile.name || profile.username || 'there';

  // ── 2. Fetch upcoming deadlines ──────────────────────────────────────────
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Upcoming timetable events
  const { data: upcomingEvents } = await db
    .from('timetable_events')
    .select('title, start_time, location')
    .eq('user_id', userId)
    .gte('start_time', now.toISOString())
    .lte('start_time', twoWeeksLater.toISOString())
    .order('start_time', { ascending: true })
    .limit(3);

  // Upcoming assignments
  const { data: upcomingAssignments } = await db
    .from('assignments')
    .select('title, due_date')
    .gte('due_date', now.toISOString())
    .lte('due_date', twoWeeksLater.toISOString())
    .order('due_date', { ascending: true })
    .limit(3);

  // Upcoming exam countdowns
  const { data: upcomingExams } = await db
    .from('exam_countdowns')
    .select('custom_title, target_date')
    .eq('user_id', userId)
    .gte('target_date', now.toISOString())
    .lte('target_date', twoWeeksLater.toISOString())
    .order('target_date', { ascending: true })
    .limit(3);

  // Upcoming quizzes
  const { data: upcomingQuizzes } = await db
    .from('quizzes')
    .select('title, due_date')
    .gte('due_date', now.toISOString())
    .lte('due_date', twoWeeksLater.toISOString())
    .order('due_date', { ascending: true })
    .limit(3);

  // ── 3. Build the welcome message ─────────────────────────────────────────
  let deadlinesSection = '';

  const allDeadlines: string[] = [];

  if (upcomingEvents?.length) {
    for (const ev of upcomingEvents) {
      const d = new Date(ev.start_time);
      allDeadlines.push(`📅 ${formatDate(d)} ${formatTime(d)} — ${ev.title}${ev.location ? ` @ ${ev.location}` : ''}`);
    }
  }

  if (upcomingAssignments?.length) {
    for (const a of upcomingAssignments) {
      const d = new Date(a.due_date);
      allDeadlines.push(`📋 ${formatDate(d)} — Assignment: ${a.title}`);
    }
  }

  if (upcomingExams?.length) {
    for (const e of upcomingExams) {
      const d = new Date(e.target_date);
      allDeadlines.push(`📝 ${formatDate(d)} — Exam: ${e.custom_title || 'Exam'}`);
    }
  }

  if (upcomingQuizzes?.length) {
    for (const q of upcomingQuizzes) {
      const d = new Date(q.due_date);
      allDeadlines.push(`📝 ${formatDate(d)} — Quiz: ${q.title}`);
    }
  }

  if (allDeadlines.length > 0) {
    deadlinesSection = `\n\n📌 <b>Your upcoming deadlines</b> (next 2 weeks):\n${allDeadlines.join('\n')}`;
  } else {
    deadlinesSection = '\n\n📌 No upcoming deadlines in the next 2 weeks. Enjoy the calm! 🎉';
  }

  const message =
    `👋 <b>Welcome to The ANTs, ${displayName}!</b>\n\n` +
    `You\'re all set to receive Telegram notifications. Here\'s what you can do:\n\n` +
    `🏛️ <b>Clubs</b> — Join subject-based clubs, collaborate on projects, chat with peers\n` +
    `🏫 <b>Classrooms</b> — Access virtual classrooms, assignments, and resources\n` +
    `🃏 <b>Flashcards</b> — Create decks, study with spaced repetition (SM-2)\n` +
    `📝 <b>Notes</b> — Write rich notes with LaTeX, diagrams, and animations\n` +
    `📅 <b>Timetable</b> — Schedule events, set reminders, stay organised\n` +
    `🎯 <b>Exams</b> — Track countdowns, calculate grades, log results\n` +
    `🍅 <b>Pomodoro</b> — Focus timers with custom intervals` +
    deadlinesSection +
    `\n\n` +
    `🚀 <b>Getting started</b>:\n` +
    `• Set your curricula in Courses → Enrol\n` +
    `• Create your timetable in Dashboard → Timetable\n` +
    `• Explore clubs at /explore/clubs\n` +
    `• Configure alert preferences in Settings → Telegram Alerts\n\n` +
    `Need help? Visit the ANTs dashboard or contact support.`;

  const result = await sendTelegramMessage(telegramChatId, message);

  return { success: true, data: result };
}
