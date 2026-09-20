import type { AwardLevel } from '@/lib/exam-papers/myanmar-papers';
import { lookupGrade, percentageOf } from './shared';
import type { CompositeGradeResult, GradeBoundary } from './types';

export type IalCashInCode =
  | 'XMA01'
  | 'YMA01'
  | 'XFM01'
  | 'YFM01'
  | 'XPM01'
  | 'YPM01'
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

/** Official Pearson IAL A* rule: grade A overall plus 90% of IA2 UMS. */
export interface IalAStarRule {
  /** Minimum total UMS for grade A (and to be considered for A*). */
  totalMin: number;
  /** Minimum UMS on the IA2 units named below. */
  a2Min: number;
  /** IA2 unit codes that count toward the A2 requirement. */
  a2Units: readonly string[];
  /** Further Mathematics uses the best three IA2 units; others sum every listed IA2 unit. */
  a2Mode?: 'sum' | 'best3';
  notes: string;
}

export interface IalCashInAward {
  code: IalCashInCode;
  name: string;
  maxUms: number;
  /** Compulsory units that must be included. */
  compulsory: readonly string[];
  /** Optional units the student picks (exclusive groups handled separately). */
  optional: readonly string[];
  unitCount: number;
  aStar?: IalAStarRule;
  aStarTotal?: number;
  aStarNotes?: string;
}

