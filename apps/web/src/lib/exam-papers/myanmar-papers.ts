/**
 * Myanmar exam paper allowlists — single source of truth for countdown filtering
 * and grade-calculator practice-set selection.
 *
 * CAIE lists use combined paper IDs (e.g. "22" = paper 2, variant 2).
 * Edexcel IGCSE uses regional R-paper codes where applicable.
 * Edexcel IAL matches on unit codes (Wxx); paper_number is typically "01".
 */

export type ExamBoardFilter =
  | 'CAIE_IGCSE'
  | 'CAIE_ALEVEL'
  | 'EDEXCEL_IGCSE'
  | 'EDEXCEL_IAL';

/** Zone 4 variant 2 papers Myanmar students sit (countdown filter). */
export const CAIE_IGCSE_MYANMAR_PAPERS: Record<string, readonly string[]> = {
  '0580': ['22', '42'],
  '0606': ['12', '22'],
  '0625': ['22', '42', '62'],
  '0620': ['22', '42', '62'],
  '0610': ['22', '42', '62'],
  '0478': ['12', '22'],
  '0417': ['12', '21', '22', '31', '32'],
  '0500': ['12', '22'],
  '0510': ['12', '22', '04'],
  '0455': ['12', '22'],
  '0450': ['12', '22'],
  '0452': ['12', '22'],
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

/** Zone 4 variant 2 papers for CAIE International AS & A Level. */
export const CAIE_ALEVEL_MYANMAR_PAPERS: Record<string, readonly string[]> = {
  '9709': ['12', '22', '32', '42', '52', '62'],
  '9231': ['12', '22', '32', '42', '52', '62'],
  '9702': ['12', '22', '33', '42', '52'],
  '9701': ['12', '22', '33', '42', '52'],
  '9700': ['12', '22', '33', '42', '52'],
  '9618': ['12', '22', '32', '42'],
  '9626': ['12', '02', '32', '04'],
  '9708': ['12', '22', '32', '42'],
  '9609': ['12', '22', '32', '42', '52', '62'],
  '9706': ['12', '22', '32', '42', '52', '62'],
  '9093': ['12', '22', '32', '42', '52', '62'],
  '9695': ['12', '22', '32', '42', '52', '62'],
};

/** All v1/v2/v3 variants for calculator practice. */
export const CAIE_ALEVEL_PRACTICE_VARIANTS: Record<string, readonly string[]> = {
  '9709': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43', '51', '52', '53', '61', '62', '63'],
  '9231': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43', '51', '52', '53', '61', '62', '63'],
  '9702': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '34', '41', '42', '43', '51', '52', '53', '61', '62', '63'],
  '9701': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '34', '41', '42', '43', '51', '52', '53', '61', '62', '63'],
  '9700': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '34', '41', '42', '43', '51', '52', '53', '61', '62', '63'],
  '9618': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43', '51', '52', '53', '61', '62', '63'],
  '9626': ['11', '12', '13', '02', '31', '32', '33', '04'],
  '9708': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43', '51', '52', '53', '61', '62', '63'],
  '9609': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43', '51', '52', '53', '61', '62', '63'],
  '9706': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43', '51', '52', '53', '61', '62', '63'],
  '9093': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43', '51', '52', '53', '61', '62', '63'],
  '9695': ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43', '51', '52', '53', '61', '62', '63'],
};

/** Regional (R) papers for Myanmar Oct/Nov sittings. */
export const EDEXCEL_IGCSE_MYANMAR_PAPERS: Record<string, readonly string[]> = {
  '4MA1': ['1HR', '2HR'],
  '4MB1': ['1BR', '2BR'],
  '4PM1': ['01', '02'],
  '4PH1': ['1PR', '2PR'],
  '4CH1': ['1CR', '2CR'],
  '4BI1': ['1BR', '2BR'],
  '4HB1': ['1HR', '2HR'],
  '4CP0': ['01', '02'],
  '4IT1': ['01', '02'],
  '4EB1': ['01', '02'],
  '4ES1': ['01', '02'],
  '4EC1': ['01', '02'],
  '4BS1': ['01', '02'],
  '4AC1': ['01', '02'],
};

/** All IAL unit codes offered to Myanmar students (enrollment + countdown). */
export const EDEXCEL_IAL_MYANMAR_UNITS: ReadonlySet<string> = new Set([
  'WMA11', 'WMA12', 'WMA13', 'WMA14',
  'WME01', 'WME02', 'WME03',
  'WST01', 'WST02', 'WST03',
  'WFM01', 'WFM02', 'WFM03',
  'WDM11',
  'WPH11', 'WPH12', 'WPH13', 'WPH14', 'WPH15', 'WPH16',
  'WCH11', 'WCH12', 'WCH13', 'WCH14', 'WCH15', 'WCH16',
  'WBI11', 'WBI12', 'WBI13', 'WBI14', 'WBI15', 'WBI16',
  'WEC11', 'WEC12', 'WEC13', 'WEC14',
  'WBS11', 'WBS12', 'WBS13', 'WBS14',
  'WAC11', 'WAC12',
  'WPS01', 'WPS02', 'WPS03', 'WPS04',
  'WIT11', 'WIT12', 'WIT13', 'WIT14',
  'WCP01', 'WCP02', 'WCP03', 'WCP04',
  'WEN01', 'WEN02', 'WEN03', 'WEN04',
  'WET01', 'WET02', 'WET03', 'WET04',
]);

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
      return 'CAIE_ALEVEL';
    case 'EDEXCEL_IGCSE':
      return 'EDEXCEL_IGCSE';
    case 'EDEXCEL_IAL':
      return 'EDEXCEL_IAL';
    default:
      return null;
  }
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

/** Whether an official exam row matches the Myanmar paper set for its board. */
/** Whether a past_papers row matches Myanmar assignment (strict countdown parity). */
export function pastPaperMatchesMyanmarPaper(
  paperNumber: string,
  variant: string | null | undefined,
  subjectCode: string,
  board: ExamBoardFilter
): boolean {
  switch (board) {
    case 'CAIE_IGCSE':
    case 'CAIE_ALEVEL': {
      const combined = toCambridgePaperId(paperNumber, variant);
      const set =
        board === 'CAIE_IGCSE' ? CAIE_IGCSE_MYANMAR_PAPERS : CAIE_ALEVEL_MYANMAR_PAPERS;
      return paperIdMatchesPracticeSet(combined, subjectCode, set);
    }
    case 'EDEXCEL_IGCSE': {
      const allowed = EDEXCEL_IGCSE_MYANMAR_PAPERS[subjectCode];
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
  board: ExamBoardFilter
): boolean {
  if (!paperNumber) return false;

  switch (board) {
    case 'CAIE_IGCSE':
      return paperIdMatchesPracticeSet(
        paperNumber,
        subjectCode,
        CAIE_IGCSE_MYANMAR_PAPERS
      );
    case 'CAIE_ALEVEL':
      return paperIdMatchesPracticeSet(
        paperNumber,
        subjectCode,
        CAIE_ALEVEL_MYANMAR_PAPERS
      );
    case 'EDEXCEL_IGCSE': {
      const allowed = EDEXCEL_IGCSE_MYANMAR_PAPERS[subjectCode];
      if (!allowed) return false;
      return allowed.includes(paperNumber);
    }
    case 'EDEXCEL_IAL':
      return EDEXCEL_IAL_MYANMAR_UNITS.has(subjectCode);
    default:
      return false;
  }
}
