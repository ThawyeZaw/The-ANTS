// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Countdown Page Loading Skeleton
// ──────────────────────────────────────────────────────────────────────────────

export default function CountdownLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 animate-pulse p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg bg-[var(--background-secondary)]" />
          <div className="h-4 w-80 rounded bg-[var(--background-secondary)]" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-[var(--background-secondary)]" />
      </div>
      {/* Section */}
      <div className="space-y-4">
        <div className="h-6 w-24 rounded bg-[var(--background-secondary)]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 space-y-4">
              <div className="h-5 w-32 rounded bg-[var(--background-secondary)]" />
              <div className="h-12 w-24 rounded-lg bg-[var(--background-secondary)]" />
              <div className="h-2 w-full rounded-full bg-[var(--background-secondary)]" />
              <div className="h-3 w-20 rounded bg-[var(--background-secondary)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
