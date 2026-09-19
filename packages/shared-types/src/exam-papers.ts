/**
 * Myanmar exam paper allowlists — single source of truth for countdown
 * filtering, past-paper practice sets, and grade-calculator selection.
 *
 * CAIE lists use combined paper IDs (e.g. "22" = paper 2, variant 2).
 * Edexcel IGCSE uses regional R-paper codes where applicable.
 * Edexcel IAL matches on unit codes (Wxx).
 */

export type ExamBoardFilter =
  | 'CAIE_IGCSE'
  | 'CAIE_ALEVEL'
  | 'EDEXCEL_IGCSE'
  | 'EDEXCEL_IAL';

export type AwardLevel = 'AS' | 'A Level';
export type ExamSeason = 'May/June' | 'Oct/Nov' | 'Feb/March' | 'Jan';
export type MathsRoute = '42' | '52';

export interface PaperPreferences {
  /** CAIE 9709 AS: Mechanics (42) vs Statistics (52). */
  mathsRoute?: MathsRoute;
  /** CAIE sciences practical 33 vs 34. */
  sciencePractical?: '33' | '34';
  /** Edexcel IAL optional units the student is taking. */
  appliedUnits?: string[];
  /** Calculator variant preference; null = Myanmar default (v2 / R). */
  variantPreference?: '1' | '2' | '3' | null;
  /** Edexcel IGCSE: prefer R-paper boundaries when equivalent exists. */
  preferRPaper?: boolean;
}

/** Speaking / endorsement components excluded from past-paper tracker progress. */
export const ENDORSEMENT_PAPER_IDS: Record<string, readonly string[]> = {
  '0510': ['04'],
  '4ES1': ['03'],
};

export interface MyanmarMatchOptions {
  series?: string | null;
  awardLevel?: AwardLevel | null;
  tier?: 'core' | 'extended' | null;
  routePrefs?: PaperPreferences | null;
}

const SEASON_ALIASES: Record<string, ExamSeason> = {
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
};

/** Zone 4 variant 2 papers Myanmar students sit (countdown default, pre-series). */
export const CAIE_IGCSE_MYANMAR_PAPERS: Record<string, readonly string[]> = {
  '0580': ['22', '42'],
  '0606': ['12', '22'],
  '0625': ['22', '42', '62'],
  '0620': ['22', '42', '62'],
  '0610': ['22', '42', '62'],
  '0478': ['12', '22'],
  '0417': ['12', '21', '31'],
  '0500': ['12', '22'],
  '0510': ['12', '22'],
  '0455': ['12', '22'],
  '0450': ['12', '22'],
  '0452': ['12', '22'],
};

/** Papers that must never auto-sync to countdown (speaking endorsements, etc.). */
export const CAIE_COUNTDOWN_EXCLUDED: Record<string, readonly string[]> = {
  '0510': ['04'],
};

