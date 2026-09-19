import type { QualificationKey } from '@/types';

export type CountdownMode = 'per_subject' | 'per_paper';
export type SubjectTier = 'core' | 'extended';

export interface GradeBoundary {
  grade: string;
  min_mark: number;
  max_mark?: number | null;
  ums_min?: number | null;
  ums_max?: number | null;
}

export interface PaperComponent {
  name: string;
  paperNumber: string;
  variant?: string | null;
  maxMark: number;
  title?: string | null;
  exclusiveGroup?: string;
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
}

export interface PaperSelectionOptions {
  tier?: SubjectTier | null;
  variant?: string | null;
  syllabusCode?: string;
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
    papers: Array<PaperComponent & { rawMark: number }>,
    compositeBoundaries?: GradeBoundary[]
  ) => CompositeGradeResult;
}
