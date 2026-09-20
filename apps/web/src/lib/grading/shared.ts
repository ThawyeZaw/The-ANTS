import type { GradeBoundary, PaperGradeResult } from './types';

/** Lookup a letter/number grade from sorted-descending min_mark boundaries. */
export function lookupGrade(
  rawScore: number,
  boundaries: GradeBoundary[]
): string {
  if (!boundaries.length) return '—';
  const sorted = [...boundaries].sort((a, b) => b.min_mark - a.min_mark);
  for (const b of sorted) {
    if (rawScore >= b.min_mark) return b.grade;
  }
  return 'U';
}

export function umsCapFromBoundaries(boundaries: GradeBoundary[]): number {
  const cap = Math.max(0, ...boundaries.map((b) => b.ums_max ?? b.ums_min ?? 0));
  return cap > 0 ? cap : 0;
}

/** Lookup a unit grade from official UMS bands. */
export function gradeFromUms(
  umsScore: number,
  boundaries: GradeBoundary[]
): PaperGradeResult {
  const cap = umsCapFromBoundaries(boundaries);
  const percentage = percentageOf(umsScore, cap || 100);
  if (!boundaries.length) {
    return { grade: '—', ums: umsScore, percentage };
  }
  const sorted = [...boundaries].sort((a, b) => (b.ums_min ?? 0) - (a.ums_min ?? 0));
  for (const b of sorted) {
    if (umsScore >= (b.ums_min ?? 0)) {
      return { grade: b.grade, ums: umsScore, percentage };
    }
  }
  return { grade: 'U', ums: umsScore, percentage };
}

export function percentageOf(raw: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((raw / max) * 1000) / 10;
}

/** Percentage bands used only when a series has no official boundaries. */
export function fallbackLetterGrade(percentage: number): string {
  if (percentage >= 80) return 'A*';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  if (percentage >= 30) return 'E';
  return 'U';
}

export function fallbackNineOneGrade(percentage: number): string {
  if (percentage >= 90) return '9';
  if (percentage >= 80) return '8';
  if (percentage >= 70) return '7';
  if (percentage >= 60) return '6';
  if (percentage >= 50) return '5';
  if (percentage >= 40) return '4';
  if (percentage >= 30) return '3';
  if (percentage >= 20) return '2';
  if (percentage >= 10) return '1';
  return 'U';
}

export function gradeFromRawMarks(
  raw: number,
  max: number,
  boundaries: GradeBoundary[],
  _scale: 'AG' | '91' = 'AG'
): PaperGradeResult {
  const percentage = percentageOf(raw, max);
  if (!boundaries.length) {
    return { grade: '—', percentage };
  }
  return { grade: lookupGrade(raw, boundaries), percentage };
}

/** Linear interpolation of UMS within the matched raw-mark band (Edexcel IAL). */
export function computeUms(
  rawScore: number,
  boundaries: GradeBoundary[]
): { ums: number; grade: string } {
  if (!boundaries.length) {
    return { ums: 0, grade: '—' };
  }

  const cap =
    Math.max(
      0,
      ...boundaries.map((b) => b.ums_max ?? b.ums_min ?? 0)
    ) || 100;

  const sorted = [...boundaries].sort((a, b) => b.min_mark - a.min_mark);
  for (const b of sorted) {
    if (rawScore >= b.min_mark) {
      const umsMin = b.ums_min ?? 0;
      const umsMax = b.ums_max ?? umsMin;
      const minM = b.min_mark;
      const maxM = b.max_mark ?? minM;
      const span = maxM - minM > 0 ? maxM - minM : 1;
      const ratio = Math.min(1, Math.max(0, (rawScore - minM) / span));
      const ums = Math.round(umsMin + ratio * (umsMax - umsMin));
      return { ums: Math.min(cap, Math.max(0, ums)), grade: b.grade };
    }
  }

  return { ums: 0, grade: 'U' };
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A*':
    case '9':
    case '8':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    case 'A':
    case '7':
      return 'text-sky-500 bg-sky-500/10 border-sky-500/30';
    case 'B':
    case '6':
      return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30';
    case 'C':
    case '5':
    case '4':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    default:
      return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
  }
}

/** First digit of CAIE paper codes like "12" / "42" / "02". */
export function caiePaperBase(paperNumber: string): string {
  const digits = paperNumber.replace(/\D/g, '');
  if (digits.length >= 2 && digits[0] !== '0') return digits[0];
  if (digits.length >= 2 && digits[0] === '0') return digits[1];
  return digits || paperNumber;
}


/** Combined CAIE paper id (e.g. paper 2 + variant 2 -> "22"). */
export function toCambridgePaperId(paperNumber: string, variant?: string | null): string {
  const trimmed = paperNumber.trim();
  const digits = trimmed.replace(/\D/g, '');
  // Already a Cambridge component ("12", unvarianted "02"/"03").
  if (digits.length >= 2) return trimmed;
  const base = digits || trimmed;
  const v = (variant ?? '2').trim();
  return `${base}${v}`;
}

const CAIE_ZONE_VARIANTS = new Set(['1', '2', '3']);

export function uniqueVariants(papers: { variant?: string | null }[]): string[] {
  const set = new Set<string>();
  for (const p of papers) {
    if (p.variant && CAIE_ZONE_VARIANTS.has(p.variant)) set.add(p.variant);
  }
  return [...set].sort();
}
