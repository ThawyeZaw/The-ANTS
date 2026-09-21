export interface BadgeDefinition {
  key: string;
  title: string;
  description: string;
  iconName: string;
  category: 'past_paper' | 'pomodoro' | 'streak' | 'level' | 'lesson';
  xpReward: number;
}

export const ALL_BADGES: BadgeDefinition[] = [
  {
    key: 'first_paper_done',
    title: 'First Step',
    description: 'Completed your first past paper exam.',
    iconName: 'BookOpen',
    category: 'past_paper',
    xpReward: 50,
  },
  {
    key: 'five_papers_done',
    title: 'Paper Grinder',
    description: 'Completed 5 past paper exams.',
    iconName: 'Award',
    category: 'past_paper',
    xpReward: 100,
  },
  {
    key: 'first_pomodoro',
    title: 'Deep Focus',
    description: 'Completed your first 25-minute Pomodoro focus block.',
    iconName: 'Timer',
    category: 'pomodoro',
    xpReward: 30,
  },
  {
    key: 'first_lesson',
    title: 'Syllabus Explorer',
    description: 'Mastered your first syllabus topic.',
    iconName: 'CheckCircle2',
    category: 'lesson',
    xpReward: 40,
  },
  {
    key: 'streak_3',
    title: 'Spark of Consistency',
    description: 'Maintained a 3-day continuous study streak.',
    iconName: 'Flame',
    category: 'streak',
    xpReward: 50,
  },
  {
    key: 'streak_7',
    title: 'Unstoppable Momentum',
    description: 'Maintained a full 7-day study streak.',
    iconName: 'Zap',
    category: 'streak',
    xpReward: 100,
  },
  {
    key: 'level_5',
    title: 'Rising Scholar',
    description: 'Reached Scholar Level 5.',
    iconName: 'GraduationCap',
    category: 'level',
    xpReward: 150,
  },
  {
    key: 'level_10',
    title: 'Master Academic',
    description: 'Reached Scholar Level 10.',
    iconName: 'Sparkles',
    category: 'level',
    xpReward: 300,
  },
];

export function badgeByKey(key: string): BadgeDefinition | undefined {
  return ALL_BADGES.find((b) => b.key === key);
}
