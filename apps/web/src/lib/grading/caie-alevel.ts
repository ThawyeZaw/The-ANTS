import type { QualificationPlugin } from './types';
import { fallbackLetterGrade, gradeFromRawMarks, lookupGrade, percentageOf } from './shared';

export const caieAlevelPlugin: QualificationPlugin = {
  key: 'CAIE_AL',
  countdownMode: 'per_subject',
  hasTiers: false,
  defaultVariant: '2',
  paperSelectionRules: (papers, opts) => {
    let list = papers;
    if (opts.variant) {
      const withVariant = list.filter((p) => (p.variant ?? '2') === opts.variant);
      if (withVariant.length > 0) list = withVariant;
    }
    const seen = new Set<string>();
    return list.filter((p) => {
      if (seen.has(p.paperNumber)) return false;
      seen.add(p.paperNumber);
      return true;
    });
  },
  gradeFromRawMark: (raw, max, boundaries) => gradeFromRawMarks(raw, max, boundaries, 'AG'),
  compositeGrade: (papers, compositeBoundaries) => {
    const totalRaw = papers.reduce((sum, p) => sum + p.rawMark, 0);
    const maxRaw = papers.reduce((sum, p) => sum + p.maxMark, 0);
    const percentage = percentageOf(totalRaw, maxRaw);
    if (compositeBoundaries?.length) {
      return {
        grade: lookupGrade(totalRaw, compositeBoundaries),
        totalRaw,
        maxRaw,
        percentage,
        usedCompositeBoundaries: true,
      };
    }
    return {
      grade: fallbackLetterGrade(percentage),
      totalRaw,
      maxRaw,
      percentage,
      usedCompositeBoundaries: false,
    };
  },
};
