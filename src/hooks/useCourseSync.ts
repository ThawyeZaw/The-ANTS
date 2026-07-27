'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useCourseSync hook
// Provides synced course-resource data for dashboards. Fetches real data from
// Supabase (user_enrollments, notes, decks, exams) via LessonContext and direct
// queries, grouped by curriculum and subject for prominent dashboard display.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useLessonContext } from '@/context/LessonContext';
import { createClient } from '@/lib/supabase/client';

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

  // ── Trigger LessonContext to fetch data on non-lesson routes (e.g. dashboard) ──
  useEffect(() => {
    if (user && !hasTriggeredFetch) {
      refetch();
      setHasTriggeredFetch(true);
    }
  }, [user, hasTriggeredFetch, refetch]);

  // ── Build synced courses from LessonContext + Supabase resource queries ──
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

    const supabase = createClient();
    const subjectIds = enrolledSubjectIds;

    const fetchResources = async () => {
      try {
        const queries: Promise<{ data: any[] | null }>[] = [];

        if (subjectIds.length > 0) {
          queries.push(supabase.from('notes').select('*').in('subject_id', subjectIds));
          queries.push(supabase.from('decks').select('*').in('subject_id', subjectIds));
          queries.push(supabase.from('exams').select('*').in('subject_id', subjectIds));
        }

        const [notesRes, decksRes, examsRes] = subjectIds.length > 0
          ? await Promise.all(queries)
          : [{ data: [] }, { data: [] }, { data: [] }];

        const notes = (notesRes?.data ?? []) as any[];
        const decks = (decksRes?.data ?? []) as any[];
        const exams = (examsRes?.data ?? []) as any[];

        // Map countdowns from LessonContext (SubjectCountdown[] -> { subjectId, exam })
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
            const subjectNotes = notes.filter(
              (n: any) => n.subject_id === subject.id
            );
            const subjectDecks = decks.filter(
              (d: any) => d.subject_id === subject.id
            );
            const subjectExams = exams.filter(
              (e: any) => e.subject_id === subject.id
            );

            // Build countdowns array for this subject
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
  }, [user, enrolledCurriculums, enrolledSubjectIds, ctxCountdowns, ctxLoading]);

  const hasEnrollments = syncedCourses.length > 0;
  const totalResources = syncedCourses.reduce(
    (acc, c) =>
      acc +
      c.subjects.reduce(
        (sAcc, s) =>
          sAcc + s.notes.length + s.flashcards.length + s.exams.length + s.countdowns.length,
        0
      ),
    0
  );

  return { syncedCourses, hasEnrollments, totalResources, isLoading };
}
