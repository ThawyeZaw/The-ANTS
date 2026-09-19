import type { QualificationPlugin, PaperComponent } from './types';
import { fallbackLetterGrade, gradeFromRawMarks, lookupGrade, percentageOf } from './shared';

const ZONE4_ALLOWED: Record<string, string[]> = {
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

export const caieAlevelPlugin: QualificationPlugin = {
  key: 'CAIE_AL',
  countdownMode: 'per_subject',
  hasTiers: false,
  defaultVariant: '2',
  paperSelectionRules: (papers, opts) => {
    let list = papers;
    const code = opts.syllabusCode;
    const allowedZone4 = code ? ZONE4_ALLOWED[code] : undefined;

    if (allowedZone4) {
      list = list.filter((p) => allowedZone4.includes(p.paperNumber));
    } else if (opts.variant) {
      const withVariant = list.filter((p) => (p.variant ?? '2') === opts.variant);
      if (withVariant.length > 0) list = withVariant;
    }

    const out: PaperComponent[] = [];
    for (const p of list) {
      let exclusiveGroup: string | undefined = undefined;
      // Paper 33 and 34 are mutually exclusive practicals for AS level Sciences
      if (['9702', '9701', '9700'].includes(code ?? '') && (p.paperNumber === '33' || p.paperNumber === '34')) {
        exclusiveGroup = 'practical';
      }
      out.push({ ...p, exclusiveGroup });
    }

    if (allowedZone4) {
      return out.sort((a, b) =>
        a.paperNumber.localeCompare(b.paperNumber, undefined, { numeric: true })
      );
    }

    const seen = new Set<string>();
    return out.filter((p) => {
      // CAIE base logic: the first digit is usually the paper base
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
