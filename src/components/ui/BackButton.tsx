'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — BackButton
// Reusable back navigation: tries router.back() first, falls back to href.
// Use this everywhere instead of ad-hoc back buttons.
// ──────────────────────────────────────────────────────────────────────────────

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /** Fallback route when history is unavailable (ignored when noFallback is true) */
  href?: string;
  /** Optional label (default: "Back") */
  label?: string;
  /** Custom class names */
  className?: string;
  /** When true, only use router.back() — no fallback redirect */
  noFallback?: boolean;
}

export default function BackButton({ href = '/dashboard', label = 'Back', className, noFallback }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // Try browser back first; only fall back to href when noFallback is false
    if (window.history.length > 1) {
      router.back();
    } else if (!noFallback) {
      router.push(href);
    }
    // If noFallback and no history, do nothing
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
