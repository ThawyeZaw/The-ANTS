// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Homepage static constants
// MVP: hardcoded values. When Supabase is live, swap for server action calls.
// Icon keys map to Lucide icons in consuming components.
// Clubs / classrooms intentionally omitted (retired product surface).
// ──────────────────────────────────────────────────────────────────────────────

/** High-impact stats displayed in the StatsRow component */
export const HOMEPAGE_STATS = [
  { endValue: 6, label: 'EXAM BOARDS' },
  { endValue: 10000, label: 'PAST PAPER MARKS', suffix: '+' },
  { endValue: 4, label: 'PROGRESSION ROLES' },
  { endValue: 0, label: '100% FREE ECOSYSTEM', suffix: ' MMK' },
] as const;

/** Qualification boards actively supported on the platform */
export const QUALIFICATION_BOARDS = [
  {
    name: 'Cambridge Assessment',
    badge: 'CAIE SPEC 2024-2026',
    qualifications: ['Pure Math (9709)', 'Physics (0625)', 'Economics (9708)'],
    color: 'var(--hp-brand)',
    icon: 'GraduationCap' as const,
    description:
      'IGCSE, O Levels & International A Levels. Full past paper topical indices and examiner reports.',
    cta: 'Explore Cambridge Syllabi',
    href: '/library?board=cambridge',
  },
  {
    name: 'Pearson Edexcel',
    badge: 'EDEXCEL MODULAR',
    qualifications: ['IAL Chemistry (WCH11)', 'Pure Math 1-4', 'Mechanics M1'],
    color: 'var(--hp-amber)',
    icon: 'BookOpen' as const,
    description:
      'Modular IAL & IGCSE with official unit-by-unit grade conversion algorithms and verified answer banks.',
    cta: 'Explore Edexcel Units',
    href: '/library?board=edexcel',
  },
  {
    name: 'IELTS Academic 8.0+',
    badge: 'BRITISH COUNCIL / IDP',
    qualifications: ['Writing Band 9 Descriptors', 'Speaking Cue Cards'],
    color: 'var(--hp-violet)',
    icon: 'Mic' as const,
    description:
      'Targeted writing task 2 frameworks, speaking mock rooms, and listening practice with authentic accents.',
    cta: 'Explore IELTS Drills',
    href: '/library?board=ielts',
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
