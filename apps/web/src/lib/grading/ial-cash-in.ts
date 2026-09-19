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
