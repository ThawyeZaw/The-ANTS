'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — App Route Group Error Boundary
// Catches errors within authenticated pages and shows a branded fallback.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--error)]/10">
        <AlertTriangle className="h-10 w-10 text-[var(--error)]" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--foreground-secondary)]">
        An unexpected error occurred. Try again, or go back to the dashboard.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-[var(--foreground-muted)]">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
