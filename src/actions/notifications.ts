'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Notification Enqueue Server Actions
//
// These server actions pre-enqueue Telegram reminders into notification_queue
// when timetable events, assignments, or exam countdowns are created/updated.
// After enqueuing, each group of reminders (by scheduled_for timestamp) gets a
// QStash-triggered HTTP request at the exact delivery time — replacing the
// unreliable GitHub Actions cron polling.
//
// Uses createAdminClient() (service_role) because notification_queue has
// RLS enabled and public access revoked.
//
// NOTE: notification_queue and some profile columns (telegram_chat_id,
// notification_preferences) were added via migrations after the auto-generated
// Supabase types were created. `as any` casts are used where needed.
// ──────────────────────────────────────────────────────────────────────────────

import { createAdminClient } from '@/lib/supabase/server';
import { scheduleQStashMessage } from '@/lib/qstash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Allow enqueueing reminders that are already slightly overdue (e.g. an
 * "On Time" reminder created a few seconds after the event started). Anything
 * more than 5 seconds in the past is skipped as it's too late to be useful.
 */
const OVERDUE_ENQUEUE_GRACE_MS = 5_000;

/**
 * Fire triggers a few seconds BEFORE the scheduled delivery time so that
 * processor + Telegram round-trip latency lands the message exactly on time
 * or slightly EARLY — never late. Must match EARLY_CLAIM_MS in
 * src/lib/notification-processor.ts (the processor claims rows due within
 * this window, which is what allows the trigger to fire ahead of schedule).
 */
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
  const supabase = await createAdminClient();
  let result = await (supabase
    .from('profiles')
    .select('id, telegram_chat_id, timezone, notification_preferences')
    .eq('id', userId)
    .maybeSingle() as SupabaseAny);

  // Fallback for environments where `profiles.timezone` does not exist yet
  // (schema drift). Never let a missing column silently block reminder delivery.
  if (result.error || !result.data) {
    result = await (supabase
      .from('profiles')
      .select('id, telegram_chat_id, notification_preferences')
      .eq('id', userId)
      .maybeSingle() as SupabaseAny);
  }

  return (result.data ?? null) as {
    id: string;
    telegram_chat_id: string | null;
    timezone: string | null;
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
  let result = await (supabase
    .from('profiles')
    .select('id, telegram_chat_id, timezone, notification_preferences')
    .in('id', userIds)
    .not('telegram_chat_id', 'is', null) as SupabaseAny);

  // Same fallback as getProfileForUser — timezone is optional for delivery.
  if (result.error || !result.data) {
    result = await (supabase
      .from('profiles')
      .select('id, telegram_chat_id, notification_preferences')
      .in('id', userIds)
      .not('telegram_chat_id', 'is', null) as SupabaseAny);
  }

  return (result.data ?? []) as Array<{
    id: string;
    telegram_chat_id: string | null;
    timezone: string | null;
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

// ── Schedule QStash triggers for each distinct scheduled_for timestamp ───────

/**
 * Detect whether the current environment is local development
 * where QStash (a cloud service) cannot reach back to us.
 */
function isLocalDev(): boolean {
  return !process.env.VERCEL_URL && process.env.NODE_ENV === 'development';
}

/**
 * Schedule one delayed trigger per distinct `scheduled_for` timestamp.
 *
 * Fixes for time-sensitive reminders:
 *   - Already-due timestamps → ONE immediate trigger. The processor picks up
 *     every overdue 'pending' row, so we don't need one trigger per timestamp.
 *     (Previously `delayMs < 0` was skipped, leaving overdue rows stranded
 *     until the 1-minute GitHub cron rescued them.)
 *   - Future timestamps → one trigger per timestamp using the EXACT remaining
 *     delay minus EARLY_FIRE_MS. The artificial 5-second minimum is removed,
 *     so "On Time" (0-min) reminders are delivered at the scheduled second or
 *     a few seconds earlier — never late. The processor's matching claim
 *     window (EARLY_CLAIM_MS) is what allows the trigger to fire early.
 *
 * In local dev, QStash (cloud) can't reach 127.0.0.1, so setTimeout fires on
 * the dev server directly with the same semantics. The dev rescue polling
 * (startDevRescuePolling) additionally covers server reloads.
 */
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

  // Already-due timestamps: one immediate trigger covers every overdue row.
  if (expired.length > 0) {
    if (local) {
      fireLocal(0);
    } else {
      await scheduleQStashMessage({ delay: 0 });
    }
  }

  // Future timestamps: exact remaining delay minus the early-fire margin.
  // Firing EARLY_FIRE_MS before the scheduled time lets the processor +
  // Telegram delivery land on-time or a few seconds earlier — never late.
  for (const scheduledFor of future) {
    const delayMs = Math.max(0, new Date(scheduledFor).getTime() - now - EARLY_FIRE_MS);
    if (local) {
      fireLocal(delayMs);
    } else {
      // Round UP so the trigger never fires before the intended time.
      const delaySeconds = Math.max(0, Math.ceil(delayMs / 1000));
      await scheduleQStashMessage({ delay: delaySeconds });
    }
  }
}

/**
 * Fire a local HTTP request to the queue-processor endpoint.
 * Used in local dev as a substitute for the QStash cloud callback.
 */
async function triggerLocalProcessing(): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? 'http://127.0.0.1:3005';
  const url = `${baseUrl}/api/qstash/process-notifications`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET ?? '',
      },
    });
    if (!res.ok) {
      console.warn(`[qstash] Local processing returned ${res.status}`);
    }
  } catch (err) {
    console.error('[qstash] Local processing fetch error:', err);
  }
}

