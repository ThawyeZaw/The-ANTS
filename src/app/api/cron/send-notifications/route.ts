// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Scheduled Telegram Notification Sender
//
// Called by a cron scheduler (Vercel Cron / external) every 5 minutes.
//
// Processes three sources:
//   1. timetable_events  — user events with optional reminder_minutes offset
//   2. assignments       — due_date reminders per user notification_preferences
//   3. exam_countdowns   — target_date reminders per user notification_preferences
//
// Rate limiting: ~25 msgs/sec (40ms delay), handles 429 Retry-After.
// Protected by CRON_SECRET header.
//
// NOTE: Some columns (telegram_chat_id, notification_preferences, notified,
// reminder_minutes) were added via migrations after the auto-generated
// Supabase types were created. `as any` casts are used where needed.
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationPrefs {
  timetable?:   { enabled?: boolean; reminders?: number[] };
  assignments?: { enabled?: boolean; reminders?: number[] };
  exams?:       { enabled?: boolean; reminders?: number[] };
  quizzes?:     { enabled?: boolean; reminders?: number[] };
}

interface ProfileRec {
  id: string;
  telegram_chat_id: string | null;
  notification_preferences: NotificationPrefs | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

type ReminderSource = 'timetable_event' | 'assignment' | 'exam_countdown';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<{ success: boolean; retryAfter?: number }> {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });

    if (res.status === 429) {
      const body = await res.json();
      return { success: false, retryAfter: body?.parameters?.retry_after ?? 5 };
    }

    if (!res.ok) {
      console.error(`Telegram send failed: ${res.status} ${await res.text()}`);
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error('Telegram fetch error:', err);
    return { success: false };
  }
}

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

function getReminders(prefs: NotificationPrefs | null, key: 'timetable' | 'assignments' | 'exams' | 'quizzes'): number[] {
  const section = prefs?.[key];
  if (!section || section.enabled === false) return [];
  return section.reminders ?? [];
}

// ── Notification builders ─────────────────────────────────────────────────────

interface PendingNotification {
  chatId: string;
  message: string;
  sourceType: ReminderSource;
  sourceId: string;
  userId: string;
  offset: number;
}

async function fetchLinkedProfiles(supabase: SupabaseAny): Promise<ProfileRec[]> {
  const { data } = await (supabase
    .from('profiles')
    .select('id, telegram_chat_id, notification_preferences')
    .not('telegram_chat_id', 'is', null) as SupabaseAny);
  return (data ?? []) as ProfileRec[];
}

async function buildTimetableNotifications(
  supabase: SupabaseAny,
  profiles: ProfileRec[],
  now: Date,
  windowEnd: Date
): Promise<PendingNotification[]> {
  const results: PendingNotification[] = [];
  const lookAhead = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000); // 8 days to cover 1-week-early reminders

  const { data: events } = await (supabase
    .from('timetable_events')
    .select('id, title, description, location, start_time, reminder_minutes, user_id, notified')
    .eq('notified', false)
    .gte('start_time', now.toISOString())
    .lte('start_time', lookAhead.toISOString())
    .order('start_time') as SupabaseAny);

  if (!events?.length) return results;

  for (const event of events as Array<Record<string, unknown>>) {
    const profile = profiles.find((p) => p.id === event.user_id);
    if (!profile?.telegram_chat_id) continue;

    // Skip if user has timetable notifications explicitly disabled
    const timetablePrefs = profile.notification_preferences?.timetable;
    if (timetablePrefs && timetablePrefs.enabled === false) continue;

    const startDate = new Date(event.start_time as string);
    // Use per-event reminder_minutes if set, otherwise fall back to user's timetable preferences
    const explicitOffset = event.reminder_minutes as number | null;
    const userOffsets = getReminders(profile.notification_preferences, 'timetable');
    const offsets = explicitOffset != null ? [explicitOffset] : userOffsets;
    if (offsets.length === 0) continue;

    const effectiveTimes = offsets.map((o) => ({
      offset: o,
      effectiveTime: new Date(startDate.getTime() - o * 60 * 1000),
    }));
    const matching = effectiveTimes.filter(
      (et) => et.effectiveTime >= now && et.effectiveTime <= windowEnd
    );
    if (matching.length === 0) continue;

    const { timeStr, dateStr } = formatTime(startDate);

    for (const { offset: matchedOffset } of matching) {
      let msg = `🔔 <b>${event.title}</b>\n${dateStr} · ${timeStr}`;
      if (event.location) msg += `\n📍 ${event.location}`;
      if (matchedOffset > 0) msg += `\n⏰ ${offsetLabel(matchedOffset)} early`;

      results.push({
        chatId: profile.telegram_chat_id,
        message: msg,
        sourceType: 'timetable_event',
        sourceId: event.id as string,
        userId: profile.id,
        offset: matchedOffset,
      });
    }
  }

  return results;
}

