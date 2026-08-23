'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Lesson Context (Hono API / Neon Backend)
// Shared context for curriculum, subject, topic, and progress data across tools.
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
import { useAuthContext } from './AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

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

export interface SubjectCountdown {
  subjectId: string;
  exam: {
    id: string;
    title?: string;
    subject?: string;
    date?: string;
    exam_date?: string;
    series?: string;
    exam_board?: string;
  } | null;
}

export interface LessonContextValue {
  enrolledCurriculums: CurriculumItem[];
  enrolledCurriculumIds: string[];
  enrolledSubjectIds: string[];
  activeCurriculumId: string | null;
  setActiveCurriculumId: (id: string | null) => void;
  selectedCurriculumIds: string[];
  selectedSubjectIds: string[];
  setSelectedCurriculumIds: (ids: string[]) => void;
  setSelectedSubjectIds: (ids: string[]) => void;
  subjects: SubjectItem[];
  topics: TopicItem[];
  progressRecords: TopicProgressRecord[];
  updateProgress: (
    topicId: string,
    patch: Partial<Pick<TopicProgressRecord, 'confidence_level' | 'status'>>
  ) => Promise<void>;
  countdowns: SubjectCountdown[];
  countdownsLoading: boolean;
  refetch: () => Promise<void>;
  isLoading: boolean;
}

const LessonContext = createContext<LessonContextValue | null>(null);

export function LessonProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const userId = user?.id ?? null;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allCurriculums, setAllCurriculums] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [progressRecords, setProgressRecords] = useState<TopicProgressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadedRef = useRef(false);

  const [selectedCurriculumIds, _setSelectedCurriculumIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('cm_curriculums') ?? '[]');
    } catch {
      return [];
    }
  });

  const setSelectedCurriculumIds = (ids: string[]) => {
    localStorage.setItem('cm_curriculums', JSON.stringify(ids));
    _setSelectedCurriculumIds(ids);
  };

  const [selectedSubjectIds, _setSelectedSubjectIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('cm_subjects') ?? '[]');
    } catch {
      return [];
    }
  });

  const setSelectedSubjectIds = (ids: string[]) => {
    localStorage.setItem('cm_subjects', JSON.stringify(ids));
    _setSelectedSubjectIds(ids);
  };

  const [countdowns, setCountdowns] = useState<SubjectCountdown[]>([]);
  const [countdownsLoading, setCountdownsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    loadedRef.current = true;

    try {
      const [cRes, eRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/curriculum`),
        fetch(`${API_BASE_URL}/api/exams`),
      ]);

      if (cRes.ok) {
        const json = await cRes.json();
        const curriculums = json.curriculums || [];
        setAllCurriculums(curriculums);

        const subs: any[] = [];
        const tops: any[] = [];
        for (const c of curriculums) {
          if (c.subjects) {
            for (const s of c.subjects) {
              subs.push(s);
              if (s.topics) {
                tops.push(...s.topics);
              }
            }
          }
        }
        setAllSubjects(subs);
        setAllTopics(tops);
      }

      if (userId) {
        const [enrRes, progRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/curriculum/user-curriculums?userId=${encodeURIComponent(userId)}`),
          fetch(`${API_BASE_URL}/api/curriculum/progress?userId=${encodeURIComponent(userId)}`),
        ]);

        if (enrRes.ok) {
          const json = await enrRes.json();
          setEnrollments(json.userCurriculums || []);
        }

        if (progRes.ok) {
          const json = await progRes.json();
          setProgressRecords(json.progress || []);
        }
      }
    } catch (err) {
      console.error('Error fetching lesson context data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

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
    const enrolledSubIds = new Set(enrollments.map((e) => e.subject_id).filter(Boolean));
    const enrolledCurIds = new Set(enrollments.map((e) => e.curriculum_id).filter(Boolean));

    const topicMap = new Map<string, TopicItem[]>();
    for (const t of allTopics) {
      const list = topicMap.get(t.subject_id) ?? [];
      list.push(t);
      topicMap.set(t.subject_id, list);
    }

    const subjectMap = new Map<string, SubjectItem[]>();
    for (const s of allSubjects) {
      if (enrolledSubIds.size === 0 || enrolledSubIds.has(s.id) || enrolledCurIds.has(s.curriculum_id)) {
        const list = subjectMap.get(s.curriculum_id) ?? [];
        list.push({
          id: s.id,
          curriculum_id: s.curriculum_id,
          title: s.title,
          description: s.description ?? null,
          order_no: s.order_no ?? null,
          topics: topicMap.get(s.id) ?? [],
        });
        subjectMap.set(s.curriculum_id, list);
      }
    }

    return allCurriculums
      .filter((c) => subjectMap.has(c.id) || enrolledCurIds.has(c.id))
      .map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description ?? null,
        qualification: c.qualification ?? null,
        exam_board: c.exam_board ?? null,
        subjects: subjectMap.get(c.id) ?? [],
      }));
  }, [allCurriculums, allSubjects, allTopics, enrollments]);

  const enrolledCurriculumIds = useMemo(
    () => [...new Set(enrollments.map((e) => e.curriculum_id))],
    [enrollments]
  );

  const enrolledSubjectIds = useMemo(
    () => [...new Set(enrollments.map((e) => e.subject_id))],
    [enrollments]
  );

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
      if (!userId) return;
      try {
        await fetch(`${API_BASE_URL}/api/curriculum/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            topicId,
            status: patch.status || 'in_progress',
          }),
        });

        setProgressRecords((prev) => {
          const existing = prev.find((r) => r.topic_id === topicId);
          if (existing) {
            return prev.map((r) =>
              r.topic_id === topicId
                ? { ...r, ...patch, updated_at: new Date().toISOString() }
                : r
            );
          }
          return [
            ...prev,
            {
              id: `tp_${Date.now()}`,
              user_id: userId,
              topic_id: topicId,
              confidence_level: patch.confidence_level ?? 0,
              status: patch.status ?? 'in_progress',
              updated_at: new Date().toISOString(),
            },
          ];
        });
      } catch (err) {
        console.error('Error updating progress:', err);
      }
    },
    [userId]
  );

  return (
    <LessonContext.Provider
      value={{
        enrolledCurriculums,
        enrolledCurriculumIds,
        enrolledSubjectIds,
        activeCurriculumId,
        setActiveCurriculumId,
        selectedCurriculumIds,
        selectedSubjectIds,
        setSelectedCurriculumIds,
        setSelectedSubjectIds,
        subjects,
        topics,
        progressRecords,
        updateProgress,
        countdowns,
        countdownsLoading,
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
