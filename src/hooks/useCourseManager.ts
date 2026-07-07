'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useCourseManager Hook (Supabase)
// Shared context for Course Manager, Lesson Tracker, and Exam Countdown.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Exam, ExamCountdown, UserExamHistory } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

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
  const supabase = createClient();
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
  useEffect(() => {
    if (!userId) {
      setEnrollments([]);
      setExamHistory([]);
      setCountdowns([]);
      setIsLoaded(true);
      return;
    }
    (async () => {
      const [
        cRes, sRes, eRes, enrRes, histRes, ovrRes, cdRes,
      ] = await Promise.all([
        supabase.from('curriculums').select('*').order('title'),
        supabase.from('subjects').select('*').order('order_no'),
        supabase.from('exams').select('*'),
        supabase.from('user_enrollments').select('*').eq('user_id', userId),
        supabase.from('user_exam_history').select('*').eq('user_id', userId),
        supabase.from('user_exam_overrides').select('*').eq('user_id', userId),
        supabase.from('exam_countdowns').select('*').eq('user_id', userId),
      ]);

      setAllCurriculums((cRes.data ?? []).map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        qualification: c.qualification,
        exam_board: c.exam_board,
        syllabus_code: c.syllabus_code ?? null,
        structure_type: c.structure_type ?? null,
        grading_system: c.grading_system ?? null,
        hierarchy_model: (c.hierarchy_model ?? null) as { level1: string; level2: string; level3: string } | null,
        library_status: (c.library_status ?? 'approved') as import('@/types').LibraryStatus,
        share_token: c.share_token ?? null,
        subject_count: c.subject_count ?? undefined,
      })));

      setAllSubjects(sRes.data ?? []);
      setAllExams(eRes.data ?? []);
      setEnrollments((enrRes.data ?? []) as EnrollmentEntry[]);
      setExamHistory((histRes.data ?? []) as UserExamHistory[]);

      const ovrMap: Record<string, any> = {};
      for (const o of (ovrRes.data ?? [])) {
        ovrMap[o.exam_id] = o;
      }
      setExamOverrides(ovrMap);

      setCountdowns((cdRes.data ?? []) as ExamCountdown[]);
      setIsLoaded(true);
    })();
  }, [userId, supabase]);

  // Refetch helper
  const refetchEnrollments = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('user_enrollments').select('*').eq('user_id', userId);
    setEnrollments((data ?? []) as EnrollmentEntry[]);
  }, [userId, supabase]);

  const refetchHistory = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('user_exam_history').select('*').eq('user_id', userId);
    setExamHistory((data ?? []) as UserExamHistory[]);
  }, [userId, supabase]);

  const refetchCountdowns = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('exam_countdowns').select('*').eq('user_id', userId);
    setCountdowns((data ?? []) as ExamCountdown[]);
  }, [userId, supabase]);

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
      return allSubjects
        .filter((s: any) => s.curriculum_id === curriculumId)
        .map((s: any) => ({
          id: s.id,
          curriculum_id: s.curriculum_id,
          title: s.title,
          description: s.description ?? null,
          order_no: s.order_no,
          exams: allExams
            .filter((e: any) => {
              // Match by exam_board or curriculum-specific logic
              return true; // All exams for now — filter by subject/topic match
            })
            .map((exam: any) => (userId ? resolveExam(exam.id, exam) : exam)),
        }));
    },
    [allSubjects, allExams, userId, resolveExam]
  );

  const getExamsForCurriculum = useCallback(
    (curriculumId: string) => {
      return allExams.map((exam: any) =>
        userId ? resolveExam(exam.id, exam) : exam
      );
    },
    [allExams, userId, resolveExam]
  );

  // ── Enrolled curriculum IDs ───────────────────────────────────────────────
  const enrolledCurriculumIds = useMemo<string[]>(() => {
    if (!userId) return [];
    return [...new Set(enrollments.map(e => e.curriculum_id))];
  }, [userId, enrollments]);

  // ── Enrollments with details ──────────────────────────────────────────────
  const enrollmentsWithDetails = useMemo<EnrollmentWithDetails[]>(() => {
    return enrollments.map(enr => {
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
          ? { id: subject.id, curriculum_id: subject.curriculum_id, title: subject.title, description: subject.description ?? null, order_no: subject.order_no, exams: [] }
          : { id: enr.subject_id, curriculum_id: enr.curriculum_id, title: 'Unknown', description: null, order_no: null, exams: [] },
        exam,
      };
    });
  }, [enrollments, allCurriculums, allSubjects, allExams, userId, resolveExam]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createCountdownIfNeeded = useCallback(
    async (userId: string, examId: string) => {
      const exam = allExams.find((e: any) => e.id === examId);
      if (!exam) return;
      await supabase.from('exam_countdowns').insert({
        user_id: userId,
        exam_id: examId,
        custom_title: exam.subject,
        target_date: exam.date,
        priority_indicator: 'medium',
        qualification_group: exam.series ?? 'Custom',
      });
      await refetchCountdowns();
    },
    [allExams, supabase, refetchCountdowns]
  );

  const enroll = useCallback(
    async (curriculumId: string, subjectId: string, examId?: string | null) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };

      const { error } = await supabase.from('user_enrollments').insert({
        user_id: userId,
        curriculum_id: curriculumId,
        subject_id: subjectId,
        exam_id: examId ?? null,
        enrolled_at: new Date().toISOString(),
      });

      if (error) return { success: false, error: error.message };

      if (examId) await createCountdownIfNeeded(userId, examId);
      await refetchEnrollments();
      return { success: true };
    },
    [userId, supabase, createCountdownIfNeeded, refetchEnrollments]
  );

  const unenroll = useCallback(
    async (enrollmentId: string) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };

      const enrollment = enrollments.find(e => e.id === enrollmentId);

      if (enrollment?.exam_id) {
        const exam = allExams.find((e: any) => e.id === enrollment.exam_id);
        const targetDate = exam?.date;
        if (targetDate && new Date(targetDate) > new Date()) {
          // Future exam — remove related countdown
          const relatedCountdown = countdowns.find(c => c.exam_id === enrollment.exam_id);
          if (relatedCountdown) {
            await supabase.from('exam_countdowns').delete().eq('id', relatedCountdown.id);
          }
        } else if (targetDate && new Date(targetDate) <= new Date()) {
          // Past exam — record in history
          await supabase.from('user_exam_history').insert({
            user_id: userId,
            curriculum_id: enrollment.curriculum_id,
            subject_id: enrollment.subject_id,
            exam_id: enrollment.exam_id,
            exam_date: targetDate,
          });
        }
      }

      await supabase.from('user_enrollments').delete().eq('id', enrollmentId);
      await Promise.all([refetchEnrollments(), refetchHistory(), refetchCountdowns()]);
      return { success: true };
    },
    [userId, enrollments, allExams, countdowns, supabase, refetchEnrollments, refetchHistory, refetchCountdowns]
  );

  const updateExamTarget = useCallback(
    async (enrollmentId: string, examId: string | null) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };

      const enrollment = enrollments.find(e => e.id === enrollmentId);

      if (enrollment?.exam_id) {
        const relatedCountdown = countdowns.find(c => c.exam_id === enrollment.exam_id);
        if (relatedCountdown) {
          await supabase.from('exam_countdowns').delete().eq('id', relatedCountdown.id);
        }
      }

      const { error } = await supabase.from('user_enrollments')
        .update({ exam_id: examId })
        .eq('id', enrollmentId)
        .eq('user_id', userId);

      if (error) return { success: false, error: error.message };

      if (examId) await createCountdownIfNeeded(userId, examId);
      await Promise.all([refetchEnrollments(), refetchCountdowns()]);
      return { success: true };
    },
    [userId, enrollments, countdowns, supabase, refetchEnrollments, refetchCountdowns, createCountdownIfNeeded]
  );

  const overrideExam = useCallback(
    async (examId: string, data: { custom_title?: string | null; custom_exam_series?: string | null; custom_exam_date?: string | null }) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };
      const { error } = await supabase.from('user_exam_overrides').upsert({
        user_id: userId,
        exam_id: examId,
        ...data,
      });
      // Update local overrides cache
      setExamOverrides(prev => ({
        ...prev,
        [examId]: { ...prev[examId], ...data },
      }));
      return error ? { success: false, error: error.message } : { success: true };
    },
    [userId, supabase]
  );

  const addToHistory = useCallback(
    async (data: { curriculum_id: string; subject_id: string; exam_id?: string | null; exam_date: string; result?: string | null; is_mock?: boolean; notes?: string | null }) => {
      if (!userId) return { success: false, error: 'Not authenticated.' };
      const { error } = await supabase.from('user_exam_history').insert({
        user_id: userId,
        ...data,
      });
      if (!error) await refetchHistory();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [userId, supabase, refetchHistory]
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