function withAStar(
  award: Omit<IalCashInAward, 'aStar' | 'aStarTotal' | 'aStarNotes'>,
  aStar: IalAStarRule
): IalCashInAward {
  return { ...award, aStar, aStarTotal: aStar.totalMin, aStarNotes: aStar.notes };
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
  YMA01: withAStar(
    {
      code: 'YMA01',
      name: 'Mathematics A Level',
      maxUms: 600,
      compulsory: ['WMA11', 'WMA12', 'WMA13', 'WMA14'],
      optional: ['WME01', 'WST01', 'WDM11', 'WME02', 'WST02'],
      unitCount: 6,
    },
    {
      totalMin: 480,
      a2Min: 180,
      a2Units: ['WMA13', 'WMA14'],
      notes: 'A* requires ≥480 total UMS and ≥180 UMS across P3 + P4.',
    }
  ),
  XFM01: {
    code: 'XFM01',
    name: 'Further Mathematics AS',
    maxUms: 300,
    compulsory: ['WFM01'],
    optional: ['WFM02', 'WFM03', 'WME01', 'WME02', 'WME03', 'WST01', 'WST02', 'WST03', 'WDM11'],
    unitCount: 3,
  },
  YFM01: withAStar(
    {
      code: 'YFM01',
      name: 'Further Mathematics A Level',
      maxUms: 600,
      compulsory: ['WFM01'],
      optional: ['WFM02', 'WFM03', 'WME01', 'WME02', 'WME03', 'WST01', 'WST02', 'WST03', 'WDM11'],
      unitCount: 6,
    },
    {
      totalMin: 480,
      a2Min: 270,
      a2Units: ['WFM02', 'WFM03', 'WME02', 'WME03', 'WST02', 'WST03'],
      a2Mode: 'best3',
      notes: 'A* requires ≥480 total UMS and ≥270 UMS across the best 3 IA2 units (FP2, FP3, M2, M3, S2, S3).',
    }
  ),
  XPM01: {
    code: 'XPM01',
    name: 'Pure Mathematics AS',
    maxUms: 300,
    compulsory: ['WMA11', 'WMA12', 'WFM01'],
    optional: [],
    unitCount: 3,
  },
  YPM01: withAStar(
    {
      code: 'YPM01',
      name: 'Pure Mathematics A Level',
      maxUms: 600,
      compulsory: ['WMA11', 'WMA12', 'WMA13', 'WMA14', 'WFM01'],
      optional: ['WFM02', 'WFM03'],
      unitCount: 6,
    },
    {
      totalMin: 480,
      a2Min: 270,
      a2Units: ['WMA13', 'WMA14', 'WFM02', 'WFM03'],
      notes: 'A* requires ≥480 total UMS and ≥270 UMS across IA2 units (P3, P4 and FP2 or FP3).',
    }
  ),
  XPH11: {
    code: 'XPH11',
    name: 'Physics AS',
    maxUms: 300,
    compulsory: ['WPH11', 'WPH12', 'WPH13'],
    optional: [],
    unitCount: 3,
  },
  YPH11: withAStar(
    {
      code: 'YPH11',
      name: 'Physics A Level',
      maxUms: 600,
      compulsory: ['WPH11', 'WPH12', 'WPH13', 'WPH14', 'WPH15', 'WPH16'],
      optional: [],
      unitCount: 6,
    },
    {
      totalMin: 480,
      a2Min: 270,
      a2Units: ['WPH14', 'WPH15', 'WPH16'],
      notes: 'A* requires ≥480 total UMS and ≥270 UMS across IA2 units 4–6.',
    }
  ),
  XCH11: {
    code: 'XCH11',
    name: 'Chemistry AS',
    maxUms: 300,
    compulsory: ['WCH11', 'WCH12', 'WCH13'],
    optional: [],
    unitCount: 3,
  },
  YCH11: withAStar(
    {
      code: 'YCH11',
      name: 'Chemistry A Level',
      maxUms: 600,
      compulsory: ['WCH11', 'WCH12', 'WCH13', 'WCH14', 'WCH15', 'WCH16'],
      optional: [],
      unitCount: 6,
    },
    {
      totalMin: 480,
      a2Min: 270,
      a2Units: ['WCH14', 'WCH15', 'WCH16'],
      notes: 'A* requires ≥480 total UMS and ≥270 UMS across IA2 units 4–6.',
    }
  ),
  XBI11: {
    code: 'XBI11',
    name: 'Biology AS',
    maxUms: 300,
    compulsory: ['WBI11', 'WBI12', 'WBI13'],
    optional: [],
    unitCount: 3,
  },
  YBI11: withAStar(
    {
      code: 'YBI11',
      name: 'Biology A Level',
      maxUms: 600,
      compulsory: ['WBI11', 'WBI12', 'WBI13', 'WBI14', 'WBI15', 'WBI16'],
      optional: [],
      unitCount: 6,
    },
    {
      totalMin: 480,
      a2Min: 270,
      a2Units: ['WBI14', 'WBI15', 'WBI16'],
      notes: 'A* requires ≥480 total UMS and ≥270 UMS across IA2 units 4–6.',
    }
  ),
  XCP01: {
    code: 'XCP01',
    name: 'Computer Science AS',
    maxUms: 200,
    compulsory: ['WCP01', 'WCP02'],
    optional: [],
    unitCount: 2,
  },
  YCP01: withAStar(
    {
      code: 'YCP01',
      name: 'Computer Science A Level',
      maxUms: 400,
      compulsory: ['WCP01', 'WCP02', 'WCP03', 'WCP04'],
      optional: [],
      unitCount: 4,
    },
    {
      totalMin: 320,
      a2Min: 180,
      a2Units: ['WCP03', 'WCP04'],
      notes: 'A* requires ≥320 total UMS and ≥180 UMS across IA2 units 3–4.',
    }
  ),
  XIT11: {
    code: 'XIT11',
    name: 'IT AS',
    maxUms: 200,
    compulsory: ['WIT11', 'WIT12'],
    optional: [],
    unitCount: 2,
  },
  YIT11: withAStar(
    {
      code: 'YIT11',
      name: 'IT A Level',
      maxUms: 400,
      compulsory: ['WIT11', 'WIT12', 'WIT13', 'WIT14'],
      optional: [],
      unitCount: 4,
    },
    {
      totalMin: 320,
      a2Min: 180,
      a2Units: ['WIT13', 'WIT14'],
      notes: 'A* requires ≥320 total UMS and ≥180 UMS across IA2 units 3–4.',
    }
  ),
  XEC11: {
    code: 'XEC11',
    name: 'Economics AS',
    maxUms: 200,
    compulsory: ['WEC11', 'WEC12'],
    optional: [],
    unitCount: 2,
  },
  YEC11: withAStar(
    {
      code: 'YEC11',
      name: 'Economics A Level',
      maxUms: 400,
      compulsory: ['WEC11', 'WEC12', 'WEC13', 'WEC14'],
      optional: [],
      unitCount: 4,
    },
    {
      totalMin: 320,
      a2Min: 180,
      a2Units: ['WEC13', 'WEC14'],
      notes: 'A* requires ≥320 total UMS and ≥180 UMS across IA2 units 3–4.',
    }
  ),
  XBS11: {
    code: 'XBS11',
    name: 'Business AS',
    maxUms: 200,
    compulsory: ['WBS11', 'WBS12'],
    optional: [],
    unitCount: 2,
  },
  YBS11: withAStar(
    {
      code: 'YBS11',
      name: 'Business A Level',
      maxUms: 400,
      compulsory: ['WBS11', 'WBS12', 'WBS13', 'WBS14'],
      optional: [],
      unitCount: 4,
    },
    {
      totalMin: 320,
      a2Min: 180,
      a2Units: ['WBS13', 'WBS14'],
      notes: 'A* requires ≥320 total UMS and ≥180 UMS across IA2 units 3–4.',
    }
  ),
  XAC11: {
    code: 'XAC11',
    name: 'Accounting AS',
    maxUms: 300,
    compulsory: ['WAC11'],
    optional: [],
    unitCount: 1,
  },
  YAC11: withAStar(
    {
      code: 'YAC11',
      name: 'Accounting A Level',
      maxUms: 600,
      compulsory: ['WAC11', 'WAC12'],
      optional: [],
      unitCount: 2,
    },
    {
      totalMin: 480,
      a2Min: 270,
      a2Units: ['WAC12'],
      notes: 'A* requires ≥480 total UMS and ≥270 UMS on IA2 Unit 2.',
    }
  ),
  XEN01: {
    code: 'XEN01',
    name: 'English Language AS',
    maxUms: 200,
    compulsory: ['WEN01', 'WEN02'],
    optional: [],
    unitCount: 2,
  },
  YEN01: withAStar(
    {
      code: 'YEN01',
      name: 'English Language A Level',
      maxUms: 400,
      compulsory: ['WEN01', 'WEN02', 'WEN03', 'WEN04'],
      optional: [],
      unitCount: 4,
    },
    {
      totalMin: 320,
      a2Min: 180,
      a2Units: ['WEN03', 'WEN04'],
      notes: 'A* requires ≥320 total UMS and ≥180 UMS across IA2 units 3–4.',
    }
  ),
  XET01: {
    code: 'XET01',
    name: 'English Literature AS',
    maxUms: 200,
    compulsory: ['WET01', 'WET02'],
    optional: [],
    unitCount: 2,
  },
  YET01: withAStar(
    {
      code: 'YET01',
      name: 'English Literature A Level',
      maxUms: 400,
      compulsory: ['WET01', 'WET02', 'WET03', 'WET04'],
      optional: [],
      unitCount: 4,
    },
    {
      totalMin: 320,
      a2Min: 180,
      a2Units: ['WET03', 'WET04'],
      notes: 'A* requires ≥320 total UMS and ≥180 UMS across IA2 units 3–4.',
    }
  ),
  XPS01: {
    code: 'XPS01',
    name: 'Psychology AS',
    maxUms: 200,
    compulsory: ['WPS01', 'WPS02'],
    optional: [],
    unitCount: 2,
  },
  YPS01: withAStar(
    {
      code: 'YPS01',
      name: 'Psychology A Level',
      maxUms: 400,
      compulsory: ['WPS01', 'WPS02', 'WPS03', 'WPS04'],
      optional: [],
      unitCount: 4,
    },
    {
      totalMin: 320,
      a2Min: 180,
      a2Units: ['WPS03', 'WPS04'],
      notes: 'A* requires ≥320 total UMS and ≥180 UMS across IA2 units 3–4.',
    }
  ),
};

