'use client';

import { useEffect, useState } from 'react';
import { Award, Flame } from 'lucide-react';
import { getGamificationProfile } from '@/actions/gamification';
import { BadgeShelf } from './BadgeShelf';

interface ScholarStatsStripProps {
  userId: string;
  className?: string;
}

export function ScholarStatsStrip({ userId, className }: ScholarStatsStripProps) {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getGamificationProfile>> | null>(
    null
  );

  useEffect(() => {
    getGamificationProfile(userId).then(setProfile);
  }, [userId]);

  if (!profile || ('hidden' in profile && profile.hidden)) return null;

  const unlockedCount = profile.allBadges.filter((b) => b.unlocked).length;

  return (
    <section className={className}>
      <div className="rounded-2xl border border-border bg-background-card p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-bold text-foreground">Scholar Progress</h3>
          <span className="text-xs font-mono text-foreground-muted">
            {unlockedCount}/{profile.allBadges.length} badges
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-background-secondary/50 p-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-foreground-muted">
              Level
            </p>
            <p className="text-xl font-bold font-mono text-foreground mt-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-primary" />
              {profile.level}
            </p>
            <p className="text-[11px] text-foreground-muted mt-1">{profile.rankTitle}</p>
          </div>
          <div className="rounded-xl border border-border bg-background-secondary/50 p-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-foreground-muted">
              Total XP
            </p>
            <p className="text-xl font-bold font-mono text-primary mt-1">{profile.totalXp}</p>
          </div>
          <div className="rounded-xl border border-border bg-background-secondary/50 p-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-foreground-muted">
              Streak
            </p>
            <p className="text-xl font-bold font-mono text-foreground mt-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              {profile.currentStreak}d
            </p>
          </div>
        </div>

        <BadgeShelf badges={profile.allBadges} />
      </div>
    </section>
  );
}
