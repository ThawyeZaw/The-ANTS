import { getDb, profiles, timetableEvents, examCountdowns } from '@/lib/db';
import { eq, and, gte, lte, asc } from 'drizzle-orm';

const WEB_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://the-ants.org';

async function profileByChatId(chatId: number) {
  const db = getDb();
  return db.query.profiles.findFirst({
    where: eq(profiles.telegram_chat_id, String(chatId)),
  });
}

function formatInTz(date: Date, timeZone: string) {
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone,
  });
  const day = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  });
  return { time, day };
}

export async function buildTodayMessage(chatId: number): Promise<string | null> {
  const profile = await profileByChatId(chatId);
  if (!profile) return null;

  const tz = profile.timezone ?? 'UTC';
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const db = getDb();
  const events = await db.query.timetableEvents.findMany({
    where: and(
      eq(timetableEvents.user_id, profile.id as string),
      gte(timetableEvents.start_time, start),
      lte(timetableEvents.start_time, end)
    ),
    orderBy: [asc(timetableEvents.start_time)],
    limit: 12,
  });

  if (events.length === 0) {
    return (
      `📅 <b>Today</b> (${profile.username})\n\n` +
      `No timed events on your timetable today.\n\n` +
      `<a href="${WEB_ORIGIN}/timetable">Open timetable</a>`
    );
  }

  const lines = events.map((ev) => {
    const st = ev.start_time ? new Date(ev.start_time as string | Date) : null;
    const { time } = st ? formatInTz(st, tz) : { time: '—' };
    return `• <b>${time}</b> — ${ev.title}`;
  });

  return (
    `📅 <b>Today</b> (${profile.username})\n\n` +
    lines.join('\n') +
    `\n\n<a href="${WEB_ORIGIN}/timetable">Open timetable</a>`
  );
}

export async function buildNextMessage(chatId: number): Promise<string | null> {
  const profile = await profileByChatId(chatId);
  if (!profile) return null;

  const tz = profile.timezone ?? 'UTC';
  const now = new Date();
  const db = getDb();
  const events = await db.query.timetableEvents.findMany({
    where: and(
      eq(timetableEvents.user_id, profile.id as string),
      gte(timetableEvents.start_time, now)
    ),
    orderBy: [asc(timetableEvents.start_time)],
    limit: 3,
  });

  if (events.length === 0) {
    return (
      `⏭ <b>Up next</b>\n\nNothing scheduled ahead on your timetable.\n\n` +
      `<a href="${WEB_ORIGIN}/timetable">Add a task</a>`
    );
  }

  const lines = events.map((ev) => {
    const st = new Date(ev.start_time as string | Date);
    const { time, day } = formatInTz(st, tz);
    return `• <b>${day}</b> ${time} — ${ev.title}`;
  });

  return `⏭ <b>Up next</b>\n\n${lines.join('\n')}\n\n<a href="${WEB_ORIGIN}/timetable">Open timetable</a>`;
}

export async function buildExamsMessage(chatId: number): Promise<string | null> {
  const profile = await profileByChatId(chatId);
  if (!profile) return null;

  const now = new Date();
  const db = getDb();
  const exams = await db.query.examCountdowns.findMany({
    where: and(
      eq(examCountdowns.user_id, profile.id as string),
      gte(examCountdowns.exam_date, now)
    ),
    orderBy: [asc(examCountdowns.exam_date)],
    limit: 8,
  });

  if (exams.length === 0) {
    return (
      `🎯 <b>Exam countdowns</b>\n\nNo upcoming exams tracked.\n\n` +
      `<a href="${WEB_ORIGIN}/countdown">Add countdown</a>`
    );
  }

  const lines = exams.map((ex) => {
    const d = new Date(ex.exam_date as string | Date);
    const days = Math.max(0, Math.ceil((d.getTime() - now.getTime()) / 86400000));
    const title = (ex.title as string) || 'Exam';
    return `• <b>${days}d</b> — ${title}`;
  });

  return `🎯 <b>Exam countdowns</b>\n\n${lines.join('\n')}\n\n<a href="${WEB_ORIGIN}/countdown">Open countdowns</a>`;
}

export async function getProfileUserIdByChatId(chatId: number): Promise<string | null> {
  const profile = await profileByChatId(chatId);
  return profile?.id ?? null;
}
