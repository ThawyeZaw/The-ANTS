import type {
  CompositeGradeResult,
  GradeBoundary,
  PaperComponent,
  PaperGradeResult,
  PaperSelectionOptions,
  QualificationPlugin,
} from './types';
import {
  caiePaperBase,
  fallbackLetterGrade,
  gradeFromRawMarks,
  lookupGrade,
  percentageOf,
} from './shared';

/**
 * Syllabi that publish Core vs Extended paper pairs.
 * Shared papers (practicals, coursework) stay available for both tiers.
 */
const TIERED_SYLLABI: Record<string, { core: string[]; extended: string[]; shared: string[] }> = {
  '0580': { core: ['1', '3'], extended: ['2', '4'], shared: ['5'] },
  '0610': { core: ['1', '3'], extended: ['2', '4'], shared: ['5', '6'] },
  '0620': { core: ['1', '3'], extended: ['2', '4'], shared: ['5', '6'] },
  '0625': { core: ['1', '3'], extended: ['2', '4'], shared: ['5', '6'] },
  '0653': { core: ['1', '3'], extended: ['2', '4'], shared: ['5', '6'] },
};

const ZONE4_ALLOWED: Record<string, string[]> = {
  '0580': ['21', '22', '23', '41', '42', '43'], // Kept core for completeness, though extended is primary
  '0606': ['11', '12', '13', '21', '22', '23'],
  '0625': ['21', '22', '23', '41', '42', '43', '61', '62', '63'],
  '0620': ['21', '22', '23', '41', '42', '43', '61', '62', '63'],
  '0610': ['21', '22', '23', '41', '42', '43', '61', '62', '63'],
  '0478': ['11', '12', '13', '21', '22', '23'],
  '0417': ['11', '12', '13', '21', '22', '02', '31', '32', '03'],
  '0500': ['11', '12', '13', '21', '22', '23', '31', '32', '33'],
  '0510': ['11', '12', '13', '21', '22', '23', '04'],
  '0455': ['11', '12', '13', '21', '22', '23'],
  '0450': ['11', '12', '13', '21', '22', '23'],
  '0452': ['11', '12', '13', '21', '22', '23'],
};

function filterByTierAndVariant(
  papers: PaperComponent[],
  opts: PaperSelectionOptions
): PaperComponent[] {
  let list = papers;

  const code = opts.syllabusCode;
  const allowedZone4 = code ? ZONE4_ALLOWED[code] : undefined;

  if (allowedZone4) {
    list = list.filter((p) => allowedZone4.includes(p.paperNumber));
  } else if (opts.variant) {
    const withVariant = list.filter((p) => (p.variant ?? '2') === opts.variant);
    if (withVariant.length > 0) list = withVariant;
  }

  const spec = code ? TIERED_SYLLABI[code] : undefined;
  if (spec && opts.tier) {
    const allowedBase = new Set(opts.tier === 'core' ? [...spec.core, ...spec.shared] : [...spec.extended, ...spec.shared]);
    list = list.filter((p) => allowedBase.has(caiePaperBase(p.paperNumber)));
  }

  // Assign exclusiveGroups based on known mutually exclusive options
  const out: PaperComponent[] = [];
  for (const p of list) {
    let exclusiveGroup: string | undefined = undefined;
    const base = caiePaperBase(p.paperNumber);
    if (['0610', '0620', '0625'].includes(code ?? '') && (base === '5' || base === '6')) {
      exclusiveGroup = 'practical';
    } else if (code === '0417') {
      if (base === '2') exclusiveGroup = 'practicalA';
      if (base === '3') exclusiveGroup = 'practicalB';
    }

    out.push({ ...p, exclusiveGroup });
  }

  if (allowedZone4) {
    // If strict mapping, don't deduplicate by base because exclusiveGroup will handle the UI choice!
    return out.sort((a, b) =>
      a.paperNumber.localeCompare(b.paperNumber, undefined, { numeric: true })
    );
  }

  // Fallback deduplication for subjects not in our Zone 4 explicit list
  const seen = new Set<string>();
  const unique: PaperComponent[] = [];
  for (const p of out) {
    const key = caiePaperBase(p.paperNumber);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  return unique.sort((a, b) =>
    caiePaperBase(a.paperNumber).localeCompare(caiePaperBase(b.paperNumber), undefined, { numeric: true })
  );
}

function composite(
  papers: Array<PaperComponent & { rawMark: number }>,
  compositeBoundaries?: GradeBoundary[]
): CompositeGradeResult {
  const filled = papers.filter((p) => Number.isFinite(p.rawMark));
  const totalRaw = filled.reduce((sum, p) => sum + p.rawMark, 0);
  const maxRaw = filled.reduce((sum, p) => sum + p.maxMark, 0);
  const percentage = percentageOf(totalRaw, maxRaw);

  if (compositeBoundaries && compositeBoundaries.length > 0) {
    return {
      grade: lookupGrade(totalRaw, compositeBoundaries),
      totalRaw,
      maxRaw,
      percentage,
      usedCompositeBoundaries: true,
    };
  }

  return {
    grade: fallbackLetterGrade(percentage),
    totalRaw,
    maxRaw,
    percentage,
    usedCompositeBoundaries: false,
  };
}

export const caieIgcsePlugin: QualificationPlugin = {
  key: 'CAIE_IGCSE',
  countdownMode: 'per_subject',
  hasTiers: true,
  defaultVariant: '2',
  paperSelectionRules: filterByTierAndVariant,
  gradeFromRawMark: (raw, max, boundaries): PaperGradeResult =>
    gradeFromRawMarks(raw, max, boundaries, 'AG'),
  compositeGrade: composite,
};

export function syllabusHasTiers(syllabusCode: string | null | undefined): boolean {
  return Boolean(syllabusCode && TIERED_SYLLABI[syllabusCode]);
}

export function examPaperMatchesTier(
  paperNumber: string,
  syllabusCode: string | null | undefined,
  tier: 'core' | 'extended' | null | undefined
): boolean {
  if (!tier) return true;
  const spec = syllabusCode ? TIERED_SYLLABI[syllabusCode] : undefined;
  if (!spec) return true;
  const base = caiePaperBase(paperNumber);
  const allowed = new Set(tier === 'core' ? [...spec.core, ...spec.shared] : [...spec.extended, ...spec.shared]);
  return allowed.has(base);
}
