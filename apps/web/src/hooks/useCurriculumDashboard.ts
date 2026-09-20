'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useCurriculumDashboard Hook (Hono API / D1)
// Aggregates exam countdowns filtered by the user's enrolled subjects.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import type { ExamCountdown } from '@/types';
import { listUserEnrollments } from '@/actions/curriculum';
import { listExamCountdownsForUser, listExams, createExamCountdown, deleteExamCountdown } from '@/actions/exam-data';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export interface CountdownWithTime {
  countdown: ExamCountdown;
  examTitle: string;
  examBoard: string | null;
  syllabusCode: string | null;
  subjectName: string;
  timeLeft: TimeLeft;
}

export interface EnrolledSubjectInfo {
  enrollmentId: string;
  subjectId: string;
  subjectTitle: string;
  curriculumId: string;
  curriculumTitle: string;
  examBoard: string | null;
}

function calcTimeLeft(targetDate: string): TimeLeft {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isPast: false };
}

function isWithinDays(targetDate: string, days: number): boolean {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  return target > now && target - now <= days * 24 * 60 * 60 * 1000;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCurriculumDashboard() {
  const { user } = useAuth();
  const { isContributor, isMainContributor } = useRole();
  const canEdit = isContributor || isMainContributor;
  const userId = user?.id ?? null;

  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(Date.now());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubjectInfo[]>([]);
  const [rawCountdowns, setRawCountdowns] = useState<ExamCountdown[]>([]);
  const [availableExams, setAvailableExams] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;

      try {
        const [enrollRows, cdRows, examRows] = await Promise.all([
          listUserEnrollments(userId),
          listExamCountdownsForUser(userId),
          listExams(),
        ]);

        const list: EnrolledSubjectInfo[] = enrollRows.map((item) => ({
          enrollmentId: item.id,
          subjectId: item.subject_id,
          subjectTitle: item.subject?.name || '',
          curriculumId: item.curriculum_id,
          curriculumTitle: item.curriculum?.name || '',
          examBoard: item.curriculum?.code ?? null,
        }));
        setEnrolledSubjects(list);
        setRawCountdowns(cdRows as unknown as ExamCountdown[]);
        setAvailableExams(examRows);
      } catch (err) {
        console.error('Error fetching curriculum dashboard data:', err);
      }
    }

    fetchData();
  }, [userId, refreshKey]);

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSubjectIds((prev) => {
      const enrolledIds = enrolledSubjects.map((s) => s.subjectId);
      if (prev.length === 0) return enrolledIds;
      return prev.filter((id) => enrolledIds.includes(id));
    });
  }, [enrolledSubjects]);

  const toggleSubject = useCallback((subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedSubjectIds(enrolledSubjects.map((s) => s.subjectId));
  }, [enrolledSubjects]);

  const deselectAll = useCallback(() => {
    setSelectedSubjectIds([]);
  }, []);

  const enrichedCountdowns = useMemo<CountdownWithTime[]>(() => {
    return rawCountdowns.map((cd) => {
      const exam = availableExams.find((e) => e.id === cd.exam_id);
      const subject = enrolledSubjects.find((s) => s.subjectId === (exam?.subject_id || (cd as any).subject_id));
      const targetDate = cd.target_date || (cd as any).exam_date || '';

      return {
        countdown: cd,
        examTitle: cd.custom_title || exam?.title || exam?.subject || 'Exam',
        examBoard: (cd as any).exam_board || exam?.exam_board || null,
        syllabusCode: exam?.syllabus_code || null,
        subjectName: subject?.subjectTitle || exam?.subject || 'General',
        timeLeft: calcTimeLeft(targetDate),
      };
    });
  }, [rawCountdowns, availableExams, enrolledSubjects, now]);

  const filteredCountdowns = useMemo(() => {
    if (selectedSubjectIds.length === 0) return [];
    return enrichedCountdowns.filter((cd) => {
      const exam = availableExams.find((e) => e.id === cd.countdown.exam_id);
      const sid = exam?.subject_id || (cd.countdown as any).subject_id;
      return !sid || selectedSubjectIds.includes(sid);
    });
  }, [enrichedCountdowns, selectedSubjectIds, availableExams]);

  const urgentCountdowns = useMemo(() => {
    return filteredCountdowns.filter((cd) => {
      const targetDate = cd.countdown.target_date || (cd.countdown as any).exam_date || '';
      return isWithinDays(targetDate, 14);
    });
  }, [filteredCountdowns]);

  const unselectedSubjects = useMemo(() => {
    return enrolledSubjects.filter((s) => !selectedSubjectIds.includes(s.subjectId));
  }, [enrolledSubjects, selectedSubjectIds]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const addCountdown = useCallback(async (data: {
    exam_id?: string;
    custom_title?: string;
    target_date: string;
    priority_indicator: string;
    qualification_group: string;
  }) => {
    if (!userId) return;
    try {
      await createExamCountdown({
        userId,
        examId: data.exam_id,
        title: data.custom_title || 'Upcoming Exam',
        examDate: data.target_date,
        isCustom: !data.exam_id,
        isPinned: Boolean(data.exam_id),
      });
      refresh();
    } catch (err) {
      console.error('Failed to add countdown:', err);
    }
  }, [userId, refresh]);

  const removeCountdown = useCallback(async (countdownId: string) => {
    if (!userId) return;
    try {
      await deleteExamCountdown(userId, countdownId);
      refresh();
    } catch (err) {
      console.error('Failed to remove countdown:', err);
    }
  }, [userId, refresh]);

  const totalCompletedTopics = 0;
  const totalTopics = 0;

  return {
    enrolledSubjects,
    selectedSubjectIds,
    unselectedSubjects,
    toggleSubject,
    selectAll,
    selectAllSubjects: selectAll,
    deselectAll,
    countdowns: filteredCountdowns,
    urgentCountdowns,
    imminentExams: urgentCountdowns,
    availableExams,
    addCountdown,
    removeCountdown,
    progress: {
      completedTopics: totalCompletedTopics,
      totalTopics,
      percentage: totalTopics > 0 ? Math.round((totalCompletedTopics / totalTopics) * 100) : 0,
    },
    canEdit,
    refresh,
  };
}
