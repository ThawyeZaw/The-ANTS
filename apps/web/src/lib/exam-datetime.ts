export const MYANMAR_TIME_ZONE = 'Asia/Yangon';

export function formatExamDateTime(value: string | Date | number | null | undefined): string {
  if (value == null || value === '') return 'Date TBD';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date TBD';
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: MYANMAR_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${formatted} MMT`;
}

export function myanmarDateTimeIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00+06:30`).toISOString();
}

/** Date and time inputs in Myanmar time, for editing a personal countdown. */
export function myanmarDateTimeParts(value: string | Date | number | null | undefined): {
  date: string;
  time: string;
} {
  if (value == null || value === '') return { date: '', time: '09:00' };
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '09:00' };

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MYANMAR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const hour = pick('hour') === '24' ? '00' : pick('hour');

  return {
    date: `${pick('year')}-${pick('month')}-${pick('day')}`,
    time: `${hour}:${pick('minute') || '00'}`,
  };
}
