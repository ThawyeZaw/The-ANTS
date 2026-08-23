'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TanStack Query Hooks for Lessons (Hono API / Neon Backend)
// Query hooks replacing Supabase calls with typed API queries.
// ──────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { Topic } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

/** Fetches all curriculums (reference data — rarely changes). */
export function useCurriculums() {
  return useQuery({
    queryKey: queryKeys.curriculums.all,
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/curriculum`);
        if (res.ok) {
          const json = await res.json();
          return json.curriculums ?? [];
        }
      } catch (err) {
        console.error('Error fetching curriculums:', err);
      }
      return [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetches all subjects (reference data — rarely changes). */
export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/curriculum`);
        if (res.ok) {
          const json = await res.json();
          const list: any[] = [];
          if (json.curriculums) {
            for (const c of json.curriculums) {
              if (c.subjects) {
                list.push(...c.subjects);
              }
            }
          }
          return list;
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
      return [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetches all topics (reference data — rarely changes). */
export function useTopics() {
  return useQuery({
    queryKey: queryKeys.topics.all,
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/curriculum`);
        if (res.ok) {
          const json = await res.json();
          const list: Topic[] = [];
          if (json.curriculums) {
            for (const c of json.curriculums) {
              if (c.subjects) {
                for (const s of c.subjects) {
                  if (s.topics) {
                    list.push(...s.topics);
                  }
                }
              }
            }
          }
          return list;
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
      }
      return [] as Topic[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetches the current user's subject enrollments. Enabled only when `userId` is truthy. */
export function useUserEnrollments(userId: string) {
  return useQuery({
    queryKey: queryKeys.enrollments.byUser(userId),
    queryFn: async () => {
      if (!userId) return [];
      try {
        const res = await fetch(`${API_BASE_URL}/api/curriculum/user-curriculums?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const json = await res.json();
          return json.userCurriculums ?? [];
        }
      } catch (err) {
        console.error('Error fetching user enrollments:', err);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

/** Fetches the current user's topic progress. Enabled only when `userId` is truthy. */
export function useTopicProgress(userId: string) {
  return useQuery({
    queryKey: queryKeys.topicProgress.byUser(userId),
    queryFn: async () => {
      if (!userId) return [];
      try {
        const res = await fetch(`${API_BASE_URL}/api/curriculum/progress?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const json = await res.json();
          return json.progress ?? [];
        }
      } catch (err) {
        console.error('Error fetching topic progress:', err);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

/** Fetches exam data for the given subject IDs. Enabled only when `subjectIds` is non-empty. */
export function useSubjectCountdowns(subjectIds: string[]) {
  return useQuery({
    queryKey: queryKeys.countdowns.bySubjects(subjectIds),
    queryFn: async () => {
      if (subjectIds.length === 0) return [];
      try {
        const res = await fetch(`${API_BASE_URL}/api/exams`);
        if (res.ok) {
          const json = await res.json();
          const list: any[] = json.exams || [];
          return list.filter((e) => subjectIds.includes(e.subject_id));
        }
      } catch (err) {
        console.error('Error fetching subject countdowns:', err);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: subjectIds.length > 0,
  });
}
