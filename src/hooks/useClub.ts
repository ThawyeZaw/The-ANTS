'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Club Showcase Hook
// Client-side hook wrapping club server actions with reactive state.
// ──────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState, useEffect } from 'react';
import type { Club, ClubSection, ClubProject, ClubAnnouncement, ClubField, ClubProjectLink } from '@/types';
import {
  actionGetAllClubs,
  actionGetClub,
  actionGetClubBySlug,
  actionCreateClub,
  actionUpdateClub,
  actionDeleteClub,
  actionGetClubLeaders,
  actionGetClubsBatchData,
  actionAddLeader,
  actionRemoveLeader,
  actionGetClubSections,
  actionUpdateSections,
  actionGetClubMembers,
  actionJoinClub,
  actionLeaveClub,
  actionRemoveMember,
  actionGetUserClubMembership,
  actionGetUserClubs,
  actionGetClubProjects,
  actionCreateProject,
  actionUpdateProject,
  actionDeleteProject,
  actionGetClubAnnouncements,
  actionCreateAnnouncement,
  actionDeleteAnnouncement,
} from '@/actions/clubs';

type Result = { success: boolean; error?: string; data?: any };

export function useClub() {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  // ── Clubs ──

  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    (async () => {
      const res = await actionGetAllClubs();
      if (res.success) setClubs(res.clubs as unknown as Club[]);
    })();
  }, [version]);

  const getClub = useCallback(async (clubId: string): Promise<Club | null> => {
    const res = await actionGetClub(clubId);
    return res.success ? (res.club as unknown as Club) : null;
  }, []);

  const getClubBySlug = useCallback(async (slug: string): Promise<Club | null> => {
    const res = await actionGetClubBySlug(slug);
    return res.success ? (res.club as unknown as Club) : null;
  }, []);

  const createNewClub = useCallback(async (data: {
    name: string; description?: string; tagline?: string;
    field: ClubField; cover_image_url?: string; accent_color?: string; custom_slug?: string;
  }, userId: string): Promise<Result & { club?: Club }> => {
    const res = await actionCreateClub(userId, data);
    if (res.success) refresh();
    return res as unknown as Result & { club?: Club };
  }, [refresh]);

  const updateClub = useCallback(async (clubId: string, userId: string, updates: Parameters<typeof actionUpdateClub>[2]): Promise<Result> => {
    const res = await actionUpdateClub(clubId, userId, updates);
    if (res.success) refresh();
    return res.success ? { success: true, data: (res as any).data } : res;
  }, [refresh]);

  const deleteClub = useCallback(async (clubId: string, userId: string): Promise<Result> => {
    const res = await actionDeleteClub(clubId, userId);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  // ── Leaders ──

  const getClubLeaders = useCallback(async (clubId: string) => {
    const res = await actionGetClubLeaders(clubId);
    return res.success ? res.leaders : [];
  }, []);

  const getClubsBatchData = useCallback(async (clubIds: string[], userId?: string) => {
    return await actionGetClubsBatchData(clubIds, userId);
  }, []);

  const addLeader = useCallback(async (clubId: string, userId: string, targetUserId: string): Promise<Result> => {
    const res = await actionAddLeader(clubId, userId, targetUserId);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  const removeLeader = useCallback(async (clubId: string, userId: string, targetUserId: string): Promise<Result> => {
    const res = await actionRemoveLeader(clubId, userId, targetUserId);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  // ── Sections ──

  const getClubSections = useCallback(async (clubId: string): Promise<ClubSection[]> => {
    const res = await actionGetClubSections(clubId);
    return res.success ? (res.sections as unknown as ClubSection[]) : [];
  }, []);

  const updateSections = useCallback(async (clubId: string, userId: string, sections: Parameters<typeof actionUpdateSections>[2]): Promise<Result> => {
    const res = await actionUpdateSections(clubId, userId, sections);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  // ── Members ──

  const getClubMembers = useCallback(async (clubId: string) => {
    const res = await actionGetClubMembers(clubId);
    return res.success ? res.members : [];
  }, []);

  const joinClub = useCallback(async (clubId: string, userId: string): Promise<Result> => {
    const res = await actionJoinClub(clubId, userId);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  const leaveClub = useCallback(async (clubId: string, userId: string): Promise<Result> => {
    const res = await actionLeaveClub(clubId, userId);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  const removeMember = useCallback(async (clubId: string, userId: string, targetUserId: string): Promise<Result> => {
    const res = await actionRemoveMember(clubId, userId, targetUserId);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  const getUserClubMembership = useCallback(async (clubId: string, userId: string) => {
    const res = await actionGetUserClubMembership(clubId, userId);
    return res.success ? res.membership : null;
  }, []);

  const getUserClubs = useCallback(async (userId: string) => {
    const res = await actionGetUserClubs(userId);
    return res.success ? res.memberships : [];
  }, []);

  // ── Projects ──

  const getClubProjects = useCallback(async (clubId: string) => {
    const res = await actionGetClubProjects(clubId);
    return res.success ? res.projects : [];
  }, []);

  const addProject = useCallback(async (clubId: string, userId: string, data: {
    title: string; description?: string; cover_image_url?: string;
    tags?: string[]; links?: ClubProjectLink[]; contributors?: string[];
  }): Promise<Result> => {
    const res = await actionCreateProject(clubId, userId, data);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  const updateProject = useCallback(async (projectId: string, userId: string, data: Parameters<typeof actionUpdateProject>[2]): Promise<Result> => {
    const res = await actionUpdateProject(projectId, userId, data);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  const deleteProject = useCallback(async (projectId: string, userId: string): Promise<Result> => {
    const res = await actionDeleteProject(projectId, userId);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  // ── Announcements ──

  const getClubAnnouncements = useCallback(async (clubId: string) => {
    const res = await actionGetClubAnnouncements(clubId);
    return res.success ? res.announcements : [];
  }, []);

  const postAnnouncement = useCallback(async (clubId: string, userId: string, title: string, content: string): Promise<Result> => {
    const res = await actionCreateAnnouncement(clubId, userId, { title, content });
    if (res.success) refresh();
    return res;
  }, [refresh]);

  const deleteAnnouncement = useCallback(async (announcementId: string, userId: string): Promise<Result> => {
    const res = await actionDeleteAnnouncement(announcementId, userId);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  return {
    // State
    clubs,
    // Clubs
    getClub, getClubBySlug, createNewClub, updateClub, deleteClub,
    // Leaders
    getClubLeaders, getClubsBatchData, addLeader, removeLeader,
    // Sections
    getClubSections, updateSections,
    // Members
    getClubMembers, joinClub, leaveClub, removeMember, getUserClubMembership, getUserClubs,
    // Projects
    getClubProjects, addProject, updateProject, deleteProject,
    // Announcements
    getClubAnnouncements, postAnnouncement, deleteAnnouncement,
  };
}
