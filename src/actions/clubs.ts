'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Club Server Actions (Supabase)
// ──────────────────────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateClubSlug } from '@/lib/utils';
import type { ClubField, ClubProjectLink } from '@/types';
import type { Json } from '@/types/supabase';

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireLeader(clubId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase.from('club_leaders').select('id').eq('club_id', clubId).eq('user_id', userId).single();
  if (!data) return { success: false, error: 'Only club leaders can perform this action' };
  return { success: true };
}

// ── Search Profiles ──────────────────────────────────────────────────────────

export async function actionSearchProfiles(query: string) {
  if (!query || query.length < 2) return { success: true, profiles: [] };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, avatar_url')
    .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(20);
  if (error) return { success: false, error: error.message };
  return { success: true, profiles: data ?? [] };
}

async function requireCreator(clubId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase.from('clubs').select('created_by').eq('id', clubId).single();
  if (!data || data.created_by !== userId) return { success: false, error: 'Only the club creator can perform this action' };
  return { success: true };
}

async function requireMember(clubId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase.from('club_members').select('id').eq('club_id', clubId).eq('user_id', userId).single();
  if (!data) return { success: false, error: 'You are not a member of this club' };
  return { success: true };
}

// ── Clubs CRUD ───────────────────────────────────────────────────────────────

export async function actionGetAllClubs() {
  const supabase = await createClient();
  const { data: clubs } = await supabase.from('clubs').select('*').order('created_at', { ascending: false });
  return { success: true, clubs: clubs ?? [] };
}

export async function actionGetClub(clubId: string) {
  const supabase = await createClient();
  const { data: club, error } = await supabase.from('clubs').select('*').eq('id', clubId).single();
  if (error || !club) return { success: false, error: 'Club not found' };
  return { success: true, club };
}

export async function actionGetClubBySlug(slug: string) {
  const supabase = await createClient();
  // Try by custom_slug first
  const { data: club, error } = await supabase.from('clubs').select('*').eq('custom_slug', slug).single();
  if (!error && club) return { success: true, club };
  // Fall back to id lookup (for legacy UUID-based links)
  const { data: clubById, error: errorById } = await supabase.from('clubs').select('*').eq('id', slug).single();
  if (!errorById && clubById) return { success: true, club: clubById };
  return { success: false, error: 'Club not found' };
}

export async function actionCreateClub(userId: string, data: {
  name: string;
  description?: string;
  tagline?: string;
  field: ClubField;
  cover_image_url?: string;
  accent_color?: string;
  custom_slug?: string;
}) {
  const supabase = await createClient();

  let slug = data.custom_slug || null;

  // Auto-generate slug if not provided
  if (!slug) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateClubSlug();
      const { data: existing } = await supabase.from('clubs').select('id').eq('custom_slug', candidate).single();
      if (!existing) {
        slug = candidate;
        break;
      }
    }
    if (!slug) return { success: false, error: 'Failed to generate a unique club URL. Please try again.' };
  } else {
    // Check slug uniqueness if custom provided
    const { data: existing } = await supabase.from('clubs').select('id').eq('custom_slug', slug).single();
    if (existing) return { success: false, error: 'This URL slug is already taken' };
  }

  const { data: club, error } = await supabase.from('clubs').insert({
    name: data.name,
    description: data.description ?? null,
    tagline: data.tagline ?? null,
    field: data.field,
    created_by: userId,
    cover_image_url: data.cover_image_url ?? null,
    accent_color: data.accent_color ?? '#6366f1',
    custom_slug: slug,
  }).select().single();

  if (error || !club) return { success: false, error: error?.message ?? 'Failed to create club' };

  revalidatePath('/clubs');
  revalidatePath('/explore/clubs');

  // Triggers automatically add default sections + creator as leader
  return { success: true, club };
}

