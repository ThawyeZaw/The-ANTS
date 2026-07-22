'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useLessons Hook (Supabase)
// Lesson Tracker feature powered by real curriculum & progress data.
// ──────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const supabase = createClient();
  const userId = user?.id ?? null;

  const [allCurriculums, setAllCurriculums] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [progressRecords, setProgressRecords] = useState<TopicProgressRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);

  // Load all data on mount / userId change
  useEffect(() => {
    if (!userId) {
      setProgressRecords([]);
      setEnrollments([]);
      setIsLoaded(true);
      return;
    }

    (async () => {
      const [cRes, sRes, tRes, ucRes, ueRes, pRes] = await Promise.all([
        supabase.from('curriculums').select('*').order('title'),
        supabase.from('subjects').select('*').order('order_no'),
        supabase.from('topics').select('*').order('order_no'),
        supabase.from('user_curriculums').select('*').eq('user_id', userId),
        supabase.from('user_enrollments').select('*').eq('user_id', userId),
        supabase.from('topic_progress').select('*').eq('user_id', userId),
      ]);

      setAllCurriculums(cRes.data ?? []);
      setAllSubjects(sRes.data ?? []);
      setAllTopics(tRes.data ?? []);

      // Merge enrollments from user_curriculums + user_enrollments (sync CourseBrowser ↔ Lesson Tracker)
      const ucData = ucRes.data ?? [];
      const ueData = ueRes.data ?? [];
      const merged: any[] = [...ucData];
      const existingKeys = new Set(ucData.map((e: any) => `${e.curriculum_id}::${e.subject_id}`));
      for (const enrollment of ueData) {
        const key = `${enrollment.curriculum_id}::${enrollment.subject_id}`;
        if (!existingKeys.has(key)) {
          merged.push(enrollment);
        }
      }
      setEnrollments(merged);

      setProgressRecords((pRes.data ?? []) as TopicProgressRecord[]);
      setIsLoaded(true);
    })();
  }, [userId, supabase]);

  // Derived: enrolled curriculum tree
  const enrolledCurriculums = useMemo<CurriculumItem[]>(() => {
    if (!userId) return [];

    const enrolledCurriculumIds = [...new Set(enrollments.map(e => e.curriculum_id))];

    return enrolledCurriculumIds
      .map((cid): CurriculumItem | null => {
        const curriculum = allCurriculums.find((c: any) => c.id === cid);
        if (!curriculum) return null;

        const userEnrollments = enrollments.filter((e: any) => e.curriculum_id === cid);
        const enrolledSubjectIds = new Set(userEnrollments.map((e: any) => e.subject_id));

        const subjects: SubjectItem[] = allSubjects
          .filter((s: any) => s.curriculum_id === cid && enrolledSubjectIds.has(s.id))
          .map((subj: any) => ({
            id: subj.id,
            curriculum_id: subj.curriculum_id,
            title: subj.title,
            description: subj.description,
            order_no: subj.order_no,
            topics: allTopics
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
  }, [userId, allCurriculums, allSubjects, allTopics, enrollments]);

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

  // Progress helpers
  const getTopicProgress = useCallback(
    (topicId: string): TopicProgressRecord | undefined =>
      progressRecords.find((r) => r.topic_id === topicId),
    [progressRecords]
  );

  const getCurriculumTopicCount = useCallback(
    (curriculum: CurriculumItem): number =>
      curriculum.subjects.reduce((sum, s) => sum + s.topics.length, 0),
    []
  );

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

  // Mutations

  const updateConfidence = useCallback(
    async (topicId: string, level: number) => {
      if (!userId) return;
      const now = new Date().toISOString();

      const existing = progressRecords.find((r) => r.topic_id === topicId);
      if (existing) {
        await supabase.from('topic_progress').update({
          confidence_level: level,
          updated_at: now,
        }).eq('id', existing.id).eq('user_id', userId);
        setProgressRecords(prev =>
          prev.map((r) => r.topic_id === topicId ? { ...r, confidence_level: level, updated_at: now } : r)
        );
      } else {
        const { data } = await supabase.from('topic_progress').insert({
          user_id: userId,
          topic_id: topicId,
          confidence_level: level,
          status: 'in_progress',
          updated_at: now,
        }).select().single();
        if (data) {
          setProgressRecords(prev => [...prev, data as TopicProgressRecord]);
        }
      }
    },
    [userId, progressRecords, supabase]
  );

  const updateStatus = useCallback(
    async (topicId: string, status: TopicStatus) => {
      if (!userId) return;
      const now = new Date().toISOString();

      const existing = progressRecords.find((r) => r.topic_id === topicId);
      if (existing) {
        await supabase.from('topic_progress').update({
          status,
          updated_at: now,
        }).eq('id', existing.id).eq('user_id', userId);
        setProgressRecords(prev =>
          prev.map((r) => r.topic_id === topicId ? { ...r, status, updated_at: now } : r)
        );
      } else {
        const { data } = await supabase.from('topic_progress').insert({
          user_id: userId,
          topic_id: topicId,
          confidence_level: 0,
          status,
          updated_at: now,
        }).select().single();
        if (data) {
          setProgressRecords(prev => [...prev, data as TopicProgressRecord]);
        }
      }
    },
    [userId, progressRecords, supabase]
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
    getTopicProgress,
    getCurriculumTopicCount,
    getCurriculumCompletedCount,
    getSubjectCompletedCount,
    setSelectedCurriculumId,
    updateConfidence,
    updateStatus,
  };
}
