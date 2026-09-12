'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStaffProfileEligible } from '@/hooks/useStaffProfileEligible';
import AdvancedProfileEditor from './AdvancedProfileEditor';

export default function ProfileEditorGate() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const staffEligible = useStaffProfileEligible();

  useEffect(() => {
    if (!isLoading && !staffEligible) {
      router.replace('/settings');
    }
  }, [isLoading, staffEligible, router]);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-xs text-foreground-muted flex flex-col items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        Loading profile editor...
      </div>
    );
  }

  if (!staffEligible) {
    return (
      <div className="text-center py-12 text-xs text-foreground-muted flex flex-col items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        Redirecting to account settings...
      </div>
    );
  }

  return <AdvancedProfileEditor />;
}
