'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Student & Unified Study Dashboard
// ──────────────────────────────────────────────────────────────────────────────

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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import MyWorkspace from '@/components/workspace/MyWorkspace';
import { WorkspaceToastProvider } from '@/components/workspace/WorkspaceToast';
import CourseSyncPanel from '@/components/layout/CourseSyncPanel';
import QuickAccessToolbar from '@/components/layout/QuickAccessToolbar';
import { useDashboardSync } from '@/hooks/useDashboardSync';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  'study-streak': Flame,
  'cards-due': Zap,
  'next-exam': Clock,
  'avg-confidence': TrendingUp,
  'enrolled-courses': GraduationCap,
  'synced-resources': Layers,
  'active-countdowns': Bell,
};

const STAT_DELAY = [
  'dash-rise-delay-1',
  'dash-rise-delay-2',
  'dash-rise-delay-3',
  'dash-rise-delay-4',
  'dash-rise-delay-5',
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { isTutor, isContributor, isAdmin } = useRole();

  const { stats } = useDashboardSync();

  if (!user) return null;

  const firstName = user.profile.name.split(' ')[0];
  const hasRoleActions = isTutor || isContributor || isAdmin;

  return (
    <WorkspaceToastProvider>
      <div className="space-y-7 pb-12 max-w-7xl mx-auto">
        {/* ── Welcome ─────────────────────────────────────────────────────── */}
        <header className="dash-hero dash-rise">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 p-6 sm:p-8">
            <div className="space-y-2.5 min-w-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase text-primary bg-primary/10 border border-primary/15">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Academic Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Welcome back, {firstName}
              </h1>
              <p className="text-sm text-foreground-muted max-w-md leading-relaxed">
                Track your syllabus mastery and upcoming exam countdowns.
              </p>
            </div>

            {hasRoleActions && (
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {isTutor && (
                  <Link
                    href="/settings/profile?tab=role-profile"
                    className="dash-action-btn focus-ring"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Tutor Schedule
                  </Link>
                )}
                {(isContributor || isAdmin) && (
                  <Link href="/editor" className="dash-action-btn focus-ring">
                    <Pencil className="w-3.5 h-3.5" />
                    Editor Portal
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/main-contributor/add-contributor"
                    className="dash-action-btn focus-ring"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Users
                  </Link>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── Courses + Quick Access ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 dash-rise dash-rise-delay-1">
          <div className="lg:col-span-2 min-w-0">
            <CourseSyncPanel />
          </div>
          <div className="min-w-0">
            <QuickAccessToolbar />
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => {
              const Icon = iconMap[stat.key] || Layers;

              return (
                <div
                  key={stat.key || i}
                  className={cn(
                    'dash-stat-card dash-rise',
                    STAT_DELAY[i % STAT_DELAY.length]
                  )}
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

        {/* ── Workspace ───────────────────────────────────────────────────── */}
        <section className="dash-panel dash-rise dash-rise-delay-3 p-6 sm:p-8">
          <MyWorkspace />
        </section>
      </div>
    </WorkspaceToastProvider>
  );
}
