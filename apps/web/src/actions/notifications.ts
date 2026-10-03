'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Notification Enqueue Server Actions (D1 / Drizzle)
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, notificationQueue, profiles, timetableEvents, examCountdowns } from '@/lib/db';
import { eq, and, sql, gte, lte, asc } from 'drizzle-orm';
import { expandRecurringEvents } from '@/lib/timetable/recurrence';
import type { TimetableEvent } from '@/types/timetable';
import {
  examReminderKeyboard,
  timetableReminderKeyboard,
} from '@/lib/telegram/reminder-keyboard';
import { requireSessionUser, getSessionUser } from '@/lib/auth-session';

// ── Types ─────────────────────────────────────────────────────────────────────

interface QueueItem {
  telegram_chat_id: string;
  message_text: string;
  scheduled_for: string; // ISO timestamp
  source_type: 'timetable_event' | 'assignment' | 'exam_countdown' | 'quiz' | 'role_upgrade' | 'daily_reminder';
  source_id: string;
  user_id: string;
  reply_markup?: Record<string, unknown>;
}

interface NotificationPrefs {
  timetable?:   { enabled?: boolean; reminders?: number[] };
  exams?:       { enabled?: boolean; reminders?: number[] };
}

const OVERDUE_ENQUEUE_GRACE_MS = 5_000;

function formatTime(date: Date, timeZone?: string): { timeStr: string; dateStr: string } {
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: '2-digit', minute: '2-digit', hour12: true,
    ...(timeZone ? { timeZone } : {}),
  };
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: 'short', month: 'short', day: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  };
  return {
    timeStr: date.toLocaleTimeString('en-US', timeOpts),
    dateStr: date.toLocaleDateString('en-US', dateOpts),
  };
}

function offsetLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hour${minutes >= 120 ? 's' : ''}`;
  return `${Math.round(minutes / 1440)} day${minutes >= 2880 ? 's' : ''}`;
}

async function getProfileForUser(userId: string) {
  const db = getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId as any),
  });

  if (!profile) return null;

  return {
    id: profile.id,
    telegram_chat_id: (profile as any).telegram_chat_id ?? null,
    timezone: profile.timezone ?? 'UTC',
    notification_preferences: (profile as any).notification_preferences ?? null,
  };
}

async function upsertQueueItems(
  sourceType: QueueItem['source_type'],
  sourceId: string,
  items: QueueItem[]
): Promise<void> {
  if (items.length === 0) return;

  const db = getDb();

  // Delete existing pending items for this source (payload.source_id match)
  await db
    .delete(notificationQueue)
    .where(
      and(
        eq(notificationQueue.status, 'pending'),
        sql`json_extract(${notificationQueue.payload}, '$.source_id') = ${sourceId}`
      )
    );

  // Batch insert
  for (const item of items) {
    await db.insert(notificationQueue).values({
      user_id: item.user_id,
      channel: 'telegram',
      payload: {
        chat_id: item.telegram_chat_id,
        telegram_chat_id: item.telegram_chat_id,
        message: item.message_text,
        source_type: item.source_type,
        source_id: item.source_id,
        ...(item.reply_markup ? { reply_markup: item.reply_markup } : {}),
      },
      scheduled_for: new Date(item.scheduled_for),
      status: 'pending',
    });
  }
}

/** In local dev, nudge the Worker cron HTTP endpoint. Production relies on Worker cron. */
async function nudgeWorkerQueueProcessor(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') return;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8787';
  try {
    const res = await fetch(`${apiUrl}/api/cron/process-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET ?? '',
      },
    });
    if (!res.ok) {
      console.warn(`[notifications] Worker queue nudge returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('[notifications] Worker queue nudge failed:', err);
  }
}

// ── Enqueue: Timetable Reminders ─────────────────────────────────────────────

function resolveTimetableReminderOffsets(
  event: TimetableEvent,
  prefs: NotificationPrefs['timetable']
): number[] | null {
  // Per-event: -1 = off; number (incl. 0) = override; null/undefined = settings default.
  const fromEvent =
    typeof (event as { reminder_minutes?: number | null }).reminder_minutes === 'number'
      ? (event as { reminder_minutes: number }).reminder_minutes
      : typeof event.metadata?.reminder_minutes === 'number'
        ? (event.metadata.reminder_minutes as number)
        : null;

  if (fromEvent === -1) return null;
  if (typeof fromEvent === 'number' && fromEvent >= 0) return [fromEvent];

  if (prefs && prefs.enabled === false) return null;
  if (prefs?.reminders && prefs.reminders.length > 0) return prefs.reminders;
  return [15];
}

export async function actionEnqueueTimetableReminders(
  event: TimetableEvent,
  userId: string
): Promise<void> {
  const guard = await requireSessionUser(userId);
  if (!guard.ok) return;

  const profile = await getProfileForUser(userId);
  if (!profile?.telegram_chat_id) return;

  const prefs = profile.notification_preferences?.timetable;
  const reminderMinutes = resolveTimetableReminderOffsets(event, prefs);
  if (!reminderMinutes || reminderMinutes.length === 0) {
    await actionClearSourceQueue('timetable_event', event.id);
    return;
  }

  const now = Date.now();
  const queueItems: QueueItem[] = [];
  const baseId = event.id.includes('::') ? event.id.split('::')[0] : event.id;

  const timeInstances: Date[] = [];
  if (event.is_recurring && event.recurrence_rule) {
    // 14-day horizon keeps queue small while covering two cron weeks of repeats.
    const horizonEnd = new Date(now + 14 * 24 * 60 * 60 * 1000);
    const expanded = expandRecurringEvents(
      event,
      new Date(now),
      horizonEnd
    );
    for (const exp of expanded) {
      if (exp.start_time) {
        timeInstances.push(new Date(exp.start_time));
      }
    }
  } else if (event.start_time) {
    timeInstances.push(new Date(event.start_time));
  }

  for (const startTime of timeInstances) {
    for (const offsetMin of reminderMinutes) {
      const scheduledMs = startTime.getTime() - offsetMin * 60 * 1000;
      if (scheduledMs < now - OVERDUE_ENQUEUE_GRACE_MS) continue;

      const { timeStr, dateStr } = formatTime(startTime, profile.timezone ?? undefined);
      const isDueNow = offsetMin === 0;
      const timingLabel = isDueNow ? 'is starting NOW' : `starts in ${offsetLabel(offsetMin)}`;
      const locationText = event.location ? `\n📍 <i>${event.location}</i>` : '';

      const text =
        `⏰ <b>TIMETABLE REMINDER</b>\n\n` +
        `<b>${event.title}</b> ${timingLabel}!\n` +
        `📅 ${dateStr} at ${timeStr}${locationText}`;

      queueItems.push({
        telegram_chat_id: profile.telegram_chat_id,
        message_text: text,
        scheduled_for: new Date(scheduledMs).toISOString(),
        source_type: 'timetable_event',
        source_id: baseId,
        user_id: userId,
        reply_markup: timetableReminderKeyboard(baseId),
      });
    }
  }

  if (queueItems.length === 0) {
    await actionClearSourceQueue('timetable_event', baseId);
    return;
  }

  await upsertQueueItems('timetable_event', baseId, queueItems);
  await nudgeWorkerQueueProcessor();
}

// ── Enqueue: Exam Countdown Reminders ────────────────────────────────────────

export async function actionEnqueueExamCountdownReminders(
  examCountdownId: string,
  userId: string,
  examTitle: string,
  examDate: Date,
  isMock = false
): Promise<void> {
  const guard = await requireSessionUser(userId);
  if (!guard.ok) return;

  const profile = await getProfileForUser(userId);
  if (!profile?.telegram_chat_id) return;

  const prefs = profile.notification_preferences?.exams;
  if (prefs && prefs.enabled === false) return;

  const reminderMinutes: number[] =
    (prefs?.reminders && prefs.reminders.length > 0)
      ? prefs.reminders
      : [1440, 60];

  const now = Date.now();
  const queueItems: QueueItem[] = [];
  const prefix = isMock ? '📝 <b>MOCK EXAM ALERT</b>' : '🎯 <b>EXAM COUNTDOWN ALERT</b>';

  for (const offsetMin of reminderMinutes) {
    const scheduledMs = examDate.getTime() - offsetMin * 60 * 1000;
    if (scheduledMs < now - OVERDUE_ENQUEUE_GRACE_MS) continue;

    const { timeStr, dateStr } = formatTime(examDate, profile.timezone ?? undefined);
    const text =
      `${prefix}\n\n` +
      `<b>${examTitle}</b> is in <b>${offsetLabel(offsetMin)}</b>!\n` +
      `📅 ${dateStr} at ${timeStr}\n\n` +
      `<i>Stay focused and get everything prepared! You've got this.</i> 🌟`;

    queueItems.push({
      telegram_chat_id: profile.telegram_chat_id,
      message_text: text,
      scheduled_for: new Date(scheduledMs).toISOString(),
      source_type: 'exam_countdown',
      source_id: examCountdownId,
      user_id: userId,
      reply_markup: examReminderKeyboard(examCountdownId),
    });
  }

  await upsertQueueItems('exam_countdown', examCountdownId, queueItems);
  await nudgeWorkerQueueProcessor();
  void actionEnqueueDailyStudyReminders(userId);
}

