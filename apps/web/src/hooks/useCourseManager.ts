'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useCourseManager Hook (Hono API / Neon Backend)
// Shared context for Course Manager, Lesson Tracker, and Exam Countdown.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Exam, ExamCountdown, UserExamHistory } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

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

  // ── State ─────────────────────────────────────────────────────────────────
  const [enrollments, setEnrollments] = useState<EnrollmentEntry[]>([]);
  const [examHistory, setExamHistory] = useState<UserExamHistory[]>([]);
  const [allCurriculums, setAllCurriculums] = useState<CurriculumSummary[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [examOverrides, setExamOverrides] = useState<Record<string, any>>({});
  const [countdowns, setCountdowns] = useState<ExamCountdown[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load all data on mount / userId change
  const loadCurriculumData = useCallback(async () => {
    setIsLoaded(false);
    try {
      const [currRes, examsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/curriculum`),
        fetch(`${API_BASE_URL}/api/exams`),
      ]);

      if (currRes.ok) {
        const json = await currRes.json();
        if (json.success && json.curriculums) {
          const curriculumsList: CurriculumSummary[] = [];
          const subjectsList: any[] = [];

          for (const c of json.curriculums) {
            curriculumsList.push({
              id: c.id,
              title: c.title,
              description: c.description ?? null,
              qualification: c.qualification ?? null,
              exam_board: c.exam_board ?? null,
              subject_count: c.subjects?.length ?? 0,
            });

            if (c.subjects) {
              for (const s of c.subjects) {
                subjectsList.push({
                  id: s.id,
                  curriculum_id: c.id,
                  title: s.title,
                  description: s.description ?? null,
                  order_no: s.order_no ?? null,
                  topics: s.topics || [],
                  exams: [],
                });
              }
            }
          }

          setAllCurriculums(curriculumsList);
          setAllSubjects(subjectsList);
        }
      }

      if (examsRes.ok) {
        const json = await examsRes.json();
        if (json.success && json.exams) {
          setAllExams(json.exams);
        }
      }

      if (userId) {
        const [enrRes, cdRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/curriculum/user-curriculums?userId=${encodeURIComponent(userId)}`),
          fetch(`${API_BASE_URL}/api/exams/countdowns?userId=${encodeURIComponent(userId)}`),
        ]);

        if (enrRes.ok) {
          const json = await enrRes.json();
          if (json.success && json.userCurriculums) {
            setEnrollments(
              json.userCurriculums.map((e: any) => ({
                id: e.id,
                user_id: e.user_id,
                curriculum_id: e.curriculum_id,
                subject_id: e.subject_id || '',
                exam_id: e.exam_id || null,
                enrolled_at: e.created_at || new Date().toISOString(),
              }))
            );
          }
        }

        if (cdRes.ok) {
          const json = await cdRes.json();
          if (json.success && json.countdowns) {
            setCountdowns(json.countdowns);
          }
        }
      }
    } catch (err) {
      console.error('Error loading curriculum manager data:', err);
    } finally {
      setIsLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    loadCurriculumData();
  }, [loadCurriculumData]);

  // Exam resolve helper
  const resolveExam = useCallback(
    (examId: string, exam: any): any => {
      const ovr = examOverrides[examId];
      if (!ovr) return exam;
      return {
        ...exam,
        subject: ovr.custom_title ?? exam.subject,
        series: ovr.custom_exam_series ?? exam.series,
        date: ovr.custom_exam_date ?? exam.date,
      };
    },
    [examOverrides]
  );

  // Subjects for a curriculum, enriched with exams
  const getSubjectsForCurriculum = useCallback(
    (curriculumId: string): SubjectSummary[] => {
      return allSubjects
        .filter((s: any) => s.curriculum_id === curriculumId)
        .map((s: any) => ({
          id: s.id,
          curriculum_id: s.curriculum_id,
          title: s.title,
          description: s.description ?? null,
          order_no: s.order_no,
          exams: allExams
            .filter((e: any) => e.subject_id === s.id)
            .map((exam: any) => (userId ? resolveExam(exam.id, exam) : exam)),
        }));
    },
    [allSubjects, allExams, userId, resolveExam]
  );

  const getExamsForCurriculum = useCallback(
    (curriculumId: string) => {
      return allExams.map((exam: any) => (userId ? resolveExam(exam.id, exam) : exam));
    },
    [allExams, userId, resolveExam]
  );

  const enrolledCurriculumIds = useMemo<string[]>(() => {
    if (!userId) return [];
    return [...new Set(enrollments.map((e) => e.curriculum_id))];
  }, [userId, enrollments]);

  const enrollmentsWithDetails = useMemo<EnrollmentWithDetails[]>(() => {
    return enrollments.map((enr) => {
      const curriculum = allCurriculums.find((c: any) => c.id === enr.curriculum_id);
      const subject = allSubjects.find((s: any) => s.id === enr.subject_id);

      let exam: any = null;
      if (enr.exam_id) {
        const rawExam = allExams.find((e: any) => e.id === enr.exam_id);
        if (rawExam) exam = userId ? resolveExam(enr.exam_id, rawExam) : rawExam;
      }

      return {
        ...enr,
        curriculum: curriculum
          ? { ...curriculum, description: curriculum.description ?? null }
          : { id: enr.curriculum_id, title: 'Unknown', description: null, qualification: null, exam_board: null },
        subject: subject
          ? {
              id: subject.id,
              curriculum_id: subject.curriculum_id,
              title: subject.title,
              description: subject.description ?? null,
              order_no: subject.order_no,
              exams: [],
            }
          : {
              id: enr.subject_id,
              curriculum_id: enr.curriculum_id,
              title: 'Unknown',
              description: null,
              order_no: null,
              exams: [],
            },
        exam,
      };
    });
  }, [enrollments, allCurriculums, allSubjects, allExams, userId, resolveExam]);

  const enroll = useCallback(
    async (curriculumId: string, subjectId: string, examId?: string | null) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };

      try {
        const res = await fetch(`${API_BASE_URL}/api/curriculum/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, curriculumId }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.enrollment) {
            setEnrollments((prev) => [
              ...prev,
              {
                id: json.enrollment.id,
                user_id: userId,
                curriculum_id: curriculumId,
                subject_id: subjectId,
                exam_id: examId ?? null,
                enrolled_at: new Date().toISOString(),
              },
            ]);
            return { success: true };
          }
        }
        return { success: false, error: 'Failed to enroll in curriculum' };
      } catch (err: any) {
        return { success: false, error: err.message || 'Enrollment failed' };
      }
    },
    [userId]
  );

  const unenroll = useCallback(
    async (enrollmentId: string) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      return { success: true };
    },
    [userId]
  );

  const updateExamTarget = useCallback(
    async (enrollmentId: string, examId: string | null) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, exam_id: examId } : e))
      );
      return { success: true };
    },
    [userId]
  );

  const overrideExam = useCallback(
    async (
      examId: string,
      data: { custom_title?: string | null; custom_exam_series?: string | null; custom_exam_date?: string | null }
    ) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };
      setExamOverrides((prev) => ({
        ...prev,
        [examId]: { ...prev[examId], ...data },
      }));
      return { success: true };
    },
    [userId]
  );

  const addToHistory = useCallback(
    async (data: {
      curriculum_id: string;
      subject_id: string;
      exam_id?: string | null;
      exam_date: string;
      result?: string | null;
      is_mock?: boolean;
      notes?: string | null;
    }) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };
      const newEntry: UserExamHistory = {
        id: `hist_${Date.now()}`,
        user_id: userId,
        curriculum_id: data.curriculum_id,
        subject_id: data.subject_id,
        exam_id: data.exam_id ?? null,
        exam_date: data.exam_date,
        result: data.result ?? null,
        is_mock: data.is_mock ?? false,
        notes: data.notes ?? null,
        recorded_at: new Date().toISOString(),
      };
      setExamHistory((prev) => [newEntry, ...prev]);
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
