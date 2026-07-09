// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Qualification Registry
// Central reference for all supported exam boards, qualifications, grading
// systems, and hierarchy models.
//
// Owner: PM (TYZ)
// ──────────────────────────────────────────────────────────────────────────────

import type { QualificationKey, GradingSystem, HierarchyModel, ExamDateType } from '@/types';

// ── Qualification Metadata ────────────────────────────────────────────────────

export interface QualificationMeta {
  key: QualificationKey;
  /** Human-readable label shown in UI */
  label: string;
  /** Short abbreviation shown in badges */
  shortLabel: string;
  /** Exam board organisation name */
  board: string;
  /** Board abbreviation used for tagging/filtering */
  boardCode: string;
  /** Grade/scoring system used by this qualification */
  gradingSystem: GradingSystem;
  /** 3-level content hierarchy for lesson tracker */
  hierarchy: HierarchyModel;
  /** Whether exam dates are globally fixed (board calendar) or user-defined */
  dateType: ExamDateType;
  /** Available exam series (for fixed-date qualifications) */
  examSeries?: string[];
  /** Grade scale description shown in grade calculator */
  gradeScale: string;
  /** Short description of this qualification */
  description: string;
  /** Tailwind colour class used for board badge styling */
  colorClass: string;
  /** Whether this qualification is currently fully supported ('live'), coming soon ('soon'), or future ('future') */
  status: 'live' | 'soon' | 'future';
}

