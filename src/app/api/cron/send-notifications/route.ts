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
  /** When true, the caller should use recordSentinel() instead of markTimetableNotified() */
  useSentinel?: boolean;
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

  // Fetch events with explicit per-event reminder_minutes (single offset, can safely mark notified)
  const { data: explicitEvents, error: explicitErr } = await (supabase
    .from('timetable_events')
    .select('id, title, description, location, start_time, reminder_minutes, user_id, notified')
    .or('notified.is.false,notified.is.null')
    .not('reminder_minutes', 'is', null)
    .gte('start_time', now.toISOString())
    .lte('start_time', lookAhead.toISOString())
    .order('start_time') as SupabaseAny);

  if (explicitErr) console.error('[cron:timetable] explicit query error:', explicitErr);

  // Fetch events WITHOUT explicit reminder_minutes (use user preferences, need sentinel dedup)
  const { data: prefEvents, error: prefErr } = await (supabase
    .from('timetable_events')
    .select('id, title, description, location, start_time, reminder_minutes, user_id')
    .is('reminder_minutes', null)
    .gte('start_time', now.toISOString())
    .lte('start_time', lookAhead.toISOString())
    .order('start_time') as SupabaseAny);

  if (prefErr) console.error('[cron:timetable] pref query error:', prefErr);

  console.log(`[cron:timetable] explicitEvents=${explicitEvents?.length ?? 0} prefEvents=${prefEvents?.length ?? 0}`);

  // Pre-fetch sentinel records for preference-based dedup
  const { data: sentinels } = await (supabase
    .from('timetable_events')
    .select('source_id, reminder_minutes')
    .eq('event_source', 'timetable_event_reminder')
    .eq('notified', true) as SupabaseAny);

  const sentinelSet = new Set<string>();
  for (const s of sentinels ?? []) {
    if (s.source_id && s.reminder_minutes != null) {
      sentinelSet.add(`${s.source_id}-${s.reminder_minutes}`);
    }
  }

  // ── Process events with explicit per-event reminder_minutes ──
  if (explicitEvents?.length) {
    for (const event of explicitEvents as Array<Record<string, unknown>>) {
      const profile = profiles.find((p) => p.id === event.user_id);
      if (!profile?.telegram_chat_id) continue;

      const timetablePrefs = profile.notification_preferences?.timetable;
      if (timetablePrefs && timetablePrefs.enabled === false) continue;

      const startDate = new Date(event.start_time as string);
      const explicitOffset = event.reminder_minutes as number;

      const effectiveTime = new Date(startDate.getTime() - explicitOffset * 60 * 1000);
      if (effectiveTime < now || effectiveTime > windowEnd) continue;

      const { timeStr, dateStr } = formatTime(startDate);
      let msg = `⏱ <b>EVENT REMINDER</b>\n\n🔔 <b>${event.title}</b>\n${dateStr} · ${timeStr}`;
      if (event.location) msg += `\n📍 ${event.location}`;
      if (explicitOffset > 0) msg += `\n⏰ ${offsetLabel(explicitOffset)} early`;

      results.push({
        chatId: profile.telegram_chat_id,
        message: msg,
        sourceType: 'timetable_event',
        sourceId: event.id as string,
        userId: profile.id,
        offset: explicitOffset,
      });
    }
  }

  // ── Process events WITHOUT explicit reminder (use user preferences + sentinels) ──
  if (prefEvents?.length) {
    for (const event of prefEvents as Array<Record<string, unknown>>) {
      const profile = profiles.find((p) => p.id === event.user_id);
      if (!profile?.telegram_chat_id) continue;

      const timetablePrefs = profile.notification_preferences?.timetable;
      if (timetablePrefs && timetablePrefs.enabled === false) continue;

      const userOffsets = getReminders(profile.notification_preferences, 'timetable');
      if (userOffsets.length === 0) continue;

      const startDate = new Date(event.start_time as string);

      for (const offset of userOffsets) {
        // Check sentinel first
        const key = `${event.id}-${offset}`;
        if (sentinelSet.has(key)) continue;

        const effectiveTime = new Date(startDate.getTime() - offset * 60 * 1000);
        if (effectiveTime < now || effectiveTime > windowEnd) continue;

        const { timeStr, dateStr } = formatTime(startDate);
        let msg = `⏱ <b>EVENT REMINDER</b>\n\n🔔 <b>${event.title}</b>\n${dateStr} · ${timeStr}`;
        if (event.location) msg += `\n📍 ${event.location}`;
        if (offset > 0) msg += `\n⏰ ${offsetLabel(offset)} early`;

        results.push({
          chatId: profile.telegram_chat_id,
          message: msg,
          sourceType: 'timetable_event',
          sourceId: event.id as string,
          userId: profile.id,
          offset,
          useSentinel: true,
        });
      }
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
          message: `📋 <b>ASSIGNMENT REMINDER</b>\n\n📚 <b>${a.title}</b>\nDue: ${dateStr}\n⏰ ${offsetLabel(offsetMin)} left`,
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
        message: `📝 <b>EXAM REMINDER</b>\n\n📝 <b>${c.title}</b>\nExam: ${dateStr}\n⏰ ${offsetLabel(offsetMin)} left`,
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
  const windowEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 min for assignments/exams
  const timetableWindowEnd = new Date(now.getTime() + 2 * 60 * 1000); // 2 min for timetable (tight accuracy)

  const profiles = await fetchLinkedProfiles(supabase);
  if (profiles.length === 0) {
    return NextResponse.json({
      processed: 0,
      message: 'No linked Telegram users',
      profiles: 0,
      window: { from: now.toISOString(), to: windowEnd.toISOString() },
    });
  }

  // Count un-notified events in the lookahead window for debugging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalUnnotified } = await (supabase
    .from('timetable_events')
    .select('id', { count: 'exact', head: true })
    .or('notified.is.false,notified.is.null' as any)
    .gte('start_time', now.toISOString())
    .lte('start_time', new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString()) as SupabaseAny);

  const timetablePending = await buildTimetableNotifications(supabase, profiles, now, timetableWindowEnd);
  const assignmentPending = await buildAssignmentNotifications(supabase, profiles, now, windowEnd);
  const examPending = await buildExamNotifications(supabase, profiles, now, windowEnd);

  const allPending = [...timetablePending, ...assignmentPending, ...examPending];

  // Debug logging
  console.log(`[cron] profiles=${profiles.length} now=${now.toISOString()} timetableWindow=2min assignmentWindow=15min`);
  console.log(`[cron] totalUnnotified=${totalUnnotified ?? 0} timetable=${timetablePending.length} assignment=${assignmentPending.length} exam=${examPending.length}`);

  if (allPending.length === 0) {
    return NextResponse.json({
      processed: 0,
      message: 'No pending notifications',
      profiles: profiles.length,
      totalUnnotified: totalUnnotified ?? 0,
      bySource: { timetable: 0, assignments: 0, exams: 0 },
      window: { from: now.toISOString(), to: windowEnd.toISOString() },
    });
  }

  let sent = 0;
  let failed = 0;

  for (const n of allPending) {
    const result = await sendTelegramMessage(n.chatId, n.message);

    if (result.success) {
      sent++;
      if (n.sourceType === 'timetable_event' && !n.useSentinel) {
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
    profiles: profiles.length,
    totalUnnotified: totalUnnotified ?? 0,
    bySource: {
      timetable: timetablePending.length,
      assignments: assignmentPending.length,
      exams: examPending.length,
    },
    window: { from: now.toISOString(), to: windowEnd.toISOString() },
  });
}
