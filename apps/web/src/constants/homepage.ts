// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Homepage static constants
// MVP: hardcoded values. When Supabase is live, swap for server action calls.
// ──────────────────────────────────────────────────────────────────────────────

/** High-impact stats displayed in the StatsRow component */
export const HOMEPAGE_STATS = [
  { value: '3', label: 'EXAM BOARDS' },
  { value: '3', label: 'COMING SOON' },
  { value: '120+', label: 'ACTIVE CLUBS' },
  { value: '100+', label: 'STUDENTS' },
] as const;

/** Qualification boards actively supported on the platform */
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
    name: 'IELTS',
    qualifications: ['Academic', 'General Training'],
    color: '#003A70',
    emoji: '🌍',
    description: 'The world\'s most popular English language proficiency test.',
  },
] as const;

/** Qualification boards currently in development */
export const UPCOMING_BOARDS = [
  {
    name: 'OSSD',
    qualifications: ['Ontario Secondary School Diploma'],
    color: '#D4AA00',
    emoji: '🍁',
  },
  {
    name: 'SAT',
    qualifications: ['Math', 'Reading & Writing'],
    color: '#041E42',
    emoji: '📝',
  },
  {
    name: 'Duolingo',
    qualifications: ['Duolingo English Test (DET)'],
    color: '#58CC02',
    emoji: '💬',
  },
] as const;