export const QUALIFICATION_REGISTRY: Record<QualificationKey, QualificationMeta> = {
  CAIE_IGCSE: {
    key: 'CAIE_IGCSE',
    label: 'Cambridge IGCSE',
    shortLabel: 'IGCSE',
    board: 'Cambridge Assessment International Education',
    boardCode: 'CAIE',
    gradingSystem: 'raw_marks_AG',
    hierarchy: { level1: 'Subject', level2: 'Paper', level3: 'Topic' },
    dateType: 'fixed',
    examSeries: ['May/June', 'Oct/Nov'],
    gradeScale: 'A* – G (or 9–1 in some regions)',
    description:
      'Two-year linear qualification. All papers taken at the end of the course. Subjects tagged by 4-digit codes (e.g. 0620). Core tier (max C) or Extended tier (max A*).',
    colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300',
    status: 'live',
  },
  Edexcel_IGCSE: {
    key: 'Edexcel_IGCSE',
    label: 'Pearson Edexcel IGCSE',
    shortLabel: 'IGCSE',
    board: 'Pearson Edexcel',
    boardCode: 'Edexcel',
    gradingSystem: 'raw_marks_91',
    hierarchy: { level1: 'Subject', level2: 'Paper', level3: 'Topic' },
    dateType: 'fixed',
    examSeries: ['May/June', 'Oct/Nov', 'Jan (some subjects)'],
    gradeScale: '9 – 1',
    description:
      'Linear qualification with 9–1 grading. Subjects tagged by alphanumeric codes (e.g. 4MA1). Usually split into Paper 1 and Paper 2.',
    colorClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300',
    status: 'live',
  },
  Edexcel_IAL: {
    key: 'Edexcel_IAL',
    label: 'Edexcel International A Level',
    shortLabel: 'IAL',
    board: 'Pearson Edexcel',
    boardCode: 'Edexcel',
    gradingSystem: 'ums',
    hierarchy: { level1: 'Subject', level2: 'Unit', level3: 'Topic' },
    dateType: 'fixed',
    examSeries: ['Jan', 'May/June', 'Oct'],
    gradeScale: 'A* – E (via UMS)',
    description:
      'Highly modular qualification. Each unit (e.g. WMA11) has independent exams and can be retaken. Raw marks are converted to UMS for standardisation. A "cash-in" code is required for the final AS or A Level certificate.',
    colorClass: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-300',
    status: 'live',
  },
  CAIE_AL: {
    key: 'CAIE_AL',
    label: 'Cambridge AS & A Level',
    shortLabel: 'A Level',
    board: 'Cambridge Assessment International Education',
    boardCode: 'CAIE',
    gradingSystem: 'raw_marks_AG',
    hierarchy: { level1: 'Subject', level2: 'Paper', level3: 'Topic' },
    dateType: 'fixed',
    examSeries: ['May/June', 'Oct/Nov'],
    gradeScale: 'A* – E (A Level) / A – E (AS)',
    description:
      'Staged linear qualification. Students may take the AS in Year 1 and carry marks forward to A2 within 13 months. Graded on raw marks against yearly grade boundaries — no UMS conversion.',
    colorClass: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-300',
    status: 'live',
  },
  IELTS: {
    key: 'IELTS',
    label: 'IELTS Academic',
    shortLabel: 'IELTS',
    board: 'British Council / IDP / Cambridge',
    boardCode: 'IELTS',
    gradingSystem: 'band',
    hierarchy: { level1: 'Module', level2: 'Skill Area', level3: 'Practice Task' },
    dateType: 'custom',
    gradeScale: 'Band 0 – 9 (in 0.5 increments)',
    description:
      'Single-sitting English proficiency test. Four modules: Reading, Writing, Listening, Speaking. Overall band = exact average rounded to nearest 0.5. Tests are available almost daily (computer-delivered).',
    colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300',
    status: 'live',
  },
  OSSD: {
    key: 'OSSD',
    label: 'Ontario Secondary School Diploma',
    shortLabel: 'OSSD',
    board: 'Ontario Ministry of Education',
    boardCode: 'OSSD',
    gradingSystem: 'percentage',
    hierarchy: { level1: 'Course', level2: 'Module', level3: 'Assignment' },
    dateType: 'custom',
    gradeScale: 'Percentage (0–100%)',
    description:
      'Credit-based diploma requiring 30 credits, 40 hours community service, and passing the OSSLT. Grades are cumulative (assignments, projects, final exam). Dates are school-specific, not global.',
    colorClass: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300',
    status: 'soon',
  },
  GED: {
    key: 'GED',
    label: 'General Educational Development',
    shortLabel: 'GED',
    board: 'GED Testing Service',
    boardCode: 'GED',
    gradingSystem: 'scaled',
    hierarchy: { level1: 'Subject', level2: 'Domain', level3: 'Skill' },
    dateType: 'custom',
    gradeScale: '145–200 per subject (145 = Pass, 165 = College Ready)',
    description:
      'High school equivalency credential covering Math, Science, Social Studies, and Reasoning through Language Arts. Computer-based, on-demand. Subjects taken one at a time.',
    colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300',
    status: 'future',
  },
};

// ── Ordered list for UI rendering ─────────────────────────────────────────────

/** All qualifications in display order */
export const QUALIFICATION_LIST: QualificationMeta[] = Object.values(
  QUALIFICATION_REGISTRY
).sort((a, b) => {
  const order: QualificationKey[] = [
    'CAIE_IGCSE',
    'Edexcel_IGCSE',
    'CAIE_AL',
    'Edexcel_IAL',
    'IELTS',
    'OSSD',
    'GED',
  ];
  return order.indexOf(a.key) - order.indexOf(b.key);
});

/** Live qualifications only */
export const LIVE_QUALIFICATIONS = QUALIFICATION_LIST.filter(q => q.status === 'live');

/** All unique board codes for filter dropdowns */
export const ALL_BOARD_CODES: string[] = [
  ...new Set(QUALIFICATION_LIST.map(q => q.boardCode)),
];

// ── Grade Calculator Logic Helpers ────────────────────────────────────────────

/**
 * IELTS band rounding algorithm.
 * The overall band is the exact average of four module scores,
 * rounded to the nearest 0.5 using the following rule:
 *  - Exact 0.25 rounds UP to 0.5
 *  - Below 0.25 rounds DOWN to 0.0 (of that whole number)
 */
