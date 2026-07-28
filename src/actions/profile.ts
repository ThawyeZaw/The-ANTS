'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Profile Server Action (Supabase)
// Batches all profile data queries into a single server action.
// Eliminates waterfall/N+1 patterns from the legacy useProfile hook.
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import type { Profile, ProjectEntry } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ContributorProfileData {
  id: string;
  title: string | null;
  bio: string | null;
  website_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
}

export interface ContributorStatsData {
  published_curriculums: number;
  published_resources: number;
  total_views: number;
}

export interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

export interface ClubMembershipInfo {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  joinMode: string;
  custom_slug?: string | null;
}

export interface FullProfileData {
  profile: Profile | null;
  certifications: any[];
  clubMemberships: ClubMembershipInfo[];
  clubProjects: ProjectEntry[];
  contributorProfile: ContributorProfileData | null;
  stats: ContributorStatsData | null;
  activities: ActivityItem[];
  notFound: boolean;
}

// ── Server Action ────────────────────────────────────────────────────────────

export async function actionGetFullProfile(username: string): Promise<FullProfileData> {
  const supabase = await createClient();

  // ── Step 1: Fetch profile ──────────────────────────────────────────────────
  const { data: profileRow, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !profileRow) {
    return {
      profile: null,
      certifications: [],
      clubMemberships: [],
      clubProjects: [],
      contributorProfile: null,
      stats: null,
      activities: [],
      notFound: true,
    };
  }

  const profile: Profile = {
    id: profileRow.id,
    email: profileRow.email ?? '',
    name: profileRow.name ?? '',
    username: profileRow.username ?? '',
    avatar: profileRow.avatar_url ?? '',
    role: (profileRow.role ?? 'student') as Profile['role'],
    bio: profileRow.bio ?? undefined,
    title: profileRow.title ?? undefined,
    socialLinks: profileRow.social_links as unknown as Profile['socialLinks'],
    isPublic: profileRow.is_public ?? true,
    pinnedItemId: profileRow.pinned_item_id ?? undefined,
    sectionVisibility: profileRow.section_visibility as unknown as Profile['sectionVisibility'],
    sectionOrder: (profileRow.section_order as unknown as Profile['sectionOrder']) ?? undefined,
    spacing: (profileRow.spacing as Profile['spacing']) ?? undefined,
    width: (profileRow.width as Profile['width']) ?? undefined,
    sectionLayout: (profileRow.section_layout as Profile['sectionLayout']) ?? undefined,
    showClubMemberships: (profileRow.show_club_memberships as boolean) ?? undefined,
    showClubProjects: (profileRow.show_club_projects as boolean) ?? undefined,
    showClubActivity: (profileRow.show_club_activity as boolean) ?? undefined,
    theme: (profileRow.theme as unknown as Profile['theme']) ?? undefined,
    projects: profileRow.projects as unknown as Profile['projects'],
    activities: profileRow.activities as unknown as Profile['activities'],
    achievements: profileRow.achievements as unknown as Profile['achievements'],
    certificationIds: profileRow.certification_ids ?? undefined,
    createdAt: profileRow.created_at ?? '',
  };

  const isContributor = profile.role === 'contributor' || profile.role === 'main_contributor';

  // ── Step 2: Fetch all secondary data in parallel ───────────────────────────
  const [
    certsRes,
    clubMembersRes,
    clubLeadersRes,
    createdClubsRes,
    contributorRes,
    submissionsRes,
  ] = await Promise.all([
    supabase.from('certifications').select('*').eq('user_id', profile.id),
    supabase.from('club_members').select('*, clubs(*)').eq('user_id', profile.id),
    supabase.from('club_leaders').select('*, clubs(*)').eq('user_id', profile.id),
    supabase.from('clubs').select('*').eq('created_by', profile.id),
    isContributor
      ? supabase.from('contributor_profiles').select('*').eq('id', profile.id).single()
      : Promise.resolve<{ data: any; error: any }>({ data: null, error: null }),
    isContributor
      ? supabase
          .from('editor_submissions')
          .select('*')
          .eq('contributor_id', profile.id)
          .eq('status', 'approved')
          .not('reviewed_at', 'is', null)
      : Promise.resolve<{ data: any; error: any }>({ data: null, error: null }),
  ]);

  const certifications = certsRes.data ?? [];
  const clubMembers = clubMembersRes.data ?? [];
  const clubLeaders = clubLeadersRes.data ?? [];
  const createdClubs = createdClubsRes.data ?? [];

  // ── Step 3: Build deduplicated club map ────────────────────────────────────
  const clubMap = new Map<string, Omit<ClubMembershipInfo, 'memberCount'>>();
  const allClubIds = new Set<string>();

  // Helper: register a club for deduplication
  const registerClub = (club: any, role: string) => {
    if (!club || clubMap.has(club.id)) return;
    clubMap.set(club.id, {
      id: club.id,
      name: club.name,
      role,
      joinMode: 'open',
      custom_slug: club.custom_slug,
    });
    allClubIds.add(club.id);
  };

  for (const cm of clubMembers) {
    registerClub((cm as any).clubs, 'member');
  }
  for (const l of clubLeaders) {
    registerClub((l as any).clubs, 'leader');
  }
  for (const club of createdClubs) {
    registerClub(club, 'admin');
  }

  // ── Step 4: Batch member counts (eliminates N+1) ───────────────────────────
  const clubIdArray = Array.from(allClubIds);
  const memberCountMap = new Map<string, number>();
  const leaderCountMap = new Map<string, number>();

  if (clubIdArray.length > 0) {
    const [memberRowsRes, leaderRowsRes] = await Promise.all([
      supabase.from('club_members').select('club_id').in('club_id', clubIdArray),
      supabase.from('club_leaders').select('club_id').in('club_id', clubIdArray),
    ]);

    for (const row of memberRowsRes.data ?? []) {
      memberCountMap.set(row.club_id, (memberCountMap.get(row.club_id) ?? 0) + 1);
    }
    for (const row of leaderRowsRes.data ?? []) {
      leaderCountMap.set(row.club_id, (leaderCountMap.get(row.club_id) ?? 0) + 1);
    }
  }

  const clubMemberships: ClubMembershipInfo[] = clubIdArray.map((clubId) => {
    const entry = clubMap.get(clubId)!;
    return {
      ...entry,
      memberCount: (memberCountMap.get(clubId) ?? 0) + (leaderCountMap.get(clubId) ?? 0),
    };
  });

  // ── Step 5: Batch club projects (eliminates per-club N+1) ──────────────────
  let clubProjects: ProjectEntry[] = [];

  if (profile.showClubProjects !== false && clubIdArray.length > 0) {
    const { data: allProjects } = await supabase
      .from('club_projects')
      .select('*')
      .in('club_id', clubIdArray);

    if (allProjects) {
      for (const p of allProjects) {
        if (p.contributors?.includes(profile.id) || p.created_by === profile.id) {
          clubProjects.push({
            id: `club-${p.id}`,
            title: p.title,
            description: p.description || '',
            technologies: p.tags ?? undefined,
          });
        }
      }
    }
  }

  // ── Step 6: Process contributor data ───────────────────────────────────────
  let contributorProfile: ContributorProfileData | null = null;
  let stats: ContributorStatsData | null = null;
  let activities: ActivityItem[] = [];

  if (isContributor) {
    const cp = contributorRes.data;
    if (cp) {
      contributorProfile = {
        id: cp.id,
        title: cp.title,
        bio: cp.bio,
        website_url: cp.website,
        facebook_url: cp.facebook_url,
        linkedin_url: cp.linkedin,
        github_url: cp.github,
      };
      stats = {
        published_curriculums: cp.published_curriculums_count ?? 0,
        published_resources: cp.published_notes_count ?? 0,
        total_views: 0,
      };
    }

    const submissions = submissionsRes.data;
    if (submissions) {
      activities = submissions
        .map((s: any) => ({
          id: s.id,
          activity_type: 'submission_approved' as const,
          description: `Submission approved for ${s.submission_type}`,
          created_at: s.reviewed_at as string,
        }))
        .sort((a: ActivityItem, b: ActivityItem) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  return {
    profile,
    certifications,
    clubMemberships,
    clubProjects,
    contributorProfile,
    stats,
    activities,
    notFound: false,
  };
}