export const actionEnqueueExamReminders = actionEnqueueExamCountdownReminders;

// ── Enqueue: Daily Study Reminders (8:30 AM & 9:00 PM) ─────────────────────────

function getNextDailyReminderUtc(
  targetHour: number,
  targetMinute: number,
  timeZone = 'Asia/Yangon'
): Date {
  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const partMap: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      partMap[p.type] = parseInt(p.value, 10);
    }
  }

  const tzYear = partMap.year;
  const tzMonth = partMap.month;
  const tzDay = partMap.day;
  const tzHour = partMap.hour === 24 ? 0 : partMap.hour;
  const tzMinute = partMap.minute;

  const isPast = tzHour > targetHour || (tzHour === targetHour && tzMinute >= targetMinute);
  const targetDay = tzDay + (isPast ? 1 : 0);

  const targetDateLocal = new Date(Date.UTC(tzYear, tzMonth - 1, targetDay, targetHour, targetMinute, 0));

  const targetParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(targetDateLocal);

  const tMap: Record<string, number> = {};
  for (const p of targetParts) {
    if (p.type !== 'literal') tMap[p.type] = parseInt(p.value, 10);
  }
  const formattedHour = tMap.hour === 24 ? 0 : tMap.hour;
  const diffMinutes = (formattedHour * 60 + (tMap.minute || 0)) - (targetHour * 60 + targetMinute);

  return new Date(targetDateLocal.getTime() - diffMinutes * 60 * 1000);
}

const WEB_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://the-ants.org';

