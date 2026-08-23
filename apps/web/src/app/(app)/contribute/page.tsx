'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — /contribute (Legacy Redirect)
// Redirects to the unified Contributor Workspace at /editor
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ContributeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/editor');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse-soft">
        <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} />
        <p className="text-sm text-foreground-muted">Redirecting to Contributor Workspace...</p>
      </div>
    </div>
  );
}
