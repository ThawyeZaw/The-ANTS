'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TanStack Query Hooks for Profiles
// Query hooks wrapping the batched profile server action.
// Replaces the legacy waterfall/N+1 useProfile hook.
// ──────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { actionGetFullProfile } from '@/actions/profile';
import { useAuth } from './useAuth';
import type { FullProfileData } from '@/actions/profile';

// ── Query Hooks ──────────────────────────────────────────────────────────────

/** Fetches a full profile (with certifications, clubs, contributor data, etc.)
 *  by username. Enabled only when `username` is truthy and not 'me'.
 */
export function useProfile(username: string) {
  return useQuery<FullProfileData>({
    queryKey: queryKeys.profile.byUsername(username),
    queryFn: () => actionGetFullProfile(username),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!username && username !== 'me',
  });
}

/** Fetches the currently authenticated user's own profile.
 *  Resolves 'me' to the current user's username internally.
 *  Enabled only when the user's profile is available.
 */
export function useOwnProfile() {
  const { user } = useAuth();

  const username = user?.profile?.username ?? '';

  return useQuery<FullProfileData>({
    queryKey: queryKeys.profile.own,
    queryFn: () => actionGetFullProfile(username),
    staleTime: 2 * 60 * 1000,
    enabled: !!username,
  });
}
