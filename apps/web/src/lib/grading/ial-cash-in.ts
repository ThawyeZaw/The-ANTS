import type { AwardLevel } from '@/lib/exam-papers/myanmar-papers';
import { lookupGrade, percentageOf } from './shared';
import type { CompositeGradeResult, GradeBoundary } from './types';

export type IalCashInCode =
  | 'XMA01'
  | 'YMA01'
  | 'XFM01'
  | 'YFM01'
  | 'XPH11'
  | 'YPH11'
  | 'XCH11'
  | 'YCH11'
  | 'XBI11'
  | 'YBI11'
  | 'XCP01'
  | 'YCP01'
  | 'XIT11'
  | 'YIT11'
  | 'XEC11'
  | 'YEC11'
  | 'XBS11'
  | 'YBS11'
  | 'XAC11'
  | 'YAC11'
  | 'XEN01'
  | 'YEN01'
  | 'XET01'
  | 'YET01'
  | 'XPS01'
  | 'YPS01';

export interface IalCashInAward {
  code: IalCashInCode;
  name: string;
  maxUms: number;
  /** Compulsory units that must be included. */
  compulsory: readonly string[];
  /** Optional units the student picks (exclusive groups handled separately). */
  optional: readonly string[];
  unitCount: number;
  aStarTotal?: number;
  aStarNotes?: string;
}

export const IAL_APPLIED_MATH_UNITS = ['WME01', 'WST01', 'WDM11', 'WME02', 'WST02'] as const;

/** Valid YMA01 applied pairings. */
export const YMA01_APPLIED_PAIRS: readonly [string, string][] = [
  ['WME01', 'WST01'],
  ['WME01', 'WME02'],
  ['WST01', 'WST02'],
  ['WME01', 'WDM11'],
  ['WST01', 'WDM11'],
];

