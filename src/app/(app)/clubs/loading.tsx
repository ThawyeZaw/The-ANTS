// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Clubs Page Loading Skeleton
// ──────────────────────────────────────────────────────────────────────────────

export default function ClubsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-32 rounded-lg bg-[var(--background-secondary)]" />
        <div className="h-4 w-64 rounded bg-[var(--background-secondary)]" />
      </div>
      {/* Club cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded-full bg-[var(--background-secondary)]" />
              <div className="h-5 w-20 rounded-full bg-[var(--background-secondary)]" />
            </div>
            <div className="h-6 w-48 rounded bg-[var(--background-secondary)]" />
            <div className="h-4 w-full rounded bg-[var(--background-secondary)]" />
            <div className="h-4 w-3/4 rounded bg-[var(--background-secondary)]" />
            <div className="flex gap-4">
              <div className="h-4 w-24 rounded bg-[var(--background-secondary)]" />
              <div className="h-4 w-20 rounded bg-[var(--background-secondary)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