export async function actionEnqueueDailyStudyReminders(userId: string): Promise<void> {
  const profile = await getProfileForUser(userId);
  if (!profile?.telegram_chat_id) return;

  const tz = profile.timezone || 'Asia/Yangon';
  const db = getDb();

  const now = new Date();
  const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const [upcomingEvents, nextExam] = await Promise.all([
    db.query.timetableEvents.findMany({
      where: and(
        eq(timetableEvents.user_id, userId),
        gte(timetableEvents.start_time, now),
        lte(timetableEvents.start_time, next48h)
      ),
      orderBy: [asc(timetableEvents.start_time)],
      limit: 6,
    }),
    db.query.examCountdowns.findFirst({
      where: and(
        eq(examCountdowns.user_id, userId),
        gte(examCountdowns.exam_date, now)
      ),
      orderBy: [asc(examCountdowns.exam_date)],
    }),
  ]);

  const nextMorningUtc = getNextDailyReminderUtc(8, 30, tz);
  const nextEveningUtc = getNextDailyReminderUtc(21, 0, tz);

  // 1. Build Morning Briefing Message (8:30 AM)
  let morningExamLine = '';
  if (nextExam) {
    const days = Math.max(0, Math.ceil((new Date(nextExam.exam_date as any).getTime() - now.getTime()) / 86400000));
    morningExamLine = `\n🎯 <b>Upcoming Exam:</b> ${nextExam.title || 'Exam'} in <b>${days} day${days === 1 ? '' : 's'}</b>\n`;
  }

  const morningEventsList = upcomingEvents.length > 0
    ? upcomingEvents.slice(0, 3).map((e) => {
        const st = new Date(e.start_time);
        const { timeStr } = formatTime(st, tz);
        return `• <b>${timeStr}</b> — ${e.title}`;
      }).join('\n')
    : '• No events scheduled on your timetable today. Add a study block!';

  const morningMessage =
    `🌅 <b>DAILY STUDY BRIEFING (8:30 AM)</b>\n\n` +
    `Good morning! Here is your study plan for today:\n\n` +
    `${morningEventsList}\n` +
    morningExamLine +
    `\n<i>"Small daily improvements over time lead to stunning results."</i> 🌟`;

  const morningKeyboard = {
    inline_keyboard: [
      [
        { text: '📅 Timetable', url: `${WEB_ORIGIN}/timetable` },
        { text: '🍅 Focus Timer', url: `${WEB_ORIGIN}/pomodoro` },
      ],
    ],
  };

  // 2. Build Evening Recap Message (9:00 PM)
  const eveningMessage =
    `🌙 <b>EVENING STUDY CHECK-IN (9:00 PM)</b>\n\n` +
    `Time to wind down! Review your completed tasks and set up for tomorrow.\n\n` +
    `💡 <i>Tip: Taking 5 minutes to plan tomorrow night reduces morning friction.</i>\n\n` +
    `Rest well tonight! ✨`;

  const eveningKeyboard = {
    inline_keyboard: [
      [
        { text: '🚀 Plan Tomorrow', url: `${WEB_ORIGIN}/timetable` },
        { text: '📊 Dashboard', url: `${WEB_ORIGIN}/student` },
      ],
    ],
  };

  const items: QueueItem[] = [
    {
      telegram_chat_id: profile.telegram_chat_id,
      message_text: morningMessage,
      scheduled_for: nextMorningUtc.toISOString(),
      source_type: 'daily_reminder',
      source_id: 'daily_reminder_morning',
      user_id: userId,
      reply_markup: morningKeyboard,
    },
    {
      telegram_chat_id: profile.telegram_chat_id,
      message_text: eveningMessage,
      scheduled_for: nextEveningUtc.toISOString(),
      source_type: 'daily_reminder',
      source_id: 'daily_reminder_evening',
      user_id: userId,
      reply_markup: eveningKeyboard,
    },
  ];

  await upsertQueueItems('daily_reminder', 'daily_reminder_morning', [items[0]]);
  await upsertQueueItems('daily_reminder', 'daily_reminder_evening', [items[1]]);
  await nudgeWorkerQueueProcessor();
}

// ── Clear Queue for a Source ─────────────────────────────────────────────────

export async function actionClearSourceQueue(
  sourceType: QueueItem['source_type'],
  sourceId: string,
  userId?: string
): Promise<void> {
  const session = await getSessionUser();
  const effectiveUserId = userId || session?.userId;
  try {
    const db = getDb();
    const conditions = [
      eq(notificationQueue.status, 'pending'),
      sql`json_extract(${notificationQueue.payload}, '$.source_id') = ${sourceId}`,
      sql`json_extract(${notificationQueue.payload}, '$.source_type') = ${sourceType}`,
    ];
    if (effectiveUserId) {
      conditions.push(eq(notificationQueue.user_id, effectiveUserId as any));
    }
    await db.delete(notificationQueue).where(and(...conditions));
  } catch (err) {
    console.error(`[notifications] Error clearing queue for ${sourceType} ${sourceId}:`, err);
  }
}
