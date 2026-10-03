import type { BadgeDefinition } from './badges';

export type XpSource = 'past_paper' | 'pomodoro' | 'lesson' | 'timetable' | 'onboarding';

export interface AwardXpResult {
  success: boolean;
  awarded: boolean;
  xpAmount?: number;
  totalXp?: number;
  previousLevel?: number;
  currentLevel?: number;
  levelUp?: boolean;
  newBadges?: BadgeDefinition[];
  currentStreak?: number;
  error?: string;
}
