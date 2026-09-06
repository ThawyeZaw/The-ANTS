'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — EmptyState Component
// Shared empty state placeholder used across the app when a list/collection
// has no items to display.
// ──────────────────────────────────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  heading,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background-card py-16 px-8 text-center">
      <AppIcon icon={icon} size="xl" tone="muted" frame="empty" className="mb-4" />
      <h3 className="mb-1.5 text-base font-semibold text-foreground">{heading}</h3>
      <p className="mb-6 max-w-sm text-sm text-foreground-muted">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-xl bg-background-secondary px-5 py-2.5 text-sm font-medium text-foreground hover:bg-border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
