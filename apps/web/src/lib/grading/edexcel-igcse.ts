import type { QualificationPlugin, PaperComponent } from './types';
import { EDEXCEL_IGCSE_PRACTICE_PAPERS } from '@/lib/exam-papers/myanmar-papers';
import { fallbackNineOneGrade, gradeFromRawMarks, lookupGrade, percentageOf } from './shared';

export const edexcelIgcsePlugin: QualificationPlugin = {
  key: 'Edexcel_IGCSE',
  countdownMode: 'per_subject',
  hasTiers: true,
  defaultVariant: null,
  paperSelectionRules: (papers, opts) => {
    let list = papers;
    const code = opts.syllabusCode;
    const practice = code ? EDEXCEL_IGCSE_PRACTICE_PAPERS[code] : undefined;
    if (practice) {
      list = list.filter((p) => practice.includes(p.paperNumber));
    }

    if (opts.syllabusCode === '4MA1' && opts.tier) {
      const allowedSuffix = opts.tier === 'core' ? 'F' : 'H';
      list = list.filter((p) => p.paperNumber.includes(allowedSuffix));
    }

    const grouped = new Map<string, PaperComponent[]>();
    for (const p of list) {
      const base = p.paperNumber.replace(/\D/g, '').charAt(0) || p.paperNumber.charAt(0);
      if (!grouped.has(base)) grouped.set(base, []);
      grouped.get(base)!.push(p);
    }

    const out: PaperComponent[] = [];
    for (const [, groupPapers] of grouped.entries()) {
      const rVariant = groupPapers.find((p) => p.paperNumber.endsWith('R'));
      out.push(rVariant ?? groupPapers[0]!);
    }

    return out.sort((a, b) =>
      a.paperNumber.localeCompare(b.paperNumber, undefined, { numeric: true })
    );
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
