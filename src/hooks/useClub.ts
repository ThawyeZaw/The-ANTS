'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ClubJoinMode,
  ClubJoinRequest,
} from '@/types';
import {
  createClub,
  createClubAnnouncement,
  getAllProfiles,
  getClub,
  getClubAnnouncements,
  getClubCurriculumLinks,
  getClubJoinRequests,
  getClubLinks,
  getClubMembers,
  getClubMessages,
  getClubSubjectLinks,
  getCurriculum,
  getProfile,
  getSubjectsByCurriculum,
  getUserClubJoinRequest,
  getUserClubMembership,
  joinClubByInviteCode,
  joinOpenClub,
  leaveClub,
  mockClubCurriculums,
  mockClubs,
  mockCurriculums,
  mockSubjects,
  mockUpdateClubFeatures,
  requestClubJoin,
  reviewClubJoinRequest,
  sendClubMessage,
  shareClubLink,
  updateClubDetails as dbUpdateClubDetails,
  promoteClubMember,
  demoteClubLeader,
} from '@/lib/mock/database';

type Result = { success: boolean; error?: string };

export function useClub() {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((current) => current + 1), []);

  const clubs = useMemo(() => [...mockClubs], [version]);
  const curriculums = useMemo(() => [...mockCurriculums], [version]);
  const subjects = useMemo(() => [...mockSubjects], [version]);
  const profiles = useMemo(() => getAllProfiles(), [version]);

  const createNewClub = useCallback((data: {
    name: string;
    description?: string;
    created_by: string;
    join_mode: ClubJoinMode;
    invite_code?: string;
    curriculum_ids?: string[];
    subject_ids?: string[];
  }) => {
    const club = createClub(data);
    refresh();
    return club;
  }, [refresh]);

  const joinClub = useCallback((clubId: string, userId: string, inviteCode?: string): Result => {
    const club = getClub(clubId);
    if (!club) return { success: false, error: 'Club not found.' };

    const result = club.join_mode === 'open'
      ? joinOpenClub(clubId, userId)
      : club.join_mode === 'invite_link'
        ? joinClubByInviteCode(clubId, userId, inviteCode || '')
        : requestClubJoin(clubId, userId);

    refresh();
    return result.success ? { success: true } : result;
  }, [refresh]);

  const leave = useCallback((clubId: string, userId: string): Result => {
    const result = leaveClub(clubId, userId);
    refresh();
    return result.success ? { success: true } : result;
  }, [refresh]);

  const reviewRequest = useCallback((requestId: string, status: 'approved' | 'rejected'): Result => {
    const result = reviewClubJoinRequest(requestId, status);
    refresh();
    return result.success ? { success: true } : result;
  }, [refresh]);

  const sendMessage = useCallback((clubId: string, userId: string, message: string): Result => {
    if (!message.trim()) return { success: false, error: 'Message cannot be empty.' };
    sendClubMessage(clubId, userId, message.trim());
    refresh();
    return { success: true };
  }, [refresh]);

  const postAnnouncement = useCallback((clubId: string, userId: string, title: string, content: string): Result => {
    if (!title.trim() || !content.trim()) {
      return { success: false, error: 'Announcement title and content are required.' };
    }
    // Check if user is a leader (admin or moderator)
    const membership = getUserClubMembership(clubId, userId);
    if (!membership || membership.membership_status !== 'active') {
      return { success: false, error: 'You must be an active member to post announcements.' };
    }
    if (membership.role !== 'admin' && membership.role !== 'moderator') {
      return { success: false, error: 'Only club leaders (admins and moderators) can post announcements.' };
    }
    createClubAnnouncement(clubId, userId, title.trim(), content.trim());
    refresh();
    return { success: true };
  }, [refresh]);

  const shareLink = useCallback((clubId: string, userId: string, title: string, url: string): Result => {
    if (!title.trim() || !url.trim()) {
      return { success: false, error: 'Link title and URL are required.' };
    }
    // Check if user is a leader (admin or moderator)
    const membership = getUserClubMembership(clubId, userId);
    if (!membership || membership.membership_status !== 'active') {
      return { success: false, error: 'You must be an active member to share links.' };
    }
    if (membership.role !== 'admin' && membership.role !== 'moderator') {
      return { success: false, error: 'Only club leaders (admins and moderators) can share links.' };
    }
    shareClubLink(clubId, userId, title.trim(), url.trim());
    refresh();
    return { success: true };
  }, [refresh]);

  const updateClubDetails = useCallback((clubId: string, userId: string, updates: {
    name?: string;
    description?: string | null;
    join_mode?: ClubJoinMode;
    invite_code?: string | null;
  }): Result => {
    const result = dbUpdateClubDetails(clubId, userId, updates);
    refresh();
    return result.success ? { success: true } : result;
  }, [refresh]);

  const promoteMember = useCallback((clubId: string, adminUserId: string, targetUserId: string, newRole: 'admin' | 'moderator'): Result => {
    const result = promoteClubMember(clubId, adminUserId, targetUserId, newRole);
    refresh();
    return result.success ? { success: true } : result;
  }, [refresh]);

  const demoteLeader = useCallback((clubId: string, adminUserId: string, targetUserId: string): Result => {
    const result = demoteClubLeader(clubId, adminUserId, targetUserId);
    refresh();
    return result.success ? { success: true } : result;
  }, [refresh]);

  const updateFeatures = useCallback((clubId: string, userId: string, features: import('@/types').ClubFeature[]): Result => {
    const result = mockUpdateClubFeatures(clubId, userId, features);
    refresh();
    return result.success ? { success: true } : result;
  }, [refresh]);

  return {
    clubs,
    curriculums,
    subjects,
    profiles,
    allClubCurriculums: mockClubCurriculums,
    getClub,
    getClubMembers,
    getClubMessages,
    getClubAnnouncements,
    getClubLinks,
    getClubJoinRequests: (clubId: string): ClubJoinRequest[] => getClubJoinRequests(clubId),
    getClubCurriculumLinks,
    getClubSubjectLinks,
    getCurriculum,
    getSubjectsByCurriculum,
    getProfile,
    getUserClubMembership,
    getUserClubJoinRequest,
    createNewClub,
    joinClub,
    leave,
    reviewRequest,
    sendMessage,
    postAnnouncement,
    shareLink,
    updateClubDetails,
    updateFeatures,
    promoteMember,
    demoteLeader,
  };
}