export const IAL_CASH_INS: Record<IalCashInCode, IalCashInAward> = {
  XMA01: {
    code: 'XMA01',
    name: 'Mathematics AS',
    maxUms: 300,
    compulsory: ['WMA11', 'WMA12'],
    optional: ['WME01', 'WST01', 'WDM11'],
    unitCount: 3,
  },
  YMA01: {
    code: 'YMA01',
    name: 'Mathematics A Level',
    maxUms: 600,
    compulsory: ['WMA11', 'WMA12', 'WMA13', 'WMA14'],
    optional: ['WME01', 'WST01', 'WDM11', 'WME02', 'WST02'],
    unitCount: 6,
    aStarTotal: 480,
    aStarNotes: 'A* requires ≥480 total UMS and ≥180 UMS across P3 + P4.',
  },
  XFM01: {
    code: 'XFM01',
    name: 'Further Mathematics AS',
    maxUms: 300,
    compulsory: ['WFM01'],
    optional: ['WFM02', 'WFM03', 'WME01', 'WME02', 'WME03', 'WST01', 'WST02', 'WST03', 'WDM11'],
    unitCount: 3,
  },
  YFM01: {
    code: 'YFM01',
    name: 'Further Mathematics A Level',
    maxUms: 600,
    compulsory: ['WFM01'],
    optional: ['WFM02', 'WFM03', 'WME01', 'WME02', 'WME03', 'WST01', 'WST02', 'WST03', 'WDM11'],
    unitCount: 6,
    aStarTotal: 480,
    aStarNotes: 'A* requires ≥480 total UMS and ≥270 UMS across the best 3 A2-level units.',
  },
  XPH11: {
    code: 'XPH11',
    name: 'Physics AS',
    maxUms: 300,
    compulsory: ['WPH11', 'WPH12', 'WPH13'],
    optional: [],
    unitCount: 3,
  },
  YPH11: {
    code: 'YPH11',
    name: 'Physics A Level',
    maxUms: 600,
    compulsory: ['WPH11', 'WPH12', 'WPH13', 'WPH14', 'WPH15', 'WPH16'],
    optional: [],
    unitCount: 6,
    aStarTotal: 480,
  },
  XCH11: {
    code: 'XCH11',
    name: 'Chemistry AS',
    maxUms: 300,
    compulsory: ['WCH11', 'WCH12', 'WCH13'],
    optional: [],
    unitCount: 3,
  },
  YCH11: {
    code: 'YCH11',
    name: 'Chemistry A Level',
    maxUms: 600,
    compulsory: ['WCH11', 'WCH12', 'WCH13', 'WCH14', 'WCH15', 'WCH16'],
    optional: [],
    unitCount: 6,
    aStarTotal: 480,
  },
  XBI11: {
    code: 'XBI11',
    name: 'Biology AS',
    maxUms: 300,
    compulsory: ['WBI11', 'WBI12', 'WBI13'],
    optional: [],
    unitCount: 3,
  },
  YBI11: {
    code: 'YBI11',
    name: 'Biology A Level',
    maxUms: 600,
    compulsory: ['WBI11', 'WBI12', 'WBI13', 'WBI14', 'WBI15', 'WBI16'],
    optional: [],
    unitCount: 6,
    aStarTotal: 480,
  },
  XCP01: {
    code: 'XCP01',
    name: 'Computer Science AS',
    maxUms: 200,
    compulsory: ['WCP01', 'WCP02'],
    optional: [],
    unitCount: 2,
  },
  YCP01: {
    code: 'YCP01',
    name: 'Computer Science A Level',
    maxUms: 400,
    compulsory: ['WCP01', 'WCP02', 'WCP03', 'WCP04'],
    optional: [],
    unitCount: 4,
    aStarTotal: 320,
  },
  XIT11: {
    code: 'XIT11',
    name: 'IT AS',
    maxUms: 200,
    compulsory: ['WIT11', 'WIT12'],
    optional: [],
    unitCount: 2,
  },
  YIT11: {
    code: 'YIT11',
    name: 'IT A Level',
    maxUms: 400,
    compulsory: ['WIT11', 'WIT12', 'WIT13', 'WIT14'],
    optional: [],
    unitCount: 4,
    aStarTotal: 320,
  },
  XEC11: {
    code: 'XEC11',
    name: 'Economics AS',
    maxUms: 200,
    compulsory: ['WEC11', 'WEC12'],
    optional: [],
    unitCount: 2,
  },
  YEC11: {
    code: 'YEC11',
    name: 'Economics A Level',
    maxUms: 400,
    compulsory: ['WEC11', 'WEC12', 'WEC13', 'WEC14'],
    optional: [],
    unitCount: 4,
    aStarTotal: 320,
  },
  XBS11: {
    code: 'XBS11',
    name: 'Business AS',
    maxUms: 200,
    compulsory: ['WBS11', 'WBS12'],
    optional: [],
    unitCount: 2,
  },
  YBS11: {
    code: 'YBS11',
    name: 'Business A Level',
    maxUms: 400,
    compulsory: ['WBS11', 'WBS12', 'WBS13', 'WBS14'],
    optional: [],
    unitCount: 4,
    aStarTotal: 320,
  },
  XAC11: {
    code: 'XAC11',
    name: 'Accounting AS',
    maxUms: 300,
    compulsory: ['WAC11'],
    optional: [],
    unitCount: 1,
  },
  YAC11: {
    code: 'YAC11',
    name: 'Accounting A Level',
    maxUms: 600,
    compulsory: ['WAC11', 'WAC12'],
    optional: [],
    unitCount: 2,
    aStarTotal: 480,
  },
  XEN01: {
    code: 'XEN01',
    name: 'English Language AS',
    maxUms: 200,
    compulsory: ['WEN01', 'WEN02'],
    optional: [],
    unitCount: 2,
  },
  YEN01: {
    code: 'YEN01',
    name: 'English Language A Level',
    maxUms: 400,
    compulsory: ['WEN01', 'WEN02', 'WEN03', 'WEN04'],
    optional: [],
    unitCount: 4,
    aStarTotal: 320,
  },
  XET01: {
    code: 'XET01',
    name: 'English Literature AS',
    maxUms: 200,
    compulsory: ['WET01', 'WET02'],
    optional: [],
    unitCount: 2,
  },
  YET01: {
    code: 'YET01',
    name: 'English Literature A Level',
    maxUms: 400,
    compulsory: ['WET01', 'WET02', 'WET03', 'WET04'],
    optional: [],
    unitCount: 4,
    aStarTotal: 320,
  },
  XPS01: {
    code: 'XPS01',
    name: 'Psychology AS',
    maxUms: 200,
    compulsory: ['WPS01', 'WPS02'],
    optional: [],
    unitCount: 2,
  },
  YPS01: {
    code: 'YPS01',
    name: 'Psychology A Level',
    maxUms: 400,
    compulsory: ['WPS01', 'WPS02', 'WPS03', 'WPS04'],
    optional: [],
    unitCount: 4,
    aStarTotal: 320,
  },
};

