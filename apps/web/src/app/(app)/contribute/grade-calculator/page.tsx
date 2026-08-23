'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — /contribute/grade-calculator (Legacy Redirect)
// Route: /contribute/grade-calculator -> /editor/exam/grade-calculator
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function GradeCalculatorLegacyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/editor/exam/grade-calculator');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse-soft">
        <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} />
        <p className="text-sm text-foreground-muted">Redirecting to Grade Calculator Editor...</p>
      </div>
    </div>
  );
}
