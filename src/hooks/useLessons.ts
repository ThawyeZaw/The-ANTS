'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — useLessons Hook (Mock Facade)
// Lesson Tracker feature powered by the unified mock data facade.
// All data flows through src/lib/mock/database.ts — no direct Supabase calls.
// ──────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  mockCurriculums,
  mockSubjects,
  mockTopics,
  mockUserCurriculums,
  mockUserEnrollments,
  mockTopicProgress,
  persistTopicProgress,
} from '@/lib/mock/database';

// ── Local Types ───────────────────────────────────────────────────────────────

export type TopicStatus = 'not_started' | 'in_progress' | 'completed';

export interface TopicProgressRecord {
  id: string;
  user_id: string;
  topic_id: string;
  confidence_level: number;
  status: TopicStatus;
  updated_at: string;
}

export interface TopicItem {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  order_no: number | null;
}

export interface SubjectItem {
  id: string;
  curriculum_id: string;
  title: string;
  description: string | null;
  order_no: number | null;
  topics: TopicItem[];
}

export interface CurriculumItem {
  id: string;
  title: string;
  description: string | null;
  qualification: string | null;
  exam_board: string | null;
  subjects: SubjectItem[];
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useLessons() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);

  // Data is loaded synchronously from the mock facade — always ready.
  const isLoaded = true;

  // ── Enrollments: merge user_curriculums + user_enrollments ──────────────────
  const enrollments = useMemo(() => {
    if (!userId) return [];

    const ucData = mockUserCurriculums.filter(e => e.user_id === userId);
    const ueData = mockUserEnrollments.filter(e => e.user_id === userId);

    const merged: any[] = [...ucData];
    const existingKeys = new Set(ucData.map((e: any) => `${e.curriculum_id}::${e.subject_id}`));
    for (const enrollment of ueData) {
      const key = `${enrollment.curriculum_id}::${enrollment.subject_id}`;
      if (!existingKeys.has(key)) {
        merged.push(enrollment);
      }
    }
    return merged;
  }, [userId, refreshKey]);

  // Derived: enrolled curriculum tree
  const enrolledCurriculums = useMemo<CurriculumItem[]>(() => {
    if (!userId) return [];

    const enrolledCurriculumIds = [...new Set(enrollments.map(e => e.curriculum_id))];

    return enrolledCurriculumIds
      .map((cid): CurriculumItem | null => {
        const curriculum = mockCurriculums.find((c: any) => c.id === cid);
        if (!curriculum) return null;

        const userEnrollments = enrollments.filter((e: any) => e.curriculum_id === cid);
        const enrolledSubjectIds = new Set(userEnrollments.map((e: any) => e.subject_id));

        const subjects: SubjectItem[] = mockSubjects
          .filter((s: any) => s.curriculum_id === cid && enrolledSubjectIds.has(s.id))
          .map((subj: any) => ({
            id: subj.id,
            curriculum_id: subj.curriculum_id,
            title: subj.title,
            description: subj.description,
            order_no: subj.order_no,
            topics: mockTopics
              .filter((t: any) => t.subject_id === subj.id)
              .map((t: any) => ({
                id: t.id,
                subject_id: t.subject_id,
                title: t.title,
                description: t.description,
                order_no: t.order_no,
              })),
          }));

        return {
          id: curriculum.id,
          title: curriculum.title,
          description: curriculum.description,
          qualification: curriculum.qualification,
          exam_board: curriculum.exam_board,
          subjects,
        };
      })
      .filter((c): c is CurriculumItem => c !== null);
  }, [userId, enrollments]);

  const activeCurriculumId = useMemo(() => {
    if (selectedCurriculumId && enrolledCurriculums.find((c) => c.id === selectedCurriculumId)) {
      return selectedCurriculumId;
    }
    return enrolledCurriculums[0]?.id ?? null;
  }, [selectedCurriculumId, enrolledCurriculums]);

  const activeCurriculum = useMemo(
    () => enrolledCurriculums.find((c) => c.id === activeCurriculumId) ?? null,
    [enrolledCurriculums, activeCurriculumId]
  );

  // ── Progress records from mock facade ──────────────────────────────────────
  const progressRecords = useMemo<TopicProgressRecord[]>(() => {
    if (!userId) return [];
    return mockTopicProgress.filter(r => r.user_id === userId) as TopicProgressRecord[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshKey]);

  // Progress helpers
  const getTopicProgress = useCallback(
    (topicId: string): TopicProgressRecord | undefined =>
      progressRecords.find((r) => r.topic_id === topicId),
    [progressRecords]
  );

  const getCurriculumTopicCount = useCallback(
    (curriculum: CurriculumItem | undefined | null): number => {
      if (!curriculum) return 0;
      return curriculum.subjects.reduce((sum, s) => sum + s.topics.length, 0);
    },
    []
  );

  const getCurriculumCompletedCount = useCallback(
    (curriculum: CurriculumItem | undefined | null): number => {
      if (!curriculum) return 0;
      const allTopicIds = curriculum.subjects.flatMap((s) => s.topics.map((t) => t.id));
      return progressRecords.filter(
        (r) => allTopicIds.includes(r.topic_id) && r.status === 'completed'
      ).length;
    },
    [progressRecords]
  );

  const getSubjectCompletedCount = useCallback(
    (subject: SubjectItem): number =>
      subject.topics.filter(
        (t) => progressRecords.find((r) => r.topic_id === t.id)?.status === 'completed'
      ).length,
    [progressRecords]
  );

  // ── Mutations (in-memory mock array updates) ───────────────────────────────

  const VALID_STATUSES: TopicStatus[] = ['not_started', 'in_progress', 'completed'];
  const MIN_CONFIDENCE = 0;
  const MAX_CONFIDENCE = 5;

  const updateConfidence = useCallback(
    (topicId: string, level: number) => {
      if (!userId) return;

      // Validate and clamp confidence level
      const clampedLevel = Math.max(MIN_CONFIDENCE, Math.min(MAX_CONFIDENCE, Math.round(level)));
      if (clampedLevel === 0 && level !== 0) {
        // Invalid level passed — silently ignore
        return;
      }

      const now = new Date().toISOString();

      const existing = mockTopicProgress.find((r) => r.user_id === userId && r.topic_id === topicId);
      if (existing) {
        existing.confidence_level = clampedLevel;
        existing.updated_at = now;
        // Setting any confidence means the user has started studying
        if (existing.status === 'not_started' && clampedLevel > 0) {
          existing.status = 'in_progress';
        }
      } else {
        mockTopicProgress.push({
          id: `tp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user_id: userId,
          topic_id: topicId,
          confidence_level: clampedLevel,
          status: clampedLevel > 0 ? 'in_progress' : 'not_started',
          updated_at: now,
        } as any);
      }
      persistTopicProgress();
      setRefreshKey(k => k + 1);
    },
    [userId]
  );

  const updateStatus = useCallback(
    (topicId: string, status: TopicStatus) => {
      if (!userId) return;

      // Validate status is a known value
      if (!VALID_STATUSES.includes(status)) return;

      const now = new Date().toISOString();

      const existing = mockTopicProgress.find((r) => r.user_id === userId && r.topic_id === topicId);
      if (existing) {
        existing.status = status;
        existing.updated_at = now;
      } else {
        mockTopicProgress.push({
          id: `tp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user_id: userId,
          topic_id: topicId,
          confidence_level: 0,
          status,
          updated_at: now,
        } as any);
      }
      persistTopicProgress();
      setRefreshKey(k => k + 1);
    },
    [userId]
  );

  const subjects = useMemo(
    () => activeCurriculum?.subjects ?? [],
    [activeCurriculum]
  );

  return {
    enrolledCurriculums,
    activeCurriculumId,
    activeCurriculum,
    subjects,
    progressRecords,
    isLoaded,
    getTopicProgress,
    getCurriculumTopicCount,
    getCurriculumCompletedCount,
    getSubjectCompletedCount,
    setSelectedCurriculumId,
    updateConfidence,
    updateStatus,
  };
}
