'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TanStack Query Hooks for Lessons
// Query hooks replacing the cachedQuery calls in LessonContext.
// Uses real Supabase queries with mock fallback when DB is empty/unavailable.
// ──────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { createClient } from '@/lib/supabase/client';
import {
  getAllCurriculums,
  getAllSubjects,
  mockTopics,
  getUserEnrollments,
  mockTopicProgress,
  mockExams,
} from '@/lib/mock/database';
import type { Topic } from '@/types';

// ── Query Hooks ──────────────────────────────────────────────────────────────

/** Fetches all curriculums (reference data — rarely changes). */
export function useCurriculums() {
  return useQuery({
    queryKey: queryKeys.curriculums.all,
    queryFn: async () => {
      const supabase = createClient();
      if (!supabase) return getAllCurriculums();

      const { data, error } = await supabase
        .from('curriculums')
        .select('*')
        .order('title');

      if (error || !data || data.length === 0) {
        return getAllCurriculums();
      }

      return data;
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
      if (!supabase) return getAllSubjects();

      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('order_no');

      if (error || !data || data.length === 0) {
        return getAllSubjects();
      }

      return data;
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
      if (!supabase) return [...mockTopics] as unknown as Topic[];

      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('order_no');

      if (error || !data || data.length === 0) {
        return [...mockTopics] as unknown as Topic[];
      }

      return data;
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
      if (!supabase) return getUserEnrollments(userId);

      const { data, error } = await supabase
        .from('user_enrollments')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) {
        return getUserEnrollments(userId);
      }

      return data;
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
      if (!supabase) return mockTopicProgress.filter(p => p.user_id === userId);

      const { data, error } = await supabase
        .from('topic_progress')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) {
        return mockTopicProgress.filter(p => p.user_id === userId);
      }

      return data;
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
      if (!supabase) {
        return mockExams.filter(e => e.subject_id && subjectIds.includes(e.subject_id));
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await (supabase as any)
        .from('exam_timetable')
        .select('*')
        .in('subject_id', subjectIds)
        .gt('date', today)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        return mockExams.filter(e => e.subject_id && subjectIds.includes(e.subject_id));
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: subjectIds.length > 0,
  });
}
