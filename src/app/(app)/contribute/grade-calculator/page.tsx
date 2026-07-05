'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Grade Calculator Editor Page
// Route: /contribute/grade-calculator — Contributor and Main Contributor only.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import BackButton from '@/components/ui/BackButton';
import GradeCalculatorEditor from '@/components/exam-data/GradeCalculatorEditor';
import MySubmissions from '@/components/exam-data/MySubmissions';

export default function GradeCalculatorEditorPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isContributor, isMainContributor } = useRole();
  const router = useRouter();

  const hasAccess = isContributor || isMainContributor;

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
          The Grade Calculator Editor is available to Contributors and Main Contributors only.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <BackButton href="/editor/exam" label="Back to exam editors" />
      <div className="mt-6 max-w-4xl mx-auto space-y-8">
        <GradeCalculatorEditor />
        <MySubmissions />
      </div>
    </div>
  );
}
