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
  /** Fallback route when history is unavailable */
  href?: string;
  /** Optional label (default: "Back") */
  label?: string;
  /** Custom class names */
  className?: string;
}

export default function BackButton({ href = '/dashboard', label = 'Back', className }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // Try browser back first; fall back to href
    if (window.history.length > 1) {
      router.back();
    } else {
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
