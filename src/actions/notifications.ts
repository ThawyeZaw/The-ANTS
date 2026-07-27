'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Notification Enqueue Server Actions
//
// These server actions pre-enqueue Telegram reminders into notification_queue
// when timetable events, assignments, or exam countdowns are created/updated.
// The process-telegram-queue Edge Function handles actual sending.
//
// Uses createAdminClient() (service_role) because notification_queue has
// RLS enabled and public access revoked.
//
// NOTE: notification_queue and some profile columns (telegram_chat_id,
// notification_preferences) were added via migrations after the auto-generated
// Supabase types were created. `as any` casts are used where needed.
// ──────────────────────────────────────────────────────────────────────────────

import { createAdminClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

// ── Types ─────────────────────────────────────────────────────────────────────

interface QueueItem {
  telegram_chat_id: string;
  message_text: string;
  scheduled_for: string; // ISO timestamp
  source_type: 'timetable_event' | 'assignment' | 'exam_countdown' | 'club_announcement';
  source_id: string;
  user_id: string;
}

interface NotificationPrefs {
  timetable?:   { enabled?: boolean; reminders?: number[] };
  assignments?: { enabled?: boolean; reminders?: number[] };
  exams?:       { enabled?: boolean; reminders?: number[] };
  quizzes?:     { enabled?: boolean; reminders?: number[] };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(date: Date): { timeStr: string; dateStr: string } {
  return {
    timeStr: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    dateStr: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  };
}

function offsetLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hour${minutes >= 120 ? 's' : ''}`;
  return `${Math.round(minutes / 1440)} day${minutes >= 2880 ? 's' : ''}`;
}

async function getProfileForUser(userId: string) {
  const supabase = await createAdminClient();
  const { data } = await (supabase
    .from('profiles')
    .select('id, telegram_chat_id, notification_preferences')
    .eq('id', userId)
    .maybeSingle() as SupabaseAny);
  return data as {
    id: string;
    telegram_chat_id: string | null;
    notification_preferences: NotificationPrefs | null;
  } | null;
}

async function getProfilesForClassroom(classroomId: string) {
  const supabase = await createAdminClient();
  const { data: members } = await supabase
    .from('classroom_members')
    .select('user_id')
    .eq('classroom_id', classroomId);

  if (!members?.length) return [];

  const userIds = members.map((m: { user_id: string }) => m.user_id);
  const { data: profiles } = await (supabase
    .from('profiles')
    .select('id, telegram_chat_id, notification_preferences')
    .in('id', userIds)
    .not('telegram_chat_id', 'is', null) as SupabaseAny);

  return (profiles ?? []) as Array<{
    id: string;
    telegram_chat_id: string | null;
    notification_preferences: NotificationPrefs | null;
  }>;
}

// ── Core: upsert queue items ──────────────────────────────────────────────────

async function upsertQueueItems(
  sourceType: QueueItem['source_type'],
  sourceId: string,
  items: QueueItem[]
): Promise<void> {
  if (items.length === 0) return;

  const supabase = await createAdminClient();
  const db = supabase as SupabaseAny;

  // Delete existing pending/processing items for this source
  await db
    .from('notification_queue')
    .delete()
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .in('status', ['pending', 'processing']);

  // Batch-insert new items (up to 1000 per insert)
  for (let i = 0; i < items.length; i += 1000) {
    const batch = items.slice(i, i + 1000);
    await db.from('notification_queue').insert(batch);
  }
}

// ── Remove queue items for a deleted source ───────────────────────────────────

export async function actionClearSourceQueue(
  sourceType: QueueItem['source_type'],
  sourceId: string
) {
  const supabase = await createAdminClient();
  const db = supabase as SupabaseAny;
  await db
    .from('notification_queue')
    .delete()
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .in('status', ['pending', 'processing']);
}

// ── Enqueue: Timetable Events ─────────────────────────────────────────────────

export async function actionEnqueueTimetableReminders(
  userId: string,
  eventId: string,
  title: string,
  location: string | null,
  startTime: string,
  reminderMinutes: number | null
) {
  if (!reminderMinutes && reminderMinutes !== 0) {
    // No reminder configured — clear any existing queue items
    await actionClearSourceQueue('timetable_event', eventId);
    return;
  }

  const profile = await getProfileForUser(userId);
  if (!profile?.telegram_chat_id) return;

  const timetablePrefs = profile.notification_preferences?.timetable;
  if (timetablePrefs?.enabled === false) return;

  const startDate = new Date(startTime);
  const scheduledFor = new Date(startDate.getTime() - reminderMinutes * 60 * 1000);

  // Don't enqueue if scheduled time is in the past
  if (scheduledFor.getTime() <= Date.now()) return;

  const { timeStr, dateStr } = formatTime(startDate);

  let msg = `⏱ <b>EVENT REMINDER</b>\n\n🔔 <b>${title}</b>\n${dateStr} · ${timeStr}`;
  if (location) msg += `\n📍 ${location}`;
  if (reminderMinutes > 0) msg += `\n⏰ ${offsetLabel(reminderMinutes)} early`;

  await upsertQueueItems('timetable_event', eventId, [
    {
      telegram_chat_id: profile.telegram_chat_id,
      message_text: msg,
      scheduled_for: scheduledFor.toISOString(),
      source_type: 'timetable_event',
      source_id: eventId,
      user_id: userId,
    },
  ]);
}

// ── Enqueue: Assignments ──────────────────────────────────────────────────────

export async function actionEnqueueAssignmentReminders(assignmentId: string) {
  const supabase = await createAdminClient();

  // Fetch the assignment
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, title, due_date, classroom_id')
    .eq('id', assignmentId)
    .single();

  if (!assignment) return;

  // Get classroom members with Telegram linked
  const profiles = await getProfilesForClassroom(assignment.classroom_id);
  if (profiles.length === 0) return;

  const items: QueueItem[] = [];

  for (const profile of profiles) {
    if (!profile.telegram_chat_id) continue;

    const prefs = profile.notification_preferences?.assignments;
    if (!prefs?.enabled || !prefs.reminders?.length) continue;

    const dueDate = new Date(assignment.due_date);

    for (const offset of prefs.reminders) {
      const scheduledFor = new Date(dueDate.getTime() - offset * 60 * 1000);

      // Don't enqueue if scheduled time is in the past
      if (scheduledFor.getTime() <= Date.now()) continue;

      const { dateStr } = formatTime(dueDate);
      items.push({
        telegram_chat_id: profile.telegram_chat_id,
        message_text: `📋 <b>ASSIGNMENT REMINDER</b>\n\n📚 <b>${assignment.title}</b>\nDue: ${dateStr}\n⏰ ${offsetLabel(offset)} left`,
        scheduled_for: scheduledFor.toISOString(),
        source_type: 'assignment',
        source_id: assignmentId,
        user_id: profile.id,
      });
    }
  }

  await upsertQueueItems('assignment', assignmentId, items);
}

// ── Enqueue: Exam Countdowns ──────────────────────────────────────────────────

export async function actionEnqueueExamReminders(countdownId: string, userId: string) {
  const supabase = await createAdminClient();

  // Fetch the countdown
  const { data: countdown } = await supabase
    .from('exam_countdowns')
    .select('id, custom_title, target_date')
    .eq('id', countdownId)
    .single();

  if (!countdown?.target_date) return;

  const profile = await getProfileForUser(userId);
  if (!profile?.telegram_chat_id) return;

  const examPrefs = profile.notification_preferences?.exams;
  if (!examPrefs?.enabled || !examPrefs.reminders?.length) return;

  const items: QueueItem[] = [];
  const targetDate = new Date(countdown.target_date);
  const title = countdown.custom_title || 'Exam';

  for (const offset of examPrefs.reminders) {
    const scheduledFor = new Date(targetDate.getTime() - offset * 60 * 1000);

    // Don't enqueue if scheduled time is in the past
    if (scheduledFor.getTime() <= Date.now()) continue;

    const { dateStr } = formatTime(targetDate);
    items.push({
      telegram_chat_id: profile.telegram_chat_id,
      message_text: `📝 <b>EXAM REMINDER</b>\n\n📝 <b>${title}</b>\nExam: ${dateStr}\n⏰ ${offsetLabel(offset)} left`,
      scheduled_for: scheduledFor.toISOString(),
      source_type: 'exam_countdown',
      source_id: countdownId,
      user_id: userId,
    });
  }

  await upsertQueueItems('exam_countdown', countdownId, items);
}