const FM_A2_UNITS = new Set(['WFM02', 'WFM03', 'WME02', 'WME03', 'WST02', 'WST03']);

/** Human-readable unit names for enrollment UI. */
export const IAL_UNIT_LABELS: Record<string, string> = {
  WMA11: 'Pure 1',
  WMA12: 'Pure 2',
  WMA13: 'Pure 3',
  WMA14: 'Pure 4',
  WME01: 'Mechanics M1',
  WME02: 'Mechanics M2',
  WME03: 'Mechanics M3',
  WST01: 'Statistics S1',
  WST02: 'Statistics S2',
  WST03: 'Statistics S3',
  WDM11: 'Decision D1',
  WFM01: 'Further Pure F1',
  WFM02: 'Further Pure F2',
  WFM03: 'Further Pure F3',
  WPH11: 'Unit 1',
  WPH12: 'Unit 2',
  WPH13: 'Unit 3',
  WPH14: 'Unit 4',
  WPH15: 'Unit 5',
  WPH16: 'Unit 6',
  WCH11: 'Unit 1',
  WCH12: 'Unit 2',
  WCH13: 'Unit 3',
  WCH14: 'Unit 4',
  WCH15: 'Unit 5',
  WCH16: 'Unit 6',
  WBI11: 'Unit 1',
  WBI12: 'Unit 2',
  WBI13: 'Unit 3',
  WBI14: 'Unit 4',
  WBI15: 'Unit 5',
  WBI16: 'Unit 6',
  WIT11: 'Unit 1',
  WIT12: 'Unit 2',
  WIT13: 'Unit 3',
  WIT14: 'Unit 4',
  WCP01: 'Unit 1',
  WCP02: 'Unit 2',
  WCP03: 'Unit 3',
  WCP04: 'Unit 4',
  WEC11: 'Unit 1',
  WEC12: 'Unit 2',
  WEC13: 'Unit 3',
  WEC14: 'Unit 4',
  WBS11: 'Unit 1',
  WBS12: 'Unit 2',
  WBS13: 'Unit 3',
  WBS14: 'Unit 4',
  WAC11: 'Unit 1',
  WAC12: 'Unit 2',
  WEN01: 'Unit 1',
  WEN02: 'Unit 2',
  WEN03: 'Unit 3',
  WEN04: 'Unit 4',
  WET01: 'Unit 1',
  WET02: 'Unit 2',
  WET03: 'Unit 3',
  WET04: 'Unit 4',
  WPS01: 'Unit 1',
  WPS02: 'Unit 2',
  WPS03: 'Unit 3',
  WPS04: 'Unit 4',
};

export interface IalSubjectGroup {
  key: string;
  label: string;
  asCode: IalCashInCode;
  alevelCode: IalCashInCode;
  /** Cash-in codes with no past papers seeded yet (new spec). */
  papersPending?: boolean;
}

