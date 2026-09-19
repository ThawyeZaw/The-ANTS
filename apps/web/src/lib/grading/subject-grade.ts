import type { GradeBoundary } from './types';
import { getPluginForCurriculumCode } from './index';
import type { AwardLevel, ExamBoardFilter, PaperPreferences } from '@/lib/exam-papers/myanmar-papers';
import {
  getRequiredPaperIds,
  pastPaperMatchesMyanmarPaper,
  toCambridgePaperId,
} from '@/lib/exam-papers/myanmar-papers';

export interface SubjectGradePaperInput {
  paperNumber: string;
  variant: string | null;
  rawScore: number | null;
  maxScore: number | null;
  year: number;
  series: string;
}

export interface SubjectGradeResult {
  grade: string | null;
  isOfficial: boolean;
  totalRaw: number;
  maxRaw: number;
  missingPapers: string[];
  message?: string;
}

export function paperRowKey(paperNumber: string, variant: string | null): string {
  return `${paperNumber}-${variant ?? ''}`;
}

export function computeSubjectGrade(opts: {
  subjectCode: string;
  board: ExamBoardFilter | null;
  curriculumCode?: string | null;
  awardLevel?: AwardLevel | null;
  routePrefs?: PaperPreferences | null;
  tier?: 'core' | 'extended' | null;
  seriesYear: number;
  seriesName: string;
  papers: SubjectGradePaperInput[];
  compositeBoundaries: GradeBoundary[];
  hasBoundaryData?: boolean;
}): SubjectGradeResult {
  const {
    subjectCode,
    board,
    curriculumCode,
    awardLevel,
    routePrefs,
    tier,
    seriesYear,
    seriesName,
    papers,
    compositeBoundaries,
    hasBoundaryData = compositeBoundaries.length > 0,
  } = opts;

  if (!board || !subjectCode) {
    return { grade: null, isOfficial: false, totalRaw: 0, maxRaw: 0, missingPapers: [] };
  }

  const requiredIds =
    getRequiredPaperIds(subjectCode, board, { awardLevel, routePrefs, tier, series: seriesName }) ?? [];

  const sessionPapers = papers.filter((p) => p.year === seriesYear && p.series === seriesName);
  const missingPapers: string[] = [];

  let totalRaw = 0;
  let maxRaw = 0;

  for (const reqId of requiredIds) {
    const match = sessionPapers.find((p) => {
      if (board === 'CAIE_IGCSE' || board === 'CAIE_ALEVEL') {
        return toCambridgePaperId(p.paperNumber, p.variant) === reqId;
      }
      return p.paperNumber === reqId;
    });

    if (!match || match.rawScore === null || match.maxScore === null) {
      missingPapers.push(reqId);
      continue;
    }
    totalRaw += match.rawScore;
    maxRaw += match.maxScore;
  }

  if (missingPapers.length > 0) {
    return { grade: null, isOfficial: false, totalRaw, maxRaw, missingPapers };
  }

  if (!hasBoundaryData) {
    const isCaieAL = board === 'CAIE_ALEVEL';
    return {
      grade: null,
      isOfficial: false,
      totalRaw,
      maxRaw,
      missingPapers: [],
      message: isCaieAL
        ? 'Official A Level boundaries not yet seeded.'
        : 'Official subject boundaries unavailable for this series.',
    };
  }

  const plugin = getPluginForCurriculumCode(curriculumCode ?? null);
  const paperComponents = sessionPapers
    .filter((p) => {
      if (board === 'CAIE_IGCSE' || board === 'CAIE_ALEVEL') {
        const combined = toCambridgePaperId(p.paperNumber, p.variant);
        return requiredIds.includes(combined);
      }
      return requiredIds.includes(p.paperNumber);
    })
    .map((p) => ({
      name: p.paperNumber,
      paperNumber: p.paperNumber,
      variant: p.variant,
      maxMark: p.maxScore ?? 0,
      rawMark: p.rawScore ?? 0,
      boundaries: [] as GradeBoundary[],
    }));

  const composite = plugin.compositeGrade(paperComponents, compositeBoundaries, null);
  return {
    grade: composite.grade,
    isOfficial: composite.usedCompositeBoundaries,
    totalRaw: composite.totalRaw,
    maxRaw: composite.maxRaw,
    missingPapers: [],
  };
}

export function isRequiredPaperRow(
  paperNumber: string,
  variant: string | null,
  subjectCode: string,
  board: ExamBoardFilter,
  opts?: { awardLevel?: AwardLevel | null; routePrefs?: PaperPreferences | null; tier?: 'core' | 'extended' | null; series?: string | null }
): boolean {
  return pastPaperMatchesMyanmarPaper(paperNumber, variant, subjectCode, board, opts);
}
