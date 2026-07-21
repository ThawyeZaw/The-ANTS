'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { ClubJoinMode, ClubJoinRequest } from '@/types';
import { createClient } from '@/lib/supabase/client';

type Result = { success: boolean; error?: string };

export function useClub() {
  const supabase = createClient()!;
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((current) => current + 1), []);

  const [clubs, setClubs] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cRes, sRes, pRes, clubsRes] = await Promise.all([
        supabase.from('curriculums').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('profiles').select('id, name, username, avatar_url'),
        supabase.from('clubs').select('*'),
      ]);
      if (cancelled) return;
      setCurriculums(cRes.data ?? []);
      setSubjects(sRes.data ?? []);
      setProfiles(pRes.data ?? []);
      setClubs(clubsRes.data ?? []);
    })();
    return () => { cancelled = true; };
  }, [version, supabase]);

  const getClub = useCallback(async (clubId: string) => {
    const { data } = await supabase.from('clubs').select('*').eq('id', clubId).single();
    return data;
  }, [supabase]);

  const getClubMembers = useCallback(async (clubId: string) => {
    const { data } = await supabase.from('club_members').select('*, profiles(*)').eq('club_id', clubId);
    return data ?? [];
  }, [supabase]);

  const getClubMessages = useCallback(async (clubId: string) => {
    const { data } = await supabase.from('club_messages').select('*, profiles(name, username, avatar_url)').eq('club_id', clubId).order('created_at', { ascending: true });
    return data ?? [];
  }, [supabase]);

  const getClubAnnouncements = useCallback(async (clubId: string) => {
    const { data } = await supabase.from('club_announcements').select('*').eq('club_id', clubId).order('created_at', { ascending: false });
    return data ?? [];
  }, [supabase]);

  const getClubLinks = useCallback(async (clubId: string) => {
    const { data } = await supabase.from('club_links').select('*').eq('club_id', clubId);
    return data ?? [];
  }, [supabase]);

  const getClubJoinRequests = useCallback(async (clubId: string): Promise<ClubJoinRequest[]> => {
    const { data } = await supabase.from('club_join_requests').select('*, profiles(name, username, avatar_url)').eq('club_id', clubId);
    return (data as ClubJoinRequest[]) ?? [];
  }, [supabase]);

  const getClubCurriculumLinks = useCallback(async (clubId: string) => {
    const { data } = await supabase.from('club_curriculums').select('*').eq('club_id', clubId);
    return data ?? [];
  }, [supabase]);

  const getClubSubjectLinks = useCallback(async (clubId: string) => {
    const { data } = await supabase.from('club_subjects').select('*').eq('club_id', clubId);
    return data ?? [];
  }, [supabase]);

  const getCurriculum = useCallback(async (curriculumId: string) => {
    const { data } = await supabase.from('curriculums').select('*').eq('id', curriculumId).single();
    return data;
  }, [supabase]);

  const getSubjectsByCurriculum = useCallback(async (curriculumId: string) => {
    const { data } = await supabase.from('subjects').select('*').eq('curriculum_id', curriculumId);
    return data ?? [];
  }, [supabase]);

  const getProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    } catch {
      return null;
    }
  }, [supabase]);

  const getUserClubMembership = useCallback(async (clubId: string, userId: string) => {
    const { data } = await supabase.from('club_members').select('*').eq('club_id', clubId).eq('user_id', userId).single();
    return data;
  }, [supabase]);

  const getUserClubJoinRequest = useCallback(async (clubId: string, userId: string) => {
    const { data } = await supabase.from('club_join_requests').select('*').eq('club_id', clubId).eq('user_id', userId).single();
    return data;
  }, [supabase]);

  // ── Mutations ──

  const createNewClub = useCallback(async (data: {
    name: string; description?: string; created_by: string;
    join_mode: ClubJoinMode; invite_code?: string;
    curriculum_ids?: string[]; subject_ids?: string[];
  }) => {
    const { data: club } = await supabase.from('clubs').insert({
      name: data.name,
      description: data.description ?? null,
      created_by: data.created_by,
      join_mode: data.join_mode,
      invite_code: data.invite_code ?? null,
    }).select().single();
    if (club) {
      // Add creator as admin
      await supabase.from('club_members').insert({ club_id: club.id, user_id: data.created_by, role: 'admin', membership_status: 'active' });
      // Add curriculum links
      if (data.curriculum_ids?.length) {
        const links = data.curriculum_ids.map(cid => ({ club_id: club.id, curriculum_id: cid }));
        await supabase.from('club_curriculums').insert(links);
      }
      if (data.subject_ids?.length) {
        const links = data.subject_ids.map(sid => ({ club_id: club.id, subject_id: sid }));
        await supabase.from('club_subjects').insert(links);
      }
    }
    refresh();
    return club;
  }, [refresh, supabase]);

  const joinClub = useCallback(async (clubId: string, userId: string, inviteCode?: string): Promise<Result> => {
    const { data: club } = await supabase.from('clubs').select('join_mode, invite_code').eq('id', clubId).single();
    if (!club) return { success: false, error: 'Club not found.' };

    if (club.join_mode === 'open') {
      await supabase.from('club_members').upsert({ club_id: clubId, user_id: userId, role: 'member', membership_status: 'active' });
    } else if (club.join_mode === 'invite_link') {
      if (club.invite_code?.toUpperCase() !== (inviteCode ?? '').toUpperCase()) {
        return { success: false, error: 'Invalid invite code.' };
      }
      await supabase.from('club_members').upsert({ club_id: clubId, user_id: userId, role: 'member', membership_status: 'active' });
    } else {
      // request-based
      await supabase.from('club_join_requests').upsert({ club_id: clubId, user_id: userId, status: 'pending' });
    }
    refresh();
    return { success: true };
  }, [refresh, supabase]);

  const leave = useCallback(async (clubId: string, userId: string): Promise<Result> => {
    await supabase.from('club_members').delete().eq('club_id', clubId).eq('user_id', userId);
    refresh();
    return { success: true };
  }, [refresh, supabase]);

  const reviewRequest = useCallback(async (requestId: string, status: 'approved' | 'rejected'): Promise<Result> => {
    const { data: request } = await supabase.from('club_join_requests').select('*').eq('id', requestId).single();
    if (status === 'approved' && request) {
      await supabase.from('club_members').upsert({ club_id: request.club_id, user_id: request.user_id, role: 'member', membership_status: 'active' });
    }
    await supabase.from('club_join_requests').update({ status }).eq('id', requestId);
    refresh();
    return { success: true };
  }, [refresh, supabase]);

  const sendMessage = useCallback(async (clubId: string, userId: string, message: string): Promise<Result> => {
    if (!message.trim()) return { success: false, error: 'Message cannot be empty.' };
    await supabase.from('club_messages').insert({ club_id: clubId, sender_id: userId, message: message.trim() });
    refresh();
    return { success: true };
  }, [refresh, supabase]);

  const postAnnouncement = useCallback(async (clubId: string, userId: string, title: string, content: string): Promise<Result> => {
    if (!title.trim() || !content.trim()) return { success: false, error: 'Title and content required.' };
    const { data: membership } = await supabase.from('club_members').select('role, membership_status').eq('club_id', clubId).eq('user_id', userId).single();
    if (!membership || membership.membership_status !== 'active') return { success: false, error: 'Not an active member.' };
    if (membership.role !== 'admin' && membership.role !== 'moderator') return { success: false, error: 'Only leaders can post announcements.' };
    await supabase.from('club_announcements').insert({ club_id: clubId, created_by: userId, title: title.trim(), content: content.trim() });
    refresh();
    return { success: true };
  }, [refresh, supabase]);

  const shareLink = useCallback(async (clubId: string, userId: string, title: string, url: string): Promise<Result> => {
    if (!title.trim() || !url.trim()) return { success: false, error: 'Title and URL required.' };
    const { data: membership } = await supabase.from('club_members').select('role, membership_status').eq('club_id', clubId).eq('user_id', userId).single();
    if (!membership || membership.membership_status !== 'active') return { success: false, error: 'Not an active member.' };
    if (membership.role !== 'admin' && membership.role !== 'moderator') return { success: false, error: 'Only leaders can share links.' };
    await supabase.from('club_links').insert({ club_id: clubId, shared_by: userId, title: title.trim(), url: url.trim() });
    refresh();
    return { success: true };
  }, [refresh, supabase]);

  const updateClubDetails = useCallback(async (clubId: string, userId: string, updates: { name?: string; description?: string | null; join_mode?: ClubJoinMode; invite_code?: string | null }): Promise<Result> => {
    const { error } = await supabase.from('clubs').update(updates).eq('id', clubId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  const promoteMember = useCallback(async (clubId: string, adminUserId: string, targetUserId: string, newRole: 'admin' | 'moderator'): Promise<Result> => {
    const { error } = await supabase.from('club_members').update({ role: newRole }).eq('club_id', clubId).eq('user_id', targetUserId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  const demoteLeader = useCallback(async (clubId: string, adminUserId: string, targetUserId: string): Promise<Result> => {
    const { error } = await supabase.from('club_members').update({ role: 'member' }).eq('club_id', clubId).eq('user_id', targetUserId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  const updateFeatures = useCallback(async (clubId: string, userId: string, features: import('@/types').ClubFeature[]): Promise<Result> => {
    const { error } = await supabase.from('clubs').update({ features } as any).eq('id', clubId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  // ── Projects & Events ──

  const getClubProjects = useCallback(async (clubId: string) => {
    const { data } = await supabase.from('club_projects').select('*').eq('club_id', clubId);
    return data ?? [];
  }, [supabase]);

  const getClubEvents = useCallback(async (clubId: string) => {
    const { data } = await supabase.from('club_events').select('*').eq('club_id', clubId);
    return data ?? [];
  }, [supabase]);

  const addClubProject = useCallback(async (clubId: string, data: any): Promise<Result> => {
    const { error } = await supabase.from('club_projects').insert({ club_id: clubId, ...data });
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  const addClubEvent = useCallback(async (clubId: string, data: any): Promise<Result> => {
    const { error } = await supabase.from('club_events').insert({ club_id: clubId, ...data });
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  // ── Milestones ──

  const getClubMilestones = useCallback(async (clubId: string) => {
    const { data } = await supabase.from('club_milestones').select('*').eq('club_id', clubId).order('order_no');
    return data ?? [];
  }, [supabase]);

  const addClubMilestone = useCallback(async (clubId: string, userId: string, title: string, description?: string | null, targetDate?: string | null): Promise<Result> => {
    const { error } = await supabase.from('club_milestones').insert({
      club_id: clubId, created_by: userId, title,
      description: description ?? null, target_date: targetDate ?? null, status: 'not_started',
    });
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  const updateClubMilestone = useCallback(async (milestoneId: string, userId: string, updates: any): Promise<Result> => {
    const { error } = await supabase.from('club_milestones').update(updates).eq('id', milestoneId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  const deleteClubMilestone = useCallback(async (milestoneId: string, userId: string): Promise<Result> => {
    const { error } = await supabase.from('club_milestones').delete().eq('id', milestoneId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  // ── Contributions ──

  const getClubContributions = useCallback(async (clubId: string, userId?: string) => {
    let query = supabase.from('club_member_contributions').select('*').eq('club_id', clubId);
    if (userId) query = query.eq('user_id', userId);
    const { data } = await query;
    return data ?? [];
  }, [supabase]);

  const getClubMemberProgress = useCallback(async (clubId: string) => {
    const { data } = await supabase.from('club_projects').select('*').eq('club_id', clubId);
    return data ?? [];
  }, [supabase]);

  const addMemberContribution = useCallback(async (clubId: string, userId: string, targetUserId: string, contributionType: string, title: string, description?: string | null): Promise<Result> => {
    const { error } = await supabase.from('club_member_contributions').insert({
      club_id: clubId, user_id: targetUserId, contribution_type: contributionType,
      title, description: description ?? null,
    });
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  // ── Showcase ──

  const updateClubShowcase = useCallback(async (clubId: string, userId: string, updates: {
    cover_image_url?: string | null; tagline?: string | null;
    custom_domain_slug?: string | null; is_showcase?: boolean;
  }): Promise<Result> => {
    const { error } = await supabase.from('clubs').update(updates).eq('id', clubId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  // ── User Clubs ──

  const getUserClubs = useCallback(async (userId: string) => {
    const { data } = await supabase.from('club_members').select('*, clubs(*)').eq('user_id', userId).eq('membership_status', 'active');
    return (data ?? []).map((m: any) => m.clubs).filter(Boolean);
  }, [supabase]);

  return {
    clubs, curriculums, subjects, profiles,
    allClubCurriculums: curriculums,
    getClub, getClubMembers, getClubMessages, getClubAnnouncements, getClubLinks,
    getClubJoinRequests, getClubCurriculumLinks, getClubSubjectLinks,
    getCurriculum, getSubjectsByCurriculum, getProfile,
    getUserClubMembership, getUserClubJoinRequest,
    createNewClub, joinClub, leave, reviewRequest, sendMessage,
    postAnnouncement, shareLink, updateClubDetails, updateFeatures,
    promoteMember, demoteLeader,
    getClubProjects, getClubEvents, addClubProject, addClubEvent,
    getClubMilestones, addClubMilestone, updateClubMilestone, deleteClubMilestone,
    getClubContributions, getClubMemberProgress, addMemberContribution,
    updateClubShowcase, getUserClubs,
  };
}
