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
  Wrench,
  ArrowRight,
  Trophy,
  Target,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { DashboardExamCountdown } from '@/components/dashboard/DashboardExamCountdown';
import { DashboardSubjectsPanel } from '@/components/dashboard/DashboardSubjectsPanel';
import { DashboardTodayTasks } from '@/components/dashboard/DashboardTodayTasks';
import { useDashboardSync } from '@/hooks/useDashboardSync';
import { cn } from '@/lib/utils';
import { getGamificationProfile } from '@/actions/gamification';
import { BadgeShelf } from '@/components/gamification/BadgeShelf';
import { GamificationHeroStrip } from '@/components/gamification/GamificationHeroStrip';
import { RecentActivityFeed } from '@/components/gamification/RecentActivityFeed';
import { ScholarQuickStartChecklist } from '@/components/dashboard/ScholarQuickStartChecklist';

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
    id: 'workspace',
    title: 'My Workspace',
    description: 'Your personal hub for exam countdowns and enrolled subjects.',
    href: '/workspace',
    icon: Wrench,
    badge: 'Yours',
    badgeTone: 'primary',
    highlight: 'Open from the dashboard',
    color: 'bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-white',
  },
  {
    id: 'calculator',
    title: 'Grade Calculator',
    description: 'CAIE raw boundaries and Edexcel IAL UMS grade prediction.',
    href: '/calculator',
    icon: Calculator,
    badge: 'Popular',
    badgeTone: 'emerald',
    highlight: 'Context-aware UMS & raw %',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white',
  },
  {
    id: 'pomodoro',
    title: 'Pomodoro Timer',
    description: 'Ambient soundscapes and timed deep-work focus sessions.',
    href: '/pomodoro',
    icon: Timer,
    badge: 'Deep Work',
    badgeTone: 'primary',
    highlight: '+20 XP per 25-min focus block',
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 group-hover:bg-violet-500 group-hover:text-white',
  },
  {
    id: 'curriculum',
    title: 'Curriculum & Topics',
    description: 'Syllabus checklists, topic completion, and maths suite selection.',
    href: '/curriculum',
    icon: GraduationCap,
    badge: 'Syllabus',
    badgeTone: 'primary',
    highlight: 'CAIE & Edexcel breakdown',
    color: 'bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-white',
  },
  {
    id: 'past-papers',
    title: 'Past Papers',
    description: 'Track solved papers with marks & automated grade boundaries.',
    href: '/past-papers',
    icon: BookOpen,
    badge: 'Core',
    badgeTone: 'emerald',
    highlight: '+30 XP per paper with marks',
    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 group-hover:bg-teal-500 group-hover:text-white',
  },
  {
    id: 'timetable',
    title: 'Timetable & Tasks',
    description: 'Time-blocking scheduler and integrated todo list.',
    href: '/timetable',
    icon: CalendarDays,
    highlight: 'Week · Day · Month + Todo',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white',
  },
  {
    id: 'countdown',
    title: 'Exam Countdown',
    description: 'Precision countdowns for CAIE, Edexcel, and custom IELTS exams.',
    href: '/countdown',
    icon: Clock,
    badge: 'Essential',
    badgeTone: 'amber',
    highlight: 'Official session & test dates',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white',
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard',
    description: 'See how you rank among scholars by XP and study activity.',
    href: '/leaderboard',
    icon: Trophy,
    highlight: 'Scholar rankings',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white',
  },
];

