'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pencil,
  BookOpen,
  Layers,
  Sparkles,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import MyWorkspace from '@/components/workspace/MyWorkspace';
import { WorkspaceToastProvider } from '@/components/workspace/WorkspaceToast';
import CourseSyncPanel from '@/components/layout/CourseSyncPanel';
import QuickAccessToolbar from '@/components/layout/QuickAccessToolbar';
import MyContributions from '@/components/layout/MyContributions';
import { cn } from '@/lib/utils';

export default function ContributorDashboard() {
  const { user } = useAuth();
  const { isContributor, isAdmin } = useRole();
  const hasAccess = isContributor || isAdmin;

  if (!user || !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in text-center p-6">
        <div className="p-4 rounded-2xl bg-violet-500/10 text-violet-500">
          <Pencil className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Contributor Access Required</h2>
        <p className="text-xs text-foreground-muted max-w-sm">
          You need Academic Contributor permissions to view this creator overview.
        </p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const firstName = user.profile.name.split(' ')[0];

  return (
    <WorkspaceToastProvider>
      <div className="space-y-8 animate-fade-in pb-12">
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-500/15 via-background-card to-background-secondary border border-border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20 mb-2">
              <Pencil className="w-3.5 h-3.5" />
              Contributor Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Welcome, {firstName}! ✍️
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Your notes and curriculum guides are empowering students across Myanmar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/editor"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 text-white text-xs font-bold shadow-md hover:bg-violet-600 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editor Workspace
            </Link>
            <Link
              href="/editor/review-queue"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-background-secondary border border-border text-foreground text-xs font-bold hover:bg-background-secondary/80 transition-all"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Review Queue
            </Link>
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

        {/* Contributions */}
        <MyContributions />

        {/* Workspace */}
        <div className="bg-background-card border border-border rounded-3xl p-6 sm:p-8">
          <MyWorkspace />
        </div>
      </div>
    </WorkspaceToastProvider>
  );
}
