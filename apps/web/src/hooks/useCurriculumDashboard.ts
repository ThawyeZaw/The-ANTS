'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — useCurriculumDashboard Hook
// Aggregates exam countdowns, notes, and flashcard decks filtered by the
// user's enrolled subjects. Powers the Curriculum Dashboard page.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { createClient } from '@/lib/supabase/client';
import type { ExamCountdown, Note, Deck } from '@/types';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

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

  // ── Real-time clock tick ────────────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubjectInfo[]>([]);
  const [rawCountdowns, setRawCountdowns] = useState<ExamCountdown[]>([]);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      const supabase = createClient();
      if (!supabase) return;

      const [
        { data: enrollments },
        { data: subjects },
        { data: curriculums },
        { data: cds },
        { data: exams },
        { data: notesData },
        { data: decksData },
      ] = await Promise.all([
        supabase.from('user_enrollments').select('*').eq('user_id', userId),
        supabase.from('subjects').select('*'),
        supabase.from('curriculums').select('*'),
        supabase.from('exam_countdowns').select('*').eq('user_id', userId),
        supabase.from('exams').select('*'),
        supabase.from('notes').select('*').eq('status', 'approved'),
        supabase.from('decks').select('*').eq('is_public', true),
      ]);

      if (enrollments && subjects) {
        const list: EnrolledSubjectInfo[] = [];
        enrollments.forEach((e: any) => {
          const s = (subjects as any[]).find(sub => sub.id === e.subject_id);
          const c = (curriculums as any[]).find(curr => curr.id === e.curriculum_id);
          if (s) {
            list.push({
              enrollmentId: e.id,
              subjectId: s.id,
              subjectTitle: s.title,
              curriculumId: e.curriculum_id,
              curriculumTitle: c?.title ?? 'Unknown',
              examBoard: c?.exam_board ?? null,
            });
          }
        });
        setEnrolledSubjects(list);
      }

      if (cds) setRawCountdowns(cds as ExamCountdown[]);
      if (exams) setAvailableExams(exams);
      if (notesData) setNotes(notesData as unknown as Note[]);
      if (decksData) setDecks(decksData as unknown as Deck[]);
    }

    fetchData();
  }, [userId, refreshKey]);

  // ── Selected subjects (default: all enrolled) ───────────────────────────────
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Sync selected subjects when enrolled subjects change
  useEffect(() => {
    setSelectedSubjectIds(prev => {
      const enrolledIds = enrolledSubjects.map(s => s.subjectId);
      if (prev.length === 0) return enrolledIds;
      return prev.filter(id => enrolledIds.includes(id));
    });
  }, [enrolledSubjects]);

  const toggleSubject = useCallback((subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  }, []);

  const selectAllSubjects = useCallback(() => {
    setSelectedSubjectIds(enrolledSubjects.map(s => s.subjectId));
  }, [enrolledSubjects]);

  // ── Countdowns for selected subjects ────────────────────────────────────────
  const countdowns = useMemo<CountdownWithTime[]>(() => {
    if (!userId) return [];

    return rawCountdowns
      .map(cd => {
        const targetDate = cd.custom_date_override ?? cd.target_date;
        if (!targetDate) return null;

        const exam = cd.exam_id ? availableExams.find(e => e.id === cd.exam_id) : null;
        const belongsToSubject = exam?.subject_id
          ? selectedSubjectIds.includes(exam.subject_id)
          : true;

        if (!belongsToSubject) return null;

        return {
          countdown: cd,
          examTitle: cd.custom_title ?? exam?.title ?? 'Untitled',
          examBoard: exam?.exam_board ?? null,
          syllabusCode: exam?.syllabus_code ?? null,
          subjectName: cd.qualification_group ?? 'General',
          timeLeft: calcTimeLeft(targetDate),
        };
      })
      .filter((c): c is CountdownWithTime => c !== null)
      .sort((a, b) => {
        if (a.timeLeft.isPast !== b.timeLeft.isPast) return a.timeLeft.isPast ? 1 : -1;
        const aTarget = new Date(a.countdown.custom_date_override ?? a.countdown.target_date ?? '').getTime();
        const bTarget = new Date(b.countdown.custom_date_override ?? b.countdown.target_date ?? '').getTime();
        return aTarget - bTarget;
      });
  }, [userId, rawCountdowns, availableExams, selectedSubjectIds, now]);

  // ── Excluded (unselected) subjects for collapsed chips ──────────────────────
  const unselectedSubjects = useMemo(
    () => enrolledSubjects.filter(s => !selectedSubjectIds.includes(s.subjectId)),
    [enrolledSubjects, selectedSubjectIds]
  );

  // ── Mutations ───────────────────────────────────────────────────────────────
  const addCountdown = useCallback(
    async (data: {
      exam_id?: string;
      custom_title?: string;
      target_date: string;
      priority_indicator: string;
      qualification_group: string;
    }) => {
      if (!userId) return null;
      const supabase = createClient();
      if (!supabase) return null;

      const { data: newCd } = await supabase.from('exam_countdowns').insert({
        user_id: userId,
        exam_id: data.exam_id ?? null,
        custom_title: data.custom_title ?? null,
        target_date: data.target_date,
        priority_indicator: data.priority_indicator,
        qualification_group: data.qualification_group,
      }).select('*').single();

      setRefreshKey(k => k + 1);
      return newCd;
    },
    [userId]
  );

  const removeCountdown = useCallback(async (id: string) => {
    const supabase = createClient();
    if (supabase) {
      await supabase.from('exam_countdowns').delete().eq('id', id);
    }
    setRefreshKey(k => k + 1);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // ── Upcoming exams within 7 days ────────────────────────────────────────────
  const imminentExams = useMemo(
    () => countdowns.filter(
      c => !c.timeLeft.isPast && isWithinDays(
        c.countdown.custom_date_override ?? c.countdown.target_date ?? '',
        7
      )
    ),
    [countdowns]
  );

  return {
    // Data
    enrolledSubjects,
    selectedSubjectIds,
    unselectedSubjects,
    countdowns,
    availableExams,
    notes,
    decks,
    imminentExams,

    // Actions
    toggleSubject,
    selectAllSubjects,
    addCountdown,
    removeCountdown,
    refresh,

    // Permissions
    canEdit,
    userId,
  };
}
