'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useProfile Hook
// Fetches public profile data by username for the /profile/[username] page.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Profile } from '@/types';
import { useAuth } from './useAuth';
import {
  getProfileByUsername,
  mockContributorProfiles,
  mockContributorStats,
  mockActivityFeed,
  mockEditorSubmissions,
} from '@/lib/mock/database';

interface ContributorProfileData {
  id: string;
  title: string | null;
  bio: string | null;
  website_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
}

interface ContributorStatsData {
  published_curriculums: number;
  published_resources: number;
  total_views: number;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface UseProfileReturn {
  profile: Profile | null;
  contributorProfile: ContributorProfileData | null;
  stats: ContributorStatsData | null;
  activities: ActivityItem[];
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

  const isOwnProfile = !!(user && profile && user.id === profile.id);

  useEffect(() => {
    setIsLoading(true);
    setNotFound(false);

    // Simulate async fetch
    const timer = setTimeout(() => {
      // Resolve "me" to the current user's username
      const resolvedUsername = username === 'me' && user
        ? user.profile.username
        : username;

      const foundProfile = getProfileByUsername(resolvedUsername);

      if (!foundProfile) {
        setProfile(null);
        setContributorProfile(null);
        setStats(null);
        setActivities([]);
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setProfile(foundProfile);

      // Fetch contributor-specific data if applicable
      if (foundProfile.role === 'contributor' || foundProfile.role === 'main_contributor') {
        const cp = mockContributorProfiles.find((p) => p.id === foundProfile.id);
        setContributorProfile(cp ?? null);

        const cs = mockContributorStats.find((s) => s.contributor_id === foundProfile.id);
        setStats(cs ? {
          published_curriculums: cs.published_curriculums,
          published_resources: cs.published_resources,
          total_views: cs.total_views,
        } : null);

        // Aggregate activity from mockActivityFeed + mockEditorSubmissions
        const feedActivities: ActivityItem[] = mockActivityFeed
          .filter((a) => a.user_id === foundProfile.id)
          .map((a) => ({
            id: a.id,
            activity_type: a.activity_type,
            description: a.description,
            created_at: a.created_at,
          }));

        const submissionActivities: ActivityItem[] = mockEditorSubmissions
          .filter((s) => s.contributor_id === foundProfile.id && s.status === 'approved')
          .map((s) => ({
            id: s.id,
            activity_type: 'submission_approved',
            description: `Submission approved for ${s.submission_type}`,
            created_at: s.reviewed_at,
          }));

        setActivities(
          [...feedActivities, ...submissionActivities].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
      } else {
        setContributorProfile(null);
        setStats(null);
        setActivities([]);
      }

      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [username, user]);

  return { profile, contributorProfile, stats, activities, isLoading, isOwnProfile, notFound };
}