export async function actionUpdateClub(clubId: string, userId: string, updates: {
  name?: string;
  description?: string | null;
  tagline?: string | null;
  field?: ClubField;
  cover_image_url?: string | null;
  accent_color?: string | null;
  custom_slug?: string | null;
}) {
  const auth = await requireLeader(clubId, userId);
  if (!auth.success) return auth;

  const supabase = await createClient();

  // Check slug uniqueness if changing
  if (updates.custom_slug) {
    const { data: existing } = await supabase.from('clubs').select('id').eq('custom_slug', updates.custom_slug).single();
    if (existing && existing.id !== clubId) return { success: false, error: 'This URL slug is already taken' };
  }

  // Use admin client for the actual update to bypass RLS (auth already verified above)
  const admin = await createAdminClient();
  const { data: updatedClub, error } = await admin.from('clubs').update(updates).eq('id', clubId).select().single();
  if (error) return { success: false, error: error.message };
  if (!updatedClub) return { success: false, error: 'Failed to update club — no rows affected.' };

  revalidatePath('/clubs');
  revalidatePath('/explore/clubs');
  revalidatePath(`/clubs/${updatedClub.custom_slug}`);
  revalidatePath(`/explore/clubs/${updatedClub.custom_slug}`);

  return { success: true, data: updatedClub };
}

