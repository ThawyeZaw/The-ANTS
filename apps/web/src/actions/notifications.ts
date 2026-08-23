'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Notification Enqueue Server Actions (Neon Drizzle DB)
// ──────────────────────────────────────────────────────────────────────────────

import { getDb, notificationQueue, profiles } from '@/lib/db';
import { eq, and, inArray } from 'drizzle-orm';
import { scheduleQStashMessage } from '@/lib/qstash';
import { expandRecurringEvents } from '@/lib/timetable/recurrence';
import type { TimetableEvent, RecurrenceRule } from '@/types/timetable';

// ── Types ─────────────────────────────────────────────────────────────────────

interface QueueItem {
  telegram_chat_id: string;
  message_text: string;
  scheduled_for: string; // ISO timestamp
  source_type: 'timetable_event' | 'assignment' | 'exam_countdown' | 'club_announcement' | 'quiz' | 'role_upgrade' | 'review_queue' | 'club_milestone';
  source_id: string;
  user_id: string;
}

interface NotificationPrefs {
  timetable?:   { enabled?: boolean; reminders?: number[] };
  assignments?: { enabled?: boolean; reminders?: number[] };
  exams?:       { enabled?: boolean; reminders?: number[] };
  quizzes?:     { enabled?: boolean; reminders?: number[] };
}

const OVERDUE_ENQUEUE_GRACE_MS = 5_000;
const EARLY_FIRE_MS = 5_000;

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

  // Delete existing pending/processing items for this source
  await db
    .delete(notificationQueue)
    .where(
      and(
        eq(notificationQueue.status, 'pending'),
        eq(notificationQueue.id, sourceId) // Or matching payload source if needed
      )
    );

  // Batch insert
  for (const item of items) {
    await db.insert(notificationQueue).values({
      payload: {
        telegram_chat_id: item.telegram_chat_id,
        message: item.message_text,
        source_type: item.source_type,
        source_id: item.source_id,
        user_id: item.user_id,
      },
      scheduled_for: new Date(item.scheduled_for),
      status: 'pending',
    });
  }
}

function isLocalDev(): boolean {
  return !process.env.VERCEL_URL && process.env.NODE_ENV === 'development';
}

async function scheduleQStashTriggers(items: QueueItem[]): Promise<void> {
  if (items.length === 0) return;

  const now = Date.now();
  const uniqueTimestamps = Array.from(new Set(items.map((i) => i.scheduled_for)));
  const local = isLocalDev();

  const fireLocal = (delayMs: number) => {
    setTimeout(() => {
      triggerLocalProcessing().catch((err) =>
        console.error('[qstash] Local processing failed:', err)
      );
    }, delayMs);
  };

  const expired = uniqueTimestamps.filter((ts) => new Date(ts).getTime() <= now);
  const future = uniqueTimestamps
    .filter((ts) => new Date(ts).getTime() > now)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  if (expired.length > 0) {
    if (local) {
      fireLocal(0);
    } else {
      await scheduleQStashMessage({ delay: 0 });
    }
  }

  for (const scheduledFor of future) {
    const delayMs = Math.max(0, new Date(scheduledFor).getTime() - now - EARLY_FIRE_MS);
    if (local) {
      fireLocal(delayMs);
    } else {
      const delaySeconds = Math.max(0, Math.ceil(delayMs / 1000));
      await scheduleQStashMessage({ delay: delaySeconds });
    }
  }
}

async function triggerLocalProcessing(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://127.0.0.1:3005';
  const url = `${baseUrl}/api/qstash/process-notifications`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-qstash-signature': 'local-dev-bypass',
      },
      body: JSON.stringify({ source: 'local-dev-timer' }),
    });
    if (!res.ok) {
      console.warn(`[qstash] Local trigger returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('[qstash] Local trigger failed to fetch:', err);
  }
}

// ── Enqueue: Timetable Reminders ─────────────────────────────────────────────

export async function actionEnqueueTimetableReminders(
  event: TimetableEvent,
  userId: string
): Promise<void> {
  const profile = await getProfileForUser(userId);
  if (!profile?.telegram_chat_id) return;

  const prefs = profile.notification_preferences?.timetable;
  if (prefs && prefs.enabled === false) return;

  const reminderMinutes: number[] =
    (prefs?.reminders && prefs.reminders.length > 0)
      ? prefs.reminders
      : [15];

  const now = Date.now();
  const queueItems: QueueItem[] = [];

  const timeInstances: Date[] = [];
  if (event.is_recurring && event.recurrence_rule) {
    const horizonEnd = new Date(now + 14 * 24 * 60 * 60 * 1000);
    const expanded = expandRecurringEvents(
      [event],
      new Date(now),
      horizonEnd
    );
    for (const exp of expanded) {
      timeInstances.push(new Date(exp.start_time));
    }
  } else {
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
        source_id: event.id,
        user_id: userId,
      });
    }
  }

  await upsertQueueItems('timetable_event', event.id, queueItems);
  await scheduleQStashTriggers(queueItems);
}

// ── Enqueue: Exam Countdown Reminders ────────────────────────────────────────

export async function actionEnqueueExamCountdownReminders(
  examCountdownId: string,
  userId: string,
  examTitle: string,
  examDate: Date,
  isMock = false
): Promise<void> {
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
    });
  }

  await upsertQueueItems('exam_countdown', examCountdownId, queueItems);
  await scheduleQStashTriggers(queueItems);
}

// ── Clear Queue for a Source ─────────────────────────────────────────────────

export async function actionClearSourceQueue(
  sourceType: QueueItem['source_type'],
  sourceId: string
): Promise<void> {
  try {
    const db = getDb();
    await db
      .delete(notificationQueue)
      .where(
        and(
          eq(notificationQueue.status, 'pending'),
          eq(notificationQueue.id, sourceId)
        )
      );
  } catch (err) {
    console.error(`[notifications] Error clearing queue for ${sourceType} ${sourceId}:`, err);
  }
}
