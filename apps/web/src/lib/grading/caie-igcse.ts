import type {
  CompositeGradeResult,
  GradeBoundary,
  PaperComponent,
  PaperGradeResult,
  PaperSelectionOptions,
  QualificationPlugin,
} from './types';
import { CAIE_IGCSE_PRACTICE_VARIANTS } from '@/lib/exam-papers/myanmar-papers';
import {
  caiePaperBase,
  fallbackLetterGrade,
  gradeFromRawMarks,
  lookupGrade,
  percentageOf,
  toCambridgePaperId,
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

function filterByTierAndVariant(
  papers: PaperComponent[],
  opts: PaperSelectionOptions
): PaperComponent[] {
  let list = papers;

  const code = opts.syllabusCode;
  const practiceVariants = code ? CAIE_IGCSE_PRACTICE_VARIANTS[code] : undefined;

  if (practiceVariants) {
    list = list.filter((p) =>
      practiceVariants.includes(toCambridgePaperId(p.paperNumber, p.variant))
    );
  }
  if (opts.variant) {
    const withVariant = list.filter((p) => (p.variant ?? '2') === opts.variant);
    if (withVariant.length > 0) list = withVariant;
  }

  const spec = code ? TIERED_SYLLABI[code] : undefined;
  if (spec && opts.tier) {
    const allowedBase = new Set(
      opts.tier === 'core' ? [...spec.core, ...spec.shared] : [...spec.extended, ...spec.shared]
    );
    list = list.filter((p) => allowedBase.has(caiePaperBase(p.paperNumber)));
  }

  const out: PaperComponent[] = [];
  for (const p of list) {
    let exclusiveGroup: string | undefined = undefined;
    const base = caiePaperBase(p.paperNumber);
    if (['0610', '0620', '0625'].includes(code ?? '') && (base === '5' || base === '6')) {
      exclusiveGroup = 'practical';
    }
    out.push({ ...p, exclusiveGroup });
  }

  const seen = new Set<string>();
  const unique: PaperComponent[] = [];
  for (const p of out) {
    const key = caiePaperBase(p.paperNumber);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  return unique.sort((a, b) =>
    caiePaperBase(a.paperNumber).localeCompare(caiePaperBase(b.paperNumber), undefined, {
      numeric: true,
    })
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
  if (syllabusCode === '4MA1') {
    const want = tier === 'core' ? 'F' : 'H';
    return paperNumber.includes(want);
  }
  const spec = syllabusCode ? TIERED_SYLLABI[syllabusCode] : undefined;
  if (!spec) return true;
  const base = caiePaperBase(paperNumber);
  const allowed = new Set(
    tier === 'core' ? [...spec.core, ...spec.shared] : [...spec.extended, ...spec.shared]
  );
  return allowed.has(base);
}
