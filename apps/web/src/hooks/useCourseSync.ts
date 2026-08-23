'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useCourseSync hook (Hono API / Neon Backend)
// Provides synced course-resource data for dashboards.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useLessonContext } from '@/context/LessonContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

export interface SyncedCourse {
  curriculumId: string;
  curriculumTitle: string;
  examBoard: string | null;
  subjects: SyncedSubject[];
}

export interface SyncedSubject {
  subjectId: string;
  subjectTitle: string;
  topicCount: number;
  completedTopics: number;
  notes: any[];
  flashcards: any[];
  exams: any[];
  countdowns: any[];
}

export function useCourseSync() {
  const { user } = useAuth();
  const {
    enrolledCurriculums,
    enrolledSubjectIds,
    countdowns: ctxCountdowns,
    refetch,
    isLoading: ctxLoading,
  } = useLessonContext();

  const [syncedCourses, setSyncedCourses] = useState<SyncedCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTriggeredFetch, setHasTriggeredFetch] = useState(false);

  useEffect(() => {
    if (user && !hasTriggeredFetch) {
      refetch();
      setHasTriggeredFetch(true);
    }
  }, [user, hasTriggeredFetch, refetch]);

  useEffect(() => {
    if (!user) {
      setSyncedCourses([]);
      setIsLoading(false);
      return;
    }

    if (ctxLoading) return;

    if (enrolledCurriculums.length === 0) {
      setSyncedCourses([]);
      setIsLoading(false);
      return;
    }

    const fetchResources = async () => {
      try {
        const [notesRes, decksRes, examsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/notes/library`),
          fetch(`${API_BASE_URL}/api/flashcards/decks?userId=${encodeURIComponent(user.id)}`),
          fetch(`${API_BASE_URL}/api/exams`),
        ]);

        const notes = notesRes.ok ? (await notesRes.json()).notes || [] : [];
        const decks = decksRes.ok ? (await decksRes.json()).decks || [] : [];
        const exams = examsRes.ok ? (await examsRes.json()).exams || [] : [];

        const countdownsBySubject = new Map<string, any>();
        for (const cd of ctxCountdowns) {
          if (cd.exam) {
            countdownsBySubject.set(cd.subjectId, cd.exam);
          }
        }

        const result: SyncedCourse[] = enrolledCurriculums.map((curriculum) => ({
          curriculumId: curriculum.id,
          curriculumTitle: curriculum.title,
          examBoard: (curriculum as any).exam_board ?? null,
          subjects: curriculum.subjects.map((subject) => {
            const subjectNotes = notes.filter((n: any) => n.subject_id === subject.id);
            const subjectDecks = decks.filter((d: any) => d.subject_id === subject.id);
            const subjectExams = exams.filter((e: any) => e.subject_id === subject.id);

            const subjectCountdowns: any[] = [];
            const cd = countdownsBySubject.get(subject.id);
            if (cd) {
              subjectCountdowns.push(cd);
            }

            return {
              subjectId: subject.id,
              subjectTitle: subject.title,
              topicCount: subject.topics.length,
              completedTopics: 0,
              notes: subjectNotes,
              flashcards: subjectDecks,
              exams: subjectExams,
              countdowns: subjectCountdowns,
            };
          }),
        }));

        setSyncedCourses(result);
      } catch (err) {
        console.error('useCourseSync: failed to fetch resources', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [user, ctxLoading, enrolledCurriculums, enrolledSubjectIds, ctxCountdowns]);

  return { syncedCourses, isLoading };
}
