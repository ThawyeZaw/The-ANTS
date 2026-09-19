import type { QualificationPlugin, PaperComponent } from './types';
import { computeUms, percentageOf } from './shared';
import { appliedMathExclusiveGroup, evaluateIalCashIn, type IalCashInCode } from './ial-cash-in';

export const edexcelIalPlugin: QualificationPlugin = {
  key: 'Edexcel_IAL',
  countdownMode: 'per_paper',
  hasTiers: false,
  defaultVariant: null,
  paperSelectionRules: (papers, opts) => {
    let list = papers;
    const cashIn = opts.cashInCode ?? null;

    list = list.filter((p) => {
      if (p.paperNumber.match(/^[W][A-Z]{2}0/)) {
        const equivalent1Series = p.paperNumber.replace('0', '1');
        if (list.some((other) => other.paperNumber === equivalent1Series)) {
          return false;
        }
      }
      return true;
    });

    const out: PaperComponent[] = [];
    for (const p of list) {
      const unit = p.paperNumber.length >= 5 ? p.paperNumber : opts.syllabusCode ?? p.paperNumber;
      const exclusiveGroup = appliedMathExclusiveGroup(cashIn, unit);
      out.push({ ...p, exclusiveGroup });
    }

    return out.sort((a, b) =>
      a.paperNumber.localeCompare(b.paperNumber, undefined, { numeric: true })
    );
  },
  gradeFromRawMark: (raw, max, boundaries) => {
    const percentage = percentageOf(raw, max);
    const { ums, grade } = computeUms(raw, boundaries);
    return { grade, ums, percentage };
  },
  compositeGrade: (papers, compositeBoundaries, cashInCode) => {
    const filled = papers.filter((p) => Number.isFinite(p.rawMark));
    const totalRaw = filled.reduce((sum, p) => sum + p.rawMark, 0);
    const maxRaw = filled.reduce((sum, p) => sum + p.maxMark, 0);
    const unitUms: Record<string, number> = {};
    for (const p of filled) {
      const unit = p.paperNumber.length >= 5 ? p.paperNumber : p.name;
      unitUms[unit] = computeUms(p.rawMark, p.boundaries).ums;
    }
    return evaluateIalCashIn({
      unitUms,
      cashInCode: (cashInCode as IalCashInCode | null) ?? null,
      compositeBoundaries,
      totalRaw,
      maxRaw,
    });
  },
};
