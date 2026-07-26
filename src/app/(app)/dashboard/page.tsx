'use client';

import Image from 'next/image';
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
        <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} />
        <p className="text-sm text-foreground-muted">Loading your dashboard...</p>
      </div>
    </div>
  );
}