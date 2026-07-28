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

    const dueDate = new Date(quiz.due_date);

    for (const offset of prefs.reminders) {
      const scheduledFor = new Date(dueDate.getTime() - offset * 60 * 1000);

      // Don't enqueue if scheduled time is in the past
      if (scheduledFor.getTime() <= Date.now()) continue;

      const { dateStr } = formatTime(dueDate);
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
  }

  // 2. Notify all main_contributors about approved/rejected upgrades
  const { data: admins } = await db
    .from('profiles')
    .select('id, telegram_chat_id')
    .eq('role', 'main_contributor')
    .not('telegram_chat_id', 'is', null);

  if (admins?.length) {
    for (const admin of admins) {
      await db.from('notification_queue').insert({
        telegram_chat_id: admin.telegram_chat_id,
        message_text: `🔄 <b>ROLE UPGRADE ${result.toUpperCase()}</b>\n\nUser <b>${profile.name || profile.username}</b> (${profile.role}) has been <b>${result}</b>.${reviewerNote ? `\n\n📝 Note: ${reviewerNote}` : ''}`,
        scheduled_for: now,
        source_type: 'role_upgrade',
        source_id: userId,
        user_id: admin.id,
      });
    }
  }
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

    await db.from('notification_queue').insert({
      telegram_chat_id: contributor.telegram_chat_id,
      message_text: msg,
      scheduled_for: now,
      source_type: 'review_queue',
      source_id: submissionId,
      user_id: contributor.id,
    });
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
        await db.from('notification_queue').insert({
          telegram_chat_id: admin.telegram_chat_id,
          message_text: `📬 <b>NEW REVIEW SUBMISSION</b>\n\nA new <b>${typeLabel}</b> has been submitted by <b>${contributor.name || contributor.username}</b> and is awaiting your review.`,
          scheduled_for: now,
          source_type: 'review_queue',
          source_id: submissionId,
          user_id: admin.id,
        });
      }
    }
  }
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

  for (const profile of profiles) {
    await db.from('notification_queue').insert({
      telegram_chat_id: profile.telegram_chat_id,
      message_text: `${badge} <b>CLUB MILESTONE</b>\n\n${badge} <b>${milestone.title}</b>\n${milestone.description ? `📄 ${milestone.description}\n` : ''}Status: <b>${milestone.status ?? 'active'}</b>`,
      scheduled_for: now,
      source_type: 'club_milestone',
      source_id: milestoneId,
      user_id: profile.id,
    });
  }
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

  for (const profile of profiles) {
    await db.from('notification_queue').insert({
      telegram_chat_id: profile.telegram_chat_id,
      message_text: `📢 <b>CLUB ANNOUNCEMENT</b>\n\n<b>${title}</b>\n\n${truncatedContent}\n\n— Check the club page for more details.`,
      scheduled_for: now,
      source_type: 'club_announcement',
      source_id: announcementId,
      user_id: profile.id,
    });
  }
}
