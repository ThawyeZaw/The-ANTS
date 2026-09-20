import { EXAM_SERIES_DATES } from '@/constants/qualifications';

export const DEFAULT_EXAM_SESSION = 'Oct/Nov 2026';

export const EXAM_SESSION_OPTIONS = [
  'May/June 2026',
  'Oct/Nov 2026',
  'Jan 2027',
  'May/June 2027',
  'Oct/Nov 2027',
] as const;

const IGCSE_SESSIONS = ['Oct/Nov 2026', 'May/June 2027', 'Oct/Nov 2027'] as const;
const IAL_SESSIONS = ['Oct/Nov 2026', 'Jan 2027', 'May/June 2027', 'Oct/Nov 2027'] as const;

export function sessionOptionsForCurriculum(code: string | null | undefined): readonly string[] {
  if (code === 'EDEXCEL_IAL') return IAL_SESSIONS;
  if (code === 'CAIE_IGCSE' || code === 'CAIE_ALEVEL' || code === 'CAIE_AL' || code === 'EDEXCEL_IGCSE') {
    return IGCSE_SESSIONS;
  }
  return EXAM_SESSION_OPTIONS;
}

export interface ParsedSession {
  season: string;
  year: number;
  label: string;
}

const SEASON_ALIASES: Record<string, string> = {
  'may/june': 'May/June',
  'may/jun': 'May/June',
  june: 'May/June',
  summer: 'May/June',
  s: 'May/June',
  'oct/nov': 'Oct/Nov',
  'oct/november': 'Oct/Nov',
  winter: 'Oct/Nov',
  w: 'Oct/Nov',
  'feb/march': 'Feb/March',
  'feb/mar': 'Feb/March',
  march: 'Feb/March',
  m: 'Feb/March',
  jan: 'Jan',
  january: 'Jan',
  j: 'Jan',
  november: 'Oct/Nov',
  october: 'Oct/Nov',
};

/** Parse "May/June 2026" or "s26" / "w26" into a canonical session. */
export function parseSessionLabel(label: string | null | undefined): ParsedSession | null {
  if (!label) return null;
  const trimmed = label.trim();

  const compact = trimmed.match(/^([swmj])(\d{2})$/i);
  if (compact) {
    const letter = compact[1].toLowerCase();
    const yy = Number(compact[2]);
    const year = yy >= 50 ? 1900 + yy : 2000 + yy;
    const season =
      letter === 's' ? 'May/June' : letter === 'w' ? 'Oct/Nov' : letter === 'm' ? 'Feb/March' : 'Jan';
    return { season, year, label: `${season} ${year}` };
  }

  const named = trimmed.match(
    /^(may\/june|may\/jun|oct\/nov|feb\/march|feb\/mar|jan(?:uary)?|june|summer|winter)\s+(\d{4})$/i
  );
  if (named) {
    const season = SEASON_ALIASES[named[1].toLowerCase()] ?? named[1];
    const year = Number(named[2]);
    return { season, year, label: `${season} ${year}` };
  }

  return null;
}

export function sessionCodeToLabel(code: string): string {
  const parsed = parseSessionLabel(code);
  return parsed?.label ?? code;
}

export function formatExamSeriesLabel(
  season?: string | null,
  series?: string | null
): string | null {
  if (series) {
    const labeled = sessionCodeToLabel(series);
    if (labeled !== series) return labeled;
    if (season && /^\d{4}$/.test(series)) return `${season} ${series}`;
    if (season && !series.toLowerCase().includes(season.toLowerCase())) {
      return `${season} ${series}`;
    }
    return labeled;
  }
  return season ?? null;
}

export function examMatchesSession(
  exam: { season?: string | null; series?: string | null; exam_date?: Date | string | number | null },
  sessionLabel: string
): boolean {
  const wanted = parseSessionLabel(sessionLabel);
  if (!wanted) return false;

  const season = exam.season ? SEASON_ALIASES[exam.season.toLowerCase()] ?? exam.season : null;
  const seriesAsSession = exam.series ? parseSessionLabel(exam.series) : null;

  if (season && season === wanted.season) {
    if (seriesAsSession) return seriesAsSession.year === wanted.year;
    if (exam.series && /^\d{4}$/.test(exam.series)) return Number(exam.series) === wanted.year;
    if (exam.exam_date) {
      const d = new Date(exam.exam_date);
      if (!Number.isNaN(d.getTime())) return d.getFullYear() === wanted.year;
    }
    return true;
  }

  if (seriesAsSession) {
    return seriesAsSession.season === wanted.season && seriesAsSession.year === wanted.year;
  }

  return false;
}

export function placeholderDateForSession(sessionLabel: string): Date {
  const range = EXAM_SERIES_DATES[sessionLabel];
  if (range?.start) return new Date(`${range.start}T02:30:00.000Z`);
  const parsed = parseSessionLabel(sessionLabel);
  if (parsed) {
    const month =
      parsed.season === 'May/June' ? 5 : parsed.season === 'Oct/Nov' ? 10 : parsed.season === 'Jan' ? 0 : 2;
    return new Date(Date.UTC(parsed.year, month, 4, 2, 30, 0));
  }
  return new Date(Date.now() + 90 * 86400000);
}