export function calculateIELTSOverallBand(
  reading: number,
  writing: number,
  listening: number,
  speaking: number
): number {
  const avg = (reading + writing + listening + speaking) / 4;
  // Round to nearest 0.5
  return Math.round(avg * 2) / 2;
}

/**
 * Grade boundary lookup for Cambridge (raw_marks_AG / raw_marks_91).
 * Given a raw score and a boundary table, returns the grade string.
 */
export function lookupGrade(
  rawScore: number,
  boundaries: { grade: string; min_mark: number }[]
): string {
  // Sort descending by min_mark
  const sorted = [...boundaries].sort((a, b) => b.min_mark - a.min_mark);
  for (const b of sorted) {
    if (rawScore >= b.min_mark) return b.grade;
  }
  return 'U'; // Ungraded
}

/**
 * Edexcel IAL UMS aggregation.
 * Sums UMS scores across all required units to determine final grade.
 * Grade thresholds are qualification-specific and must be passed in.
 */
export function calculateIALFinalGrade(
  umsScores: number[],
  gradeBoundaries: { grade: string; min_total_ums: number }[]
): string {
  const total = umsScores.reduce((sum, s) => sum + s, 0);
  const sorted = [...gradeBoundaries].sort((a, b) => b.min_total_ums - a.min_total_ums);
  for (const b of sorted) {
    if (total >= b.min_total_ums) return b.grade;
  }
  return 'U';
}

// ── Exam Series Calendar ───────────────────────────────────────────────────────

/**
 * Approximate real-world exam date ranges for fixed-date qualifications.
 * Used as default placeholders when adding library exam countdowns.
 */
export const EXAM_SERIES_DATES: Record<string, { start: string; end: string }> = {
  'May/June 2026': { start: '2026-05-04', end: '2026-06-19' },
  'Oct/Nov 2026': { start: '2026-10-05', end: '2026-11-20' },
  'Jan 2026': { start: '2026-01-05', end: '2026-01-30' },
  'May/June 2027': { start: '2027-05-03', end: '2027-06-18' },
  'Oct/Nov 2027': { start: '2027-10-04', end: '2027-11-19' },
};

// ── Syllabus Code Lookup ───────────────────────────────────────────────────────

/** Common CAIE IGCSE subject codes for autocomplete in editors */
export const CAIE_IGCSE_CODES: Record<string, string> = {
  '0580': 'Mathematics',
  '0625': 'Physics',
  '0620': 'Chemistry',
  '0610': 'Biology',
  '0500': 'English – First Language',
  '0511': 'English – Second Language',
  '0470': 'History',
  '0460': 'Geography',
  '0455': 'Economics',
  '0450': 'Business Studies',
  '0417': 'Computer Science',
  '0478': 'Computer Science (alt)',
};

/** Common Edexcel IGCSE subject codes */
export const EDEXCEL_IGCSE_CODES: Record<string, string> = {
  '4MA1': 'Mathematics A',
  '4MB1': 'Mathematics B',
  '4PH1': 'Physics',
  '4CH1': 'Chemistry',
  '4BI1': 'Biology',
  '4EA1': 'English Language',
};

/** Common Edexcel IAL unit codes */
export const EDEXCEL_IAL_CODES: Record<string, string> = {
  'WMA11': 'Pure Mathematics 1',
  'WMA12': 'Pure Mathematics 2',
  'WMA13': 'Pure Mathematics 3',
  'WMA14': 'Pure Mathematics 4',
  'WME01': 'Mechanics 1',
  'WST01': 'Statistics 1',
  'WPH11': 'Physics Unit 1',
  'WPH12': 'Physics Unit 2',
  'WCH11': 'Chemistry Unit 1',
  'WCH12': 'Chemistry Unit 2',
  'WBI11': 'Biology Unit 1',
  'WBI12': 'Biology Unit 2',
};
