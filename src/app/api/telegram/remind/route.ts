// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Force Reminder Endpoint (dev testing)
//
// POST /api/telegram/remind?eventId=<id>
// Immediately sends a Telegram reminder for a specific timetable event.
// Bypasses the cron window check. Useful for dev testing.
//
// Also supports: POST /api/telegram/remind?latest=true
// Sends a reminder for the user's most recent event.
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function offsetLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hour${minutes >= 120 ? 's' : ''}`;
  return `${Math.round(minutes / 1440)} day${minutes >= 2880 ? 's' : ''}`;
}

function formatTime(date: Date): { timeStr: string; dateStr: string } {
  return {
    timeStr: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    dateStr: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  };
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ success: false, error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }

  const searchParams = req.nextUrl.searchParams;
  const eventId = searchParams.get('eventId');
  const latest = searchParams.get('latest');

  const supabase = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type SupabaseAny = any;

  let event: Record<string, unknown> | null = null;

  if (eventId) {
    const { data } = await (supabase
      .from('timetable_events')
      .select('id, title, description, location, start_time, reminder_minutes, user_id')
      .eq('id', eventId)
      .maybeSingle() as SupabaseAny);
    event = data;
  } else if (latest === 'true') {
    // Get the most recent timetable event from any user with Telegram linked
    const { data } = await (supabase
      .from('timetable_events')
      .select('id, title, description, location, start_time, reminder_minutes, user_id')
      .eq('event_source', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as SupabaseAny);
    event = data;
  } else {
    return NextResponse.json({ success: false, error: 'Pass ?eventId=<id> or ?latest=true' }, { status: 400 });
  }

  if (!event) {
    return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
  }

  // Get profile with telegram_chat_id
  const { data: profile } = await (supabase
    .from('profiles')
    .select('id, telegram_chat_id')
    .eq('id', event.user_id as string)
    .maybeSingle() as SupabaseAny);

  if (!profile?.telegram_chat_id) {
    return NextResponse.json({
      success: false,
      error: 'User has no linked Telegram chat',
      userId: event.user_id,
    }, { status: 400 });
  }

  const startDate = new Date(event.start_time as string);
  const { timeStr, dateStr } = formatTime(startDate);

  const offset = (event.reminder_minutes as number) ?? 0;

  let msg = `⏱ <b>EVENT REMINDER</b>\n\n🔔 <b>${event.title}</b>\n${dateStr} · ${timeStr}`;
  if (event.location) msg += `\n📍 ${event.location}`;
  if (offset > 0) msg += `\n⏰ ${offsetLabel(offset)} early`;
  msg += `\n\n<i>(Manual test — event ID: ${(event.id as string).slice(0, 8)}…)</i>`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: profile.telegram_chat_id, text: msg, parse_mode: 'HTML' }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: `Telegram API error (${res.status})`,
        detail: data,
      });
    }

    return NextResponse.json({
      success: true,
      event: { id: event.id, title: event.title, start_time: event.start_time },
      chatId: profile.telegram_chat_id,
      telegramResponse: data,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: `Fetch failed: ${String(err)}` });
  }
}
