// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Homepage static constants
// MVP: hardcoded values. When Supabase is live, swap for server action calls.
// ──────────────────────────────────────────────────────────────────────────────

/** High-impact stats displayed in the StatsRow component */
export const HOMEPAGE_STATS = [
  { value: '6', label: 'EXAM BOARDS' },
  { value: '4', label: 'USER ROLES' },
  { value: '120+', label: 'ACTIVE CLUBS' },
  { value: '100+', label: 'STUDENTS' },
] as const;

/** Qualification boards data for the carousel */
export const QUALIFICATION_BOARDS = [
  {
    name: 'Cambridge CAIE',
    qualifications: ['IGCSE', 'A Levels'],
    color: '#E1140A',
    emoji: '🎓',
    description: 'World-renowned curriculum trusted by top universities globally.',
  },
  {
    name: 'Pearson Edexcel',
    qualifications: ['IGCSE', 'International A Level (IAL)'],
    color: '#002B5C',
    emoji: '📘',
    description: 'UK-based qualifications with a strong international presence.',
  },
  {
    name: 'OSSD',
    qualifications: ['Ontario Secondary School Diploma'],
    color: '#D4AA00',
    emoji: '🍁',
    description: 'Canadian high school diploma recognized worldwide.',
  },
  {
    name: 'IELTS',
    qualifications: ['Academic', 'General Training'],
    color: '#003A70',
    emoji: '🌍',
    description: 'The world\'s most popular English language proficiency test.',
  },
  {
    name: 'SAT',
    qualifications: ['Math', 'Reading & Writing'],
    color: '#041E42',
    emoji: '📝',
    description: 'Standardized college admissions test for US universities.',
  },
  {
    name: 'Duolingo',
    qualifications: ['Duolingo English Test (DET)'],
    color: '#58CC02',
    emoji: '💬',
    description: 'Convenient, affordable English certification accepted by 5000+ institutions.',
  },
] as const;