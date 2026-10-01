// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Official Exam Paper Durations & Presets
// Supported Cambridge (CAIE) & Pearson Edexcel IGCSE syllabi
// ──────────────────────────────────────────────────────────────────────────────

export interface ExamPaperConfig {
  paperNumber: string;
  name: string;
  durationMinutes: number;
  totalMarks?: number;
  description?: string;
}

export interface SubjectExamConfig {
  code: string;
  name: string;
  board: 'CAIE' | 'Edexcel';
  curriculumId: 'curr-caie-igcse' | 'curr-edexcel-igcse';
  papers: ExamPaperConfig[];
}

export const EXAM_SUBJECT_CONFIGS: SubjectExamConfig[] = [
  // ── CAIE IGCSE ──
  {
    code: '0580',
    name: 'Mathematics',
    board: 'CAIE',
    curriculumId: 'curr-caie-igcse',
    papers: [
      { paperNumber: 'Paper 2', name: 'Paper 2 (Extended)', durationMinutes: 90, totalMarks: 70, description: '1h 30m Short-answer questions' },
      { paperNumber: 'Paper 4', name: 'Paper 4 (Extended)', durationMinutes: 150, totalMarks: 100, description: '2h 30m Structured questions' },
      { paperNumber: 'Paper 1', name: 'Paper 1 (Core)', durationMinutes: 60, totalMarks: 56, description: '1h Short-answer questions' },
      { paperNumber: 'Paper 3', name: 'Paper 3 (Core)', durationMinutes: 120, totalMarks: 104, description: '2h Structured questions' },
    ],
  },
  {
    code: '0606',
    name: 'Additional Mathematics',
    board: 'CAIE',
    curriculumId: 'curr-caie-igcse',
    papers: [
      { paperNumber: 'Paper 1', name: 'Paper 1', durationMinutes: 120, totalMarks: 80, description: '2h Pure Mathematics' },
      { paperNumber: 'Paper 2', name: 'Paper 2', durationMinutes: 120, totalMarks: 80, description: '2h Pure Mathematics' },
    ],
  },
  {
    code: '0625',
    name: 'Physics',
    board: 'CAIE',
    curriculumId: 'curr-caie-igcse',
    papers: [
      { paperNumber: 'Paper 2', name: 'Paper 2 (Extended MCQ)', durationMinutes: 45, totalMarks: 40, description: '45m 40 multiple-choice questions' },
      { paperNumber: 'Paper 4', name: 'Paper 4 (Extended Theory)', durationMinutes: 75, totalMarks: 80, description: '1h 15m Structured theory questions' },
      { paperNumber: 'Paper 6', name: 'Paper 6 (Alt to Practical)', durationMinutes: 60, totalMarks: 40, description: '1h Alternative to Practical' },
      { paperNumber: 'Paper 1', name: 'Paper 1 (Core MCQ)', durationMinutes: 45, totalMarks: 40, description: '45m 40 multiple-choice questions' },
      { paperNumber: 'Paper 3', name: 'Paper 3 (Core Theory)', durationMinutes: 75, totalMarks: 80, description: '1h 15m Structured questions' },
    ],
  },
  {
    code: '0620',
    name: 'Chemistry',
    board: 'CAIE',
    curriculumId: 'curr-caie-igcse',
    papers: [
      { paperNumber: 'Paper 2', name: 'Paper 2 (Extended MCQ)', durationMinutes: 45, totalMarks: 40, description: '45m 40 multiple-choice questions' },
      { paperNumber: 'Paper 4', name: 'Paper 4 (Extended Theory)', durationMinutes: 75, totalMarks: 80, description: '1h 15m Structured theory questions' },
      { paperNumber: 'Paper 6', name: 'Paper 6 (Alt to Practical)', durationMinutes: 60, totalMarks: 40, description: '1h Alternative to Practical' },
      { paperNumber: 'Paper 1', name: 'Paper 1 (Core MCQ)', durationMinutes: 45, totalMarks: 40, description: '45m 40 multiple-choice questions' },
      { paperNumber: 'Paper 3', name: 'Paper 3 (Core Theory)', durationMinutes: 75, totalMarks: 80, description: '1h 15m Structured questions' },
    ],
  },
  {
    code: '0610',
    name: 'Biology',
    board: 'CAIE',
    curriculumId: 'curr-caie-igcse',
    papers: [
      { paperNumber: 'Paper 2', name: 'Paper 2 (Extended MCQ)', durationMinutes: 45, totalMarks: 40, description: '45m 40 multiple-choice questions' },
      { paperNumber: 'Paper 4', name: 'Paper 4 (Extended Theory)', durationMinutes: 75, totalMarks: 80, description: '1h 15m Structured theory questions' },
      { paperNumber: 'Paper 6', name: 'Paper 6 (Alt to Practical)', durationMinutes: 60, totalMarks: 40, description: '1h Alternative to Practical' },
      { paperNumber: 'Paper 1', name: 'Paper 1 (Core MCQ)', durationMinutes: 45, totalMarks: 40, description: '45m 40 multiple-choice questions' },
      { paperNumber: 'Paper 3', name: 'Paper 3 (Core Theory)', durationMinutes: 75, totalMarks: 80, description: '1h 15m Structured questions' },
    ],
  },
  {
    code: '0478',
    name: 'Computer Science',
    board: 'CAIE',
    curriculumId: 'curr-caie-igcse',
    papers: [
      { paperNumber: 'Paper 1', name: 'Paper 1 (Computer Systems)', durationMinutes: 105, totalMarks: 75, description: '1h 45m Theory' },
      { paperNumber: 'Paper 2', name: 'Paper 2 (Algorithms & Code)', durationMinutes: 105, totalMarks: 75, description: '1h 45m Problem solving & pseudocode' },
    ],
  },
  {
    code: '0455',
    name: 'Economics',
    board: 'CAIE',
    curriculumId: 'curr-caie-igcse',
    papers: [
      { paperNumber: 'Paper 1', name: 'Paper 1 (MCQ)', durationMinutes: 45, totalMarks: 30, description: '45m 30 multiple-choice questions' },
      { paperNumber: 'Paper 2', name: 'Paper 2 (Structured)', durationMinutes: 135, totalMarks: 90, description: '2h 15m Structured written exam' },
    ],
  },
  {
    code: '0450',
    name: 'Business Studies',
    board: 'CAIE',
    curriculumId: 'curr-caie-igcse',
    papers: [
      { paperNumber: 'Paper 1', name: 'Paper 1 (Short Answer)', durationMinutes: 90, totalMarks: 80, description: '1h 30m Short answer & data response' },
      { paperNumber: 'Paper 2', name: 'Paper 2 (Case Study)', durationMinutes: 90, totalMarks: 80, description: '1h 30m Case study evaluation' },
    ],
  },
  {
    code: '0452',
    name: 'Accounting',
    board: 'CAIE',
    curriculumId: 'curr-caie-igcse',
    papers: [
      { paperNumber: 'Paper 1', name: 'Paper 1 (MCQ)', durationMinutes: 75, totalMarks: 35, description: '1h 15m Multiple-choice questions' },
      { paperNumber: 'Paper 2', name: 'Paper 2 (Structured)', durationMinutes: 105, totalMarks: 100, description: '1h 45m Financial statements & ledgers' },
    ],
  },
  {
    code: '0417',
    name: 'Information & Communication Technology',
    board: 'CAIE',
    curriculumId: 'curr-caie-igcse',
    papers: [
      { paperNumber: 'Paper 1', name: 'Paper 1 (Theory)', durationMinutes: 90, totalMarks: 80, description: '1h 30m Written theory paper' },
      { paperNumber: 'Paper 2', name: 'Paper 2 (Document Production)', durationMinutes: 135, totalMarks: 70, description: '2h 15m Practical paper' },
      { paperNumber: 'Paper 3', name: 'Paper 3 (Data Analysis & Web)', durationMinutes: 135, totalMarks: 70, description: '2h 15m Practical paper' },
    ],
  },
  {
    code: '0500',
    name: 'First Language English',
    board: 'CAIE',
    curriculumId: 'curr-caie-igcse',
    papers: [
      { paperNumber: 'Paper 1', name: 'Paper 1 (Reading)', durationMinutes: 120, totalMarks: 80, description: '2h Reading comprehension & response' },
      { paperNumber: 'Paper 2', name: 'Paper 2 (Writing)', durationMinutes: 120, totalMarks: 80, description: '2h Directed writing & composition' },
    ],
  },

  // ── Edexcel IGCSE ──
  {
    code: '4MA1',
    name: 'Mathematics A',
    board: 'Edexcel',
    curriculumId: 'curr-edexcel-igcse',
    papers: [
      { paperNumber: 'Paper 1H', name: 'Paper 1H (Higher)', durationMinutes: 120, totalMarks: 100, description: '2h Higher Tier Calculator paper' },
      { paperNumber: 'Paper 2H', name: 'Paper 2H (Higher)', durationMinutes: 120, totalMarks: 100, description: '2h Higher Tier Calculator paper' },
      { paperNumber: 'Paper 1F', name: 'Paper 1F (Foundation)', durationMinutes: 120, totalMarks: 100, description: '2h Foundation Tier Calculator paper' },
      { paperNumber: 'Paper 2F', name: 'Paper 2F (Foundation)', durationMinutes: 120, totalMarks: 100, description: '2h Foundation Tier Calculator paper' },
    ],
  },
  {
    code: '4MB1',
    name: 'Mathematics B',
    board: 'Edexcel',
    curriculumId: 'curr-edexcel-igcse',
    papers: [
      { paperNumber: 'Paper 1', name: 'Paper 1', durationMinutes: 90, totalMarks: 100, description: '1h 30m Pure mathematics' },
      { paperNumber: 'Paper 2', name: 'Paper 2', durationMinutes: 150, totalMarks: 100, description: '2h 30m Pure mathematics' },
    ],
  },
  {
    code: '4PM1',
    name: 'Further Pure Mathematics',
    board: 'Edexcel',
    curriculumId: 'curr-edexcel-igcse',
    papers: [
      { paperNumber: 'Paper 1', name: 'Paper 1', durationMinutes: 120, totalMarks: 100, description: '2h Pure mathematics' },
      { paperNumber: 'Paper 2', name: 'Paper 2', durationMinutes: 120, totalMarks: 100, description: '2h Pure mathematics' },
    ],
  },
  {
    code: '4PH1',
    name: 'Physics',
    board: 'Edexcel',
    curriculumId: 'curr-edexcel-igcse',
    papers: [
      { paperNumber: 'Paper 1P', name: 'Paper 1P (Main Paper)', durationMinutes: 120, totalMarks: 110, description: '2h Comprehensive physics' },
      { paperNumber: 'Paper 2P', name: 'Paper 2P (Additional)', durationMinutes: 75, totalMarks: 70, description: '1h 15m In-depth topics' },
    ],
  },
  {
    code: '4CH1',
    name: 'Chemistry',
    board: 'Edexcel',
    curriculumId: 'curr-edexcel-igcse',
    papers: [
      { paperNumber: 'Paper 1C', name: 'Paper 1C (Main Paper)', durationMinutes: 120, totalMarks: 110, description: '2h Comprehensive chemistry' },
      { paperNumber: 'Paper 2C', name: 'Paper 2C (Additional)', durationMinutes: 75, totalMarks: 70, description: '1h 15m In-depth topics' },
    ],
  },
  {
    code: '4BI1',
    name: 'Biology',
    board: 'Edexcel',
    curriculumId: 'curr-edexcel-igcse',
    papers: [
      { paperNumber: 'Paper 1B', name: 'Paper 1B (Main Paper)', durationMinutes: 120, totalMarks: 110, description: '2h Comprehensive biology' },
      { paperNumber: 'Paper 2B', name: 'Paper 2B (Additional)', durationMinutes: 75, totalMarks: 70, description: '1h 15m In-depth topics' },
    ],
  },
  {
    code: '4EC1',
    name: 'Economics',
    board: 'Edexcel',
    curriculumId: 'curr-edexcel-igcse',
    papers: [
      { paperNumber: 'Paper 1', name: 'Paper 1 (Microeconomics)', durationMinutes: 90, totalMarks: 80, description: '1h 30m Microeconomics and Business' },
      { paperNumber: 'Paper 2', name: 'Paper 2 (Macroeconomics)', durationMinutes: 90, totalMarks: 80, description: '1h 30m Macroeconomics and Global Economy' },
    ],
  },
  {
    code: '4BS1',
    name: 'Business',
    board: 'Edexcel',
    curriculumId: 'curr-edexcel-igcse',
    papers: [
      { paperNumber: 'Paper 1', name: 'Paper 1 (Small Business)', durationMinutes: 90, totalMarks: 80, description: '1h 30m Investigating small businesses' },
      { paperNumber: 'Paper 2', name: 'Paper 2 (Large Business)', durationMinutes: 90, totalMarks: 80, description: '1h 30m Investigating large businesses' },
    ],
  },
];

export interface ExamPresetQuickPill {
  label: string;
  durationMinutes: number;
  tag: string;
}

export const EXAM_QUICK_PRESETS: ExamPresetQuickPill[] = [
  { label: '45m MCQ', durationMinutes: 45, tag: 'Speed Drill' },
  { label: '1h 15m', durationMinutes: 75, tag: 'Science Theory' },
  { label: '1h 30m', durationMinutes: 90, tag: 'Standard Paper' },
  { label: '1h 45m', durationMinutes: 105, tag: 'CS / Accounting' },
  { label: '2h 00m', durationMinutes: 120, tag: 'Full Exam' },
  { label: '2h 30m', durationMinutes: 150, tag: 'Extended Maths' },
];

export function formatDurationHoursMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h} hour${h > 1 ? 's' : ''}`;
  return `${m} mins`;
}
