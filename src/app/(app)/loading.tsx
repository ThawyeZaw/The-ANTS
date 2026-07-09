// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — App Route Group Loading Skeleton
// Shown while authenticated pages load.
// ──────────────────────────────────────────────────────────────────────────────

export default function AppLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
      <div className="text-4xl">🐜</div>
      <div className="h-2 w-48 rounded-full bg-[var(--background-secondary)]" />
      <p className="text-sm text-[var(--foreground-muted)]">Loading...</p>
    </div>
  );
}
