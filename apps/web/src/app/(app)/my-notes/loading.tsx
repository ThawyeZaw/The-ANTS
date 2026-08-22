// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — My Notes Loading Skeleton
// ──────────────────────────────────────────────────────────────────────────────

export default function MyNotesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2 mb-6">
        <div className="h-8 w-32 rounded-lg bg-[var(--background-secondary)]" />
        <div className="h-4 w-56 rounded bg-[var(--background-secondary)]" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        <div className="h-10 w-28 rounded-xl bg-[var(--background-secondary)]" />
        <div className="h-10 w-28 rounded-xl bg-[var(--background-secondary)]" />
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="h-10 w-64 rounded-xl bg-[var(--background-secondary)]" />
        <div className="h-10 w-24 rounded-xl bg-[var(--background-secondary)]" />
      </div>

      {/* Note cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden">
            <div className="h-1.5 w-full bg-[var(--background-secondary)]" />
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <div className="h-4 w-16 rounded-full bg-[var(--background-secondary)]" />
                <div className="h-4 w-20 rounded-full bg-[var(--background-secondary)]" />
              </div>
              <div className="h-6 w-48 rounded bg-[var(--background-secondary)]" />
              <div className="h-4 w-full rounded bg-[var(--background-secondary)]" />
              <div className="h-4 w-3/4 rounded bg-[var(--background-secondary)]" />
              <div className="flex gap-2 pt-2">
                <div className="h-4 w-20 rounded bg-[var(--background-secondary)]" />
                <div className="h-4 w-16 rounded bg-[var(--background-secondary)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