/** IA2 maths-suite units (Pearson spec). D1 / M1 / S1 / FP1 / P1 / P2 are IAS. */
export const IAL_MATHS_A2_UNITS = new Set([
  'WMA13',
  'WMA14',
  'WFM02',
  'WFM03',
  'WME02',
  'WME03',
  'WST02',
  'WST03',
]);

export interface MathsCashInSelectionStatus {
  complete: boolean;
  message: string | null;
}

/** Official Pearson IAS/IAL Mathematics and Further Mathematics cash-in combinations. */
export function mathsCashInSelectionStatus(
  cashInCode: string | null | undefined,
  selectedElectives: readonly string[],
  selectedPair: readonly string[] = []
): MathsCashInSelectionStatus {
  if (!cashInCode) return { complete: true, message: null };
  const award = IAL_CASH_INS[cashInCode as IalCashInCode];
  if (!award) return { complete: true, message: null };

  if (award.code === 'XMA01') {
    const need = requiredOptionalCount(award);
    if (selectedElectives.length !== need) {
      return {
        complete: false,
        message: `IAS Mathematics (XMA01) needs P1, P2 and exactly one of M1, S1 or D1.`,
      };
    }
    return { complete: true, message: null };
  }

  if (award.code === 'YMA01') {
    if (selectedPair.length !== 2) {
      return {
        complete: false,
        message: 'IAL Mathematics (YMA01) needs P1–P4 plus one official applied pair (M1+S1, M1+M2, S1+S2, M1+D1 or S1+D1).',
      };
    }
    return { complete: true, message: null };
  }

  if (award.code === 'XFM01') {
    const need = requiredOptionalCount(award);
    if (selectedElectives.length !== need) {
      return {
        complete: false,
        message: `IAS Further Mathematics (XFM01) needs FP1 plus exactly two units from FP2, FP3, M1–M3, S1–S3 and D1.`,
      };
    }
    return { complete: true, message: null };
  }

  if (award.code === 'YFM01') {
    const need = requiredOptionalCount(award);
    if (selectedElectives.length !== need) {
      return {
        complete: false,
        message: `IAL Further Mathematics (YFM01) needs FP1 plus five further units (six units in total).`,
      };
    }
    if (!selectedElectives.includes('WFM02') && !selectedElectives.includes('WFM03')) {
      return {
        complete: false,
        message: 'YFM01 must include FP1 and at least one of FP2 or FP3.',
      };
    }
    const allUnits = [...award.compulsory, ...selectedElectives];
    const a2Count = allUnits.filter((u) => IAL_MATHS_A2_UNITS.has(u)).length;
    if (a2Count < 3) {
      return {
        complete: false,
        message: `YFM01 needs at least three A2 units (currently ${a2Count}: FP2, FP3, M2, M3, S2, S3).`,
      };
    }
    return { complete: true, message: null };
  }

  if (award.code === 'XPM01') {
    return { complete: true, message: null };
  }

  if (award.code === 'YPM01') {
    if (!selectedElectives.includes('WFM02') && !selectedElectives.includes('WFM03')) {
      return {
        complete: false,
        message: 'IAL Pure Mathematics (YPM01) needs P1–P4, FP1 and either FP2 or FP3.',
      };
    }
    return { complete: true, message: null };
  }

  const need = requiredOptionalCount(award);
  if (need > 0 && selectedElectives.length !== need) {
    return {
      complete: false,
      message: `Select ${need} optional unit${need === 1 ? '' : 's'} for ${award.code}.`,
    };
  }
  return { complete: true, message: null };
}

