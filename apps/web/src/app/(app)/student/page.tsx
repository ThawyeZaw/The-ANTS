'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Unified Study Hub & Academic Dashboard
// Central gateway to: Past Papers, Timetable, Pomodoro, Countdown, Calculator & Lessons
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
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Timer,
  Calculator,
  ArrowRight,
  Sparkles,
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

const iconMap: Record<string, LucideIcon> = {
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
}

const STUDY_TOOLS: StudyToolCard[] = [
  {
    id: 'past-papers',
    title: 'Past Paper Tracker',
    description: 'Track solved official exam papers with component marks and automated grade boundaries.',
    href: '/past-papers',
    icon: BookOpen,
    badge: 'Core Tool',
    badgeTone: 'emerald',
    highlight: '+30 XP per solved paper (with marks)',
  },
  {
    id: 'timetable',
    title: 'Smart Timetable',
    description: 'Weekly schedule blocks, daily revision slots, and synchronized exam schedules.',
    href: '/timetable',
    icon: CalendarDays,
    badge: 'Redesigned',
    badgeTone: 'primary',
    highlight: 'Week, Day & Month views',
  },
  {
    id: 'pomodoro',
    title: 'Pomodoro Focus Timer',
    description: 'Ambient soundscapes, timed deep work sessions, and focus habit tracking.',
    href: '/pomodoro',
    icon: Timer,
    badgeTone: 'accent',
    highlight: '+20 XP per 25-min focus block',
  },
  {
    id: 'countdown',
    title: 'Exam Countdown',
    description: 'Precision countdowns to upcoming official exam papers and mock assessments.',
    href: '/countdown',
    icon: Clock,
    badge: 'Essential',
    badgeTone: 'amber',
    highlight: 'Official session dates',
  },
  {
    id: 'calculator',
    title: 'Grade Calculator',
    description: 'Official syllabus grade prediction for CAIE raw boundaries and Edexcel IAL UMS scales.',
    href: '/calculator',
    icon: Calculator,
    highlight: 'Context-aware UMS & raw %',
  },
  {
    id: 'lessons',
    title: 'Syllabus & Lessons',
    description: 'Curriculum frameworks, topic-by-topic mastery tracking, and revision notes.',
    href: '/lessons',
    icon: GraduationCap,
    highlight: '+10 XP per topic mastered',
  },
];

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
      <div className="space-y-8 pb-16 max-w-7xl mx-auto animate-fade-in">
        {/* ── Welcome & Gamification Hero ─────────────────────────────────── */}
        <header className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Greeting & Roles */}
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Unified Study Hub
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Welcome back, {firstName}
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Your integrated academic headquarters for syllabus mastery, past papers, and daily focus.
              </p>

              {hasRoleActions && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  {isTutor && (
                    <Link
                      href="/settings/profile?tab=role-profile"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-background-secondary border border-border text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      Tutor Profile
                    </Link>
                  )}
                  {(isContributor || isAdmin) && (
                    <Link
                      href="/past-papers"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-background-secondary border border-border text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Past Papers
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/main-contributor/add-contributor"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-background-secondary border border-border text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Admin Users
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
        </header>

        {/* ── My Workspace (Exam Countdowns) ─────────────────────────────── */}
        <section className="dash-panel p-6 sm:p-8 shadow-xs border border-primary/20">
          <MyWorkspace />
        </section>

        {/* ── Dashboard Subjects Panel ───────────────────────────────────────── */}
        <section>
          <DashboardSubjectsPanel />
        </section>

        {/* ── Core Study Tools Launcher Grid ───────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Academic Study Suite
            </h2>
            <span className="text-xs text-foreground-muted font-medium">
              6 Connected Productivity Tools
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {STUDY_TOOLS.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group relative flex flex-col justify-between p-6 rounded-3xl border border-border bg-background-card hover:bg-background-secondary/60 hover:border-primary/40 shadow-xs transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-2xs">
                      <tool.icon className="w-6 h-6" />
                    </div>
                    {tool.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                        {tool.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-foreground-muted mt-1.5 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono font-medium text-foreground-secondary">
                    {tool.highlight}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-primary group-hover:translate-x-1 transition-transform">
                    Open
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Gamification Shelf: Badges & Milestones ──────────────────────── */}
        <section className="p-6 sm:p-8 rounded-3xl border border-border bg-background-card shadow-xs space-y-6">
          <BadgeShelf badges={gamification.allBadges} />
          <RecentActivityFeed items={gamification.recentActivity} />
        </section>

        {/* ── Quick Stats Grid ─────────────────────────────────────────────── */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => {
              const Icon = iconMap[stat.key] || Layers;
              return (
                <div
                  key={stat.key || i}
                  className="p-4 rounded-2xl border border-border bg-background-card flex items-center gap-3 shadow-xs"
                >
                  <AppIcon icon={Icon} size="md" tone="secondary" frame="soft" />
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-foreground font-mono tabular-nums truncate">
                      {stat.value}
                    </p>
                    <p className="text-xs text-foreground-muted truncate mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}


      </div>
  );
}
