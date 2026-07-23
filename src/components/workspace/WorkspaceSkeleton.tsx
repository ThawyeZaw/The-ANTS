'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — WorkspaceSkeleton
// Loading placeholder for workspace cards before data loads.
// ──────────────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-md bg-[var(--border)] animate-pulse', className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 space-y-3">
      <div className="flex justify-between">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-3 w-10" />
      </div>
      <SkeletonBar className="h-4 w-3/4" />
      <div className="space-y-2 pt-2">
        <SkeletonBar className="h-8 w-full" />
        <SkeletonBar className="h-8 w-full" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 4, columns = 'md:grid-cols-2' }: { count?: number; columns?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4', columns)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TabContentSkeleton({ tab }: { tab: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonBar className="h-4 w-32" />
        <SkeletonBar className="h-4 w-20" />
      </div>
      <GridSkeleton count={4} />
    </div>
  );
}