export async function actionDeleteClub(clubId: string, userId: string) {
  const auth = await requireLeader(clubId, userId);
  if (!auth.success) return auth;

  const admin = await createAdminClient();
  const { error } = await admin.from('clubs').delete().eq('id', clubId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Leaders ──────────────────────────────────────────────────────────────────

export async function actionGetClubLeaders(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('club_leaders').select('*, profiles(name, username, avatar_url)').eq('club_id', clubId);
  return { success: true, leaders: data ?? [] };
}

/**
 * Batch fetch leaders, members, and user memberships for multiple clubs in
 * just 3 DB queries — eliminates the N+1 client request pattern.
 *
 * @param clubIds  Array of club UUIDs to fetch data for.
 * @param userId   Optional — if provided, membership status is returned per club.
 */
export async function actionGetClubsBatchData(clubIds: string[], userId?: string) {
  const supabase = await createClient();

  // 1) All leaders for all requested clubs
  const { data: leaders } = await supabase
    .from('club_leaders')
    .select('*, profiles(name, username, avatar_url)')
    .in('club_id', clubIds);

  // 2) All members for all requested clubs
  const { data: members } = await supabase
    .from('club_members')
    .select('*, profiles(name, username, avatar_url)')
    .in('club_id', clubIds);

  // 3) User memberships across all clubs (only when userId is provided)
  let memberships: any[] = [];
  if (userId) {
    const { data: userMemberships } = await supabase
      .from('club_members')
      .select('*')
      .in('club_id', clubIds)
      .eq('user_id', userId);
    memberships = userMemberships ?? [];
  }

  return {
    success: true,
    leaders: leaders ?? [],
    members: members ?? [],
    memberships,
  };
}

export async function actionAddLeader(clubId: string, userId: string, targetUserId: string) {
  const auth = await requireCreator(clubId, userId);
  if (!auth.success) return auth;

  const admin = await createAdminClient();
  const { error } = await admin.from('club_leaders').insert({ club_id: clubId, user_id: targetUserId });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function actionRemoveLeader(clubId: string, userId: string, targetUserId: string) {
  const auth = await requireCreator(clubId, userId);
  if (!auth.success) return auth;

  const admin = await createAdminClient();
  const { error } = await admin.from('club_leaders').delete().eq('club_id', clubId).eq('user_id', targetUserId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Sections ─────────────────────────────────────────────────────────────────

export async function actionGetClubSections(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('club_sections').select('*').eq('club_id', clubId).order('order_no');
  return { success: true, sections: data ?? [] };
}

export async function actionUpdateSections(clubId: string, userId: string, sections: Array<{ section_key: string; visible: boolean; order_no: number; title_override?: string | null }>) {
  const auth = await requireLeader(clubId, userId);
  if (!auth.success) return auth;

  const admin = await createAdminClient();
  for (const section of sections) {
    const { error } = await admin.from('club_sections').update({
      visible: section.visible,
      order_no: section.order_no,
      title_override: section.title_override ?? null,
    }).eq('club_id', clubId).eq('section_key', section.section_key);
    if (error) return { success: false, error: error.message };
  }
  return { success: true };
}

// ── Members ──────────────────────────────────────────────────────────────────

export async function actionGetClubMembers(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('club_members').select('*, profiles(name, username, avatar_url)').eq('club_id', clubId);
  return { success: true, members: data ?? [] };
}

export async function actionJoinClub(clubId: string, userId: string) {
  const admin = await createAdminClient();
  const { error } = await admin.from('club_members').insert({ club_id: clubId, user_id: userId });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function actionLeaveClub(clubId: string, userId: string) {
  const admin = await createAdminClient();
  const { error } = await admin.from('club_members').delete().eq('club_id', clubId).eq('user_id', userId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function actionRemoveMember(clubId: string, userId: string, targetUserId: string) {
  const auth = await requireCreator(clubId, userId);
  if (!auth.success) return auth;

  const admin = await createAdminClient();
  await admin.from('club_leaders').delete().eq('club_id', clubId).eq('user_id', targetUserId);
  const { error } = await admin.from('club_members').delete().eq('club_id', clubId).eq('user_id', targetUserId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function actionGetUserClubMembership(clubId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('club_members').select('*').eq('club_id', clubId).eq('user_id', userId).single();
  return { success: true, membership: data ?? null };
}

export async function actionGetUserClubs(userId: string) {
  const supabase = await createClient();

  // Get clubs where user is a member
  const { data: memberClubs } = await supabase.from('club_members').select('*, clubs(*)').eq('user_id', userId);

  // Get clubs where user is a leader
  const { data: leaderClubs } = await supabase.from('club_leaders').select('*, clubs(*)').eq('user_id', userId);

  // Get clubs created by the user
  const { data: createdClubs } = await supabase.from('clubs').select('*').eq('created_by', userId);

  // Merge: use a Map keyed by club_id to deduplicate
  const clubMap = new Map<string, any>();

  (memberClubs ?? []).forEach((m: any) => {
    if (m.clubs) clubMap.set(m.clubs.id, { ...m, clubs: m.clubs });
  });

  (leaderClubs ?? []).forEach((l: any) => {
    if (l.clubs && !clubMap.has(l.clubs.id)) {
      clubMap.set(l.clubs.id, { ...l, clubs: l.clubs });
    }
  });

  // For created clubs not already captured, add synthetic membership entries
  (createdClubs ?? []).forEach((club: any) => {
    if (!clubMap.has(club.id)) {
      clubMap.set(club.id, { club_id: club.id, user_id: userId, joined_at: null, clubs: club });
    }
  });

  return { success: true, memberships: Array.from(clubMap.values()) };
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function actionGetClubProjects(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('club_projects').select('*, profiles(name, username, avatar_url)').eq('club_id', clubId).order('created_at', { ascending: false });
  return { success: true, projects: data ?? [] };
}

export async function actionCreateProject(clubId: string, userId: string, data: {
  title: string;
  description?: string;
  cover_image_url?: string;
  tags?: string[];
  links?: ClubProjectLink[];
  contributors?: string[];
}) {
  const auth = await requireMember(clubId, userId);
  if (!auth.success) return auth;

  const supabase = await createClient();
  const { error } = await supabase.from('club_projects').insert({
    club_id: clubId,
    created_by: userId,
    title: data.title,
    description: data.description ?? null,
    cover_image_url: data.cover_image_url ?? null,
    tags: data.tags ?? [],
    links: (data.links ?? []) as unknown as Json,
    contributors: data.contributors ?? [],
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function actionUpdateProject(projectId: string, userId: string, data: {
  title?: string;
  description?: string | null;
  cover_image_url?: string | null;
  tags?: string[];
  links?: ClubProjectLink[];
  contributors?: string[];
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('club_projects').update({
    ...data,
    links: data.links as unknown as Json,
  }).eq('id', projectId).eq('created_by', userId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function actionDeleteProject(projectId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('club_projects').delete().eq('id', projectId).eq('created_by', userId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Announcements ────────────────────────────────────────────────────────────

export async function actionGetClubAnnouncements(clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('club_announcements').select('*, profiles(name, username, avatar_url)').eq('club_id', clubId).order('created_at', { ascending: false });
  return { success: true, announcements: data ?? [] };
}

export async function actionCreateAnnouncement(clubId: string, userId: string, data: { title: string; content: string }) {
  const auth = await requireLeader(clubId, userId);
  if (!auth.success) return auth;

  const supabase = await createClient();
  const { error } = await supabase.from('club_announcements').insert({
    club_id: clubId,
    created_by: userId,
    title: data.title,
    content: data.content,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function actionDeleteAnnouncement(announcementId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('club_announcements').delete().eq('id', announcementId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