/** IAL subjects grouped for enrollment — AS + A Level per row. */
export const IAL_SUBJECT_GROUPS: IalSubjectGroup[] = [
  { key: 'maths', label: 'Mathematics', asCode: 'XMA01', alevelCode: 'YMA01' },
  { key: 'fmaths', label: 'Further Mathematics', asCode: 'XFM01', alevelCode: 'YFM01' },
  { key: 'phys', label: 'Physics', asCode: 'XPH11', alevelCode: 'YPH11' },
  { key: 'chem', label: 'Chemistry', asCode: 'XCH11', alevelCode: 'YCH11' },
  { key: 'bio', label: 'Biology', asCode: 'XBI11', alevelCode: 'YBI11' },
  { key: 'it', label: 'Information Technology', asCode: 'XIT11', alevelCode: 'YIT11' },
  { key: 'cs', label: 'Computer Science', asCode: 'XCP01', alevelCode: 'YCP01', papersPending: true },
  { key: 'econ', label: 'Economics', asCode: 'XEC11', alevelCode: 'YEC11' },
  { key: 'biz', label: 'Business', asCode: 'XBS11', alevelCode: 'YBS11' },
  { key: 'acc', label: 'Accounting', asCode: 'XAC11', alevelCode: 'YAC11' },
  { key: 'eng', label: 'English Language', asCode: 'XEN01', alevelCode: 'YEN01' },
  { key: 'lit', label: 'English Literature', asCode: 'XET01', alevelCode: 'YET01' },
  { key: 'psych', label: 'Psychology', asCode: 'XPS01', alevelCode: 'YPS01' },
];

export function formatIalUnitLabel(unitCode: string, includeCode = true): string {
  const label = IAL_UNIT_LABELS[unitCode] ?? unitCode;
  return includeCode ? `${label} (${unitCode})` : label;
}

export function formatIalUnitList(codes: readonly string[]): string {
  return codes.map((c) => formatIalUnitLabel(c)).join(', ');
}

export function umsGradeBoundaries(maxUms: number): GradeBoundary[] {
  const a = Math.round(maxUms * 0.8);
  return [
    { grade: 'A*', min_mark: a },
    { grade: 'A', min_mark: a },
    { grade: 'B', min_mark: Math.round(maxUms * 0.7) },
    { grade: 'C', min_mark: Math.round(maxUms * 0.6) },
    { grade: 'D', min_mark: Math.round(maxUms * 0.5) },
    { grade: 'E', min_mark: Math.round(maxUms * 0.4) },
    { grade: 'U', min_mark: 0 },
  ];
}

export function cashInsForUnit(unitCode: string): IalCashInAward[] {
  return Object.values(IAL_CASH_INS).filter(
    (award) => award.compulsory.includes(unitCode) || award.optional.includes(unitCode)
  );
}

/** How many optional units the student must pick for this cash-in award. */
export function requiredOptionalCount(award: IalCashInAward): number {
  return Math.max(0, award.unitCount - award.compulsory.length);
}

export function awardLevelFromCashInCode(code: IalCashInCode): AwardLevel {
  return code.startsWith('Y') ? 'A Level' : 'AS';
}

/** Preset optional-unit picks for awards with structured routes. */
export function optionalUnitPresets(award: IalCashInAward): { label: string; units: string[] }[] {
  const need = requiredOptionalCount(award);
  if (need === 0) return [{ label: 'Standard route', units: [] }];

  if (award.code === 'XMA01') {
    return [
      { label: 'Mechanics M1', units: ['WME01'] },
      { label: 'Statistics S1', units: ['WST01'] },
      { label: 'Decision D1', units: ['WDM11'] },
    ];
  }

  if (award.code === 'YMA01') {
    return YMA01_APPLIED_PAIRS.map(([a, b]) => ({
      label: `${IAL_UNIT_LABELS[a] ?? a} + ${IAL_UNIT_LABELS[b] ?? b}`,
      units: [a, b],
    }));
  }

  if (award.code === 'XFM01') {
    return [
      { label: 'M1 + S1', units: ['WME01', 'WST01'] },
      { label: 'M1 + M2', units: ['WME01', 'WME02'] },
      { label: 'S1 + S2', units: ['WST01', 'WST02'] },
      { label: 'F2 + M1', units: ['WFM02', 'WME01'] },
    ];
  }

  if (award.code === 'YFM01') {
    return [
      { label: 'F1–F3 + M1 + S1', units: ['WFM02', 'WFM03', 'WME01', 'WST01', 'WST02'] },
      { label: 'F1–F3 + M1 + S2', units: ['WFM02', 'WFM03', 'WME01', 'WME02', 'WST01'] },
      { label: 'F1–F3 + S1 + S2', units: ['WFM02', 'WFM03', 'WST01', 'WST02', 'WME01'] },
    ];
  }

  if (need === 1) {
    return award.optional.map((u) => ({ label: formatIalUnitLabel(u, false), units: [u] }));
  }

  return [];
}