/** Units Pearson assesses in the October IAL series (maths suite). */
export const IAL_OCTOBER_UNITS = new Set([
  'WMA11',
  'WMA12',
  'WMA13',
  'WMA14',
  'WME01',
  'WME02',
  'WST01',
  'WST02',
]);

const MATHS_SUITE_UNITS = new Set([
  'WMA11',
  'WMA12',
  'WMA13',
  'WMA14',
  'WFM01',
  'WFM02',
  'WFM03',
  'WME01',
  'WME02',
  'WME03',
  'WST01',
  'WST02',
  'WST03',
  'WDM11',
]);

export const IAL_MATHS_CASH_INS = new Set<IalCashInCode>(['XMA01', 'YMA01']);
export const IAL_FM_CASH_INS = new Set<IalCashInCode>(['XFM01', 'YFM01']);
export const IAL_PURE_CASH_INS = new Set<IalCashInCode>(['XPM01', 'YPM01']);

export function isIalOctoberSeries(series: string | null | undefined): boolean {
  return Boolean(series && /oct/i.test(series));
}

export function mathsSuiteUnitAvailableInSeries(
  unitCode: string,
  series: string | null | undefined
): boolean {
  if (!MATHS_SUITE_UNITS.has(unitCode)) return true;
  if (!isIalOctoberSeries(series)) return true;
  return IAL_OCTOBER_UNITS.has(unitCode);
}

