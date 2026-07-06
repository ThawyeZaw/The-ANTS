'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useRole';

export default function DashboardPage() {
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (role) {
      const targetPath = role === 'main_contributor' ? '/main-contributor' : `/${role}`;
      router.replace(targetPath);
    }
  }, [role, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse-soft">
        <div className="text-4xl">🐜</div>
        <p className="text-sm text-foreground-muted">Loading your dashboard...</p>
      </div>
    </div>
  );
}