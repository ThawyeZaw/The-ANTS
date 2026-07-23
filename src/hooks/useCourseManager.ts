'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useCourseManager Hook (Mock Facade)
// Shared context for Course Manager, Lesson Tracker, and Exam Countdown.
// All data flows through src/lib/mock/database.ts — no direct Supabase calls.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo } from 'react';
import type { Exam, ExamCountdown, UserExamHistory } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  mockCurriculums,
  mockSubjects,
  mockExams,
  mockUserEnrollments,
  mockUserExamOverrides,
  mockUserExamHistory,
  mockExamCountdowns,
  enrollInSubject,
  unenrollFromSubject,
  updateEnrollmentExamTarget,
  createExamCountdown,
  deleteExamCountdown,
  upsertExamOverride,
  persistExamHistory,
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
  syllabus_code?: string | null;
  structure_type?: string | null;
  grading_system?: string | null;
  hierarchy_model?: { level1: string; level2: string; level3: string } | null;
  subject_count?: number;
  library_status?: import('@/types').LibraryStatus;
  share_token?: string | null;
}

export interface SubjectSummary {
  id: string;
  curriculum_id: string;
  title: string;
  description: string | null;
  order_no: number | null;
  exams: Exam[];
}

export interface EnrollmentWithDetails extends EnrollmentEntry {
  subject: SubjectSummary;
  curriculum: CurriculumSummary;
  exam: Exam | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCourseManager() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [refreshKey, setRefreshKey] = useState(0);

  // Data is loaded synchronously from the mock facade — always ready.
  const isLoaded = true;

  // ── Curriculum data ────────────────────────────────────────────────────────