/** Official Pearson cash-in UMS cuts from IAL grade-boundary PDFs / maths spec. */
export function officialCashInUmsBoundaries(maxUms: number): GradeBoundary[] {
  const table: Record<number, number[]> = {
    60: [48, 42, 36, 30, 24],
    80: [64, 56, 48, 40, 32],
    100: [80, 70, 60, 50, 40],
    120: [96, 84, 72, 60, 48],
    200: [160, 140, 120, 100, 80],
    300: [240, 210, 180, 150, 120],
    400: [320, 280, 240, 200, 160],
    600: [480, 420, 360, 300, 240],
  };
  const cuts = table[maxUms] ?? [80, 70, 60, 50, 40].map((p) => Math.round((p / 100) * maxUms));
  if (!maxUms || cuts.some((n) => !Number.isFinite(n))) return [];
  const grades = ['A', 'B', 'C', 'D', 'E'] as const;
  return [
    ...grades.map((g, i) => ({
      grade: g,
      min_mark: cuts[i],
      max_mark: i === 0 ? maxUms : cuts[i - 1] - 1,
    })),
    { grade: 'U', min_mark: 0, max_mark: cuts[4] - 1 },
  ];
}

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
  { key: 'pure', label: 'Pure Mathematics', asCode: 'XPM01', alevelCode: 'YPM01' },
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
  return officialCashInUmsBoundaries(maxUms);
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

  if (award.code === 'YPM01') {
    return [
      { label: 'FP2', units: ['WFM02'] },
      { label: 'FP3', units: ['WFM03'] },
    ];
  }

  if (need === 1) {
    return award.optional.map((u) => ({ label: formatIalUnitLabel(u, false), units: [u] }));
  }

  return [];
}

export function inferCashInFromUnits(unitCodes: string[]): IalCashInCode | null {
  const set = new Set(unitCodes);
  if (set.has('WFM01') && set.has('WMA11') && set.has('WMA12') && !set.has('WME01') && !set.has('WST01') && !set.has('WDM11')) {
    return set.has('WMA13') || set.has('WMA14') || set.has('WFM02') || set.has('WFM03') ? 'YPM01' : 'XPM01';
  }
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

export function ialA2Ums(unitUms: Record<string, number>, rule: IalAStarRule): number {
  const scores = rule.a2Units.map((unit) => unitUms[unit] ?? 0);
  if (rule.a2Mode === 'best3') {
    return scores
      .sort((a, b) => b - a)
      .slice(0, 3)
      .reduce((sum, n) => sum + n, 0);
  }
  return scores.reduce((sum, n) => sum + n, 0);
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
      ? input.compositeBoundaries.filter((b) => b.grade !== 'A*')
      : officialCashInUmsBoundaries(maxUms);

  let grade = boundaries.length ? lookupGrade(totalUms, boundaries) : '—';

  const aStar = award?.aStar;
  if (aStar && totalUms >= aStar.totalMin) {
    const a2 = ialA2Ums(input.unitUms, aStar);
    aStarEligible = a2 >= aStar.a2Min;
    if (!aStarEligible) {
      const unitLabel =
        aStar.a2Mode === 'best3'
          ? 'the best 3 IA2 units'
          : aStar.a2Units.length === 1
            ? formatIalUnitLabel(aStar.a2Units[0])
            : formatIalUnitList(aStar.a2Units);
      notes.push(`A* needs ≥${aStar.a2Min} UMS across ${unitLabel} (currently ${a2}).`);
    } else {
      grade = 'A*';
    }
  }

  if (award?.aStarNotes) notes.push(award.aStarNotes);

  return {
    grade,
    totalRaw: input.totalRaw,
    maxRaw: input.maxRaw,
    totalUms: Math.round(totalUms),
    percentage,
    usedCompositeBoundaries:
      Boolean(input.compositeBoundaries?.length) || officialCashInUmsBoundaries(maxUms).length > 0,
    aStarEligible,
    aStarNotes: notes,
  };
}

export function ialUnitMaxUms(unitCode: string): number {
  const SCIENCE_120 = new Set([
    'WPH11', 'WPH12', 'WPH14', 'WPH15',
    'WCH11', 'WCH12', 'WCH14', 'WCH15',
    'WBI11', 'WBI12', 'WBI14', 'WBI15',
  ]);
  const SCIENCE_60 = new Set([
    'WPH13', 'WPH16',
    'WCH13', 'WCH16',
    'WBI13', 'WBI16',
  ]);
  if (unitCode === 'WAC11' || unitCode === 'WAC12') return 300;
  if (unitCode === 'WPS01' || unitCode === 'WPS03') return 80;
  if (unitCode === 'WPS02' || unitCode === 'WPS04') return 120;
  if (SCIENCE_120.has(unitCode)) return 120;
  if (SCIENCE_60.has(unitCode)) return 60;
  return 100;
}

/** Unit letter from official UMS thresholds (series-independent). Units are A–E only. */
export function umsUnitGrade(ums: number, maxUms = 100): string {
  return lookupGrade(ums, officialCashInUmsBoundaries(maxUms));
}

export const IAL_MATHS_ONLY_UNITS = [
  'WMA11',
  'WMA12',
  'WMA13',
  'WMA14',
  'WME01',
  'WME02',
  'WST01',
  'WST02',
  'WDM11',
] as const;

export const IAL_PURE_MATHS_UNITS = [
  'WMA11',
  'WMA12',
  'WMA13',
  'WMA14',
  'WFM01',
  'WFM02',
  'WFM03',
] as const;

export const IAL_MATHS_SUITE_UNIT_ORDER = [
  'WMA11',
  'WMA12',
  'WMA13',
  'WMA14',
  'WFM01',
  'WFM02',
  'WFM03',
  'WME01',
  'WME02',
  'WME03',
  'WST01',
  'WST02',
  'WST03',
  'WDM11',
] as const;

const YMA01_PURE = ['WMA11', 'WMA12', 'WMA13', 'WMA14'] as const;
const FM_UNIT_POOL = [
  'WFM01',
  'WFM02',
  'WFM03',
  'WME01',
  'WME02',
  'WME03',
  'WST01',
  'WST02',
  'WST03',
  'WDM11',
] as const;
const XMA01_APPLIED = ['WME01', 'WST01', 'WDM11'] as const;

export const IAL_GROUP_UNITS: Record<string, readonly string[]> = {
  Mathematics: IAL_MATHS_ONLY_UNITS,
  'Pure Mathematics': IAL_PURE_MATHS_UNITS,
  'Further Mathematics': FM_UNIT_POOL,
  'Mathematics & Further Mathematics': IAL_MATHS_SUITE_UNIT_ORDER,
  Physics: ['WPH11', 'WPH12', 'WPH13', 'WPH14', 'WPH15', 'WPH16'],
  Chemistry: ['WCH11', 'WCH12', 'WCH13', 'WCH14', 'WCH15', 'WCH16'],
  Biology: ['WBI11', 'WBI12', 'WBI13', 'WBI14', 'WBI15', 'WBI16'],
  'Information Technology': ['WIT11', 'WIT12', 'WIT13', 'WIT14'],
  'Computer Science': ['WCP01', 'WCP02', 'WCP03', 'WCP04'],
  Economics: ['WEC11', 'WEC12', 'WEC13', 'WEC14'],
  Business: ['WBS11', 'WBS12', 'WBS13', 'WBS14'],
  Accounting: ['WAC11', 'WAC12'],
  'English Language': ['WEN01', 'WEN02', 'WEN03', 'WEN04'],
  'English Literature': ['WET01', 'WET02', 'WET03', 'WET04'],
  Psychology: ['WPS01', 'WPS02', 'WPS03', 'WPS04'],
};

function combinations<T>(items: readonly T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > items.length) return [];
  const out: T[][] = [];
  const rec = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i <= items.length - (k - acc.length); i++) {
      acc.push(items[i]);
      rec(i + 1, acc);
      acc.pop();
    }
  };
  rec(0, []);
  return out;
}

