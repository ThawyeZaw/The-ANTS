'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Notes Editor Page
// Route: /editor/notes — Contributor and Main Contributor only.
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import NotesEditor from '@/components/notes/NotesEditor';

function EditorGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isContributor, isMainContributor } = useRole();
  const router = useRouter();

  const hasAccess = isContributor || isMainContributor;

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess) {
      router.replace('/library');
    }
  }, [isLoading, isAuthenticated, hasAccess, router]);

  // Show spinner while auth is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Show access denied for authenticated but unauthorized users
  if (!hasAccess) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
          <ShieldAlert className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">Access Restricted</h2>
        <p className="mt-2 max-w-sm text-sm text-[var(--foreground-secondary)]">
          The Notes Editor is available to Contributors and Main Contributors only.
          Browse the Library or request a role upgrade in Settings.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <BackButton href="/library" label="Go to Library" />
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors"
          >
            Request Upgrade
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <NotesEditor />
    </Suspense>
  );
}

export default function NotesEditorPage() {
  return <EditorGuard />;
}
