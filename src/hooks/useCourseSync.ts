'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — useCourseSync hook
// Provides synced course-resource data for dashboards. When a user enrolls in
// courses, this hook fetches all related resources (notes, flashcards, exams)
// grouped by curriculum and subject for prominent dashboard display.
// ──────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  getUserEnrollments,
  getNotesByEnrolledCourses,
  getDecksByEnrolledCourses,
  getExamsByEnrolledCourses,
  getUserCountdowns,
  getAllCurriculums,
  getAllSubjects,
  getTopicsBySubject,
} from '@/lib/mock/database';

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

  const syncedCourses = useMemo<SyncedCourse[]>(() => {
    if (!user) return [];

    const enrollments = getUserEnrollments(user.id);
    if (enrollments.length === 0) return [];

    const curriculums = getAllCurriculums();
    const subjects = getAllSubjects();
    const enrolledNotes = getNotesByEnrolledCourses(user.id);
    const enrolledDecks = getDecksByEnrolledCourses(user.id);
    const enrolledExams = getExamsByEnrolledCourses(user.id);
    const userCountdowns = getUserCountdowns(user.id);

    // Group enrollments by curriculum
    const curriculumMap = new Map<string, typeof enrollments>();
    for (const enr of enrollments) {
      if (!curriculumMap.has(enr.curriculum_id)) {
        curriculumMap.set(enr.curriculum_id, []);
      }
      curriculumMap.get(enr.curriculum_id)!.push(enr);
    }

    const result: SyncedCourse[] = [];

    for (const [curriculumId, curriculumEnrollments] of curriculumMap) {
      const curriculum = curriculums.find((c: any) => c.id === curriculumId);
      if (!curriculum) continue;

      const syncedSubjects: SyncedSubject[] = [];

      for (const enr of curriculumEnrollments) {
        const subject = subjects.find((s: any) => s.id === enr.subject_id);
        if (!subject) continue;

        const topics = getTopicsBySubject(enr.subject_id);

        // Filter resources by subject/curriculum
        const subjectNotes = enrolledNotes.filter(
          (n: any) => n.subject_id === enr.subject_id || n.curriculum_id === curriculumId
        );
        const subjectDecks = enrolledDecks.filter(
          (d: any) => d.subject_id === enr.subject_id || d.curriculum_id === curriculumId
        );
        const subjectExams = enrolledExams.filter(
          (e: any) => e.subject_id === enr.subject_id || e.curriculum_id === curriculumId
        );
        const subjectCountdowns = userCountdowns.filter(
          (c: any) => {
            const linkedExam = enrolledExams.find((e: any) => e.id === c.exam_id);
            return linkedExam && (linkedExam.subject_id === enr.subject_id || linkedExam.curriculum_id === curriculumId);
          }
        );

        syncedSubjects.push({
          subjectId: enr.subject_id,
          subjectTitle: subject.title,
          topicCount: topics.length,
          completedTopics: 0,
          notes: subjectNotes,
          flashcards: subjectDecks,
          exams: subjectExams,
          countdowns: subjectCountdowns,
        });
      }

      result.push({
        curriculumId,
        curriculumTitle: (curriculum as any).title,
        examBoard: (curriculum as any).exam_board ?? null,
        subjects: syncedSubjects,
      });
    }

    return result;
  }, [user]);

  const hasEnrollments = syncedCourses.length > 0;
  const totalResources = syncedCourses.reduce(
    (acc, c) =>
      acc +
      c.subjects.reduce(
        (sAcc, s) => sAcc + s.notes.length + s.flashcards.length + s.exams.length + s.countdowns.length,
        0
      ),
    0
  );

  return { syncedCourses, hasEnrollments, totalResources, isLoading: false };
}