function pickUms(unitUms: Record<string, number>, codes: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const code of codes) out[code] = unitUms[code] ?? 0;
  return out;
}

export function isValidYfm01Units(units: readonly string[]): boolean {
  if (units.length !== 6) return false;
  if (!units.includes('WFM01')) return false;
  if (!units.includes('WFM02') && !units.includes('WFM03')) return false;
  if (units.some((u) => !(FM_UNIT_POOL as readonly string[]).includes(u))) return false;
  return units.filter((u) => IAL_MATHS_A2_UNITS.has(u)).length >= 3;
}

export function isValidXfm01Units(units: readonly string[]): boolean {
  if (units.length !== 3) return false;
  if (!units.includes('WFM01')) return false;
  return units.every((u) => (FM_UNIT_POOL as readonly string[]).includes(u));
}

export function isValidYpm01Units(units: readonly string[]): boolean {
  if (units.length !== 6) return false;
  if (!YMA01_PURE.every((u) => units.includes(u))) return false;
  if (!units.includes('WFM01')) return false;
  return units.includes('WFM02') || units.includes('WFM03');
}

const GRADE_RANK: Record<string, number> = {
  'A*': 7,
  A: 6,
  B: 5,
  C: 4,
  D: 3,
  E: 2,
  U: 1,
  '—': 0,
};

export interface IalAwardResult {
  cashInCode: IalCashInCode;
  units: string[];
  result: ReturnType<typeof evaluateIalCashIn>;
}

export interface MathsFmSplit {
  maths: IalAwardResult | null;
  pure: IalAwardResult | null;
  further: IalAwardResult | null;
  unusedUnits: string[];
  notes: string[];
}