/** All v1/v2/v3 variants seeded for calculator / past-paper practice. */
export const CAIE_IGCSE_PRACTICE_VARIANTS: Record<string, readonly string[]> = {
  '0580': ['21', '22', '23', '41', '42', '43'],
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

/**
 * Series-dependent Myanmar papers (countdown).
 * 0417: May/June uses varianted practicals; Oct/Nov uses unvarianted 02/03.
 * 9626: same pattern for practicals (02/04 vs 21/41).
 */
export const CAIE_SERIES_PAPERS: Record<string, Partial<Record<ExamSeason, readonly string[]>>> = {
  '0417': {
    'May/June': ['12', '21', '31'],
    'Feb/March': ['12', '21', '31'],
    'Oct/Nov': ['12', '02', '03'],
  },
  '9626': {
    'May/June': ['12', '21', '32', '41'],
    'Feb/March': ['12', '21', '32', '41'],
    'Oct/Nov': ['12', '02', '32', '04'],
  },
};

/** Zone 4 variant 2 papers for CAIE International AS & A Level (full A Level set). */
export const CAIE_ALEVEL_MYANMAR_PAPERS: Record<string, readonly string[]> = {
  '9709': ['12', '32', '42', '52'],
  '9231': ['12', '22', '32', '42'],
  '9702': ['12', '22', '33', '34', '42', '52'],
  '9701': ['12', '22', '33', '34', '42', '52'],
  '9700': ['12', '22', '33', '34', '42', '52'],
  '9618': ['12', '22', '32', '42'],
  '9626': ['12', '02', '32', '04'],
  '9708': ['12', '22', '32', '42'],
  '9609': ['12', '22', '32', '42'],
  '9706': ['12', '22', '32', '42'],
  '9093': ['12', '22', '32', '42'],
  '9695': ['12', '22', '32', '42'],
};

/** AS vs full A Level paper sets (Myanmar v2 IDs). */
export const CAIE_ALEVEL_AWARD_PAPERS: Record<
  string,
  { AS: readonly string[]; 'A Level': readonly string[] }
> = {
  '9709': { AS: ['12', '42', '52'], 'A Level': ['12', '32', '42', '52'] },
  '9231': { AS: ['12', '22'], 'A Level': ['12', '22', '32', '42'] },
  '9702': { AS: ['12', '22', '33', '34'], 'A Level': ['12', '22', '33', '34', '42', '52'] },
  '9701': { AS: ['12', '22', '33', '34'], 'A Level': ['12', '22', '33', '34', '42', '52'] },
  '9700': { AS: ['12', '22', '33', '34'], 'A Level': ['12', '22', '33', '34', '42', '52'] },
  '9618': { AS: ['12', '22'], 'A Level': ['12', '22', '32', '42'] },
  '9626': { AS: ['12', '02'], 'A Level': ['12', '02', '32', '04'] },
  '9708': { AS: ['12', '22'], 'A Level': ['12', '22', '32', '42'] },
  '9609': { AS: ['12', '22'], 'A Level': ['12', '22', '32', '42'] },
  '9706': { AS: ['12', '22'], 'A Level': ['12', '22', '32', '42'] },
  '9093': { AS: ['12', '22'], 'A Level': ['12', '22', '32', '42'] },
  '9695': { AS: ['12', '22'], 'A Level': ['12', '22', '32', '42'] },
};

/** All v1/v2/v3 variants for calculator practice. */
export const CAIE_ALEVEL_PRACTICE_VARIANTS: Record<string, readonly string[]> = {
  '9709': [
    '11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43', '51', '52', '53',
  ],
  '9231': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'],
  '9702': [
    '11', '12', '13', '21', '22', '23', '31', '32', '33', '34', '41', '42', '43', '51', '52', '53',
  ],
  '9701': [
    '11', '12', '13', '21', '22', '23', '31', '32', '33', '34', '41', '42', '43', '51', '52', '53',
  ],
  '9700': [
    '11', '12', '13', '21', '22', '23', '31', '32', '33', '34', '41', '42', '43', '51', '52', '53',
  ],
  '9618': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'],
  '9626': ['11', '12', '13', '21', '22', '02', '31', '32', '33', '41', '04'],
  '9708': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'],
  '9609': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'],
  '9706': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'],
  '9093': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'],
  '9695': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'],
};

const CAIE_SCIENCE_AL = new Set(['9702', '9701', '9700']);

/** Regional (R) papers for Myanmar Oct/Nov sittings. */
export const EDEXCEL_IGCSE_MYANMAR_PAPERS: Record<string, readonly string[]> = {
  '4MA1': ['1HR', '2HR'],
  '4MB1': ['01R', '02R'],
  '4PM1': ['01R', '02R'],
  '4PH1': ['1PR', '2PR'],
  '4CH1': ['1CR', '2CR'],
  '4BI1': ['1BR', '2BR'],
  '4HB1': ['01R', '02R'],
  '4CP0': ['01', '02'],
  '4IT1': ['01R', '02R'],
  '4EB1': ['01R', '02R'],
  '4ES1': ['01R', '02R', '03'],
  '4EC1': ['01R', '02R'],
  '4BS1': ['01R', '02R'],
  '4AC1': ['01R', '02R'],
};

/** Standard + R papers for past-paper practice and calculator. */
export const EDEXCEL_IGCSE_PRACTICE_PAPERS: Record<string, readonly string[]> = {
  '4MA1': ['1F', '2F', '1H', '2H', '1FR', '2FR', '1HR', '2HR'],
  '4MB1': ['01', '02', '01R', '02R'],
  '4PM1': ['01', '02', '01R', '02R'],
  '4PH1': ['1P', '2P', '1PR', '2PR'],
  '4CH1': ['1C', '2C', '1CR', '2CR'],
  '4BI1': ['1B', '2B', '1BR', '2BR'],
  '4HB1': ['01', '02', '01R', '02R'],
  '4CP0': ['01', '02'],
  '4IT1': ['01', '02', '01R', '02R'],
  '4EB1': ['01', '02', '01R', '02R'],
  '4ES1': ['01', '02', '03', '01R', '02R'],
  '4EC1': ['01', '02', '01R', '02R'],
  '4BS1': ['01', '02', '01R', '02R'],
  '4AC1': ['01', '02', '01R', '02R'],
};

/** All IAL unit codes offered to Myanmar students (enrollment + countdown). */
export const EDEXCEL_IAL_MYANMAR_UNITS: ReadonlySet<string> = new Set([
  'WMA11',
  'WMA12',
  'WMA13',
  'WMA14',
  'WME01',
  'WME02',
  'WME03',
  'WST01',
  'WST02',
  'WST03',
  'WFM01',
  'WFM02',
  'WFM03',
  'WDM11',
  'WPH11',
  'WPH12',
  'WPH13',
  'WPH14',
  'WPH15',
  'WPH16',
  'WCH11',
  'WCH12',
  'WCH13',
  'WCH14',
  'WCH15',
  'WCH16',
  'WBI11',
  'WBI12',
  'WBI13',
  'WBI14',
  'WBI15',
  'WBI16',
  'WEC11',
  'WEC12',
  'WEC13',
  'WEC14',
  'WBS11',
  'WBS12',
  'WBS13',
  'WBS14',
  'WAC11',
  'WAC12',
  'WAC13',
  'WAC14',
  'WPS01',
  'WPS02',
  'WPS03',
  'WPS04',
  'WIT11',
  'WIT12',
  'WIT13',
  'WIT14',
  'WCP01',
  'WCP02',
  'WCP03',
  'WCP04',
  'WEN01',
  'WEN02',
  'WEN03',
  'WEN04',
  'WET01',
  'WET02',
  'WET03',
  'WET04',
]);

export const CAIE_ALEVEL_SYLLABI = new Set(Object.keys(CAIE_ALEVEL_AWARD_PAPERS));

export function syllabusHasAwardLevel(syllabusCode: string | null | undefined): boolean {
  return Boolean(syllabusCode && CAIE_ALEVEL_SYLLABI.has(syllabusCode));
}

export function syllabusNeedsMathsRoute(syllabusCode: string | null | undefined): boolean {
  return syllabusCode === '9709';
}

/** Combine split past_papers.paper_number + variant into a Cambridge combined ID. */
export function toCambridgePaperId(
  paperNumber: string,
  variant?: string | null
): string {
  const trimmed = paperNumber.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length >= 2) {
    return trimmed;
  }

  const base = digits || trimmed;
  const v = (variant ?? '2').trim();
  return `${base}${v}`;
}

