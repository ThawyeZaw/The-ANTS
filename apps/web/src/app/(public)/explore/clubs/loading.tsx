// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Explore Clubs Loading Skeleton
// ──────────────────────────────────────────────────────────────────────────────

export default function ClubsLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b border-border bg-background-card">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="h-5 w-24 animate-shimmer rounded-lg mb-4" />
          <div className="h-8 w-56 animate-shimmer rounded-lg mb-2" />
          <div className="h-4 w-96 animate-shimmer rounded-lg mb-6" />
          <div className="h-10 max-w-md animate-shimmer rounded-xl" />
        </div>
      </div>

      {/* Card grid skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-background-card border border-border rounded-2xl p-6 animate-shimmer">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-background-elevated" />
                <div className="h-5 w-16 rounded-full bg-background-elevated" />
              </div>
              <div className="h-6 w-3/4 rounded-lg mb-2" />
              <div className="h-4 w-full rounded-lg mb-1" />
              <div className="h-4 w-2/3 rounded-lg mb-4" />
              <div className="flex gap-1.5 mb-4">
                <div className="h-5 w-16 rounded-full bg-background-elevated" />
                <div className="h-5 w-20 rounded-full bg-background-elevated" />
                <div className="h-5 w-14 rounded-full bg-background-elevated" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded-lg" />
                <div className="h-4 w-12 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
