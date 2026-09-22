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
 * Cambridge component weighting factor as an exact ratio (weighted = raw × num / den).
 * Syllabus grade thresholds, including A*, are on the sum of those weighted marks.
 * They are not raw totals and not the 90–100 percentage-uniform-mark band.
 *
 * Sources: Cambridge "Syllabus component weighting factors" (June 2021 and
 * November 2025–June 2026) plus the IGCSE grade-threshold booklets.
 * `rawMax` selects the syllabus version when the paper total changed.
 */
interface WeightRatio {
  num: number;
  den: number;
  rawMax?: number;
}

const IDENTITY: WeightRatio = { num: 1, den: 1 };

/** Papers whose raw mark is already the weighted mark (factor 1) are omitted. */
const WEIGHT_RATIOS: Record<string, Record<string, WeightRatio[]>> = {
  // 2022: P1 100→120 (×1.2), P2/P3 80→90 (×1.125). From 2023: P1 80→112 (×1.4), P2/P3 70→84 (×1.2).
  '0417': {
    '1': [
      { rawMax: 100, num: 6, den: 5 },
      { rawMax: 80, num: 7, den: 5 },
    ],
    '2': [
      { rawMax: 80, num: 9, den: 8 },
      { rawMax: 70, num: 6, den: 5 },
    ],
    '3': [
      { rawMax: 80, num: 9, den: 8 },
      { rawMax: 70, num: 6, den: 5 },
    ],
  },
  // Paper 1: 35 → 43. Paper 2: 100 → 100.
  '0452': {
    '1': [{ num: 43, den: 35 }],
    '2': [IDENTITY],
  },
  // Paper 1: 30 → 45. Paper 2: 90 → 105.
  '0455': {
    '1': [{ num: 3, den: 2 }],
    '2': [{ num: 7, den: 6 }],
  },
  // MCQ ×1.5, theory ×1.25, practical ×1. Total weighted option mark is 200.
  '0610': {
    '1': [{ num: 3, den: 2 }],
    '2': [{ num: 3, den: 2 }],
    '3': [{ num: 5, den: 4 }],
    '4': [{ num: 5, den: 4 }],
    '5': [IDENTITY],
    '6': [IDENTITY],
  },
  '0620': {
    '1': [{ num: 3, den: 2 }],
    '2': [{ num: 3, den: 2 }],
    '3': [{ num: 5, den: 4 }],
    '4': [{ num: 5, den: 4 }],
    '5': [IDENTITY],
    '6': [IDENTITY],
  },
  '0625': {
    '1': [{ num: 3, den: 2 }],
    '2': [{ num: 3, den: 2 }],
    '3': [{ num: 5, den: 4 }],
    '4': [{ num: 5, den: 4 }],
    '5': [IDENTITY],
    '6': [IDENTITY],
  },
  '0653': {
    '1': [{ num: 3, den: 2 }],
    '2': [{ num: 3, den: 2 }],
    '3': [{ num: 5, den: 4 }],
    '4': [{ num: 5, den: 4 }],
    '5': [IDENTITY],
    '6': [IDENTITY],
  },
  // Speaking & Listening is endorsed (factor 0) and is not part of the syllabus grade.
  '0500': {
    '4': [{ num: 0, den: 1 }],
  },
};

function eslWeight(base: string, rawMax: number, optionMax: number): WeightRatio {
  // Through 2023 the weighted total is 200: Reading/Writing 140 + Listening 60. Speaking is endorsed.
  const legacy = optionMax >= 180;
  if (legacy) {
    if (base === '1') return { num: 7, den: 3 }; // 60 → 140
    if (base === '2') return { num: 7, den: 4 }; // 80 → 140
    if (base === '3') return { num: 2, den: 1 }; // 30 → 60
    if (base === '4') return { num: 3, den: 2 }; // 40 → 60
    return { num: 0, den: 1 };
  }
  // From 2024 the weighted total is 150: Paper 1 60→105, Paper 2 40→45. Component 3 is endorsed speaking.
  if (base === '1') return { num: 7, den: 4 };
  if (base === '2') return rawMax >= 70 ? { num: 7, den: 4 } : { num: 9, den: 8 };
  if (base === '3') return rawMax <= 30 ? { num: 2, den: 1 } : { num: 0, den: 1 };
  if (base === '4') return { num: 3, den: 2 };
  return { num: 0, den: 1 };
}

function weightRatioFor(
  syllabus: string | undefined,
  base: string,
  rawMax: number,
  optionMax: number
): WeightRatio {
  if (syllabus === '0510') return eslWeight(base, rawMax, optionMax);
  const rules = syllabus ? WEIGHT_RATIOS[syllabus]?.[base] : undefined;
  if (!rules || rules.length === 0) return IDENTITY;
  const exact = rules.find((r) => r.rawMax == null || r.rawMax === rawMax);
  if (exact) return exact;
  return rules[rules.length - 1];
}

