'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Official Exam Countdown Editor Page
// Route: /editor/exam/countdown — Contributor and Admin only.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import BackButton from '@/components/ui/BackButton';
import CountdownEditor from '@/components/exam-data/CountdownEditor';
import MySubmissions from '@/components/exam-data/MySubmissions';

export default function CountdownEditorPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isContributor, isMainContributor, isAdmin } = useRole();
  const router = useRouter();

  const hasAccess = isContributor || isMainContributor || isAdmin;

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess) {
      router.replace('/editor/exam');
    }
  }, [isLoading, isAuthenticated, hasAccess, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
          <ShieldAlert className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="mt-2 max-w-sm text-sm text-foreground-muted">
          Only Contributors and Administrators can propose official exam countdown presets.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <BackButton href="/editor/exam" label="Back to Exam Editors" />
      <div className="mt-4 space-y-10">
        <CountdownEditor />
        <MySubmissions />
      </div>
    </div>
  );
}