/**
 * Local-development rescue loop.
 *
 * setTimeout()-based triggers only live inside the Node process and are lost
 * when the dev server reloads. This lightweight poll re-fires the local
 * processor endpoint every 5 seconds (plus once shortly after startup), which
 * recovers overdue rows and stale 'processing' rows — so no reminder is
 * permanently stranded by a reload. The 5s cadence matches the EARLY_FIRE_MS
 * claim window, so even a timer lost to a reload is still delivered on time.
 * No-op outside local development.
 */
function startDevRescuePolling(): void {
  if (!isLocalDev()) return;

  const g = globalThis as { __antsDevRescuePollingStarted?: boolean };
  if (g.__antsDevRescuePollingStarted) return;
  g.__antsDevRescuePollingStarted = true;

  const POLL_INTERVAL_MS = 5_000;

  // Initial sweep — catches rows stranded by a previous dev-server reload.
  setTimeout(() => {
    triggerLocalProcessing().catch((err) =>
      console.error('[qstash] Dev rescue poll failed:', err)
    );
  }, 1_000);

  setInterval(() => {
    triggerLocalProcessing().catch((err) =>
      console.error('[qstash] Dev rescue poll failed:', err)
    );
  }, POLL_INTERVAL_MS);

  console.log('[qstash] Local dev rescue polling started (every 5s)');
}

