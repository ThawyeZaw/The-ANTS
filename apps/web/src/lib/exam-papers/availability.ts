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

  // Computer Science 0478 & 0984 rules (and other subjects where only variant 2 exists globally/for our users)
  // The user explicitly requested to disable non-variant 2 for 0478.
  if (syllabusCode === '0478' || syllabusCode === '0984') {
    if (variant && variant !== '2') {
      return { available: false, reason: `Only variant 2 is applicable` };
    }
  }

  // By default, if it's not explicitly ruled out, we assume it's available.
  // The 'unseeded' logic is handled separately in the grid data builder.
  return { available: true };
}
