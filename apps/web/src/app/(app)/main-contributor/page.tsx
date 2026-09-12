'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserPlus,
  ClipboardCheck,
} from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import MyWorkspace from '@/components/workspace/MyWorkspace';
import { WorkspaceToastProvider } from '@/components/workspace/WorkspaceToast';
import CourseSyncPanel from '@/components/layout/CourseSyncPanel';
import QuickAccessToolbar from '@/components/layout/QuickAccessToolbar';

const iconMap: Record<string, typeof AlertTriangle> = {
  'pending-reviews': AlertTriangle,
  'approved-this-week': CheckCircle,
  'rejected-this-week': XCircle,
  'total-reviewed': ShieldCheck,
};

export default function MainContributorDashboard() {
  const { user } = useAuth();
  const { isAdmin } = useRole();

  const [stats] = useState<any[]>([
    { id: 'pending-reviews', key: 'pending-reviews', label: 'Pending Reviews', value: 0, color: 'amber' },
    { id: 'approved-this-week', key: 'approved-this-week', label: 'Approved by You', value: 0, color: 'emerald' },
    { id: 'rejected-this-week', key: 'rejected-this-week', label: 'Rejected by You', value: 0, color: 'red' },
    { id: 'total-reviewed', key: 'total-reviewed', label: 'Total Reviewed', value: 0, color: 'violet' },
  ]);

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in text-center p-6">
        <AppIcon icon={ShieldCheck} size="xl" tone="muted" frame="soft" />
        <h2 className="text-xl font-bold text-foreground">Admin Access Required</h2>
        <p className="text-xs text-foreground-muted max-w-sm">
          You need Administrator permissions to view the Gatekeeper Dashboard.
        </p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const firstName = user.profile.name.split(' ')[0];
  const welcomeSubtitle = "Manage community submissions and oversee platform contributors.";

  return (
    <WorkspaceToastProvider>
      <div className="space-y-8 animate-fade-in pb-12">
        <div className="rounded-3xl bg-background-card border border-border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrator Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Welcome, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">{welcomeSubtitle}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/main-contributor/add-contributor"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Manage Users
            </Link>
            <Link
              href="/editor"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-background-secondary border border-border text-foreground text-xs font-bold hover:bg-background-secondary/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Exam Editor
            </Link>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = iconMap[stat.id] || ShieldCheck;
            return (
              <div
                key={stat.id}
                className="p-5 rounded-2xl bg-background-card border border-border flex items-center gap-4 hover:border-border-hover transition-colors"
              >
                <AppIcon icon={Icon} size="md" tone="secondary" frame="soft" />
                <div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-foreground-muted">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Workspace */}
        <div className="bg-background-card border border-border rounded-3xl p-6 sm:p-8">
          <MyWorkspace />
        </div>
      </div>
    </WorkspaceToastProvider>
  );
}
