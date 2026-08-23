'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — /contribute/countdown (Legacy Redirect)
// Route: /contribute/countdown -> /editor/exam/countdown
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CountdownLegacyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/editor/exam/countdown');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse-soft">
        <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} />
        <p className="text-sm text-foreground-muted">Redirecting to Countdown Editor...</p>
      </div>
    </div>
  );
}
