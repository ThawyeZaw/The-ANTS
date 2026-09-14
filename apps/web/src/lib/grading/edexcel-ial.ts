import type { QualificationPlugin } from './types';
import { computeUms, lookupGrade, percentageOf } from './shared';

const DEFAULT_UMS_OVERALL: { grade: string; min_mark: number }[] = [
  { grade: 'A', min_mark: 80 },
  { grade: 'B', min_mark: 70 },
  { grade: 'C', min_mark: 60 },
  { grade: 'D', min_mark: 50 },
  { grade: 'E', min_mark: 40 },
  { grade: 'U', min_mark: 0 },
];

export const edexcelIalPlugin: QualificationPlugin = {
  key: 'Edexcel_IAL',
  countdownMode: 'per_paper',
  hasTiers: false,
  defaultVariant: null,
  paperSelectionRules: (papers) => papers,
  gradeFromRawMark: (raw, max, boundaries) => {
    const percentage = percentageOf(raw, max);
    const { ums, grade } = computeUms(raw, boundaries);
    return { grade, ums, percentage };
  },
  compositeGrade: (papers, compositeBoundaries) => {
    const filled = papers.filter((p) => Number.isFinite(p.rawMark));
    const totalRaw = filled.reduce((sum, p) => sum + p.rawMark, 0);
    const maxRaw = filled.reduce((sum, p) => sum + p.maxMark, 0);
    let totalUms = 0;
    for (const p of filled) {
      totalUms += computeUms(p.rawMark, p.boundaries).ums;
    }
    const avgUms = filled.length > 0 ? totalUms / filled.length : 0;
    const percentage = percentageOf(totalRaw, maxRaw);
    const boundaries = compositeBoundaries?.length ? compositeBoundaries : DEFAULT_UMS_OVERALL;
    return {
      grade: lookupGrade(Math.round(avgUms), boundaries),
      totalRaw,
      maxRaw,
      totalUms: Math.round(totalUms),
      percentage,
      usedCompositeBoundaries: Boolean(compositeBoundaries?.length),
    };
  },
};
