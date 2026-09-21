'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Scholar Leaderboard
// Route: /leaderboard
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Crown,
  Medal,
  Users,
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { getLeaderboard, type LeaderboardEntry } from '@/actions/leaderboard';
import { LeaderboardVisibilityToggle } from '@/components/gamification/LeaderboardVisibilityToggle';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const { user, updateProfile } = useAuth();
  const [timeframe, setTimeframe] = useState<'all_time' | 'weekly'>('all_time');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getLeaderboard(user?.id, timeframe);
      setEntries(data.entries);
      setMyEntry(data.myEntry);
      setLoading(false);
    }
    load();
  }, [user?.id, timeframe]);

  const top3 = entries.slice(0, 3);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 space-y-8 max-w-5xl mx-auto animate-fade-in pb-16">
      <BackButton href="/dashboard" label="Back to Dashboard" />

      <div className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Trophy className="w-3.5 h-3.5" />
              Academic Leaderboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Scholar Ranks & Momentum
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-xl leading-relaxed">
              Earn XP by solving past papers, finishing Pomodoro blocks, and mastering syllabus topics.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-background-secondary border border-border shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTimeframe('all_time')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                timeframe === 'all_time'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground'
              )}
            >
              All-Time
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('weekly')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                timeframe === 'weekly'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground'
              )}
            >
              This Week
            </button>
          </div>
        </div>
      </div>

      {user && (
        <LeaderboardVisibilityToggle
          userId={user.id}
          initialVisible={user.profile.leaderboardVisible !== false}
          compact
          onVisibilityChange={(visible) => updateProfile({ leaderboardVisible: visible })}
        />
      )}

      {myEntry && (
        <div className="p-4 sm:p-5 rounded-2xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs font-mono">
              #{myEntry.rank}
            </div>
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Your Current Position
              </span>
              <h4 className="text-sm font-bold text-foreground">
                {myEntry.name} (Level {myEntry.level})
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] text-foreground-muted uppercase font-bold block">
                {timeframe === 'weekly' ? 'Weekly XP' : 'Total XP'}
              </span>
              <span className="text-base font-bold font-mono text-primary">
                {myEntry.totalXp} XP
              </span>
            </div>
            {myEntry.currentStreak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                {myEntry.currentStreak}d
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {top3.map((entry, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;

            return (
              <div
                key={entry.userId}
                className={cn(
                  'relative rounded-3xl border p-6 flex flex-col items-center text-center space-y-3 transition-all',
                  isFirst
                    ? 'bg-amber-500/5 border-amber-500/30 shadow-md order-first md:order-2 md:-translate-y-2'
                    : isSecond
                    ? 'bg-background-card border-border shadow-xs order-2 md:order-1'
                    : 'bg-background-card border-border shadow-xs order-3'
                )}
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs',
                    isFirst
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : isSecond
                      ? 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                      : 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                  )}
                >
                  {isFirst ? (
                    <Crown className="w-7 h-7 fill-amber-500" />
                  ) : (
                    <Medal className="w-7 h-7" />
                  )}
                </div>

                <div className="space-y-1">
                  <span
                    className={cn(
                      'text-xs font-extrabold uppercase tracking-wider',
                      isFirst
                        ? 'text-amber-500'
                        : isSecond
                        ? 'text-slate-400'
                        : 'text-orange-400'
                    )}
                  >
                    Rank #{entry.rank}
                  </span>
                  <h3 className="font-bold text-base text-foreground line-clamp-1">
                    {entry.name}
                  </h3>
                  <span className="text-xs text-foreground-muted block font-mono">
                    Level {entry.level}
                  </span>
                </div>

                <div className="pt-2 border-t border-border/80 w-full flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-mono font-bold">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    {entry.currentStreak}d
                  </div>
                  <span className="font-mono font-bold text-primary">
                    {entry.totalXp} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-3xl border border-border bg-background-card overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Scholar Rankings
          </h3>
          <span className="text-xs text-foreground-muted font-mono">
            Top {entries.length} Students
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-foreground-muted animate-pulse">
            Loading scholar rankings...
          </div>
        ) : entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-foreground-muted bg-background-secondary/50 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5 w-16">Rank</th>
                  <th className="py-3.5 px-4">Scholar</th>
                  <th className="py-3.5 px-4 text-center">Level</th>
                  <th className="py-3.5 px-4 text-center">Streak</th>
                  <th className="py-3.5 px-5 text-right">XP Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={cn(
                      'transition-colors hover:bg-background-secondary/60',
                      entry.isCurrentUser ? 'bg-primary/5 font-semibold' : ''
                    )}
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-foreground">
                      #{entry.rank}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs overflow-hidden">
                          {entry.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            entry.name.slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <span className="font-bold text-foreground">
                          {entry.name}
                          {entry.isCurrentUser && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-primary text-white font-normal">
                              You
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-foreground-secondary">
                      Lvl {entry.level}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {entry.currentStreak}d
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-primary">
                      {entry.totalXp} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-foreground-muted space-y-2">
            <Trophy className="w-8 h-8 text-foreground-muted mx-auto opacity-40" />
            <p>No scholar activity recorded yet.</p>
            <p className="text-[11px] text-foreground-muted/70">
              Complete your first past paper or focus block to climb the leaderboard!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
