'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useProfile Hook
// Fetches public profile data by username for the /profile/[username] page.
//
// ⚡ Performance: delegates all data fetching to the batched server action
// `actionGetFullProfile` which runs all queries in parallel, eliminating the
// previous N+1 waterfall (one Supabase call per club per membership count).
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Profile, ProjectEntry, ActivityEntry, AchievementEntry } from '@/types';
import { useAuth } from './useAuth';
import { actionGetFullProfile } from '@/actions/profile';
import type {
  ContributorProfileData,
  ContributorStatsData,
  ActivityItem,
  ClubMembershipInfo,
} from '@/actions/profile';

// Re-export action types for convenience (consumers previously imported from here)
export type { ContributorProfileData, ContributorStatsData, ActivityItem, ClubMembershipInfo };

interface UseProfileReturn {
  profile: Profile | null;
  contributorProfile: ContributorProfileData | null;
  stats: ContributorStatsData | null;
  activities: ActivityItem[];
  projects: ProjectEntry[];
  portfolioActivities: ActivityEntry[];
  achievements: AchievementEntry[];
  certifications: any[];
  clubMemberships: ClubMembershipInfo[];
  clubProjects: ProjectEntry[];
  clubActivity: ActivityItem[];
  isLoading: boolean;
  isOwnProfile: boolean;
  notFound: boolean;
}

export function useProfile(username: string): UseProfileReturn {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributorProfile, setContributorProfile] = useState<ContributorProfileData | null>(null);
  const [stats, setStats] = useState<ContributorStatsData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [clubMemberships, setClubMemberships] = useState<ClubMembershipInfo[]>([]);
  const [clubProjects, setClubProjects] = useState<ProjectEntry[]>([]);
  // clubActivity is derived from activities — kept for API compatibility
  const [clubActivity] = useState<ActivityItem[]>([]);

  const isOwnProfile = !!(user && profile && user.id === profile.id);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setIsLoading(true);
      setNotFound(false);

      // Resolve "me" to the current user's username
      const resolvedUsername = username === 'me' && user
        ? user.profile?.username
        : username;

      if (!resolvedUsername) {
        if (!cancelled) {
          setNotFound(true);
          setIsLoading(false);
        }
        return;
      }

      // ── Single batched server action (replaces 8+ sequential Supabase calls) ─
      const data = await actionGetFullProfile(resolvedUsername);

      if (cancelled) return;

      if (data.notFound || !data.profile) {
        setProfile(null);
        setContributorProfile(null);
        setStats(null);
        setActivities([]);
        setCertifications([]);
        setClubMemberships([]);
        setClubProjects([]);
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setProfile(data.profile);
      setCertifications(data.certifications);
      setClubMemberships(data.clubMemberships);
      setClubProjects(data.clubProjects);
      setContributorProfile(data.contributorProfile);
      setStats(data.stats);
      setActivities(data.activities);
      setNotFound(false);
      setIsLoading(false);
    }

    fetchProfile();

    return () => { cancelled = true; };
  }, [username, user]);

  return {
    profile,
    contributorProfile,
    stats,
    activities,
    projects: profile?.projects || [],
    portfolioActivities: profile?.activities || [],
    achievements: profile?.achievements || [],
    certifications,
    clubMemberships,
    clubProjects,
    clubActivity,
    isLoading,
    isOwnProfile,
    notFound,
  };
}
