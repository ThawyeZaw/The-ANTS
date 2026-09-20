import type { QualificationKey } from '@/types';

export type CountdownMode = 'per_subject' | 'per_paper';
export type SubjectTier = 'core' | 'extended';

export interface GradeBoundary {
  grade: string;
  min_mark: number;
  max_mark?: number | null;
  ums_min?: number | null;
  ums_max?: number | null;
  /** Seed row id; used to pick the matching Cambridge option table. */
  sourceId?: string;
}

export interface PaperComponent {
  name: string;
  paperNumber: string;
  variant?: string | null;
  maxMark: number;
  title?: string | null;
  exclusiveGroup?: string;
  syllabusCode?: string;
  boundaries: GradeBoundary[];
}

export interface PaperGradeResult {
  grade: string;
  ums?: number;
  percentage: number;
}

export interface CompositeGradeResult {
  grade: string;
  totalRaw: number;
  maxRaw: number;
  totalUms?: number;
  percentage: number;
  usedCompositeBoundaries: boolean;
  aStarEligible?: boolean;
  aStarNotes?: string[];
}

export interface PaperSelectionOptions {
  tier?: SubjectTier | null;
  variant?: string | null;
  syllabusCode?: string;
  awardLevel?: 'AS' | 'A Level' | null;
  series?: string | null;
  cashInCode?: string | null;
  mathsRoute?: '42' | '52' | null;
}

export interface QualificationPlugin {
  key: QualificationKey;
  countdownMode: CountdownMode;
  hasTiers: boolean;
  defaultVariant: string | null;
  paperSelectionRules: (
    papers: PaperComponent[],
    opts: PaperSelectionOptions
  ) => PaperComponent[];
  gradeFromRawMark: (
    raw: number,
    max: number,
    boundaries: GradeBoundary[]
  ) => PaperGradeResult;
  compositeGrade: (
    papers: Array<PaperComponent & { rawMark: number; umsInput?: number }>,
    compositeBoundaries?: GradeBoundary[],
    cashInCode?: string | null
  ) => CompositeGradeResult;
}