// Start the dev rescue loop when this module loads in local development.
// Guarded by isLocalDev() — a no-op in production builds.
startDevRescuePolling();

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

  const userTimezone = profile.timezone ?? 'Asia/Yangon';
  const startDate = new Date(startTime);
  const scheduledFor = new Date(startDate.getTime() - reminderMinutes * 60 * 1000);

  // Skip only if the reminder time is too far in the past. Near-term and
  // "On Time" (0-min) reminders are enqueued — the trigger scheduler fires
  // them immediately if they are already due.
  if (scheduledFor.getTime() <= Date.now() - OVERDUE_ENQUEUE_GRACE_MS) return;

  const { timeStr, dateStr } = formatTime(startDate, userTimezone);

  let msg = `⏱ <b>EVENT REMINDER</b>\n\n🔔 <b>${title}</b>\n${dateStr} · ${timeStr}`;
  if (location) msg += `\n📍 ${location}`;
  if (reminderMinutes > 0) msg += `\n⏰ ${offsetLabel(reminderMinutes)} early`;

  const items: QueueItem[] = [
    {
      telegram_chat_id: profile.telegram_chat_id,
      message_text: msg,
      scheduled_for: scheduledFor.toISOString(),
      source_type: 'timetable_event',
      source_id: eventId,
      user_id: userId,
    },
  ];

  await upsertQueueItems('timetable_event', eventId, items);
  await scheduleQStashTriggers(items);
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

    const userTimezone = profile.timezone ?? 'Asia/Yangon';
    const dueDate = new Date(assignment.due_date);

    for (const offset of prefs.reminders) {
      const scheduledFor = new Date(dueDate.getTime() - offset * 60 * 1000);

      // Skip only if the reminder is too far in the past — near-term and
      // "On Time" reminders are enqueued and fired immediately by the scheduler.
      if (scheduledFor.getTime() <= Date.now() - OVERDUE_ENQUEUE_GRACE_MS) continue;

      const { dateStr } = formatTime(dueDate, userTimezone);
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
  await scheduleQStashTriggers(items);
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

  const userTimezone = profile.timezone ?? 'Asia/Yangon';
  const items: QueueItem[] = [];
  const targetDate = new Date(countdown.target_date);
  const title = countdown.custom_title || 'Exam';

  for (const offset of examPrefs.reminders) {
    const scheduledFor = new Date(targetDate.getTime() - offset * 60 * 1000);

    // Skip only if the reminder is too far in the past — near-term and
    // "On Time" reminders are enqueued and fired immediately by the scheduler.
    if (scheduledFor.getTime() <= Date.now() - OVERDUE_ENQUEUE_GRACE_MS) continue;

    const { dateStr } = formatTime(targetDate, userTimezone);
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
  await scheduleQStashTriggers(items);
}

// ── Enqueue: Quiz Reminders ──────────────────────────────────────────────────

export async function actionEnqueueQuizReminders(quizId: string) {
  const supabase = await createAdminClient();

  // Fetch the quiz
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, due_date, classroom_id')
    .eq('id', quizId)
    .single();

  if (!quiz?.due_date) return;

  // Get classroom members with Telegram linked
  const profiles = await getProfilesForClassroom(quiz.classroom_id);
  if (profiles.length === 0) return;

  const items: QueueItem[] = [];

  for (const profile of profiles) {
    if (!profile.telegram_chat_id) continue;

    const prefs = profile.notification_preferences?.quizzes;
    if (!prefs?.enabled || !prefs.reminders?.length) continue;

    const userTimezone = profile.timezone ?? 'Asia/Yangon';
    const dueDate = new Date(quiz.due_date);

    for (const offset of prefs.reminders) {
      const scheduledFor = new Date(dueDate.getTime() - offset * 60 * 1000);

      // Skip only if the reminder is too far in the past — near-term and
      // "On Time" reminders are enqueued and fired immediately by the scheduler.
      if (scheduledFor.getTime() <= Date.now() - OVERDUE_ENQUEUE_GRACE_MS) continue;

      const { dateStr } = formatTime(dueDate, userTimezone);
      items.push({
        telegram_chat_id: profile.telegram_chat_id,
        message_text: `📝 <b>QUIZ REMINDER</b>\n\n📝 <b>${quiz.title}</b>\nDue: ${dateStr}\n⏰ ${offsetLabel(offset)} left`,
        scheduled_for: scheduledFor.toISOString(),
        source_type: 'quiz',
        source_id: quizId,
        user_id: profile.id,
      });
    }
  }

  await upsertQueueItems('quiz', quizId, items);
  await scheduleQStashTriggers(items);
}

// ── Enqueue: Role Upgrade Notifications ──────────────────────────────────────

export async function actionEnqueueRoleUpgradeNotification(
  userId: string,
  result: 'approved' | 'rejected',
  reviewerNote?: string
) {
  const supabase = await createAdminClient();
  const db = supabase as SupabaseAny;

  // Fetch the user's profile
  const { data: profile } = await db
    .from('profiles')
    .select('id, name, username, telegram_chat_id, role')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return;

  const now = new Date(Date.now() + 60 * 1000).toISOString();
  const insertedItems: QueueItem[] = [];

  // 1. Notify the requesting user about their upgrade result
  if (profile.telegram_chat_id) {
    const userMsg = result === 'approved'
      ? `🎉 <b>ROLE UPGRADE APPROVED</b>\n\nCongratulations, ${profile.name || profile.username}! Your role upgrade request has been <b>approved</b>.\n\n${reviewerNote ? `📝 Reviewer note: ${reviewerNote}` : 'You now have access to your new role\'s features.'}`
      : `ℹ️ <b>ROLE UPGRADE REJECTED</b>\n\nHi ${profile.name || profile.username}, your role upgrade request was <b>rejected</b>.\n\n${reviewerNote ? `📝 Reason: ${reviewerNote}` : 'Please review the requirements and submit a new request.'}`;

    await db.from('notification_queue').insert({
      telegram_chat_id: profile.telegram_chat_id,
      message_text: userMsg,
      scheduled_for: now,
      source_type: 'role_upgrade',
      source_id: userId,
      user_id: userId,
    });
    insertedItems.push({
      telegram_chat_id: profile.telegram_chat_id,
      message_text: userMsg,
      scheduled_for: now,
      source_type: 'role_upgrade',
      source_id: userId,
      user_id: userId,
    });
  }

  // 2. Notify all main_contributors about approved/rejected upgrades
  const { data: admins } = await db
    .from('profiles')
    .select('id, telegram_chat_id')
    .eq('role', 'main_contributor')
    .not('telegram_chat_id', 'is', null);

  if (admins?.length) {
    for (const admin of admins) {
      const adminItem: QueueItem = {
        telegram_chat_id: admin.telegram_chat_id,
        message_text: `🔄 <b>ROLE UPGRADE ${result.toUpperCase()}</b>\n\nUser <b>${profile.name || profile.username}</b> (${profile.role}) has been <b>${result}</b>.${reviewerNote ? `\n\n📝 Note: ${reviewerNote}` : ''}`,
        scheduled_for: now,
        source_type: 'role_upgrade',
        source_id: userId,
        user_id: admin.id,
      };
      await db.from('notification_queue').insert(adminItem);
      insertedItems.push(adminItem);
    }
  }

  await scheduleQStashTriggers(insertedItems);
}

// ── Enqueue: Review Queue Notifications ──────────────────────────────────────

export async function actionEnqueueReviewQueueNotification(
  submissionId: string,
  newStatus: string
) {
  const supabase = await createAdminClient();
  const db = supabase as SupabaseAny;

  // Fetch the submission
  const { data: submission } = await db
    .from('review_queue')
    .select('id, contributor_id, submission_type, status')
    .eq('id', submissionId)
    .single();

  if (!submission) return;

  // Fetch the contributor's profile
  const { data: contributor } = await db
    .from('profiles')
    .select('id, name, username, telegram_chat_id')
    .eq('id', submission.contributor_id)
    .maybeSingle();

  if (!contributor) return;

  const now = new Date(Date.now() + 60 * 1000).toISOString();
  const typeLabel = (submission.submission_type ?? 'submission').replace(/_/g, ' ');
  const insertedItems: QueueItem[] = [];

  // Notify the contributor
  if (contributor.telegram_chat_id) {
    let msg: string;
    if (newStatus === 'approved') {
      msg = `✅ <b>SUBMISSION APPROVED</b>\n\nYour <b>${typeLabel}</b> has been <b>approved</b> and is now live! 🎉\n\nThank you for your contribution to The ANTs.`;
    } else if (newStatus === 'rejected') {
      msg = `❌ <b>SUBMISSION REJECTED</b>\n\nYour <b>${typeLabel}</b> submission was <b>rejected</b>.\n\nPlease check the review feedback in your dashboard for details and resubmit.`;
    } else {
      msg = `🔄 <b>SUBMISSION UPDATED</b>\n\nYour <b>${typeLabel}</b> submission status has been updated to: <b>${newStatus}</b>.`;
    }

    const contributorItem: QueueItem = {
      telegram_chat_id: contributor.telegram_chat_id,
      message_text: msg,
      scheduled_for: now,
      source_type: 'review_queue',
      source_id: submissionId,
      user_id: contributor.id,
    };
    await db.from('notification_queue').insert(contributorItem);
    insertedItems.push(contributorItem);
  }

  // Also notify all main_contributors when a new submission is pending review
  if (newStatus === 'pending') {
    const { data: admins } = await db
      .from('profiles')
      .select('id, telegram_chat_id')
      .eq('role', 'main_contributor')
      .not('telegram_chat_id', 'is', null);

    if (admins?.length) {
      for (const admin of admins) {
        const adminItem: QueueItem = {
          telegram_chat_id: admin.telegram_chat_id,
          message_text: `📬 <b>NEW REVIEW SUBMISSION</b>\n\nA new <b>${typeLabel}</b> has been submitted by <b>${contributor.name || contributor.username}</b> and is awaiting your review.`,
          scheduled_for: now,
          source_type: 'review_queue',
          source_id: submissionId,
          user_id: admin.id,
        };
        await db.from('notification_queue').insert(adminItem);
        insertedItems.push(adminItem);
      }
    }
  }

  await scheduleQStashTriggers(insertedItems);
}

// ── Enqueue: Club Milestone Notifications ────────────────────────────────────

export async function actionEnqueueClubMilestoneNotification(milestoneId: string) {
  const supabase = await createAdminClient();
  const db = supabase as SupabaseAny;

  // Fetch the milestone
  const { data: milestone } = await db
    .from('club_milestones_legacy')
    .select('id, club_id, title, description, status')
    .eq('id', milestoneId)
    .single();

  if (!milestone) return;

  // Find all club members with Telegram linked
  const { data: members } = await db
    .from('club_members')
    .select('user_id')
    .eq('club_id', milestone.club_id);

  if (!members?.length) return;

  const userIds = members.map((m: { user_id: string }) => m.user_id);
  const { data: profiles } = await db
    .from('profiles')
    .select('id, telegram_chat_id')
    .in('id', userIds)
    .not('telegram_chat_id', 'is', null);

  if (!profiles?.length) return;

  const now = new Date(Date.now() + 60 * 1000).toISOString();
  const badge = milestone.status === 'completed' ? '✅' : '🎯';
  const insertedItems: QueueItem[] = [];

  for (const profile of profiles) {
    const item: QueueItem = {
      telegram_chat_id: profile.telegram_chat_id,
      message_text: `${badge} <b>CLUB MILESTONE</b>\n\n${badge} <b>${milestone.title}</b>\n${milestone.description ? `📄 ${milestone.description}\n` : ''}Status: <b>${milestone.status ?? 'active'}</b>`,
      scheduled_for: now,
      source_type: 'club_milestone',
      source_id: milestoneId,
      user_id: profile.id,
    };
    await db.from('notification_queue').insert(item);
    insertedItems.push(item);
  }

  await scheduleQStashTriggers(insertedItems);
}

// ── Enqueue: Club Announcement Notifications ─────────────────────────────────

export async function actionEnqueueClubAnnouncementNotification(
  announcementId: string,
  clubId: string,
  title: string,
  content: string
) {
  const supabase = await createAdminClient();
  const db = supabase as SupabaseAny;

  // Find all club members with Telegram linked
  const { data: members } = await db
    .from('club_members')
    .select('user_id')
    .eq('club_id', clubId);

  if (!members?.length) return;

  const userIds = members.map((m: { user_id: string }) => m.user_id);
  const { data: profiles } = await db
    .from('profiles')
    .select('id, telegram_chat_id')
    .in('id', userIds)
    .not('telegram_chat_id', 'is', null);

  if (!profiles?.length) return;

  // Truncate long content for Telegram messages
  const truncatedContent = content.length > 500 ? content.slice(0, 500) + '…' : content;
  const now = new Date(Date.now() + 60 * 1000).toISOString();
  const insertedItems: QueueItem[] = [];

  for (const profile of profiles) {
    const item: QueueItem = {
      telegram_chat_id: profile.telegram_chat_id,
      message_text: `📢 <b>CLUB ANNOUNCEMENT</b>\n\n<b>${title}</b>\n\n${truncatedContent}\n\n— Check the club page for more details.`,
      scheduled_for: now,
      source_type: 'club_announcement',
      source_id: announcementId,
      user_id: profile.id,
    };
    await db.from('notification_queue').insert(item);
    insertedItems.push(item);
  }

  await scheduleQStashTriggers(insertedItems);
}