async function buildAssignmentNotifications(
  supabase: SupabaseAny,
  profiles: ProfileRec[],
  now: Date,
  windowEnd: Date
): Promise<PendingNotification[]> {
  const results: PendingNotification[] = [];

  const offsetProfiles = new Map<number, ProfileRec[]>();
  for (const p of profiles) {
    const reminders = getReminders(p.notification_preferences, 'assignments');
    for (const r of reminders) {
      if (!offsetProfiles.has(r)) offsetProfiles.set(r, []);
      offsetProfiles.get(r)!.push(p);
    }
  }

  if (offsetProfiles.size === 0) return results;

  for (const [offsetMin, profs] of offsetProfiles) {
    const targetTime = new Date(now.getTime() + offsetMin * 60 * 1000);
    const windowStart = new Date(targetTime.getTime() - 5 * 60 * 1000);

    const { data: assignments } = await (supabase
      .from('assignments')
      .select('id, title, due_date, classroom_id')
      .gte('due_date', windowStart.toISOString())
      .lte('due_date', windowEnd.toISOString())
      .eq('status', 'published') as SupabaseAny);

    if (!assignments?.length) continue;

    for (const a of assignments) {
      const { data: members } = await supabase
        .from('classroom_members')
        .select('user_id')
        .eq('classroom_id', a.classroom_id);

      const memberIds = new Set((members ?? []).map((m: { user_id: string }) => m.user_id));

      for (const p of profs) {
        if (!memberIds.has(p.id)) continue;
        if (!p.telegram_chat_id) continue;

        const { data: existing } = await (supabase
          .from('timetable_events')
          .select('id')
          .eq('user_id', p.id)
          .eq('event_source', 'assignment_reminder')
          .eq('source_id', a.id)
          .eq('reminder_minutes', offsetMin)
          .eq('notified', true)
          .maybeSingle() as SupabaseAny);

        if (existing) continue;

        const { dateStr } = formatTime(new Date(a.due_date));
        results.push({
          chatId: p.telegram_chat_id,
          message: `📚 <b>${a.title}</b>\nDue: ${dateStr}\n⏰ ${offsetLabel(offsetMin)} left`,
          sourceType: 'assignment',
          sourceId: a.id,
          userId: p.id,
          offset: offsetMin,
        });
      }
    }
  }

  return results;
}

async function buildExamNotifications(
  supabase: SupabaseAny,
  profiles: ProfileRec[],
  now: Date,
  windowEnd: Date
): Promise<PendingNotification[]> {
  const results: PendingNotification[] = [];

  const offsetProfiles = new Map<number, ProfileRec[]>();
  for (const p of profiles) {
    const reminders = getReminders(p.notification_preferences, 'exams');
    for (const r of reminders) {
      if (!offsetProfiles.has(r)) offsetProfiles.set(r, []);
      offsetProfiles.get(r)!.push(p);
    }
  }

  if (offsetProfiles.size === 0) return results;

  for (const [offsetMin, profs] of offsetProfiles) {
    const targetTime = new Date(now.getTime() + offsetMin * 60 * 1000);
    const windowStart = new Date(targetTime.getTime() - 5 * 60 * 1000);

    const { data: countdowns } = await (supabase
      .from('exam_countdowns')
      .select('id, title, target_date, user_id')
      .gte('target_date', windowStart.toISOString())
      .lte('target_date', windowEnd.toISOString()) as SupabaseAny);

    if (!countdowns?.length) continue;

    for (const c of countdowns) {
      const p = profs.find((pp) => pp.id === c.user_id);
      if (!p?.telegram_chat_id) continue;

      const { data: existing } = await (supabase
        .from('timetable_events')
        .select('id')
        .eq('user_id', p.id)
        .eq('event_source', 'exam_reminder')
        .eq('source_id', c.id)
        .eq('reminder_minutes', offsetMin)
        .eq('notified', true)
        .maybeSingle() as SupabaseAny);

      if (existing) continue;

      const { dateStr } = formatTime(new Date(c.target_date));
      results.push({
        chatId: p.telegram_chat_id,
        message: `📝 <b>${c.title}</b>\nExam: ${dateStr}\n⏰ ${offsetLabel(offsetMin)} left`,
        sourceType: 'exam_countdown',
        sourceId: c.id,
        userId: p.id,
        offset: offsetMin,
      });
    }
  }

  return results;
}

async function markTimetableNotified(supabase: SupabaseAny, eventId: string) {
  await (supabase.from('timetable_events').update({ notified: true }).eq('id', eventId) as SupabaseAny);
}

async function recordSentinel(supabase: SupabaseAny, n: PendingNotification) {
  await (supabase.from('timetable_events').insert({
    user_id: n.userId,
    title: `[Sentinel] ${n.sourceType}`,
    start_time: new Date().toISOString(),
    event_source: n.sourceType === 'assignment' ? 'assignment_reminder'
                : n.sourceType === 'exam_countdown' ? 'exam_reminder'
                : n.sourceType,
    source_id: n.sourceId,
    reminder_minutes: n.offset,
    notified: true,
  }) as SupabaseAny);
}

// ── GET Handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }

  const supabase = await createAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);

  const profiles = await fetchLinkedProfiles(supabase);
  if (profiles.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No linked Telegram users' });
  }

  const timetablePending = await buildTimetableNotifications(supabase, profiles, now, windowEnd);
  const assignmentPending = await buildAssignmentNotifications(supabase, profiles, now, windowEnd);
  const examPending = await buildExamNotifications(supabase, profiles, now, windowEnd);

  const allPending = [...timetablePending, ...assignmentPending, ...examPending];

  if (allPending.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No pending notifications' });
  }

  let sent = 0;
  let failed = 0;

  for (const n of allPending) {
    const result = await sendTelegramMessage(n.chatId, n.message);

    if (result.success) {
      sent++;
      if (n.sourceType === 'timetable_event') {
        await markTimetableNotified(supabase, n.sourceId);
      } else {
        await recordSentinel(supabase, n);
      }
    } else {
      failed++;
      if (result.retryAfter) {
        await new Promise((r) => setTimeout(r, (result.retryAfter ?? 5) * 1000));
      }
    }

    await new Promise((r) => setTimeout(r, 40));
  }

  return NextResponse.json({
    processed: allPending.length,
    sent,
    failed,
    bySource: {
      timetable: timetablePending.length,
      assignments: assignmentPending.length,
      exams: examPending.length,
    },
    window: { from: now.toISOString(), to: windowEnd.toISOString() },
  });
}
