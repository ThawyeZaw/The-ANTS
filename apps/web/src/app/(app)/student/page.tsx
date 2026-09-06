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

const iconMap: Record<string, LucideIcon> = {
  'study-streak': Flame,
  'cards-due': Zap,
  'next-exam': Clock,
  'avg-confidence': TrendingUp,
  'enrolled-courses': GraduationCap,
  'synced-resources': Layers,
  'active-countdowns': Bell,
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { isTutor, isContributor, isAdmin } = useRole();

  const { stats } = useDashboardSync();

  if (!user) return null;

  const firstName = user.profile.name.split(' ')[0];

  return (
    <WorkspaceToastProvider>
      <div className="space-y-8 animate-fade-in pb-12 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-background-card border border-border p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Academic Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Welcome back, {firstName}
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted">
                Track your syllabus mastery and upcoming exam countdowns.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isTutor && (
                <Link
                  href="/settings/profile?tab=role-profile"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-background-secondary text-foreground border border-border hover:border-border-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Tutor Schedule
                </Link>
              )}
              {(isContributor || isAdmin) && (
                <Link
                  href="/editor"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-background-secondary text-foreground border border-border hover:border-border-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editor Portal
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/main-contributor/add-contributor"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-background-secondary text-foreground border border-border hover:border-border-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Users
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CourseSyncPanel />
          </div>
          <div>
            <QuickAccessToolbar />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = iconMap[stat.key] || Layers;

            return (
              <div
                key={stat.key || i}
                className="p-5 rounded-2xl bg-background-card border border-border flex items-center gap-4 hover:border-border-hover transition-colors"
              >
                <AppIcon icon={Icon} size="md" tone="secondary" frame="soft" />
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground truncate">{stat.value}</p>
                  <p className="text-xs text-foreground-muted truncate">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-background-card border border-border rounded-3xl p-6 sm:p-8">
          <MyWorkspace />
        </div>
      </div>
    </WorkspaceToastProvider>
  );
}
