'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — BackButton
// Reusable back navigation.
// - With an explicit `href` (default): navigates directly to that destination.
// - With `useHistory={true}`: uses router.back() with href as fallback.
// Use this everywhere instead of ad-hoc back buttons.
// ──────────────────────────────────────────────────────────────────────────────

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /** Target route — navigated to directly unless useHistory is true */
  href?: string;
  /** Optional label (default: "Back") */
  label?: string;
  /** Custom class names */
  className?: string;
  /**
   * When true, attempts router.back() first, using href only as a fallback.
   * Leave false (default) so the label destination is always honoured.
   */
  useHistory?: boolean;
  /** @deprecated use useHistory instead. When true, only use router.back() — no fallback redirect */
  noFallback?: boolean;
}

export default function BackButton({ href = '/dashboard', label = 'Back', className, useHistory = false, noFallback }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (useHistory || noFallback) {
      // Legacy / explicit history-back mode
      if (window.history.length > 1) {
        router.back();
      } else if (!noFallback) {
        router.push(href);
      }
    } else {
      // Default: navigate directly to the declared destination
      router.push(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--background-card)] border border-[var(--border)] shadow-sm hover:shadow-md hover:border-[var(--primary)]/40 text-sm font-medium text-[var(--foreground)] transition-all duration-300 cursor-pointer',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4 text-[var(--foreground-muted)] group-hover:text-[var(--primary)] group-hover:-translate-x-0.5 transition-all duration-300" />
      {label}
    </button>
  );
}
