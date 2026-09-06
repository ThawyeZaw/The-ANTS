'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — My Workspace Page
// Route: /workspace — Personal study hub for exams & enrolled courses.
// ──────────────────────────────────────────────────────────────────────────────

import { useAuth } from '@/hooks/useAuth';
import MyWorkspace from '@/components/workspace/MyWorkspace';
import { WorkspaceToastProvider } from '@/components/workspace/WorkspaceToast';
import { Wrench } from 'lucide-react';

export default function WorkspacePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <WorkspaceToastProvider>
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Header */}
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background-card to-background-secondary p-6 sm:p-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Wrench className="w-3.5 h-3.5" />
              Personal Study Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              My Workspace
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-2xl">
              Access your exam countdowns, enrolled courses, and study tools in one place.
            </p>
          </div>
        </div>

        {/* Workspace Component */}
        <div className="bg-background-card border border-border rounded-3xl p-6 sm:p-8">
          <MyWorkspace />
        </div>
      </div>
    </WorkspaceToastProvider>
  );
}
