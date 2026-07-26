'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Resources Page (redirects to unified Resources hub at /library)
// ──────────────────────────────────────────────────────────────────────────────

import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResourcesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/library');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse-soft">
        <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} />
        <p className="text-sm text-foreground-muted">Redirecting to Resources...</p>
      </div>
    </div>
  );
}
