'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — EmptyState Component
// Shared empty state placeholder used across the app when a list/collection
// has no items to display.
// ──────────────────────────────────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  heading,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-card)] py-16 px-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
        <Icon size={26} />
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-[var(--foreground)]">{heading}</h3>
      <p className="mb-6 max-w-sm text-sm text-[var(--foreground-muted)]">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--background-secondary)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
