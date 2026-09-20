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
    const base = caiePaperBase(toCambridgePaperId(p.paperNumber, p.variant));
    if (['0610', '0620', '0625'].includes(code ?? '') && (base === '5' || base === '6')) {
      exclusiveGroup = 'practical';
    }
    if (code === '0500' && (base === '2' || base === '3')) {
      exclusiveGroup = 'writing';
    }
    out.push({ ...p, exclusiveGroup });
  }

  const seen = new Set<string>();
  const unique: PaperComponent[] = [];
  for (const p of out) {
    const key = caiePaperBase(toCambridgePaperId(p.paperNumber, p.variant));
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  return unique.sort((a, b) =>
    caiePaperBase(toCambridgePaperId(a.paperNumber, a.variant)).localeCompare(
      caiePaperBase(toCambridgePaperId(b.paperNumber, b.variant)),
      undefined,
      { numeric: true }
    )
  );
}

/**
 * Official syllabus weighting as % of the Cambridge *weighted* option total.
 * Component tables in the GB PDFs are raw A–G; A* is overall-only after weighting.
 */
const SYLLABUS_WEIGHT_PCT: Record<string, Record<string, number>> = {
  '0580': { '1': 35, '2': 35, '3': 65, '4': 65 },
  '0606': { '1': 50, '2': 50 },
  '0610': { '1': 30, '2': 30, '3': 50, '4': 50, '5': 20, '6': 20 },
  '0620': { '1': 30, '2': 30, '3': 50, '4': 50, '5': 20, '6': 20 },
  '0625': { '1': 30, '2': 30, '3': 50, '4': 50, '5': 20, '6': 20 },
  '0653': { '1': 30, '2': 30, '3': 50, '4': 50, '5': 20, '6': 20 },
  '0417': { '1': 40, '2': 30, '3': 30 },
  '0450': { '1': 50, '2': 50 },
  '0452': { '1': 30, '2': 70 },
  '0455': { '1': 30, '2': 70 },
  '0478': { '1': 50, '2': 50 },
  '0500': { '1': 50, '2': 50, '3': 50 },
  '0510': { '1': 50, '2': 25, '3': 25 },
};

/** Pre-2024 ESL 0510 count-in speaking was 70 / 15 / 15 on a 200-mark syllabus total. */
const ESL_LEGACY_WEIGHT_PCT: Record<string, number> = { '1': 70, '2': 15, '3': 15, '5': 15 };

const OPTION_ID_RE = /^sgb-\d{4}-[msw]\d{2}-[A-Za-z0-9]+-(.+)-(Astar|[A-GU])$/;

function padComponent(code: string): string {
  const digits = code.replace(/\D/g, '');
  if (!digits) return code;
  return digits.length >= 2 ? digits.slice(0, 2) : digits.padStart(2, '0');
}

function optionKeyFromSourceId(sourceId: string | undefined): string | null {
  if (!sourceId) return null;
  const m = OPTION_ID_RE.exec(sourceId);
  if (!m) {
    const trimmed = sourceId.replace(/-(Astar|[A-GU])$/, '');
    return trimmed === sourceId ? null : trimmed;
  }
  return sourceId.slice(0, sourceId.length - m[2].length - 1);
}

function optionComponentsFromSourceId(sourceId: string | undefined): string[] {
  if (!sourceId) return [];
  const m = OPTION_ID_RE.exec(sourceId);
  if (!m) return [];
  return m[1].split('-').map(padComponent).filter(Boolean);
}

function pickMatchingCompositeBoundaries(
  rows: GradeBoundary[],
  papers: PaperComponent[]
): GradeBoundary[] {
  if (rows.length === 0) return [];
  const paperIds = new Set(
    papers.map((p) => padComponent(toCambridgePaperId(p.paperNumber, p.variant)))
  );

  const groups = new Map<string, GradeBoundary[]>();
  for (const row of rows) {
    const key = optionKeyFromSourceId(row.sourceId) ?? '__all__';
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  if (groups.size <= 1) return rows;

  let best: GradeBoundary[] = rows;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const [key, group] of groups) {
    if (key === '__all__') continue;
    const comps = new Set(optionComponentsFromSourceId(group[0]?.sourceId));
    if (comps.size === 0) continue;
    let overlap = 0;
    for (const id of paperIds) {
      if (comps.has(id)) overlap += 1;
    }
    const extraOption = comps.size - overlap;
    const extraPapers = paperIds.size - overlap;
    const exact = extraOption === 0 && extraPapers === 0 ? 100 : 0;
    const score = exact + overlap * 10 - extraOption * 3 - extraPapers;
    if (score > bestScore) {
      bestScore = score;
      best = group;
    }
  }
  return best;
}

