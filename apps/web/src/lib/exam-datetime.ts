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