/** First component digit(s) from a combined Cambridge paper ID. */
export function caiePaperBaseFromNumber(paperId: string): string {
  const digits = paperId.replace(/\D/g, '');
  if (digits.length >= 2 && digits[0] !== '0') {
    return digits[0]!;
  }
  if (digits.length >= 2 && digits[0] === '0') {
    return digits[1]!;
  }
  return digits || paperId;
}

export function boardFromCurriculumCode(
  curriculumCode: string | null | undefined
): ExamBoardFilter | null {
  switch (curriculumCode) {
    case 'CAIE_IGCSE':
      return 'CAIE_IGCSE';
    case 'CAIE_ALEVEL':
    case 'CAIE_AL':
      return 'CAIE_ALEVEL';
    case 'EDEXCEL_IGCSE':
      return 'EDEXCEL_IGCSE';
    case 'EDEXCEL_IAL':
      return 'EDEXCEL_IAL';
    default:
      return null;
  }
}

export function parseExamSeason(value: string | null | undefined): ExamSeason | null {
  if (!value) return null;
  const trimmed = value.trim();
  const compact = trimmed.match(/^([swmj])(\d{2})$/i);
  if (compact) {
    const letter = compact[1]!.toLowerCase();
    return letter === 's'
      ? 'May/June'
      : letter === 'w'
        ? 'Oct/Nov'
        : letter === 'm'
          ? 'Feb/March'
          : 'Jan';
  }
  const named = trimmed.match(
    /^(may\/june|may\/jun|oct\/nov|feb\/march|feb\/mar|jan(?:uary)?|june|summer|winter)\b/i
  );
  if (named) {
    return SEASON_ALIASES[named[1]!.toLowerCase()] ?? null;
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes('oct') || lower.includes('nov') || lower.includes('winter')) return 'Oct/Nov';
  if (lower.includes('may') || lower.includes('june') || lower.includes('summer')) return 'May/June';
  if (lower.includes('feb') || lower.includes('march')) return 'Feb/March';
  if (lower.includes('jan')) return 'Jan';
  return SEASON_ALIASES[lower] ?? null;
}

