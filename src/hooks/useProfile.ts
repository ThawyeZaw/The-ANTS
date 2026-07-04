'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useProfile Hook
// Fetches public profile data by username for the /profile/[username] page.
// Now supports projects, activities, and achievements for all roles.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Profile, ProjectEntry, ActivityEntry, AchievementEntry } from '@/types';
import { useAuth } from './useAuth';
import {
  getProfileByUsername,
  mockContributorProfiles,
  mockContributorStats,
  mockActivityFeed,
  mockEditorSubmissions,
  getUserCertifications,
  getUserClubs,
  getClubProjects,
  getMemberContributions,
  mockClubMembers,
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

interface ClubMembershipInfo {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  joinMode: string;
  custom_domain_slug?: string | null;
}

interface UseProfileReturn {
  profile: Profile | null;
  contributorProfile: ContributorProfileData | null;
  stats: ContributorStatsData | null;
  activities: ActivityItem[];
  projects: ProjectEntry[];
  portfolioActivities: ActivityEntry[];
  achievements: AchievementEntry[];
  certifications: ReturnType<typeof getUserCertifications>;
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
  const [certifications, setCertifications] = useState<ReturnType<typeof getUserCertifications>>([]);
  const [clubMemberships, setClubMemberships] = useState<ClubMembershipInfo[]>([]);
  const [clubProjects, setClubProjects] = useState<ProjectEntry[]>([]);
  const [clubActivity, setClubActivity] = useState<ActivityItem[]>([]);

  const isOwnProfile = !!(user && profile && user.id === profile.id);

  useEffect(() => {
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

      // Fetch certifications for the profile user
      const userCerts = getUserCertifications(foundProfile.id);
      setCertifications(userCerts);

      // Fetch club memberships for the profile user
      const userClubs = getUserClubs(foundProfile.id);
      const memberships: ClubMembershipInfo[] = userClubs.map(({ club, membership }) => {
        const memberCount = mockClubMembers.filter(
          (m) => m.club_id === club.id && m.membership_status === 'active'
        ).length;
        return {
          id: club.id,
          name: club.name,
          role: membership.role,
          memberCount,
          joinMode: club.join_mode,
          custom_domain_slug: club.custom_domain_slug,
        };
      });
      setClubMemberships(memberships);

      // Generate club projects for profile display
      const clubProjEntries: ProjectEntry[] = [];
      const clubActivityItems: ActivityItem[] = [];
      if (foundProfile.showClubProjects !== false) {
        for (const { club } of userClubs) {
          const projects = getClubProjects(club.id);
          for (const p of projects) {
            if (p.contributors?.includes(foundProfile.id) || p.created_by === foundProfile.id) {
              clubProjEntries.push({
                id: `club-${p.id}`,
                title: p.title,
                description: p.description || '',
                technologies: p.tags,
              });
            }
          }
          if (foundProfile.showClubActivity !== false) {
            const contributions = getMemberContributions(club.id, foundProfile.id);
            for (const c of contributions) {
              clubActivityItems.push({
                id: c.id,
                activity_type: `club_${c.contribution_type}`,
                description: `[${club.name}] ${c.title}`,
                created_at: c.created_at,
              });
            }
          }
        }
      }
      setClubProjects(clubProjEntries);
      setClubActivity(clubActivityItems);

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
          .filter((s) => s.contributor_id === foundProfile.id && s.status === 'approved' && s.reviewed_at !== null)
          .map((s) => ({
            id: s.id,
            activity_type: 'submission_approved' as const,
            description: `Submission approved for ${s.submission_type}`,
            created_at: s.reviewed_at as string,
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