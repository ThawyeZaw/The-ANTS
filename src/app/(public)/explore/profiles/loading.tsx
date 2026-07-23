// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Explore Profiles Loading Skeleton
// ──────────────────────────────────────────────────────────────────────────────

export default function ProfilesLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b border-border bg-background-card">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="h-5 w-24 animate-shimmer rounded-lg mb-4" />
          <div className="h-8 w-64 animate-shimmer rounded-lg mb-2" />
          <div className="h-4 w-96 animate-shimmer rounded-lg mb-6" />
          <div className="h-10 max-w-md animate-shimmer rounded-xl" />
          <div className="flex flex-wrap gap-2 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-24 animate-shimmer rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Profile card grid skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-background-card border border-border rounded-2xl p-6 animate-shimmer">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-background-elevated shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-5 w-32 rounded-lg mb-1" />
                  <div className="h-4 w-20 rounded-lg mb-0.5" />
                  <div className="h-3 w-24 rounded-lg" />
                </div>
                <div className="h-6 w-20 rounded-full bg-background-elevated shrink-0" />
              </div>
              <div className="h-4 w-full rounded-lg mb-1" />
              <div className="h-4 w-2/3 rounded-lg mb-4" />
              <div className="flex items-center gap-4">
                <div className="h-3 w-16 rounded-lg" />
                <div className="h-3 w-20 rounded-lg" />
              </div>
              <div className="mt-4 h-4 w-28 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
