// apps/web/src/lib/exam-papers/availability.ts

/**
 * Checks if a specific paper variant is globally available/valid for a given CAIE exam series.
 * This is used to disable grid cells for papers that do not exist (e.g., 0417 variant 11 in Feb/March).
 */
export function isPaperAvailable(
  syllabusCode: string,
  paperNumber: string,
  variant: string | null,
  series: string
): { available: boolean; reason?: string } {
  // Combine to something like "11", "21", or "02"
  const combined = variant ? `${paperNumber}${variant}` : paperNumber;

  // ICT 0417 & 0983 rules
  if (syllabusCode === '0417' || syllabusCode === '0983') {
    if (series === 'Feb/March') {
      // In Feb/March, ICT only has variants 12, 21, 31 (and practicals sometimes coded as 02, 03, 2, 3)
      const allowed = ['12', '21', '31', '02', '03', '2', '3'];
      if (!allowed.includes(combined)) {
        return { available: false, reason: `Not available in Feb/March` };
      }
    } else if (series === 'Oct/Nov') {
      // User specified for Oct/Nov: Only allow 11, 12, 13, 02, 03 (which means 21, 31 for practicals)
      const allowed = ['11', '12', '13', '21', '31', '02', '03', '2', '3'];
      if (!allowed.includes(combined)) {
        return { available: false, reason: `Not available in Oct/Nov` };
      }
    }
  }

  // Computer Science 0478 & 0984 rules
  // In Feb/March (India-only series), only variant 2 exists.
  // In May/June and Oct/Nov, variants 1, 2, and 3 are all available (papers 11, 12, 13, 21, 22, 23).
  if (syllabusCode === '0478' || syllabusCode === '0984') {
    if (series === 'Feb/March' && variant && variant !== '2') {
      return { available: false, reason: 'Not available in Feb/March (variant 2 only)' };
    }
  }

  // By default, if it's not explicitly ruled out, we assume it's available.
  // The 'unseeded' logic is handled separately in the grid data builder.
  return { available: true };
}
