/** Scholar level thresholds — exponential cumulative (200, 400, 800, … total XP). */

export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return 200 * 2 ** (level - 2);
}

export function levelFromTotalXp(totalXp: number): number {
  if (totalXp < 200) return 1;
  let level = 2;
  let threshold = 200;
  while (totalXp >= threshold * 2) {
    threshold *= 2;
    level += 1;
  }
  return level;
}

export function levelProgress(totalXp: number) {
  const level = levelFromTotalXp(totalXp);
  const xpAtLevelStart = xpRequiredForLevel(level);
  const xpAtNextLevel = xpRequiredForLevel(level + 1);
  const progressInLevel = Math.max(0, totalXp - xpAtLevelStart);
  const levelSpan = xpAtNextLevel - xpAtLevelStart;

  return {
    level,
    xpAtLevelStart,
    xpAtNextLevel,
    progressInLevel,
    xpToNextLevel: Math.max(0, xpAtNextLevel - totalXp),
    percentage: levelSpan > 0 ? Math.min(100, (progressInLevel / levelSpan) * 100) : 100,
  };
}

export function rankTitleForLevel(level: number): string {
  if (level >= 10) return 'Master Scholar';
  if (level >= 7) return 'Distinguished Scholar';
  if (level >= 4) return 'Senior Scholar';
  if (level >= 2) return 'Apprentice Scholar';
  return 'Novice Scholar';
}
