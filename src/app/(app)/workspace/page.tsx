'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkspacePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <main className="flex items-center justify-center min-h-[60vh]">
      <p className="text-sm text-[var(--foreground-muted)]">Redirecting to dashboard...</p>
    </main>
  );
}
