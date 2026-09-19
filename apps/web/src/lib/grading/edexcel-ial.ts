import type { QualificationPlugin, PaperComponent } from './types';
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
  paperSelectionRules: (papers, opts) => {
    let list = papers;
    const code = opts.syllabusCode; // This is typically the Cash-in code (e.g. XMA01, YMA01)

    // Filter out old specification units (e.g. WPH01 vs WPH11) - prefer the newer '1' series
    list = list.filter((p) => {
      // If a subject has a new spec (like WPH11), filter out WPH01
      if (p.paperNumber.match(/^[W][A-Z]{2}0/)) {
        // Only allow 0-series if there's no 1-series equivalent in the list
        const equivalent1Series = p.paperNumber.replace('0', '1');
        if (list.some((other) => other.paperNumber === equivalent1Series)) {
          return false;
        }
      }
      return true;
    });

    const out: PaperComponent[] = [];
    for (const p of list) {
      let exclusiveGroup: string | undefined = undefined;
      // AS Mathematics (XMA01) Option: S1 (WST01) OR M1 (WME01)
      if (code === 'XMA01' && (p.paperNumber === 'WST01' || p.paperNumber === 'WME01')) {
        exclusiveGroup = 'applied_math';
      }
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
