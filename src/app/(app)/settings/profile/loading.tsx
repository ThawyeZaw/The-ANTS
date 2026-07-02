// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Profile Editor Loading Skeleton
// ──────────────────────────────────────────────────────────────────────────────

export default function ProfileEditorLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-[var(--background-secondary)]" />
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-[var(--background-secondary)]" />
          <div className="h-4 w-64 rounded bg-[var(--background-secondary)]" />
        </div>
      </div>

      {/* Profile editor skeleton */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[var(--background-secondary)]" />
          <div className="space-y-2">
            <div className="h-5 w-36 rounded bg-[var(--background-secondary)]" />
            <div className="h-4 w-24 rounded bg-[var(--background-secondary)]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-[var(--background-secondary)]" />
            <div className="h-10 w-full rounded-xl bg-[var(--background-secondary)]" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-[var(--background-secondary)]" />
            <div className="h-10 w-full rounded-xl bg-[var(--background-secondary)]" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-[var(--background-secondary)]" />
          <div className="h-24 w-full rounded-xl bg-[var(--background-secondary)]" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-[var(--background-secondary)]" />
      </div>
    </div>
  );
}