function expandCaieVariants(ids: readonly string[]): string[] {
  const out = new Set<string>();
  for (const id of ids) {
    if (/^\d{2}$/.test(id) && id[0] !== '0' && id !== '33' && id !== '34') {
      const base = id[0]!;
      out.add(`${base}1`);
      out.add(`${base}2`);
      out.add(`${base}3`);
    } else if (id === '33' || id === '34') {
      out.add('33');
      out.add('34');
    } else {
      out.add(id);
    }
  }
  return [...out];
}

function applyRouteFilter(
  ids: readonly string[],
  subjectCode: string,
  prefs?: PaperPreferences | null
): string[] {
  let list = [...ids];
  if (subjectCode === '9709' && prefs?.mathsRoute) {
    const other = prefs.mathsRoute === '42' ? '5' : '4';
    list = list.filter((id) => caiePaperBaseFromNumber(id) !== other);
  }
  if (CAIE_SCIENCE_AL.has(subjectCode) && prefs?.sciencePractical) {
    const other = prefs.sciencePractical === '33' ? '34' : '33';
    list = list.filter((id) => id !== other);
  }
  return list;
}

export function getMyanmarPaperIds(
  subjectCode: string,
  board: ExamBoardFilter,
  opts?: MyanmarMatchOptions
): readonly string[] | null {
  const season = parseExamSeason(opts?.series ?? null);

  if (board === 'CAIE_IGCSE') {
    const seriesSet = season ? CAIE_SERIES_PAPERS[subjectCode]?.[season] : undefined;
    const base = seriesSet ?? CAIE_IGCSE_MYANMAR_PAPERS[subjectCode];
    if (!base) return null;
    const excluded = new Set(CAIE_COUNTDOWN_EXCLUDED[subjectCode] ?? []);
    return base.filter((id) => !excluded.has(id));
  }

  if (board === 'CAIE_ALEVEL') {
    const award = opts?.awardLevel ?? 'A Level';
    const awardSet = CAIE_ALEVEL_AWARD_PAPERS[subjectCode]?.[award];
    const seriesSet = season ? CAIE_SERIES_PAPERS[subjectCode]?.[season] : undefined;
    let ids = [...(awardSet ?? CAIE_ALEVEL_MYANMAR_PAPERS[subjectCode] ?? [])];
    if (seriesSet) {
      const seriesAllowed = new Set(seriesSet);
      ids = ids
        .map((id) => {
          if (seriesAllowed.has(id)) return id;
          const base = caiePaperBaseFromNumber(id);
          const seasonal = seriesSet.find((s) => caiePaperBaseFromNumber(s) === base);
          return seasonal ?? null;
        })
        .filter((id): id is string => Boolean(id));
      for (const extra of seriesSet) {
        if (award === 'AS') {
          const asBases = new Set(
            (CAIE_ALEVEL_AWARD_PAPERS[subjectCode]?.AS ?? []).map(caiePaperBaseFromNumber)
          );
          if (asBases.has(caiePaperBaseFromNumber(extra)) && !ids.includes(extra)) {
            ids.push(extra);
          }
        }
      }
    }
    ids = applyRouteFilter(ids, subjectCode, opts?.routePrefs);
    return ids;
  }

  if (board === 'EDEXCEL_IGCSE') {
    return EDEXCEL_IGCSE_MYANMAR_PAPERS[subjectCode] ?? null;
  }

  if (board === 'EDEXCEL_IAL') {
    return EDEXCEL_IAL_MYANMAR_UNITS.has(subjectCode) ? [subjectCode] : [];
  }

  return null;
}

/** Speaking / endorsement papers — excluded from tracker grid. */
export function isEndorsementPaper(subjectCode: string, paperNumber: string): boolean {
  const excluded = ENDORSEMENT_PAPER_IDS[subjectCode];
  return excluded?.includes(paperNumber) ?? false;
}

