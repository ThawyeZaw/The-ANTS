'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TanStack Query Hooks for Clubs
// Query + Mutation hooks replacing the legacy useClub version/useEffect pattern.
// ──────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  actionGetAllClubs,
  actionGetClubBySlug,
  actionGetClubsBatchData,
  actionGetClubProjects,
  actionGetClubAnnouncements,
  actionCreateClub,
  actionUpdateClub,
  actionDeleteClub,
  actionJoinClub,
  actionLeaveClub,
  actionCreateProject,
  actionUpdateProject,
  actionDeleteProject,
  actionCreateAnnouncement,
  actionDeleteAnnouncement,
} from '@/actions/clubs';
import type { Club, ClubProject, ClubAnnouncement } from '@/types';

// ── Query Hooks ──────────────────────────────────────────────────────────────

/** Fetches all clubs. */
export function useClubList() {
  return useQuery({
    queryKey: queryKeys.clubs.all,
    queryFn: async () => {
      const res = await actionGetAllClubs();
      return res.clubs as unknown as Club[];
    },
  });
}

/** Fetches a single club by its slug. Enabled only when `slug` is truthy. */
export function useClubDetail(slug: string) {
  return useQuery({
    queryKey: queryKeys.clubs.bySlug(slug),
    queryFn: async () => {
      const res = await actionGetClubBySlug(slug);
      if (!res.success) throw new Error(res.error);
      return res.club as unknown as Club;
    },
    enabled: !!slug,
  });
}

/** Fetches leaders, members, and optional user memberships for a club. */
export function useClubMembers(clubId: string, userId?: string) {
  return useQuery({
    queryKey: queryKeys.clubs.members(clubId),
    queryFn: async () => {
      const res = await actionGetClubsBatchData([clubId], userId);
      return res;
    },
    enabled: !!clubId,
  });
}

/** Fetches projects for a club. */
export function useClubProjects(clubId: string) {
  return useQuery({
    queryKey: queryKeys.clubs.projects(clubId),
    queryFn: async () => {
      const res = await actionGetClubProjects(clubId);
      return res.projects as unknown as ClubProject[];
    },
    enabled: !!clubId,
  });
}

/** Fetches announcements for a club. */
export function useClubAnnouncements(clubId: string) {
  return useQuery({
    queryKey: queryKeys.clubs.announcements(clubId),
    queryFn: async () => {
      const res = await actionGetClubAnnouncements(clubId);
      return res.announcements as unknown as ClubAnnouncement[];
    },
    enabled: !!clubId,
  });
}

// ── Mutation Hooks ───────────────────────────────────────────────────────────

/** Creates a new club. Invalidates the club list cache on success. */
export function useCreateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, userId }: { data: Parameters<typeof actionCreateClub>[1]; userId: string }) => {
      const res = await actionCreateClub(userId, data);
      if (!res.success) throw new Error(res.error);
      return res.club;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
    },
  });
}

/** Updates an existing club. Invalidates the club list and the specific slug cache. */
export function useUpdateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      { clubId, userId, updates, slug }:
      { clubId: string; userId: string; updates: Parameters<typeof actionUpdateClub>[2]; slug: string }
    ) => {
      const res = await actionUpdateClub(clubId, userId, updates);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.bySlug(variables.slug) });
    },
  });
}

/** Deletes a club. Invalidates the club list cache on success. */
export function useDeleteClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, userId }: { clubId: string; userId: string }) => {
      const res = await actionDeleteClub(clubId, userId);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
    },
  });
}

/** Joins a club. Invalidates the members cache for that club. */
export function useJoinClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, userId, inviteCode }: { clubId: string; userId: string; inviteCode?: string }) => {
      const res = await actionJoinClub(clubId, userId, inviteCode);
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.members(variables.clubId) });
    },
  });
}

/** Leaves a club. Invalidates the members cache for that club. */
export function useLeaveClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, userId }: { clubId: string; userId: string }) => {
      const res = await actionLeaveClub(clubId, userId);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.members(variables.clubId) });
    },
  });
}

/** Creates a new project in a club. Invalidates the projects cache. */
export function useAddProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, userId, data }: { clubId: string; userId: string; data: Parameters<typeof actionCreateProject>[2] }) => {
      const res = await actionCreateProject(clubId, userId, data);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.projects(variables.clubId) });
    },
  });
}

/** Updates an existing project. Invalidates the projects cache for the club. */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      { projectId, userId, data, clubId }:
      { projectId: string; userId: string; data: Parameters<typeof actionUpdateProject>[2]; clubId: string }
    ) => {
      const res = await actionUpdateProject(projectId, userId, data);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.projects(variables.clubId) });
    },
  });
}

/** Deletes a project. Invalidates the projects cache for the club. */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId, clubId }: { projectId: string; userId: string; clubId: string }) => {
      const res = await actionDeleteProject(projectId, userId);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.projects(variables.clubId) });
    },
  });
}

/** Creates a new announcement. Invalidates the announcements cache for the club. */
export function usePostAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      { clubId, userId, data }:
      { clubId: string; userId: string; data: Parameters<typeof actionCreateAnnouncement>[2] }
    ) => {
      const res = await actionCreateAnnouncement(clubId, userId, data);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.announcements(variables.clubId) });
    },
  });
}

/** Deletes an announcement. Invalidates the announcements cache for the club. */
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ announcementId, userId, clubId }: { announcementId: string; userId: string; clubId: string }) => {
      const res = await actionDeleteAnnouncement(announcementId, userId);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.announcements(variables.clubId) });
    },
  });
}
