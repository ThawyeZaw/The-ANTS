'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useProfile Hook
// Fetches public profile data by username for the /profile/[username] page.
// Uses Supabase for all data fetching.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Profile, ProjectEntry, ActivityEntry, AchievementEntry } from '@/types';
import { useAuth } from './useAuth';
import { createClient } from '@/lib/supabase/client';

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
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contributorProfile, setContributorProfile] = useState<ContributorProfileData | null>(null);
  const [stats, setStats] = useState<ContributorStatsData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [clubMemberships, setClubMemberships] = useState<ClubMembershipInfo[]>([]);
  const [clubProjects, setClubProjects] = useState<ProjectEntry[]>([]);
  const [clubActivity, setClubActivity] = useState<ActivityItem[]>([]);

  const isOwnProfile = !!(user && profile && user.id === profile.id);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setIsLoading(true);

      // Resolve "me" to the current user's username
      const resolvedUsername = username === 'me' && user
        ? user.profile.username
        : username;

      if (!resolvedUsername) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const { data: profileRow, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', resolvedUsername)
        .single();

      if (error || !profileRow) {
        if (!cancelled) {
          setProfile(null);
          setContributorProfile(null);
          setStats(null);
          setActivities([]);
          setNotFound(true);
          setIsLoading(false);
        }
        return;
      }

      const foundProfile: Profile = {
        id: profileRow.id,
        email: profileRow.email ?? '',
        name: profileRow.name ?? '',
        username: profileRow.username ?? '',
        avatar: profileRow.avatar_url ?? '',
        role: profileRow.role ?? 'student',
        bio: profileRow.bio,
        title: profileRow.title,
        socialLinks: profileRow.social_links as Profile['socialLinks'],
        isPublic: profileRow.is_public ?? true,
        pinnedItemId: profileRow.pinned_item_id,
        sectionVisibility: profileRow.section_visibility as Profile['sectionVisibility'],
        projects: profileRow.projects as Profile['projects'],
        activities: profileRow.activities as Profile['activities'],
        achievements: profileRow.achievements as Profile['achievements'],
        certificationIds: profileRow.certification_ids,
        createdAt: profileRow.created_at,
      };

      if (cancelled) return;
      setProfile(foundProfile);

      // Fetch certifications for the profile user
      const { data: certs } = await supabase
        .from('certifications')
        .select('*')
        .eq('contributor_id', foundProfile.id);
      if (!cancelled) setCertifications(certs ?? []);

      // Fetch club memberships for the profile user
      const { data: clubMembers } = await supabase
        .from('club_members')
        .select('*, clubs(*)')
        .eq('user_id', foundProfile.id)
        .eq('membership_status', 'active');

      if (!cancelled && clubMembers) {
        const memberships: ClubMembershipInfo[] = [];
        for (const cm of clubMembers) {
          const club = cm.clubs as any;
          if (!club) continue;

          const { count } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id)
            .eq('membership_status', 'active');

          memberships.push({
            id: club.id,
            name: club.name,
            role: cm.role,
            memberCount: count ?? 0,
            joinMode: club.join_mode,
            custom_domain_slug: club.custom_domain_slug,
          });
        }
        if (!cancelled) setClubMemberships(memberships);

        // Club projects for profile display
        if (foundProfile.showClubProjects !== false) {
          const clubProjEntries: ProjectEntry[] = [];
          const clubActivityItems: ActivityItem[] = [];
          for (const cm of clubMembers) {
            const club = cm.clubs as any;
            if (!club) continue;

            const { data: projects } = await supabase
              .from('club_projects')
              .select('*')
              .eq('club_id', club.id);
            if (projects) {
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
            }

            if (foundProfile.showClubActivity !== false) {
              const { data: contributions } = await supabase
                .from('club_member_contributions')
                .select('*')
                .eq('club_id', club.id)
                .eq('user_id', foundProfile.id);
              if (contributions) {
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
          if (!cancelled) {
            setClubProjects(clubProjEntries);
            setClubActivity(clubActivityItems);
          }
        }
      }

      // Fetch contributor-specific data if applicable
      if (foundProfile.role === 'contributor' || foundProfile.role === 'main_contributor') {
        const { data: cp } = await supabase
          .from('contributor_profiles')
          .select('*')
          .eq('id', foundProfile.id)
          .single();
        if (!cancelled) {
          setContributorProfile(cp ? {
            id: cp.id,
            title: cp.title,
            bio: cp.bio,
            website_url: cp.website,
            facebook_url: cp.facebook_url,
            linkedin_url: cp.linkedin,
            github_url: cp.github,
          } : null);
          setStats({
            published_curriculums: cp?.published_curriculums_count ?? 0,
            published_resources: cp?.published_notes_count ?? 0,
            total_views: 0,
          });
        }

        // Aggregate activity from editor_submissions
        const { data: submissions } = await supabase
          .from('editor_submissions')
          .select('*')
          .eq('submitter_id', foundProfile.id)
          .eq('status', 'approved')
          .not('reviewed_at', 'is', null);

        if (!cancelled && submissions) {
          const submissionActivities: ActivityItem[] = submissions.map((s: any) => ({
            id: s.id,
            activity_type: 'submission_approved' as const,
            description: `Submission approved for ${s.submission_type}`,
            created_at: s.reviewed_at as string,
          }));
          setActivities(submissionActivities.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ));
        }
      } else {
        if (!cancelled) {
          setContributorProfile(null);
          setStats(null);
          setActivities([]);
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    fetchProfile();

    return () => { cancelled = true; };
  }, [username, user, supabase]);

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
