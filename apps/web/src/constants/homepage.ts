// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Homepage static constants
// MVP: hardcoded values. When Supabase is live, swap for server action calls.
// Icon keys map to Lucide icons in consuming components.
// Clubs / classrooms intentionally omitted (retired product surface).
// ──────────────────────────────────────────────────────────────────────────────

/** High-impact stats displayed in the StatsRow component */
export const HOMEPAGE_STATS = [
  { endValue: 2, label: 'FLAGSHIP BOARDS' },
  { endValue: 10000, label: 'TOPICS & MARKS', suffix: '+' },
  { endValue: 7, label: 'STUDY TOOLS', suffix: '+' },
  { endValue: 100, label: 'FREE ECOSYSTEM', suffix: '%' },
] as const;

/** Qualification boards actively supported on the platform */
export const QUALIFICATION_BOARDS = [
  {
    name: 'Cambridge Assessment (CAIE)',
    badge: 'CAIE SPEC 2024-2026',
    qualifications: ['IGCSE Sciences', 'Pure Math (9709)', 'Economics (9708)'],
    color: 'var(--hp-brand)',
    icon: 'GraduationCap' as const,
    description:
      'Cambridge IGCSE & International A Levels. Syllabus breakdowns, topic completion trackers, and official component thresholds.',
    cta: 'Explore Cambridge Syllabi',
    href: '/curriculum',
  },
  {
    name: 'Pearson Edexcel',
    badge: 'EDEXCEL MODULAR & IGCSE',
    qualifications: ['IAL Modular Sciences', 'Modular Maths Suite (WMA11-SET)', 'IGCSE Series'],
    color: 'var(--hp-amber)',
    icon: 'BookOpen' as const,
    description:
      'Modular IAL & IGCSE with official unit-by-unit UMS conversion rules, cash-in combinations, and verified past paper matrices.',
    cta: 'Explore Edexcel Units',
    href: '/curriculum',
  },
  {
    name: 'IELTS Academic & Tests',
    badge: 'ENGLISH PROFICIENCY & SCHOOL',
    qualifications: ['Writing & Speaking Prep', 'Custom Exam Countdowns', 'Study Time-blocking'],
    color: 'var(--hp-violet)',
    icon: 'Mic' as const,
    description:
      'Custom countdown timers and time-blocking timetable for IELTS tests, school term mocks, and daily language practice.',
    cta: 'Set IELTS Countdown',
    href: '/countdown',
  },
] as const;

/** Qualification boards currently in development */
export const UPCOMING_BOARDS = [
  { name: 'OSSD Ontario Diploma', status: 'Coming in Hot' },
  { name: 'Digital SAT 1500+ Bank', status: 'Coming in Hot' },
  { name: 'Duolingo DET 130+', status: 'Soon' },
] as const;

/** Verified mentor previews for the Explore / mentors section */
export const MENTOR_PREVIEWS = [
  {
    initials: 'MT',
    name: 'May Thant',
    location: 'Yangon · Cambridge Scholar',
    tags: ['Bio Guru · 500+ hrs', 'A* in CAIE Bio & Chem'],
    quote:
      'Specialized in converting Paper 4 structured questions into straightforward step-by-step scoring checklists.',
    rating: '4.98',
    reviews: 42,
    accent: 'var(--hp-brand)',
  },
  {
    initials: 'MK',
    name: 'Min Khant',
    location: 'Mandalay · Math Olympian',
    tags: ['Pure Math Wizard', 'Edexcel P1-P4 + M1'],
    quote:
      'No rote memorizing. We solve past papers under exam conditions with instant live mark schemes review.',
    rating: '5.0',
    reviews: 68,
    accent: 'var(--hp-amber)',
  },
  {
    initials: 'HE',
    name: 'Hnin Ei',
    location: 'Yangon · British Council Certified',
    tags: ['IELTS Band 8.5', 'Speaking 9.0'],
    quote:
      'Tired of scoring Band 6.5 in Writing Task 2? I will teach you the exact cohesion templates that British Council examiners love.',
    rating: '4.95',
    reviews: 55,
    accent: 'var(--hp-violet)',
  },
] as const;