export function inferCashInFromUnits(unitCodes: string[]): IalCashInCode | null {
  const set = new Set(unitCodes);
  if (set.has('WMA13') || set.has('WMA14')) return 'YMA01';
  if (set.has('WMA11') || set.has('WMA12')) return set.size <= 3 ? 'XMA01' : 'YMA01';
  if (set.has('WFM02') || set.has('WFM03') || (set.has('WFM01') && set.size >= 6)) return 'YFM01';
  if (set.has('WFM01')) return 'XFM01';
  for (const award of Object.values(IAL_CASH_INS)) {
    if (award.compulsory.every((u) => set.has(u)) && set.size >= award.unitCount) {
      return award.code;
    }
  }
  for (const award of Object.values(IAL_CASH_INS)) {
    if (award.compulsory.some((u) => set.has(u))) return award.code;
  }
  return null;
}

export function evaluateIalCashIn(input: {
  unitUms: Record<string, number>;
  cashInCode?: IalCashInCode | null;
  compositeBoundaries?: GradeBoundary[];
  totalRaw: number;
  maxRaw: number;
}): CompositeGradeResult & { aStarEligible?: boolean; aStarNotes?: string[] } {
  const units = Object.keys(input.unitUms);
  const code = input.cashInCode ?? inferCashInFromUnits(units);
  const award = code ? IAL_CASH_INS[code] : null;
  const totalUms = Object.values(input.unitUms).reduce((sum, n) => sum + n, 0);
  const maxUms = award?.maxUms ?? Math.max(units.length * 100, 1);
  const percentage = percentageOf(totalUms, maxUms);

  const notes: string[] = [];
  let aStarEligible = false;

  const boundaries =
    input.compositeBoundaries && input.compositeBoundaries.length > 0
      ? input.compositeBoundaries
      : umsGradeBoundaries(maxUms);

  let grade = lookupGrade(totalUms, boundaries.filter((b) => b.grade !== 'A*'));

  if (award?.aStarTotal != null && totalUms >= award.aStarTotal) {
    if (award.code === 'YMA01') {
      const p3p4 = (input.unitUms.WMA13 ?? 0) + (input.unitUms.WMA14 ?? 0);
      aStarEligible = p3p4 >= 180;
      if (!aStarEligible) {
        notes.push(`A* needs ≥180 UMS across P3+P4 (currently ${p3p4}).`);
      }
    } else if (award.code === 'YFM01') {
      const a2Scores = Object.entries(input.unitUms)
        .filter(([u]) => FM_A2_UNITS.has(u))
        .map(([, ums]) => ums)
        .sort((a, b) => b - a)
        .slice(0, 3);
      const best3 = a2Scores.reduce((s, n) => s + n, 0);
      aStarEligible = best3 >= 270;
      if (!aStarEligible) {
        notes.push(`A* needs ≥270 UMS across the best 3 A2 units (currently ${best3}).`);
      }
    } else {
      aStarEligible = true;
    }
    if (aStarEligible) grade = 'A*';
  }

  if (award?.aStarNotes) notes.push(award.aStarNotes);

  return {
    grade,
    totalRaw: input.totalRaw,
    maxRaw: input.maxRaw,
    totalUms: Math.round(totalUms),
    percentage,
    usedCompositeBoundaries: Boolean(input.compositeBoundaries?.length),
    aStarEligible,
    aStarNotes: notes,
  };
}

export function appliedMathExclusiveGroup(cashInCode: string | null | undefined, unitCode: string): string | undefined {
  if (cashInCode === 'XMA01' && (unitCode === 'WST01' || unitCode === 'WME01' || unitCode === 'WDM11')) {
    return 'applied_math';
  }
  return undefined;
}
