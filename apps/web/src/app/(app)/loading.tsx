// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — App Route Group Loading Skeleton
// Shown while authenticated pages load.
// ──────────────────────────────────────────────────────────────────────────────

import Image from 'next/image';

export default function AppLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
      <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} />
      <div className="h-2 w-48 rounded-full bg-[var(--background-secondary)]" />
      <p className="text-sm text-[var(--foreground-muted)]">Loading...</p>
    </div>
  );
}
