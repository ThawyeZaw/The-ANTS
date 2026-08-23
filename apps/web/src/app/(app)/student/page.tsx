'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Student & Unified Study Dashboard
// ──────────────────────────────────────────────────────────────────────────────

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookMarked,
  Library,
  Clock,
  Flame,
  Zap,
  TrendingUp,
  GraduationCap,
  Layers,
  Bell,
  Calendar,
  Pencil,
  Shield,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import MyWorkspace from '@/components/workspace/MyWorkspace';
import { WorkspaceToastProvider } from '@/components/workspace/WorkspaceToast';
import CourseSyncPanel from '@/components/layout/CourseSyncPanel';
import QuickAccessToolbar from '@/components/layout/QuickAccessToolbar';
import { cn } from '@/lib/utils';
import { useDashboardSync } from '@/hooks/useDashboardSync';
import STAT_COLOR_MAP from '@/constants/statColors';

const iconMap: Record<string, React.ReactNode> = {
  'study-streak': <Flame className="h-5 w-5" />,
  'cards-due': <Zap className="h-5 w-5" />,
  'next-exam': <Clock className="h-5 w-5" />,
  'avg-confidence': <TrendingUp className="h-5 w-5" />,
  'enrolled-courses': <GraduationCap className="h-5 w-5" />,
  'synced-resources': <Layers className="h-5 w-5" />,
  'saved-notes': <BookMarked className="h-5 w-5" />,
  'flashcard-decks': <Layers className="h-5 w-5" />,
  'active-countdowns': <Bell className="h-5 w-5" />,
};

const colorMap = STAT_COLOR_MAP;

export default function StudentDashboard() {
  const { user } = useAuth();
  const { isTutor, isContributor, isAdmin } = useRole();

  const { savedNotes, upcomingExams, stats } = useDashboardSync();

  if (!user) return null;

  const firstName = user.profile.name.split(' ')[0];

  return (
    <WorkspaceToastProvider>
      <div className="space-y-8 animate-fade-in pb-12 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-background-card to-background-secondary border border-border p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-3.5 w-3.5" />
                Academic Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted">
                Track your syllabus mastery, flashcards recall, and upcoming exam countdowns.
              </p>
            </div>

            {/* Role Quick Links */}
            <div className="flex items-center gap-2 flex-wrap">
              {isTutor && (
                <Link
                  href="/settings/profile?tab=role-profile"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Tutor Schedule
                </Link>
              )}
              {(isContributor || isAdmin) && (
                <Link
                  href="/editor"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-500/10 text-violet-600 border border-violet-500/20 hover:bg-violet-500/20 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editor Portal
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/main-contributor/add-contributor"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Users
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sync Panel & Quick Toolbar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CourseSyncPanel />
          </div>
          <div>
            <QuickAccessToolbar />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = iconMap[stat.key] || <Layers className="h-5 w-5" />;
            const colorClass = colorMap[stat.key] || 'bg-primary/10 text-primary';

            return (
              <div
                key={stat.key || i}
                className="p-5 rounded-2xl bg-background-card border border-border flex items-center gap-4 hover:shadow-sm transition-all"
              >
                <div className={cn('p-3 rounded-xl shrink-0', colorClass)}>{Icon}</div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground truncate">{stat.value}</p>
                  <p className="text-xs text-foreground-muted truncate">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Workspace Component */}
        <div className="bg-background-card border border-border rounded-3xl p-6 sm:p-8">
          <MyWorkspace />
        </div>
      </div>
    </WorkspaceToastProvider>
  );
}