  const allCurriculums = useMemo<CurriculumSummary[]>(() => {
    return mockCurriculums.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      qualification: c.qualification,
      exam_board: c.exam_board,
      syllabus_code: (c as any).syllabus_code ?? null,
      structure_type: (c as any).structure_type ?? null,
      grading_system: (c as any).grading_system ?? null,
      hierarchy_model: ((c as any).hierarchy_model ?? null) as { level1: string; level2: string; level3: string } | null,
      library_status: ((c as any).library_status ?? 'approved') as import('@/types').LibraryStatus,
      share_token: (c as any).share_token ?? null,
      subject_count: (c as any).subject_count ?? undefined,
    }));
  }, []);

  // ── Enrollments ────────────────────────────────────────────────────────────

  const enrollments = useMemo<EnrollmentEntry[]>(() => {
    if (!userId) return [];
    return mockUserEnrollments
      .filter(e => e.user_id === userId)
      .map(e => ({
        ...e,
        exam_id: e.exam_id ?? null,
      })) as EnrollmentEntry[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshKey]);

  // ── Exam overrides ─────────────────────────────────────────────────────────

  const examOverrides = useMemo<Record<string, any>>(() => {
    if (!userId) return {};
    const ovrMap: Record<string, any> = {};
    for (const o of mockUserExamOverrides) {
      if (o.user_id === userId) ovrMap[o.exam_id] = o;
    }
    return ovrMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshKey]);

  // ── Exam history ───────────────────────────────────────────────────────────

  const examHistory = useMemo<UserExamHistory[]>(() => {
    if (!userId) return [];
    return mockUserExamHistory
      .filter(e => e.user_id === userId) as UserExamHistory[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshKey]);

  // ── Countdowns ─────────────────────────────────────────────────────────────

  const countdowns = useMemo<ExamCountdown[]>(() => {
    if (!userId) return [];
    return mockExamCountdowns.filter(c => c.user_id === userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshKey]);

  // ── Exam resolve helper (applies user overrides) ───────────────────────────

  const resolveExam = useCallback((examId: string, exam: any): any => {
    const ovr = examOverrides[examId];
    if (!ovr) return exam;
    return {
      ...exam,
      subject: ovr.custom_title ?? exam.subject,
      series: ovr.custom_exam_series ?? exam.series,
      date: ovr.custom_exam_date ?? exam.date,
    };
  }, [examOverrides]);

  // ── Subjects for a curriculum, enriched with exams ─────────────────────────

  const getSubjectsForCurriculum = useCallback(
    (curriculumId: string): SubjectSummary[] => {
      return mockSubjects
        .filter((s: any) => s.curriculum_id === curriculumId)
        .map((s: any) => ({
          id: s.id,
          curriculum_id: s.curriculum_id,
          title: s.title,
          description: s.description ?? null,
          order_no: s.order_no,
          exams: mockExams
            .map((exam) => (userId ? resolveExam(exam.id, exam) : exam)),
        }));
    },
    [userId, resolveExam]
  );

  const getExamsForCurriculum = useCallback(
    (_curriculumId: string) => {
      return mockExams.map((exam) =>
        userId ? resolveExam(exam.id, exam) : exam
      );
    },
    [userId, resolveExam]
  );

  // ── Enrolled curriculum IDs ───────────────────────────────────────────────

  const enrolledCurriculumIds = useMemo<string[]>(() => {
    if (!userId) return [];
    return [...new Set(enrollments.map(e => e.curriculum_id))];
  }, [userId, enrollments]);

  // ── Enrollments with details ──────────────────────────────────────────────

  const enrollmentsWithDetails = useMemo<EnrollmentWithDetails[]>(() => {
    return enrollments.map(enr => {
      const curriculum = mockCurriculums.find((c: any) => c.id === enr.curriculum_id);
      const subject = mockSubjects.find((s: any) => s.id === enr.subject_id);

      let exam: any = null;
      if (enr.exam_id) {
        const rawExam = mockExams.find((e: any) => e.id === enr.exam_id);
        if (rawExam) exam = userId ? resolveExam(enr.exam_id, rawExam) : rawExam;
      }

      return {
        ...enr,
        curriculum: curriculum
          ? { ...curriculum, description: curriculum.description ?? null }
          : { id: enr.curriculum_id, title: 'Unknown', description: null, qualification: null, exam_board: null },
        subject: subject
          ? { id: subject.id, curriculum_id: (subject as any).curriculum_id, title: subject.title, description: subject.description ?? null, order_no: (subject as any).order_no ?? null, exams: [] }
          : { id: enr.subject_id, curriculum_id: enr.curriculum_id, title: 'Unknown', description: null, order_no: null, exams: [] },
        exam,
      };
    });
  }, [enrollments, userId, resolveExam]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createCountdownIfNeeded = useCallback(
    (targetUserId: string, examId: string) => {
      const exam = mockExams.find((e: any) => e.id === examId);
      if (!exam) return;
      createExamCountdown({
        user_id: targetUserId,
        exam_id: examId,
        custom_title: (exam as any).subject ?? null,
        target_date: (exam as any).date ?? new Date().toISOString(),
        priority_indicator: 'medium',
        qualification_group: (exam as any).series ?? 'Custom',
      });
    },
    []
  );

  const enroll = useCallback(
    async (curriculumId: string, subjectId: string, examId?: string | null) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };

      const result = enrollInSubject({
        user_id: userId,
        curriculum_id: curriculumId,
        subject_id: subjectId,
        exam_id: examId ?? null,
      });

      if (!result.success) return result;

      if (examId) createCountdownIfNeeded(userId, examId);
      setRefreshKey(k => k + 1);
      return { success: true };
    },
    [userId, createCountdownIfNeeded]
  );

  const unenroll = useCallback(
    async (enrollmentId: string) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };

      const enrollment = mockUserEnrollments.find(e => e.id === enrollmentId && e.user_id === userId);

      if (enrollment?.exam_id) {
        const exam = mockExams.find((e: any) => e.id === enrollment.exam_id);
        const targetDate = exam ? (exam as any).date : null;
        if (targetDate && new Date(targetDate) > new Date()) {
          // Future exam — remove related countdown
          const relatedCountdown = mockExamCountdowns.find(
            c => c.exam_id === enrollment.exam_id && c.user_id === userId
          );
          if (relatedCountdown) deleteExamCountdown(relatedCountdown.id);
        } else if (targetDate && new Date(targetDate) <= new Date()) {
          // Past exam — record in history
          mockUserExamHistory.push({
            id: `eh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            user_id: userId,
            curriculum_id: enrollment.curriculum_id,
            subject_id: enrollment.subject_id,
            exam_id: enrollment.exam_id,
            exam_date: targetDate,
            result: null,
            is_mock: false,
            notes: null,
            recorded_at: new Date().toISOString(),
          });
          persistExamHistory();
        }
      }

      unenrollFromSubject(enrollmentId);
      setRefreshKey(k => k + 1);
      return { success: true };
    },
    [userId]
  );

  const updateExamTarget = useCallback(
    async (enrollmentId: string, examId: string | null) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };

      const enrollment = mockUserEnrollments.find(e => e.id === enrollmentId && e.user_id === userId);

      if (enrollment?.exam_id) {
        const relatedCountdown = mockExamCountdowns.find(
          c => c.exam_id === enrollment.exam_id && c.user_id === userId
        );
        if (relatedCountdown) deleteExamCountdown(relatedCountdown.id);
      }

      const result = updateEnrollmentExamTarget(enrollmentId, examId);
      if (!result.success) return result;

      if (examId) createCountdownIfNeeded(userId, examId);
      setRefreshKey(k => k + 1);
      return { success: true };
    },
    [userId, createCountdownIfNeeded]
  );

  const overrideExam = useCallback(
    async (examId: string, data: { custom_title?: string | null; custom_exam_series?: string | null; custom_exam_date?: string | null }) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };
      upsertExamOverride({
        user_id: userId,
        exam_id: examId,
        ...data,
      });
      setRefreshKey(k => k + 1);
      return { success: true };
    },
    [userId]
  );

  const addToHistory = useCallback(
    async (data: { curriculum_id: string; subject_id: string; exam_id?: string | null; exam_date: string; result?: string | null; is_mock?: boolean; notes?: string | null }) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };
      mockUserExamHistory.push({
        id: `eh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        user_id: userId,
        curriculum_id: data.curriculum_id,
        subject_id: data.subject_id,
        exam_id: data.exam_id ?? null,
        exam_date: data.exam_date,
        result: data.result ?? null,
        is_mock: data.is_mock ?? false,
        notes: data.notes ?? null,
        recorded_at: new Date().toISOString(),
      });
      persistExamHistory();
      setRefreshKey(k => k + 1);
      return { success: true };
    },
    [userId]
  );

  return {
    allCurriculums,
    getSubjectsForCurriculum,
    getExamsForCurriculum,
    enrollments: enrollmentsWithDetails,
    enrolledCurriculumIds,
    isLoading: !isLoaded,
    enroll,
    unenroll,
    updateExamTarget,
    overrideExam,
    examHistory,
    addToHistory,
  };
}
