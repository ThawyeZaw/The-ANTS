'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — PinPageButton Component
// A small toggle button for pinning/unpinning a page.
// Props: href (string) and label (string).
// Shows a filled Pin icon when the page is pinned, outline when not.
// ──────────────────────────────────────────────────────────────────────────────

import { Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePinnedPages } from '@/hooks/usePinnedPages';

interface PinPageButtonProps {
  href: string;
  label: string;
}

export default function PinPageButton({ href, label }: PinPageButtonProps) {
  const { isPinned, pinPage, unpinPage } = usePinnedPages();

  const pinned = isPinned(href);

  const handleClick = () => {
    if (pinned) {
      unpinPage(href);
    } else {
      pinPage(href, label);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'p-1.5 rounded-lg transition-colors duration-200',
        pinned
          ? 'text-[var(--primary)] hover:bg-[var(--primary)]/10'
          : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)]'
      )}
      aria-label={pinned ? `Unpin ${label}` : `Pin ${label}`}
      title={pinned ? 'Unpin page' : 'Pin page'}
    >
      {pinned ? (
        <Pin className="h-4 w-4" fill="currentColor" />
      ) : (
        <PinOff className="h-4 w-4" />
      )}
    </button>
  );
}