/** All seeded practice variants for tracker display (no route filter on CAIE A Level). */
export function getAllPracticePaperIds(
  subjectCode: string,
  board: ExamBoardFilter,
  opts?: MyanmarMatchOptions
): readonly string[] | null {
  if (board === 'CAIE_IGCSE') {
    return CAIE_IGCSE_PRACTICE_VARIANTS[subjectCode] ?? null;
  }

  if (board === 'CAIE_ALEVEL') {
    return CAIE_ALEVEL_PRACTICE_VARIANTS[subjectCode] ?? null;
  }

  if (board === 'EDEXCEL_IGCSE') {
    let list = [...(EDEXCEL_IGCSE_PRACTICE_PAPERS[subjectCode] ?? [])];
    if (subjectCode === '4MA1' && opts?.tier) {
      const suffix = opts.tier === 'core' ? 'F' : 'H';
      list = list.filter((p) => p.includes(suffix));
    }
    return list.filter((p) => !isEndorsementPaper(subjectCode, p));
  }

  if (board === 'EDEXCEL_IAL') {
    return EDEXCEL_IAL_MYANMAR_UNITS.has(subjectCode) ? [subjectCode] : [];
  }

  return null;
}

/** Papers required for the student's selected route (progress denominator). */
export function getRequiredPaperIds(
  subjectCode: string,
  board: ExamBoardFilter,
  opts?: MyanmarMatchOptions
): readonly string[] | null {
  return getMyanmarPaperIds(subjectCode, board, opts);
}

export function getPracticePaperIds(
  subjectCode: string,
  board: ExamBoardFilter,
  opts?: MyanmarMatchOptions
): readonly string[] | null {
  if (board === 'CAIE_IGCSE') {
    return CAIE_IGCSE_PRACTICE_VARIANTS[subjectCode] ?? null;
  }

  if (board === 'CAIE_ALEVEL') {
    const practice = CAIE_ALEVEL_PRACTICE_VARIANTS[subjectCode];
    if (!practice) return null;
    if (!opts?.awardLevel && !opts?.routePrefs?.mathsRoute) return practice;
    const award = opts.awardLevel ?? 'A Level';
    const awardV2 = CAIE_ALEVEL_AWARD_PAPERS[subjectCode]?.[award] ?? CAIE_ALEVEL_MYANMAR_PAPERS[subjectCode] ?? [];
    const expanded = new Set(expandCaieVariants(applyRouteFilter(awardV2, subjectCode, opts.routePrefs)));
    return practice.filter((id) => expanded.has(id));
  }

  if (board === 'EDEXCEL_IGCSE') {
    let list = [...(EDEXCEL_IGCSE_PRACTICE_PAPERS[subjectCode] ?? [])];
    if (subjectCode === '4MA1' && opts?.tier) {
      const suffix = opts.tier === 'core' ? 'F' : 'H';
      list = list.filter((p) => p.includes(suffix));
    }
    return list.filter((p) => !isEndorsementPaper(subjectCode, p));
  }

  if (board === 'EDEXCEL_IAL') {
    return EDEXCEL_IAL_MYANMAR_UNITS.has(subjectCode) ? [subjectCode] : [];
  }

  return null;
}

export function paperIdMatchesPracticeSet(
  paperId: string,
  subjectCode: string,
  practiceSet: Record<string, readonly string[]>
): boolean {
  const allowed = practiceSet[subjectCode];
  if (!allowed) return false;
  return allowed.includes(paperId);
}

export function pastPaperMatchesMyanmarPaper(
  paperNumber: string,
  variant: string | null | undefined,
  subjectCode: string,
  board: ExamBoardFilter,
  opts?: MyanmarMatchOptions
): boolean {
  switch (board) {
    case 'CAIE_IGCSE':
    case 'CAIE_ALEVEL': {
      const combined = toCambridgePaperId(paperNumber, variant);
      const allowed = getMyanmarPaperIds(subjectCode, board, opts);
      if (!allowed) return false;
      return allowed.includes(combined);
    }
    case 'EDEXCEL_IGCSE': {
      const allowed = getMyanmarPaperIds(subjectCode, board, opts);
      if (!allowed) return false;
      return allowed.includes(paperNumber);
    }
    case 'EDEXCEL_IAL':
      return EDEXCEL_IAL_MYANMAR_UNITS.has(subjectCode);
    default:
      return false;
  }
}