function roundWeighted(raw: number, ratio: WeightRatio): number {
  if (ratio.num === 0) return 0;
  return Math.round((raw * ratio.num) / ratio.den);
}

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

function optionMaxFromBoundaries(rows: GradeBoundary[]): number {
  let max = 0;
  for (const row of rows) {
    if (typeof row.max_mark === 'number' && row.max_mark > max) max = row.max_mark;
  }
  return max;
}

/** Bottom of the percentage-uniform-mark band Cambridge prints with each IGCSE grade. */
const PUM_FLOOR: Record<string, number> = {
  'A*': 90,
  A: 80,
  B: 70,
  C: 60,
  D: 50,
  E: 40,
  F: 30,
  G: 20,
};

const PUM_GRADE_ORDER = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

/**
 * Statement-of-results percentage for a weighted syllabus total.
 * The grade threshold maps to the bottom of that grade's band (A* = 90).
 * The next higher threshold, or the maximum mark for A*, maps to the top.
 * Rounded to an integer. A mark does not round up into the next grade's band.
 * Ungraded has no percentage uniform mark.
 */
function percentageUniformMark(
  weighted: number,
  grade: string,
  boundaries: GradeBoundary[],
  optionMax: number
): number | null {
  const floor = PUM_FLOOR[grade];
  if (floor == null) return null;
  const row = boundaries.find((b) => b.grade === grade);
  if (!row) return null;

  const lower = row.min_mark;
  const rank = PUM_GRADE_ORDER.indexOf(grade);
  let upper = optionMax;
  if (rank > 0) {
    const next = boundaries.find((b) => b.grade === PUM_GRADE_ORDER[rank - 1]);
    if (next) upper = next.min_mark;
    else if (typeof row.max_mark === 'number' && row.max_mark >= lower) upper = row.max_mark + 1;
  } else if (!(optionMax > lower) && typeof row.max_mark === 'number') {
    upper = row.max_mark;
  }

  if (upper <= lower) return floor;
  const pum = Math.round(floor + ((weighted - lower) / (upper - lower)) * 10);
  const cap = grade === 'A*' ? 100 : floor + 9;
  return Math.min(cap, Math.max(floor, pum));
}

function composite(
  papers: Array<PaperComponent & { rawMark: number }>,
  compositeBoundaries?: GradeBoundary[]
): CompositeGradeResult {
  const sitting = papers.filter((p) => Number.isFinite(p.rawMark) && p.maxMark > 0);
  const maxRaw = sitting.reduce((sum, p) => sum + p.maxMark, 0);

  const syllabus = sitting.find((p) => p.syllabusCode)?.syllabusCode;
  const optionRows =
    compositeBoundaries && compositeBoundaries.length > 0
      ? pickMatchingCompositeBoundaries(compositeBoundaries, sitting)
      : [];
  const optionMax = optionMaxFromBoundaries(optionRows);

  const ratios = sitting.map((p) =>
    weightRatioFor(
      syllabus,
      caiePaperBase(toCambridgePaperId(p.paperNumber, p.variant)),
      p.maxMark,
      optionMax
    )
  );
  const weightedParts = sitting.map((p, i) => roundWeighted(p.rawMark, ratios[i]));
  const weightedMax = sitting.reduce((sum, p, i) => sum + roundWeighted(p.maxMark, ratios[i]), 0);
  const total = weightedParts.reduce((sum, mark) => sum + mark, 0);
  const cap = optionMax > 0 ? optionMax : weightedMax > 0 ? weightedMax : maxRaw;

  if (optionRows.length === 0) {
    return {
      grade: '—',
      totalRaw: total,
      maxRaw: cap,
      percentage: 0,
      uniformMark: null,
      usedCompositeBoundaries: false,
    };
  }

  const grade = lookupGrade(total, optionRows);
  const uniformMark = percentageUniformMark(total, grade, optionRows, cap);

  return {
    grade,
    totalRaw: total,
    maxRaw: cap,
    percentage: uniformMark ?? 0,
    uniformMark,
    usedCompositeBoundaries: true,
    aStarNotes: [
      uniformMark != null
        ? `${uniformMark}% is the percentage uniform mark Cambridge prints with grade ${grade}. It comes from the weighted syllabus total, not from the raw marks divided by the paper maximum.`
        : 'Ungraded has no percentage uniform mark. The total shown is the weighted syllabus mark.',
    ],
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
