'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Lesson Context
// Shared context for curriculum, subject, topic, and progress data across tools.
// Lazy-loads: only fetches when navigating to lesson-related routes.
// ──────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from './AuthContext';

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

export interface LessonContextValue {
  enrolledCurriculums: CurriculumItem[];
  activeCurriculumId: string | null;
  setActiveCurriculumId: (id: string | null) => void;
  subjects: SubjectItem[];
  topics: TopicItem[];
  progressRecords: TopicProgressRecord[];
  updateProgress: (
    topicId: string,
    patch: Partial<Pick<TopicProgressRecord, 'confidence_level' | 'status'>>
  ) => Promise<void>;
  refetch: () => Promise<void>;
  isLoading: boolean;
}

const LessonContext = createContext<LessonContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function LessonProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const userId = user?.id ?? null;

  const [allCurriculums, setAllCurriculums] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [progressRecords, setProgressRecords] = useState<TopicProgressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!userId || !supabase) {
      setProgressRecords([]);
      setEnrollments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadedRef.current = true;
    const [cRes, sRes, tRes, eRes, pRes] = await Promise.all([
      supabase.from('curriculums').select('*').order('title'),
      supabase.from('subjects').select('*').order('order_no'),
      supabase.from('topics').select('*').order('order_no'),
      supabase.from('user_enrollments').select('*').eq('user_id', userId),
      supabase.from('topic_progress').select('*').eq('user_id', userId),
    ]);

    setAllCurriculums(cRes.data ?? []);
    setAllSubjects(sRes.data ?? []);
    setAllTopics(tRes.data ?? []);
    setEnrollments(eRes.data ?? []);
    setProgressRecords((pRes.data ?? []) as TopicProgressRecord[]);
    setIsLoading(false);
  }, [userId, supabase]);

  const isLessonPage =
    pathname?.startsWith('/lessons') ||
    pathname?.startsWith('/flashcards') ||
    pathname?.startsWith('/courses') ||
    pathname?.startsWith('/workspace') ||
    pathname?.startsWith('/library') ||
    pathname?.startsWith('/my-notes');

  useEffect(() => {
    if (isLessonPage && userId && !loadedRef.current) {
      fetchData();
    }
  }, [isLessonPage, userId, fetchData]);

  const enrolledCurriculums = useMemo<CurriculumItem[]>(() => {
    if (!userId) return [];

    const enrolledCurriculumIds = [...new Set(enrollments.map((e) => e.curriculum_id))];

    return enrolledCurriculumIds
      .map((cid): CurriculumItem | null => {
        const curriculum = allCurriculums.find((c: any) => c.id === cid);
        if (!curriculum) return null;

        const userEnrollments = enrollments.filter((e: any) => e.curriculum_id === cid);
        const enrolledSubjectIds = new Set(userEnrollments.map((e: any) => e.subject_id));

        const allSubjectsForCurriculum = allSubjects.filter((s: any) => s.curriculum_id === cid);

        const subjects: SubjectItem[] = allSubjectsForCurriculum
          .filter((s: any) => enrolledSubjectIds.has(s.id))
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

  const activeCurriculumIdFromUrl = searchParams.get('curriculum') ?? null;

  const activeCurriculumId =
    activeCurriculumIdFromUrl ?? (enrolledCurriculums.length > 0 ? enrolledCurriculums[0].id : null);

  const setActiveCurriculumId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams);
      if (id) {
        params.set('curriculum', id);
      } else {
        params.delete('curriculum');
      }
      const searchString = params.toString();
      router.replace(searchString ? `${pathname}?${searchString}` : pathname);
    },
    [searchParams, router, pathname]
  );

  const activeCurriculum = useMemo(
    () => enrolledCurriculums.find((c) => c.id === activeCurriculumId) ?? null,
    [enrolledCurriculums, activeCurriculumId]
  );

  const subjects = useMemo(() => activeCurriculum?.subjects ?? [], [activeCurriculum]);
  const topics = useMemo(() => subjects.flatMap((s) => s.topics), [subjects]);

  const updateProgress = useCallback(
    async (
      topicId: string,
      patch: Partial<Pick<TopicProgressRecord, 'confidence_level' | 'status'>>
    ) => {
      if (!userId || !supabase) return;
      const now = new Date().toISOString();

      const existing = progressRecords.find((r) => r.topic_id === topicId);
      if (existing) {
        const { error } = await supabase
          .from('topic_progress')
          .update({ ...patch, updated_at: now })
          .eq('id', existing.id)
          .eq('user_id', userId);
        if (!error) {
          setProgressRecords((prev) =>
            prev.map((r) =>
              r.topic_id === topicId ? { ...r, ...patch, updated_at: now } : r
            )
          );
        }
      } else {
        const { data, error } = await supabase
          .from('topic_progress')
          .insert({
            user_id: userId,
            topic_id: topicId,
            confidence_level: patch.confidence_level ?? 0,
            status: patch.status ?? 'in_progress',
            updated_at: now,
          })
          .select()
          .single();
        if (!error && data) {
          setProgressRecords((prev) => [...prev, data as TopicProgressRecord]);
        }
      }
    },
    [userId, supabase, progressRecords]
  );

  return (
    <LessonContext.Provider
      value={{
        enrolledCurriculums,
        activeCurriculumId,
        setActiveCurriculumId,
        subjects,
        topics,
        progressRecords,
        updateProgress,
        refetch: fetchData,
        isLoading,
      }}
    >
      {children}
    </LessonContext.Provider>
  );
}

export function useLessonContext(): LessonContextValue {
  const context = useContext(LessonContext);
  if (!context) {
    throw new Error('useLessonContext must be used within a LessonProvider');
  }
  return context;
}
