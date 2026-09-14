import type { QualificationPlugin } from './types';
import { fallbackNineOneGrade, gradeFromRawMarks, lookupGrade, percentageOf } from './shared';

export const edexcelIgcsePlugin: QualificationPlugin = {
  key: 'Edexcel_IGCSE',
  countdownMode: 'per_subject',
  hasTiers: false,
  defaultVariant: null,
  paperSelectionRules: (papers) => {
    const seen = new Set<string>();
    return papers.filter((p) => {
      if (seen.has(p.paperNumber)) return false;
      seen.add(p.paperNumber);
      return true;
    });
  },
  gradeFromRawMark: (raw, max, boundaries) => gradeFromRawMarks(raw, max, boundaries, '91'),
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
      grade: fallbackNineOneGrade(percentage),
      totalRaw,
      maxRaw,
      percentage,
      usedCompositeBoundaries: false,
    };
  },
};
