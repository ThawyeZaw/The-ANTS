'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Unified Study Hub & Academic Dashboard (redesigned)
// Premium command-centre for IGCSE & A-Level students.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Flame,
  Zap,
  TrendingUp,
  GraduationCap,
  Layers,
  Bell,
  Pencil,
  Shield,
  BookOpen,
  CalendarDays,
  Timer,
  Calculator,
  ArrowRight,
  Sparkles,
  Trophy,
  Target,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import MyWorkspace from '@/components/workspace/MyWorkspace';
import { DashboardSubjectsPanel } from '@/components/dashboard/DashboardSubjectsPanel';
import { useDashboardSync } from '@/hooks/useDashboardSync';
import { cn } from '@/lib/utils';
import { getGamificationProfile } from '@/actions/gamification';
import { BadgeShelf } from '@/components/gamification/BadgeShelf';
import { GamificationHeroStrip } from '@/components/gamification/GamificationHeroStrip';
import { RecentActivityFeed } from '@/components/gamification/RecentActivityFeed';

const statIconMap: Record<string, LucideIcon> = {
  'study-streak': Flame,
  'cards-due': Zap,
  'next-exam': Clock,
  'avg-confidence': TrendingUp,
  'enrolled-courses': GraduationCap,
  'synced-resources': Layers,
  'active-countdowns': Bell,
};

interface StudyToolCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeTone?: 'primary' | 'accent' | 'emerald' | 'amber';
  highlight: string;
  color: string; // Tailwind color class for the icon bg
}

const STUDY_TOOLS: StudyToolCard[] = [
  {
    id: 'past-papers',
    title: 'Past Papers',
    description: 'Track solved papers with marks & automated grade boundaries.',
    href: '/past-papers',
    icon: BookOpen,
    badge: 'Core',
    badgeTone: 'emerald',
    highlight: '+30 XP per paper with marks',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white',
  },
  {
    id: 'timetable',
    title: 'Timetable & Tasks',
    description: 'Time-blocking scheduler and integrated todo list.',
    href: '/timetable',
    icon: CalendarDays,
    badge: 'Redesigned',
    badgeTone: 'primary',
    highlight: 'Week · Day · Month + Todo',
    color: 'bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-white',
  },
  {
    id: 'pomodoro',
    title: 'Pomodoro Timer',
    description: 'Ambient soundscapes and timed deep-work focus sessions.',
    href: '/pomodoro',
    icon: Timer,
    highlight: '+20 XP per 25-min focus block',
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 group-hover:bg-violet-500 group-hover:text-white',
  },
  {
    id: 'countdown',
    title: 'Exam Countdown',
    description: 'Precision countdowns to upcoming official exam papers.',
    href: '/countdown',
    icon: Clock,
    badge: 'Essential',
    badgeTone: 'amber',
    highlight: 'Official session dates',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white',
  },
  {
    id: 'calculator',
    title: 'Grade Calculator',
    description: 'CAIE raw boundaries and Edexcel IAL UMS grade prediction.',
    href: '/calculator',
    icon: Calculator,
    highlight: 'Context-aware UMS & raw %',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white',
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard',
    description: 'See how you rank among scholars by XP and activity.',
    href: '/leaderboard',
    icon: Trophy,
    highlight: 'Scholar rankings',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white',
  },
];

// ── Quick stat pill ──────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, accent }: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-2xl border bg-background-card p-4 shadow-xs',
      'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'
    )}>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold font-mono tabular-nums text-foreground leading-none">{value}</p>
        <p className="text-xs text-foreground-muted mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { isTutor, isContributor, isAdmin } = useRole();
  const { stats } = useDashboardSync();

  const [gamification, setGamification] = useState({
    totalXp: 0,
    level: 1,
    rankTitle: 'Novice Scholar',
    currentStreak: 0,
    longestStreak: 0,
    allBadges: [] as any[],
    recentActivity: [] as any[],
  });

  useEffect(() => {
    if (user?.id) {
      getGamificationProfile(user.id).then((p) => {
        setGamification(p);
      });
    }
  }, [user?.id]);

  if (!user) return null;

  const firstName = user.profile.name.split(' ')[0];
  const hasRoleActions = isTutor || isContributor || isAdmin;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto animate-fade-in">

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-6 sm:p-8 text-primary-foreground shadow-lg">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 border border-white/20 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Study Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-sm text-primary-foreground/75 max-w-md leading-relaxed">
              Your integrated academic HQ for IGCSE & A-Level mastery.
            </p>
            {hasRoleActions && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {isTutor && (
                  <Link href="/settings/profile?tab=role-profile" className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/15 border border-white/20 hover:bg-white/25 transition-colors flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> Tutor Profile
                  </Link>
                )}
                {(isContributor || isAdmin) && (
                  <Link href="/past-papers" className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/15 border border-white/20 hover:bg-white/25 transition-colors flex items-center gap-1.5">
                    <Pencil className="w-3.5 h-3.5" /> Past Papers
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/main-contributor/add-contributor" className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/15 border border-white/20 hover:bg-white/25 transition-colors flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </Link>
                )}
              </div>
            )}
          </div>

          <GamificationHeroStrip
            level={gamification.level}
            totalXp={gamification.totalXp}
            rankTitle={gamification.rankTitle}
            currentStreak={gamification.currentStreak}
            longestStreak={gamification.longestStreak}
          />
        </div>
      </div>

      {/* ── Quick Stats Row ─────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.slice(0, 4).map((stat, i) => {
            const Icon = statIconMap[stat.key] || Layers;
            const accents = [
              'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
              'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
              'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            ];
            return (
              <StatPill
                key={stat.key || i}
                icon={Icon}
                label={stat.label}
                value={stat.value}
                accent={accents[i % accents.length]}
              />
            );
          })}
        </div>
      )}

      {/* ── Main Grid: Subjects + Workspace ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Subjects — takes 2 cols */}
        <div className="lg:col-span-2">
          <DashboardSubjectsPanel />
        </div>

        {/* Exam Countdowns Workspace — 1 col */}
        <div className="rounded-3xl border border-primary/20 bg-background-card p-6 shadow-xs">
          <MyWorkspace />
        </div>
      </div>

      {/* ── Study Tools Grid ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Academic Study Suite
          </h2>
          <span className="text-xs text-foreground-muted font-medium">
            {STUDY_TOOLS.length} Productivity Tools
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STUDY_TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group relative flex flex-col justify-between p-5 rounded-2xl border border-border bg-background-card hover:bg-background-secondary/50 hover:border-border-hover hover:shadow-md shadow-xs transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-200', tool.color)}>
                    <tool.icon className="w-5 h-5" />
                  </div>
                  {tool.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] font-mono font-medium text-foreground-secondary truncate">
                  {tool.highlight}
                </span>
                <ChevronRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Badges & Recent Activity ─────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl border border-border bg-background-card shadow-xs">
          <BadgeShelf badges={gamification.allBadges} />
        </div>
        <div className="p-6 rounded-3xl border border-border bg-background-card shadow-xs">
          <RecentActivityFeed items={gamification.recentActivity} />
        </div>
      </section>

    </div>
  );
}
