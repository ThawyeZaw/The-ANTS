'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — /resources (Redirect to Unified Library)
// Route: /resources -> /library?tab=exams
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ResourcesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/library?tab=exams');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse-soft">
        <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} />
        <p className="text-sm text-foreground-muted">Redirecting to Library...</p>
      </div>
    </div>
  );
}
