'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Settings Page Loading Skeleton
// ──────────────────────────────────────────────────────────────────────────────

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 animate-pulse">
      {/* Back button placeholder */}
      <div className="h-10 w-24 rounded-xl bg-[var(--background-secondary)]" />
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-lg bg-[var(--background-secondary)]" />
        <div className="h-4 w-64 rounded bg-[var(--background-secondary)]" />
      </div>
      {/* Profile card */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[var(--background-secondary)]" />
          <div className="space-y-1">
            <div className="h-5 w-20 rounded bg-[var(--background-secondary)]" />
            <div className="h-3 w-40 rounded bg-[var(--background-secondary)]" />
          </div>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="h-4 w-full rounded bg-[var(--background-secondary)]" />
          <div className="h-10 w-40 rounded-xl bg-[var(--background-secondary)]" />
        </div>
      </div>
      {/* Role card */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[var(--background-secondary)]" />
          <div className="space-y-1">
            <div className="h-5 w-28 rounded bg-[var(--background-secondary)]" />
            <div className="h-3 w-48 rounded bg-[var(--background-secondary)]" />
          </div>
        </div>
        <div className="px-6 py-6 h-20 bg-[var(--background-secondary)]/50" />
      </div>
      {/* Appearance card */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[var(--background-secondary)]" />
          <div className="space-y-1">
            <div className="h-5 w-24 rounded bg-[var(--background-secondary)]" />
            <div className="h-3 w-44 rounded bg-[var(--background-secondary)]" />
          </div>
        </div>
        <div className="px-6 py-6 h-32 bg-[var(--background-secondary)]/50" />
      </div>
    </div>
  );
}
