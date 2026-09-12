'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useProfile Hook (Unified Multi-Role & Tutor Support)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Profile, ProjectEntry, ActivityEntry, AchievementEntry } from '@/types';
import { useAuth } from './useAuth';
import { actionGetFullProfile } from '@/actions/profile';
import type {
  TutorProfileData,
  ContributorProfileData,
  ContributorStatsData,
  ActivityItem,
} from '@/actions/profile';

export type { TutorProfileData, ContributorProfileData, ContributorStatsData, ActivityItem };

interface UseProfileReturn {
  profile: Profile | null;
  tutorProfile: TutorProfileData | null;
  contributorProfile: ContributorProfileData | null;
  stats: ContributorStatsData | null;
  activities: ActivityItem[];
  projects: ProjectEntry[];
  portfolioActivities: ActivityEntry[];
  achievements: AchievementEntry[];
  certifications: any[];
  isLoading: boolean;
  isOwnProfile: boolean;
  notFound: boolean;
  unavailableReason?: string;
  refetch: () => Promise<void>;
}

export function useProfile(username: string): UseProfileReturn {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfileData | null>(null);
  const [contributorProfile, setContributorProfile] = useState<ContributorProfileData | null>(null);
  const [stats, setStats] = useState<ContributorStatsData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState<string | undefined>();
  const [certifications, setCertifications] = useState<any[]>([]);

  const isOwnProfile = !!(user && profile && user.id === profile.id);

  const fetchProfile = async () => {
    setIsLoading(true);
    setNotFound(false);

    const resolvedUsername = username === 'me' && user
      ? user.profile?.username
      : username;

    if (!resolvedUsername) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const data = await actionGetFullProfile(resolvedUsername, user?.id ?? null);

    if (data.notFound || !data.profile) {
      setProfile(null);
      setTutorProfile(null);
      setContributorProfile(null);
      setStats(null);
      setActivities([]);
      setCertifications([]);
      setNotFound(true);
      setUnavailableReason(data.unavailableReason);
      setIsLoading(false);
      return;
    }

    setUnavailableReason(undefined);
    setProfile(data.profile);
    setTutorProfile(data.tutorProfile);
    setContributorProfile(data.contributorProfile);
    setStats(data.stats);
    setActivities(data.activities);
    setCertifications(data.certifications);
    setNotFound(false);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [username, user]);

  return {
    profile,
    tutorProfile,
    contributorProfile,
    stats,
    activities,
    projects: profile?.projects || [],
    portfolioActivities: profile?.activities || [],
    achievements: profile?.achievements || [],
    certifications,
    isLoading,
    isOwnProfile,
    notFound,
    unavailableReason,
    refetch: fetchProfile,
  };
}
