'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useCourseManager Hook
// Shared context for Course Manager, Lesson Tracker, and Exam Countdown features.
// Owns enrollment state, exam sync, and curriculum browsing.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Exam, ExamCountdown, UserExamHistory } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  getUserEnrollments,
  enrollInSubject,
  unenrollFromSubject,
  updateEnrollmentExamTarget,
  getEnrolledCurriculumIds,
  getPublishedCurriculums,
  getPublicSubjects,
  getExamsByCurriculum,
  getExam,
  resolveExam,
  upsertExamOverride,
  getUserExamHistory,
  recordExamHistory,
  createExamCountdown,
  deleteExamCountdown,
  getUserCountdowns,
  getSubjectsByCurriculum,
} from '@/lib/mock/database';

// ── Local Types ───────────────────────────────────────────────────────────────

export interface EnrollmentEntry {
  id: string;
  user_id: string;
  curriculum_id: string;
  subject_id: string;
  exam_id: string | null;
  enrolled_at: string;
}

export interface CurriculumSummary {
  id: string;
  title: string;
  description: string | null;
  qualification: string | null;
  exam_board: string | null;
  // ── Library System additions ──
  /** Subject syllabus code, e.g. "0620", "4MA1" */
  syllabus_code?: string | null;
  /** Structural model: linear, modular, credit_based, proficiency */
  structure_type?: string | null;
  /** Grading system used by this curriculum */
  grading_system?: string | null;
  /** 3-level hierarchy labels (level1 = Subject, level2 = Paper/Unit, level3 = Topic) */
  hierarchy_model?: { level1: string; level2: string; level3: string } | null;
  /** Number of subjects in this curriculum */
  subject_count?: number;
  /** Library pipeline status */
  library_status?: import('@/types').LibraryStatus;
  /** Share token for link-sharing */
  share_token?: string | null;
}

export interface SubjectSummary {
  id: string;
  curriculum_id: string;
  title: string;
  description: string | null;
  order_no: number | null;
  /** Exams available for this subject (resolved with user overrides) */
  exams: Exam[];
}

export interface EnrollmentWithDetails extends EnrollmentEntry {
  subject: SubjectSummary;
  curriculum: CurriculumSummary;
  /** Resolved exam data (null if no exam target) */
  exam: Exam | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCourseManager() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // ── State ─────────────────────────────────────────────────────────────────

  const [enrollments, setEnrollments] = useState<EnrollmentEntry[]>(() =>
    userId ? [...getUserEnrollments(userId)] : []
  );

  const [examHistory, setExamHistory] = useState<UserExamHistory[]>(() =>
    userId ? getUserExamHistory(userId) : []
  );

  // Refresh enrollments when userId changes
  useEffect(() => {
    if (userId) {
      setEnrollments([...getUserEnrollments(userId)]);
      setExamHistory(getUserExamHistory(userId));
    } else {
      setEnrollments([]);
      setExamHistory([]);
    }
  }, [userId]);

  // ── Curriculum library ────────────────────────────────────────────────────