export function pastPaperMatchesAllPracticeSet(
  paperNumber: string,
  variant: string | null | undefined,
  subjectCode: string,
  board: ExamBoardFilter,
  opts?: MyanmarMatchOptions
): boolean {
  if (isEndorsementPaper(subjectCode, paperNumber)) return false;
  switch (board) {
    case 'CAIE_IGCSE':
    case 'CAIE_ALEVEL': {
      const combined = toCambridgePaperId(paperNumber, variant);
      const allowed = getAllPracticePaperIds(subjectCode, board, opts);
      if (!allowed) return false;
      return allowed.includes(combined);
    }
    case 'EDEXCEL_IGCSE': {
      const allowed = getAllPracticePaperIds(subjectCode, board, opts);
      if (!allowed) return false;
      return allowed.includes(paperNumber);
    }
    case 'EDEXCEL_IAL':
      return EDEXCEL_IAL_MYANMAR_UNITS.has(subjectCode);
    default:
      return false;
  }
}

export function pastPaperMatchesPracticeSet(
  paperNumber: string,
  variant: string | null | undefined,
  subjectCode: string,
  board: ExamBoardFilter,
  opts?: MyanmarMatchOptions
): boolean {
  if (isEndorsementPaper(subjectCode, paperNumber)) return false;
  switch (board) {
    case 'CAIE_IGCSE':
    case 'CAIE_ALEVEL': {
      const combined = toCambridgePaperId(paperNumber, variant);
      const allowed = getPracticePaperIds(subjectCode, board, opts);
      if (!allowed) return false;
      return allowed.includes(combined);
    }
    case 'EDEXCEL_IGCSE': {
      const allowed = getPracticePaperIds(subjectCode, board, opts);
      if (!allowed) return false;
      return allowed.includes(paperNumber);
    }
    case 'EDEXCEL_IAL':
      return EDEXCEL_IAL_MYANMAR_UNITS.has(subjectCode);
    default:
      return false;
  }
}

export function formatPaperRowLabel(
  paperNumber: string,
  variant: string | null | undefined,
  board: ExamBoardFilter | null
): string {
  if (board === 'CAIE_IGCSE' || board === 'CAIE_ALEVEL') {
    const combined = toCambridgePaperId(paperNumber, variant);
    return `Paper ${combined}`;
  }
  if (board === 'EDEXCEL_IGCSE') {
    return `Paper ${paperNumber}`;
  }
  if (board === 'EDEXCEL_IAL') {
    return paperNumber;
  }
  const suffix = variant ? ` V${variant}` : '';
  return `Paper ${paperNumber}${suffix}`;
}

export function examMatchesMyanmarPaper(
  paperNumber: string | null | undefined,
  subjectCode: string,
  board: ExamBoardFilter,
  opts?: MyanmarMatchOptions
): boolean {
  if (!paperNumber) return false;

  switch (board) {
    case 'CAIE_IGCSE':
    case 'CAIE_ALEVEL': {
      const allowed = getMyanmarPaperIds(subjectCode, board, opts);
      if (!allowed) return false;
      return allowed.includes(paperNumber);
    }
    case 'EDEXCEL_IGCSE': {
      const allowed = getMyanmarPaperIds(subjectCode, board, opts);
      if (!allowed) return false;
      return allowed.includes(paperNumber);
    }
    case 'EDEXCEL_IAL':
      return EDEXCEL_IAL_MYANMAR_UNITS.has(subjectCode);
    default:
      return false;
  }
}

export function examRowMatchesMyanmar(exam: {
  paper_number?: string | null;
  syllabus_code?: string | null;
  season?: string | null;
  series?: string | null;
  curriculum_code?: string | null;
  exam_board?: string | null;
  subject_code?: string | null;
}): boolean {
  const curriculumCode =
    exam.curriculum_code ??
    (exam.exam_board?.toUpperCase().includes('EDEXCEL')
      ? exam.syllabus_code?.startsWith('W')
        ? 'EDEXCEL_IAL'
        : 'EDEXCEL_IGCSE'
      : exam.syllabus_code && CAIE_ALEVEL_SYLLABI.has(exam.syllabus_code)
        ? 'CAIE_ALEVEL'
        : 'CAIE_IGCSE');
  const board = boardFromCurriculumCode(curriculumCode);
  const subjectCode = exam.syllabus_code || exam.subject_code || '';
  if (!board || !subjectCode || !exam.paper_number) return false;
  return examMatchesMyanmarPaper(exam.paper_number, subjectCode, board, {
    series: exam.season || exam.series,
  });
}
