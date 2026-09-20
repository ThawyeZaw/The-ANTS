import { parseExamSeason, toCambridgePaperId } from '@/lib/exam-papers/myanmar-papers';

/**
 * Series-specific Cambridge components. Keys are combined paper IDs
 * (11/12/13, or unvarianted 02/03). Used to disable tracker cells for
 * papers that were not offered in that series.
 */
const CAIE_SERIES_COMPONENTS: Record<string, Partial<Record<string, readonly string[]>>> = {
  // ICT: Oct/Nov practicals are unvarianted 02/03; May/June uses 21/22 and 31/32.
  '0417': {
    'Feb/March': ['12', '21', '31'],
    'May/June': ['11', '12', '13', '21', '22', '31', '32'],
    'Oct/Nov': ['11', '12', '13', '02', '03'],
  },
  '0983': {
    'Feb/March': ['12', '21', '31'],
    'May/June': ['11', '12', '13', '21', '22', '31', '32'],
    'Oct/Nov': ['11', '12', '13', '02', '03'],
  },
};

/**
 * Checks if a specific paper variant is offered for a given CAIE exam series.
 * Used to disable grid cells for papers that do not exist (e.g. 0417/21 in Oct/Nov).
 */
export function isPaperAvailable(
  syllabusCode: string,
  paperNumber: string,
  variant: string | null,
  series: string
): { available: boolean; reason?: string } {
  const combined = toCambridgePaperId(paperNumber, variant);
  const season = parseExamSeason(series) ?? series;

  const explicit = CAIE_SERIES_COMPONENTS[syllabusCode]?.[season];
  if (explicit) {
    if (!explicit.includes(combined)) {
      return { available: false, reason: `Not available in ${season}` };
    }
    return { available: true };
  }

  // Computer Science 0478 & 0984: Feb/March is variant 2 only.
  if (syllabusCode === '0478' || syllabusCode === '0984') {
    if (season === 'Feb/March' && variant && variant !== '2') {
      return { available: false, reason: 'Not available in Feb/March (variant 2 only)' };
    }
  }

  return { available: true };
}
