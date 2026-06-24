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
  requestClubJoin,
  reviewClubJoinRequest,
  sendClubMessage,
  shareClubLink,
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
    createClubAnnouncement(clubId, userId, title.trim(), content.trim());
    refresh();
    return { success: true };
  }, [refresh]);

  const shareLink = useCallback((clubId: string, userId: string, title: string, url: string): Result => {
    if (!title.trim() || !url.trim()) {
      return { success: false, error: 'Link title and URL are required.' };
    }
    shareClubLink(clubId, userId, title.trim(), url.trim());
    refresh();
    return { success: true };
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
  };
}
