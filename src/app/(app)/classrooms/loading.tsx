// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Classrooms Page Loading Skeleton
// ──────────────────────────────────────────────────────────────────────────────

export default function ClassroomsLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-pulse p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded-lg bg-[var(--background-secondary)]" />
          <div className="h-4 w-72 rounded bg-[var(--background-secondary)]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-20 rounded-xl bg-[var(--background-secondary)]" />
          <div className="h-10 w-36 rounded-xl bg-[var(--background-secondary)]" />
        </div>
      </div>
      {/* Classroom cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 space-y-4">
            <div className="h-5 w-40 rounded bg-[var(--background-secondary)]" />
            <div className="h-4 w-full rounded bg-[var(--background-secondary)]" />
            <div className="flex items-center gap-4">
              <div className="h-4 w-16 rounded bg-[var(--background-secondary)]" />
              <div className="h-4 w-20 rounded bg-[var(--background-secondary)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
