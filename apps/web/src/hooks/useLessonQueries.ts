'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TanStack Query Hooks for Lessons
// Query hooks replacing the cachedQuery calls in LessonContext.
// Uses real Supabase queries with mock fallback when DB is empty/unavailable.
// ──────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { createClient } from '@/lib/supabase/client';
import type { Topic } from '@/types';

// ── Query Hooks ──────────────────────────────────────────────────────────────

/** Fetches all curriculums (reference data — rarely changes). */
export function useCurriculums() {
  return useQuery({
    queryKey: queryKeys.curriculums.all,
    queryFn: async () => {
      const supabase = createClient();
      if (!supabase) return [];

      const { data } = await supabase
        .from('curriculums')
        .select('*')
        .order('title');

      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetches all subjects (reference data — rarely changes). */
export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: async () => {
      const supabase = createClient();
      if (!supabase) return [];

      const { data } = await supabase
        .from('subjects')
        .select('*')
        .order('order_no');

      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetches all topics (reference data — rarely changes). */
export function useTopics() {
  return useQuery({
    queryKey: queryKeys.topics.all,
    queryFn: async () => {
      const supabase = createClient();
      if (!supabase) return [] as Topic[];

      const { data } = await supabase
        .from('topics')
        .select('*')
        .order('order_no');

      return (data ?? []) as unknown as Topic[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Fetches the current user's subject enrollments. Enabled only when `userId` is truthy. */
export function useUserEnrollments(userId: string) {
  return useQuery({
    queryKey: queryKeys.enrollments.byUser(userId),
    queryFn: async () => {
      const supabase = createClient();
      if (!supabase) return [];

      const { data } = await supabase
        .from('user_enrollments')
        .select('*')
        .eq('user_id', userId);

      return data ?? [];
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
      const supabase = createClient();
      if (!supabase) return [];

      const { data } = await supabase
        .from('topic_progress')
        .select('*')
        .eq('user_id', userId);

      return data ?? [];
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
      const supabase = createClient();
      if (!supabase) return [];

      const today = new Date().toISOString().split('T')[0];

      const { data } = await (supabase as any)
        .from('exams')
        .select('*')
        .in('subject_id', subjectIds)
        .gt('date', today)
        .order('date', { ascending: true });

      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: subjectIds.length > 0,
  });
}
