'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Auth Route Group Error Boundary
// ──────────────────────────────────────────────────────────────────────────────

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--error)]/10">
        <AlertTriangle className="h-10 w-10 text-[var(--error)]" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Sign In Error</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--foreground-secondary)]">
        Something went wrong on the authentication page. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}