function weightsForSyllabus(
  syllabus: string | undefined,
  optionMax: number
): Record<string, number> | undefined {
  if (!syllabus) return undefined;
  if (syllabus === '0510' && optionMax >= 180) return ESL_LEGACY_WEIGHT_PCT;
  return SYLLABUS_WEIGHT_PCT[syllabus];
}

function optionMaxFromBoundaries(rows: GradeBoundary[]): number {
  let max = 0;
  for (const row of rows) {
    if (typeof row.max_mark === 'number' && row.max_mark > max) max = row.max_mark;
  }
  return max;
}

function composite(
  papers: Array<PaperComponent & { rawMark: number }>,
  compositeBoundaries?: GradeBoundary[]
): CompositeGradeResult {
  const sitting = papers.filter((p) => Number.isFinite(p.rawMark) && p.maxMark > 0);
  const totalRaw = sitting.reduce((sum, p) => sum + p.rawMark, 0);
  const maxRaw = sitting.reduce((sum, p) => sum + p.maxMark, 0);

  if (!compositeBoundaries || compositeBoundaries.length === 0) {
    return {
      grade: '—',
      totalRaw,
      maxRaw,
      percentage: percentageOf(totalRaw, maxRaw),
      usedCompositeBoundaries: false,
    };
  }

  const optionRows = pickMatchingCompositeBoundaries(compositeBoundaries, sitting);
  const optionMax = optionMaxFromBoundaries(optionRows);
  const syllabus = sitting.find((p) => p.syllabusCode)?.syllabusCode;
  const weightMap = weightsForSyllabus(syllabus, optionMax);

  const sittingWeights = sitting.map((p) => {
    const base = caiePaperBase(toCambridgePaperId(p.paperNumber, p.variant));
    return weightMap?.[base] ?? 0;
  });
  const weightSum = sittingWeights.reduce((sum, w) => sum + w, 0);

  let total = totalRaw;
  let cap = maxRaw;
  const notes: string[] = [];

  if (optionMax > 0 && weightSum > 0) {
    cap = optionMax;
    total = 0;
    for (let i = 0; i < sitting.length; i += 1) {
      const p = sitting[i];
      const slice = optionMax * (sittingWeights[i] / weightSum);
      total += (p.rawMark / p.maxMark) * slice;
    }
    total = Math.round(total);
    const unequal = sitting.some((p, i) => {
      if (maxRaw <= 0) return false;
      return Math.abs(p.maxMark / maxRaw - sittingWeights[i] / weightSum) > 0.02;
    });
    notes.push(
      unequal
        ? 'Overall A* uses Cambridge weighted syllabus marks, not raw paper totals. A* is not awarded on individual papers.'
        : 'A* is awarded on the overall syllabus total only, not on individual papers.'
    );
  } else if (optionMax > 0 && optionMax !== maxRaw) {
    notes.push(
      'Overall boundaries are weighted syllabus marks; official component weights were unavailable so raw totals were used.'
    );
  }

  return {
    grade: lookupGrade(total, optionRows),
    totalRaw: total,
    maxRaw: cap,
    percentage: percentageOf(total, cap),
    usedCompositeBoundaries: true,
    aStarNotes: notes,
  };
}

export const caieIgcsePlugin: QualificationPlugin = {
  key: 'CAIE_IGCSE',
  countdownMode: 'per_paper',
  hasTiers: true,
  defaultVariant: '2',
  paperSelectionRules: filterByTierAndVariant,
  gradeFromRawMark: (raw, max, boundaries): PaperGradeResult =>
    gradeFromRawMarks(
      raw,
      max,
      boundaries.filter((b) => b.grade !== 'A*'),
      'AG'
    ),
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
