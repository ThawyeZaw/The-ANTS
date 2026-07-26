'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — PinnedPages Component
// Displays pinned pages in a horizontal row with unpin buttons.
// Used on the dashboard for quick access to frequently visited pages.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { Pin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePinnedPages } from '@/hooks/usePinnedPages';

export default function PinnedPages() {
  const { pinnedPages, isLoaded, unpinPage } = usePinnedPages();

  // Don't render anything until we've loaded from localStorage
  if (!isLoaded) return null;

  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border)]',
        'bg-[var(--background-card)] p-4'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Pin className="h-4 w-4 text-[var(--foreground-muted)]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          Pinned
        </span>
      </div>

      {/* Content */}
      {pinnedPages.length === 0 ? (
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          Pin your favorite pages for quick access. Use the pin button in the
          navigation bar.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {pinnedPages.map((page) => (
            <div
              key={page.href}
              className={cn(
                'flex items-center gap-1 rounded-xl',
                'bg-[var(--background-secondary)]',
                'hover:bg-[var(--primary)]/10',
                'transition-colors duration-200',
                'group'
              )}
            >
              <Link
                href={page.href}
                className="px-3 py-2 text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors"
              >
                {page.label}
              </Link>
              <button
                onClick={() => unpinPage(page.href)}
                className={cn(
                  'p-1 mr-1 rounded-lg',
                  'text-[var(--foreground-muted)]',
                  'hover:text-[var(--foreground)] hover:bg-[var(--background)]',
                  'transition-colors duration-200'
                )}
                aria-label={`Unpin ${page.label}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