// ── Quick stat pill ──────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, accent, gradient }: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent: string;
  gradient: string;
}) {
  return (
    <div className={cn(
      'relative flex items-center gap-3.5 rounded-2xl border bg-background-card p-4 overflow-hidden',
      'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-xs cursor-default'
    )}>
      {/* Subtle radial glow in corner */}
      <div className={cn('absolute -top-4 -right-4 h-16 w-16 rounded-full blur-xl opacity-20 pointer-events-none', gradient)} />
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border', accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black font-mono tabular-nums text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-foreground-muted mt-0.5 truncate font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { isTutor, isContributor, isAdmin } = useRole();
  const {
    subjects,
    subjectsLoading,
    subjectsError,
    refetchSubjects,
    stats,
    allCountdowns,
    isLoading: dashboardLoading,
  } = useDashboardSync();

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

      {/* ── Compact Welcome & Gamification Banner ────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-amber-500 p-4 sm:p-6 text-primary-foreground shadow-sm">
        {/* Subtle glow elements */}
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-12 h-32 w-32 rounded-full bg-white/5 blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/15 border border-white/20">
                Study Hub
              </span>
              <span className="text-xs text-primary-foreground/80 font-medium">
                Academic Command Centre
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight truncate">
              Welcome back, {firstName}
            </h1>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <Link href="/workspace" className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/15 border border-white/20 hover:bg-white/25 transition-colors flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> Workspace
              </Link>
              {hasRoleActions && (
                <>
                  {isTutor && (
                    <Link href="/settings/profile?tab=role-profile" className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/15 border border-white/20 hover:bg-white/25 transition-colors flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Tutor
                    </Link>
                  )}
                  {(isContributor || isAdmin) && (
                    <Link href="/contributor" className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/15 border border-white/20 hover:bg-white/25 transition-colors flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Contributor
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/main-contributor/add-contributor" className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/15 border border-white/20 hover:bg-white/25 transition-colors flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Admin
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <GamificationHeroStrip
              level={gamification.level}
              totalXp={gamification.totalXp}
              rankTitle={gamification.rankTitle}
              currentStreak={gamification.currentStreak}
              longestStreak={gamification.longestStreak}
              className="py-2.5 px-3.5 sm:p-4 bg-black/20 border-white/15 text-primary-foreground backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* ── Scholar Quick-Start Checklist ─────────────────────────────── */}
      <ScholarQuickStartChecklist
        userId={user.id}
        onXpAwarded={(xp) => setGamification((prev) => ({ ...prev, totalXp: xp }))}
      />

      {/* ── Quick Stats Row ─────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.slice(0, 4).map((stat, i) => {
            const Icon = statIconMap[stat.key] || Layers;
            const styleMap = [
              {
                accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                gradient: 'bg-amber-400',
              },
              {
                accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
                gradient: 'bg-violet-400',
              },
              {
                accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                gradient: 'bg-emerald-400',
              },
              {
                accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                gradient: 'bg-blue-400',
              },
            ];
            const s = styleMap[i % styleMap.length];
            return (
              <StatPill
                key={stat.key || i}
                icon={Icon}
                label={stat.label}
                value={stat.value}
                accent={s.accent}
                gradient={s.gradient}
              />
            );
          })}
        </div>
      )}

      {/* ── Main Grid: Subjects + Today's Tasks + Countdowns ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: My Subjects & Today's Schedule */}
        <div className="lg:col-span-2 space-y-5">
          <DashboardSubjectsPanel
            subjects={subjects}
            loading={subjectsLoading}
            loadError={subjectsError}
            onRetry={refetchSubjects}
          />
          <DashboardTodayTasks />
        </div>

        {/* Right 1 Col: Compact Exam Countdowns */}
        <div className="lg:col-span-1">
          <DashboardExamCountdown
            compact
            enrolledSubjectIds={subjects.map((s) => s.id)}
            countdowns={allCountdowns}
            isLoading={dashboardLoading}
          />
        </div>
      </div>

      {/* ── Study Tools: Compact Horizontal App Dock ─────────────────────────── */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Productivity Suite
          </h2>
          <span className="text-[11px] text-foreground-muted font-medium">
            {STUDY_TOOLS.length} Tools
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x -mx-1 px-1">
          {STUDY_TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group shrink-0 snap-start w-40 sm:w-44 p-3.5 rounded-2xl border border-border bg-background-card hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200', tool.color)}>
                    <tool.icon className="w-4 h-4" />
                  </div>
                  {tool.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {tool.title}
                </h3>
              </div>
              <p className="text-[10px] text-foreground-muted mt-1.5 truncate">
                {tool.highlight}
              </p>
            </Link>
          ))}
        </div>

        {/* ── Coming Soon Resources Strip ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-dashed border-border bg-background-secondary/30">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Notes, flashcards &amp; quizzes are being rebuilt
            </p>
            <p className="text-xs text-foreground-muted mt-0.5">
              In-app study materials are coming next — curriculum, past papers, and timers are ready now.
            </p>
          </div>
          <span className="shrink-0 text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            In development
          </span>
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