function scoreSplit(split: MathsFmSplit): number[] {
  const awards = [split.maths, split.pure, split.further].filter(Boolean);
  const dual = awards.length >= 2 ? 1 : 0;
  const ialCount = awards.filter((a) => a?.cashInCode.startsWith('Y')).length;
  const rankSum = awards.reduce((sum, a) => sum + (GRADE_RANK[a?.result.grade ?? '—'] ?? 0), 0);
  const stars = awards.filter((a) => a?.result.grade === 'A*').length;
  const ums = awards.reduce((sum, a) => sum + (a?.result.totalUms ?? 0), 0);
  const mathsRank = GRADE_RANK[split.maths?.result.grade ?? split.pure?.result.grade ?? '—'] ?? 0;
  return [dual, ialCount, rankSum, stars, ums, mathsRank];
}

function betterSplit(a: MathsFmSplit, b: MathsFmSplit): MathsFmSplit {
  const as = scoreSplit(a);
  const bs = scoreSplit(b);
  for (let i = 0; i < as.length; i++) {
    if (as[i] !== bs[i]) return as[i] > bs[i] ? a : b;
  }
  return a;
}

function cashInOf(code: IalCashInCode, units: string[], unitUms: Record<string, number>): IalAwardResult {
  return {
    cashInCode: code,
    units,
    result: evaluateIalCashIn({
      unitUms: pickUms(unitUms, units),
      cashInCode: code,
      totalRaw: 0,
      maxRaw: 0,
    }),
  };
}

export type MathsSuiteMode = 'all' | 'maths' | 'pure' | 'further';

/**
 * Assign sat Maths-suite units to Mathematics / Pure Mathematics / Further Mathematics.
 * A unit may be used in only one qualification (Pearson spec p.10). When several
 * legal splits exist, keep the one with the highest possible grades.
 */
