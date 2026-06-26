'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useLessons Hook
// Owns all stateful logic for the Lesson Tracker feature.
// Reads from and mutates the mock database facade (src/lib/mock/database.ts).
// ──────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from 'react';
import {
  mockCurriculums,
  mockSubjects,
  mockTopicProgress,
  mockUserCurriculums,
  getSubjectsByCurriculum,
  getTopicsBySubject,
} from '@/lib/mock/database';
import { useAuth } from '@/hooks/useAuth';

// ── Local Types ───────────────────────────────────────────────────────────────

export type TopicStatus = 'not_started' | 'in_progress' | 'completed';

export interface TopicProgressRecord {
  id: string;
  user_id: string;
  topic_id: string;
  /** 1 (none) – 5 (mastered) */
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

  // Local mirror of topic progress so React re-renders on mutation.
  // Initialised from the mock array (which holds the seeded data).
  const [progressRecords, setProgressRecords] = useState<TopicProgressRecord[]>(
    () => (mockTopicProgress as TopicProgressRecord[]).filter((r) => r.user_id === userId)
  );

  // Selected curriculum tab
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);

  // ── Derived: enrolled curriculum tree ──────────────────────────────────────

  const enrolledCurriculums = useMemo<CurriculumItem[]>(() => {
    if (!userId) return [];

    const enrolledIds = mockUserCurriculums
      .filter((uc) => uc.user_id === userId)
      .map((uc) => uc.curriculum_id);

    return enrolledIds
      .map((cid): CurriculumItem | null => {
        const curriculum = mockCurriculums.find((c) => c.id === cid);
        if (!curriculum) return null;

        const subjects: SubjectItem[] = getSubjectsByCurriculum(cid).map((subj) => ({
          id: subj.id,
          curriculum_id: subj.curriculum_id,
          title: subj.title,
          description: subj.description,
          order_no: subj.order_no,
          topics: getTopicsBySubject(subj.id).map((t) => ({
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
  }, [userId]);

  // Auto-select the first curriculum when the list loads
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

  // ── Progress helpers ───────────────────────────────────────────────────────

  const getTopicProgress = useCallback(
    (topicId: string): TopicProgressRecord | undefined =>
      progressRecords.find((r) => r.topic_id === topicId),
    [progressRecords]
  );

  /** Total topics across all subjects of a curriculum */
  const getCurriculumTopicCount = useCallback(
    (curriculum: CurriculumItem): number =>
      curriculum.subjects.reduce((sum, s) => sum + s.topics.length, 0),
    []
  );

  /**
   * Topics that have status === 'completed' within a curriculum.
   * Used for the per-curriculum progress percentage.
   */
  const getCurriculumCompletedCount = useCallback(
    (curriculum: CurriculumItem): number => {
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

  // ── Mutations ──────────────────────────────────────────────────────────────

  /**
   * Update (or create) a confidence level entry for a topic.
   * Mutates both the local React state and the shared in-memory mock array
   * so that other components reading from mockTopicProgress see the change
   * within the same browser session.
   */
  const updateConfidence = useCallback(
    (topicId: string, level: number) => {
      if (!userId) return;
      const now = new Date().toISOString();

      setProgressRecords((prev) => {
        const existing = prev.find((r) => r.topic_id === topicId);
        if (existing) {
          // Mutate the shared mock store
          const mockEntry = mockTopicProgress.find(
            (r) => r.topic_id === topicId && r.user_id === userId
          );
          if (mockEntry) {
            (mockEntry as TopicProgressRecord).confidence_level = level;
            (mockEntry as TopicProgressRecord).updated_at = now;
          }
          return prev.map((r) =>
            r.topic_id === topicId ? { ...r, confidence_level: level, updated_at: now } : r
          );
        }

        // Create new record
        const newRecord: TopicProgressRecord = {
          id: `tp-${Date.now()}`,
          user_id: userId,
          topic_id: topicId,
          confidence_level: level,
          status: 'in_progress',
          updated_at: now,
        };
        // Push to shared mock store
        (mockTopicProgress as TopicProgressRecord[]).push(newRecord);
        return [...prev, newRecord];
      });
    },
    [userId]
  );

  /**
   * Update (or create) a status entry for a topic.
   */
  const updateStatus = useCallback(
    (topicId: string, status: TopicStatus) => {
      if (!userId) return;
      const now = new Date().toISOString();

      setProgressRecords((prev) => {
        const existing = prev.find((r) => r.topic_id === topicId);
        if (existing) {
          const mockEntry = mockTopicProgress.find(
            (r) => r.topic_id === topicId && r.user_id === userId
          );
          if (mockEntry) {
            (mockEntry as TopicProgressRecord).status = status;
            (mockEntry as TopicProgressRecord).updated_at = now;
          }
          return prev.map((r) =>
            r.topic_id === topicId ? { ...r, status, updated_at: now } : r
          );
        }

        const newRecord: TopicProgressRecord = {
          id: `tp-${Date.now()}`,
          user_id: userId,
          topic_id: topicId,
          confidence_level: 0,
          status,
          updated_at: now,
        };
        (mockTopicProgress as TopicProgressRecord[]).push(newRecord);
        return [...prev, newRecord];
      });
    },
    [userId]
  );

  // ── Subjects for active curriculum ────────────────────────────────────────

  const subjects = useMemo(
    () => activeCurriculum?.subjects ?? [],
    [activeCurriculum]
  );

  return {
    // State
    enrolledCurriculums,
    activeCurriculumId,
    activeCurriculum,
    subjects,
    progressRecords,

    // Selectors
    getTopicProgress,
    getCurriculumTopicCount,
    getCurriculumCompletedCount,
    getSubjectCompletedCount,

    // Actions
    setSelectedCurriculumId,
    updateConfidence,
    updateStatus,
  };
}