  const allCurriculums = useMemo<CurriculumSummary[]>(() => {
    return getPublishedCurriculums().map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      qualification: c.qualification,
      exam_board: c.exam_board,
      // Library System additions — safely access optional fields
      syllabus_code: (c as Record<string, unknown>).syllabus_code as string | null ?? null,
      structure_type: (c as Record<string, unknown>).structure_type as string | null ?? null,
      grading_system: (c as Record<string, unknown>).grading_system as string | null ?? null,
      hierarchy_model: (c as Record<string, unknown>).hierarchy_model as { level1: string; level2: string; level3: string } | null ?? null,
      library_status: ((c as Record<string, unknown>).library_status ?? 'approved') as import('@/types').LibraryStatus,
      share_token: (c as Record<string, unknown>).share_token as string | null ?? null,
    }));
  }, []);


  /** Get subjects for a curriculum, enriched with exams */
  const getSubjectsForCurriculum = useCallback(
    (curriculumId: string): SubjectSummary[] => {
      const subjects = getPublicSubjects(curriculumId);
      return subjects.map(s => ({
        id: s.id,
        curriculum_id: s.curriculum_id,
        title: s.title,
        description: s.description ?? null,
        order_no: s.order_no,
        exams: getExamsByCurriculum(curriculumId, s.id).map(exam =>
          userId ? (resolveExam(userId, exam.id) ?? exam) : exam
        ),
      }));
    },
    [userId]
  );

  /** Get exams for a specific subject (for legacy backwards compatibility) */
  const getExamsForCurriculum = useCallback(
    (curriculumId: string) => {
      return getExamsByCurriculum(curriculumId).map(exam =>
        userId ? (resolveExam(userId, exam.id) ?? exam) : exam
      );
    },
    [userId]
  );

  // ── Enrolled curriculum IDs ───────────────────────────────────────────────

  const enrolledCurriculumIds = useMemo<string[]>(() => {
    if (!userId) return [];
    return getEnrolledCurriculumIds(userId);
  }, [userId, enrollments]);

  // ── Enrollments with details ──────────────────────────────────────────────

  const enrollmentsWithDetails = useMemo<EnrollmentWithDetails[]>(() => {
    const allPubCurriculums = getPublishedCurriculums();
    return enrollments.map(enr => {
      const curriculum = allPubCurriculums.find(c => c.id === enr.curriculum_id);
      const subjects = getSubjectsByCurriculum(enr.curriculum_id);
      const subject = subjects.find(s => s.id === enr.subject_id);

      let exam: Exam | null = null;
      if (enr.exam_id && userId) {
        exam = resolveExam(userId, enr.exam_id);
      }

      return {
        ...enr,
        curriculum: curriculum
          ? { id: curriculum.id, title: curriculum.title, description: curriculum.description, qualification: curriculum.qualification, exam_board: curriculum.exam_board }
          : { id: enr.curriculum_id, title: 'Unknown', description: null, qualification: null, exam_board: null },
        subject: subject
          ? { id: subject.id, curriculum_id: subject.curriculum_id, title: subject.title, description: subject.description ?? null, order_no: subject.order_no, exams: [] }
          : { id: enr.subject_id, curriculum_id: enr.curriculum_id, title: 'Unknown', description: null, order_no: null, exams: [] },
        exam,
      };
    });
  }, [enrollments, userId]);

  // ── Mutations: Enroll / Unenroll ──────────────────────────────────────────

  /** Enrol a user in a subject, and auto-create exam countdown if exam target set */
  const enroll = useCallback(
    (curriculumId: string, subjectId: string, examId?: string | null) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };

      const result = enrollInSubject({
        user_id: userId,
        curriculum_id: curriculumId,
        subject_id: subjectId,
        exam_id: examId ?? null,
      });

      if (result.success && examId && userId) {
        // Auto-create countdown
        const exam = getExam(examId);
        if (exam) {
          createExamCountdown({
            user_id: userId,
            exam_id: examId,
            custom_title: exam.title,
            target_date: exam.exam_date,
            priority_indicator: 'medium',
            qualification_group: exam.exam_series ?? 'Custom',
          });
        }
      }

      setEnrollments([...mockRefetchEnrollments(userId)]);
      return result;
    },
    [userId]
  );

  /** Unenrol (remove enrollment + corresponding countdown) */
  const unenroll = useCallback(
    (enrollmentId: string) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };

      const enrollment = enrollments.find(e => e.id === enrollmentId);
      const result = unenrollFromSubject(enrollmentId);

      if (result.success && enrollment?.exam_id) {
        // Remove the corresponding countdown (only future exams)
        const countdowns = getUserCountdowns(userId);
        const targetDate = getExam(enrollment.exam_id)?.exam_date;
        if (targetDate && new Date(targetDate) > new Date()) {
          // Only remove countdowns that are in the future
          const relatedCountdown = countdowns.find(
            c => c.exam_id === enrollment.exam_id
          );
          if (relatedCountdown) {
            deleteExamCountdown(relatedCountdown.id);
          }
        } else if (targetDate && new Date(targetDate) <= new Date()) {
          // Exam already passed — record in history instead
          recordExamHistory({
            user_id: userId,
            curriculum_id: enrollment.curriculum_id,
            subject_id: enrollment.subject_id,
            exam_id: enrollment.exam_id,
            exam_date: targetDate,
          });
        }
      }

      setEnrollments([...mockRefetchEnrollments(userId)]);
      if (userId) setExamHistory(getUserExamHistory(userId));
      return result;
    },
    [userId, enrollments]
  );

  /** Update exam target for an enrollment */
  const updateExamTarget = useCallback(
    (enrollmentId: string, examId: string | null) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };

      const enrollment = enrollments.find(e => e.id === enrollmentId);

      // Remove old countdown if it exists
      if (enrollment?.exam_id) {
        const countdowns = getUserCountdowns(userId);
        const oldCountdown = countdowns.find(c => c.exam_id === enrollment.exam_id);
        if (oldCountdown) deleteExamCountdown(oldCountdown.id);
      }

      // Update the enrollment
      const result = updateEnrollmentExamTarget(enrollmentId, examId);

      // Create new countdown if exam target set
      if (result.success && examId) {
        const exam = getExam(examId);
        if (exam) {
          createExamCountdown({
            user_id: userId,
            exam_id: examId,
            custom_title: exam.title,
            target_date: exam.exam_date,
            priority_indicator: 'medium',
            qualification_group: exam.exam_series ?? 'Custom',
          });
        }
      }

      setEnrollments([...mockRefetchEnrollments(userId)]);
      return result;
    },
    [userId, enrollments]
  );

  // ── Exam Overrides ────────────────────────────────────────────────────────

  const overrideExam = useCallback(
    (examId: string, data: { custom_title?: string | null; custom_exam_series?: string | null; custom_exam_date?: string | null }) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };
      return upsertExamOverride({
        user_id: userId,
        exam_id: examId,
        ...data,
      });
    },
    [userId]
  );

  // ── Exam History ──────────────────────────────────────────────────────────

  const addToHistory = useCallback(
    (data: { curriculum_id: string; subject_id: string; exam_id?: string | null; exam_date: string; result?: string | null; is_mock?: boolean; notes?: string | null }) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };
      const result = recordExamHistory({ user_id: userId, ...data });
      if (result.success) setExamHistory(getUserExamHistory(userId));
      return result;
    },
    [userId]
  );

  return {
    // Library browsing
    allCurriculums,
    getSubjectsForCurriculum,
    getExamsForCurriculum,

    // Enrollment state
    enrollments: enrollmentsWithDetails,
    enrolledCurriculumIds,
    isLoading: false,

    // Mutations
    enroll,
    unenroll,
    updateExamTarget,

    // Exam overrides
    overrideExam,

    // Exam history
    examHistory,
    addToHistory,
  };
}

// ── Helper: refetch enrollments from mock store ─────────────────────────────

function mockRefetchEnrollments(userId: string) {
  return getUserEnrollments(userId);
}
