import type { QualificationPlugin, PaperComponent } from './types';
import {
  CAIE_ALEVEL_PRACTICE_VARIANTS,
  getPracticePaperIds,
  toCambridgePaperId as toCombined,
} from '@/lib/exam-papers/myanmar-papers';
import { fallbackLetterGrade, gradeFromRawMarks, lookupGrade, percentageOf, toCambridgePaperId, caiePaperBase } from './shared';

export const caieAlevelPlugin: QualificationPlugin = {
  key: 'CAIE_AL',
  countdownMode: 'per_subject',
  hasTiers: false,
  defaultVariant: '2',
  paperSelectionRules: (papers, opts) => {
    let list = papers;
    const code = opts.syllabusCode;
    const practiceVariants = code
      ? getPracticePaperIds(code, 'CAIE_ALEVEL') ?? CAIE_ALEVEL_PRACTICE_VARIANTS[code]
      : undefined;

    if (practiceVariants) {
      list = list.filter((p) =>
        practiceVariants.includes(toCambridgePaperId(p.paperNumber, p.variant))
      );
    } else if (opts.variant) {
      const withVariant = list.filter((p) => (p.variant ?? '2') === opts.variant);
      if (withVariant.length > 0) list = withVariant;
    }

    const out: PaperComponent[] = [];
    for (const p of list) {
      let exclusiveGroup: string | undefined = undefined;
      const combined = toCombined(p.paperNumber, p.variant);
      const base = caiePaperBase(p.paperNumber);
      if (['9702', '9701', '9700'].includes(code ?? '') && (combined === '33' || combined === '34')) {
        exclusiveGroup = 'practical';
      }
      if (code === '9709' && (base === '4' || base === '5')) {
        exclusiveGroup = 'applied_math';
      }
      out.push({ ...p, exclusiveGroup });
    }

    if (practiceVariants) {
      return out.sort((a, b) =>
        a.paperNumber.localeCompare(b.paperNumber, undefined, { numeric: true })
      );
    }

    const seen = new Set<string>();
    return out.filter((p) => {
      const base = p.paperNumber.replace(/\D/g, '').charAt(0);
      if (seen.has(base)) return false;
      seen.add(base);
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
