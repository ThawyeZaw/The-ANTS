import type { SubjectTier } from '@/lib/grading/types';

export interface OnboardingSubjectPick {
  curriculumId: string;
  curriculumCode: string;
  curriculumTitle: string;
  subjectId: string;
  subjectTitle: string;
  subjectCode: string;
  /** Parent group title for IAL units (e.g. Mathematics) */
  groupTitle?: string;
  /** IAL elective unit chosen by the user (not auto-required) */
  isOptionalUnit?: boolean;
  tier?: SubjectTier | null;
  targetGrade?: string | null;
  /** Per-subject exam session override; falls back to global default */
  targetSeries?: string | null;
}

export interface OnboardingCatalogSubject {
  id: string;
  curriculum_id: string;
  name: string;
  title: string;
  code: string;
  description: string | null;
  color_code?: string | null;
}

export interface OnboardingCatalogCurriculum {
  id: string;
  name: string;
  title: string;
  code: string;
  description: string | null;
  subjects: OnboardingCatalogSubject[];
}

/** Boards shown during launch onboarding */
export const ONBOARDING_CURRICULUM_CODES = new Set([
  'CAIE_IGCSE',
  'CAIE_ALEVEL',
  'EDEXCEL_IGCSE',
  'EDEXCEL_IAL',
]);

export const ONBOARDING_STEPS = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Subjects' },
  { id: 3, label: 'Exams' },
] as const;

/** Cambridge / Edexcel IGCSE letter grades (A*–G). */
export const TARGET_GRADES_IGCSE = [
  'A*',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'U',
] as const;

/** Cambridge A Level and Pearson Edexcel IAL grades (A*–E). */
export const TARGET_GRADES_ALEVEL = ['A*', 'A', 'B', 'C', 'D', 'E', 'U'] as const;

export function targetGradesForCurriculum(
  curriculumCode: string
): readonly string[] {
  if (curriculumCode === 'CAIE_IGCSE' || curriculumCode === 'EDEXCEL_IGCSE') {
    return TARGET_GRADES_IGCSE;
  }
  return TARGET_GRADES_ALEVEL;
}