export function bestMathsFmSplit(
  unitUms: Record<string, number>,
  mode: MathsSuiteMode = 'all'
): MathsFmSplit {
  const entered = Object.entries(unitUms)
    .filter(([, v]) => typeof v === 'number' && Number.isFinite(v))
    .map(([k]) => k);

  const empty: MathsFmSplit = { maths: null, pure: null, further: null, unusedUnits: entered, notes: [] };
  if (entered.length === 0) return empty;

  const allowMaths = mode === 'all' || mode === 'maths';
  const allowPure = mode === 'all' || mode === 'pure';
  const allowFurther = mode === 'all' || mode === 'further';

  let best: MathsFmSplit | null = null;

  const consider = (partial: Omit<MathsFmSplit, 'pure'> & { pure?: IalAwardResult | null }) => {
    const split: MathsFmSplit = {
      maths: partial.maths ?? null,
      further: partial.further ?? null,
      unusedUnits: partial.unusedUnits,
      notes: partial.notes,
      pure: partial.pure ?? null,
    };
    if (!allowMaths && split.maths) return;
    if (!allowPure && split.pure) return;
    if (!allowFurther && split.further) return;
    best = best ? betterSplit(best, split) : split;
  };

  const fmEntered = entered.filter((u) => (FM_UNIT_POOL as readonly string[]).includes(u));

  if (allowMaths) {
  for (const pair of YMA01_APPLIED_PAIRS) {
    const mathsUnits = [...YMA01_PURE, ...pair];
    if (!mathsUnits.every((u) => entered.includes(u))) continue;
    const remaining = fmEntered.filter((u) => !mathsUnits.includes(u));

    if (allowFurther && remaining.length >= 6) {
      const combos = remaining.length === 6 ? [remaining] : combinations(remaining, 6);
      for (const fm6 of combos) {
        if (!isValidYfm01Units(fm6)) continue;
        const used = new Set([...mathsUnits, ...fm6]);
        consider({
          maths: cashInOf('YMA01', mathsUnits, unitUms),
          further: cashInOf('YFM01', fm6, unitUms),
          unusedUnits: entered.filter((u) => !used.has(u)),
          notes: [
            'Pearson: a unit result can cash in for only one qualification. This split uses 12 different units and the highest available Mathematics + Further Mathematics grades.',
          ],
        });
      }
    }

    if (allowFurther && remaining.length >= 3) {
      const combos = remaining.length === 3 ? [remaining] : combinations(remaining, 3);
      for (const fm3 of combos) {
        if (!isValidXfm01Units(fm3)) continue;
        const used = new Set([...mathsUnits, ...fm3]);
        consider({
          maths: cashInOf('YMA01', mathsUnits, unitUms),
          further: cashInOf('XFM01', fm3, unitUms),
          unusedUnits: entered.filter((u) => !used.has(u)),
          notes: ['IAL Mathematics plus IAS Further Mathematics (units are not shared).'],
        });
      }
    }

    consider({
      maths: cashInOf('YMA01', mathsUnits, unitUms),
      further: null,
      unusedUnits: entered.filter((u) => !mathsUnits.includes(u)),
      notes: [],
    });
  }

  for (const extra of XMA01_APPLIED) {
    const mathsUnits = ['WMA11', 'WMA12', extra];
    if (!mathsUnits.every((u) => entered.includes(u))) continue;
    const remaining = fmEntered.filter((u) => !mathsUnits.includes(u));
    if (allowFurther && remaining.length >= 6) {
      const combos = remaining.length === 6 ? [remaining] : combinations(remaining, 6);
      for (const fm6 of combos) {
        if (!isValidYfm01Units(fm6)) continue;
        const used = new Set([...mathsUnits, ...fm6]);
        consider({
          maths: cashInOf('XMA01', mathsUnits, unitUms),
          further: cashInOf('YFM01', fm6, unitUms),
          unusedUnits: entered.filter((u) => !used.has(u)),
          notes: ['IAS Mathematics plus IAL Further Mathematics (units are not shared).'],
        });
      }
    }
    if (allowFurther && remaining.length >= 3) {
      const combos = remaining.length === 3 ? [remaining] : combinations(remaining, 3);
      for (const fm3 of combos) {
        if (!isValidXfm01Units(fm3)) continue;
        const used = new Set([...mathsUnits, ...fm3]);
        consider({
          maths: cashInOf('XMA01', mathsUnits, unitUms),
          further: cashInOf('XFM01', fm3, unitUms),
          unusedUnits: entered.filter((u) => !used.has(u)),
          notes: ['IAS Mathematics plus IAS Further Mathematics (units are not shared).'],
        });
      }
    }
    consider({
      maths: cashInOf('XMA01', mathsUnits, unitUms),
      further: null,
      unusedUnits: entered.filter((u) => !mathsUnits.includes(u)),
      notes: [],
    });
  }
  }

  if (allowPure) {
    for (const fp of ['WFM02', 'WFM03'] as const) {
      const pureUnits = [...YMA01_PURE, 'WFM01', fp];
      if (!pureUnits.every((u) => entered.includes(u))) continue;
      consider({
        maths: null,
        pure: cashInOf('YPM01', pureUnits, unitUms),
        further: null,
        unusedUnits: entered.filter((u) => !pureUnits.includes(u)),
        notes: ['IAL Pure Mathematics (YPM01): P1–P4, FP1 and FP2 or FP3.'],
      });
    }
    const xpm = ['WMA11', 'WMA12', 'WFM01'];
    if (xpm.every((u) => entered.includes(u))) {
      consider({
        maths: null,
        pure: cashInOf('XPM01', xpm, unitUms),
        further: null,
        unusedUnits: entered.filter((u) => !xpm.includes(u)),
        notes: ['IAS Pure Mathematics (XPM01): P1, P2 and FP1.'],
      });
    }
  }

  if (allowFurther && fmEntered.length >= 6) {
    const combos = fmEntered.length === 6 ? [fmEntered] : combinations(fmEntered, 6);
    for (const fm6 of combos) {
      if (!isValidYfm01Units(fm6)) continue;
      consider({
        maths: null,
        further: cashInOf('YFM01', fm6, unitUms),
        unusedUnits: entered.filter((u) => !fm6.includes(u)),
        notes: [],
      });
    }
  }
  if (allowFurther && fmEntered.length >= 3) {
    const combos = fmEntered.length === 3 ? [fmEntered] : combinations(fmEntered, 3);
    for (const fm3 of combos) {
      if (!isValidXfm01Units(fm3)) continue;
      consider({
        maths: null,
        further: cashInOf('XFM01', fm3, unitUms),
        unusedUnits: entered.filter((u) => !fm3.includes(u)),
        notes: [],
      });
    }
  }

  return best ?? empty;
}

export function appliedMathExclusiveGroup(cashInCode: string | null | undefined, unitCode: string): string | undefined {
  if (cashInCode === 'XMA01' && (unitCode === 'WST01' || unitCode === 'WME01' || unitCode === 'WDM11')) {
    return 'applied_math';
  }
  return undefined;
}
