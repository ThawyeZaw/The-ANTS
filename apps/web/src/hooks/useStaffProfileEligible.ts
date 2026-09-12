'use client';

import { useMemo } from 'react';
import { canHavePublicProfile } from '@the-ants/shared-types';
import { useAuth } from './useAuth';

/** True when the signed-in user may use the public profile editor and public profile URL. */
export function useStaffProfileEligible(): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    const roles =
      user.profile.roles && user.profile.roles.length > 0
        ? user.profile.roles
        : [user.profile.role ?? 'student'];
    return canHavePublicProfile(roles);
  }, [user]);
}
