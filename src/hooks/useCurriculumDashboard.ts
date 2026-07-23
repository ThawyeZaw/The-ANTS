'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — useCurriculumDashboard Hook
// Aggregates exam countdowns, notes, and flashcard decks filtered by the
// user's enrolled subjects. Powers the Curriculum Dashboard page.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import {
  mockUserEnrollments,
  mockCurriculums,
  mockSubjects,
  mockExams,
  getUserCountdowns,
  createExamCountdown,
  deleteExamCountdown,
  getNotes,
  getRelatedDecks,
} from '@/lib/mock/database';
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

  // ── Enrolled subjects ──────────────────────────────────────────────────────
  const enrolledSubjects = useMemo<EnrolledSubjectInfo[]>(() => {
    if (!userId) return [];

    const userEnrollments = mockUserEnrollments.filter(e => e.user_id === userId);

    return userEnrollments
      .map(enrollment => {
        const subject = mockSubjects.find(s => s.id === enrollment.subject_id);
        const curriculum = mockCurriculums.find(c => c.id === enrollment.curriculum_id);
        if (!subject) return null;
        return {
          enrollmentId: enrollment.id,
          subjectId: subject.id,
          subjectTitle: subject.title,
          curriculumId: enrollment.curriculum_id,
          curriculumTitle: curriculum?.title ?? 'Unknown',
          examBoard: curriculum?.exam_board ?? null,
        };
      })
      .filter((s): s is EnrolledSubjectInfo => s !== null);
  }, [userId]);

  // ── Selected subjects (default: all enrolled) ───────────────────────────────
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Sync selected subjects when enrolled subjects change
  useEffect(() => {
    setSelectedSubjectIds(prev => {
      const enrolledIds = enrolledSubjects.map(s => s.subjectId);
      // If none selected yet, select all
      if (prev.length === 0) return enrolledIds;
      // Filter out any subjects no longer enrolled
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
    const userCountdowns = getUserCountdowns(userId);

    return userCountdowns
      .map(cd => {
        const targetDate = cd.custom_date_override ?? cd.target_date;
        if (!targetDate) return null;

        // Find the linked exam for metadata
        const exam = cd.exam_id ? mockExams.find(e => e.id === cd.exam_id) : null;
        const subject = exam?.subject_id
          ? mockSubjects.find(s => s.id === exam.subject_id)
          : null;

        // Only include if the subject is selected (or if custom countdown with no exam)
        const belongsToSubject = exam?.subject_id
          ? selectedSubjectIds.includes(exam.subject_id)
          : true; // custom countdowns always show

        if (!belongsToSubject) return null;

        return {
          countdown: cd,
          examTitle: cd.custom_title ?? exam?.title ?? 'Untitled',
          examBoard: exam?.exam_board ?? null,
          syllabusCode: exam?.syllabus_code ?? null,
          subjectName: subject?.title ?? cd.qualification_group ?? 'General',
          timeLeft: calcTimeLeft(targetDate),
        };
      })
      .filter((c): c is CountdownWithTime => c !== null)
      .sort((a, b) => {
        // Past exams go to the bottom; upcoming sorted nearest first
        if (a.timeLeft.isPast !== b.timeLeft.isPast) return a.timeLeft.isPast ? 1 : -1;
        const aTarget = new Date(a.countdown.custom_date_override ?? a.countdown.target_date ?? '').getTime();
        const bTarget = new Date(b.countdown.custom_date_override ?? b.countdown.target_date ?? '').getTime();
        return aTarget - bTarget;
      });
  }, [userId, selectedSubjectIds, now, refreshKey]);

  // ── Available exams for selected subjects (for creating countdowns) ────────
  const availableExams = useMemo(() => {
    if (selectedSubjectIds.length === 0) return [];
    return mockExams.filter(
      e => e.subject_id && selectedSubjectIds.includes(e.subject_id)
    );
  }, [selectedSubjectIds]);

  // ── Notes for selected subjects ─────────────────────────────────────────────
  const notes = useMemo<Note[]>(() => {
    if (selectedSubjectIds.length === 0) return [];
    // Get approved notes for each selected subject
    const allNotes: Note[] = [];
    const seenIds = new Set<string>();
    for (const subjectId of selectedSubjectIds) {
      const subjectNotes = getNotes({ subjectId });
      for (const note of subjectNotes) {
        if (!seenIds.has(note.id)) {
          seenIds.add(note.id);
          allNotes.push(note);
        }
      }
    }
    return allNotes.slice(0, 20); // limit to 20 most recent
  }, [selectedSubjectIds, refreshKey]);

  // ── Flashcard decks for selected subjects ───────────────────────────────────
  const decks = useMemo<Deck[]>(() => {
    if (selectedSubjectIds.length === 0) return [];
    const allDecks: Deck[] = [];
    const seenIds = new Set<string>();
    for (const subjectId of selectedSubjectIds) {
      const related = getRelatedDecks(null, subjectId);
      for (const deck of related) {
        if (!seenIds.has(deck.id)) {
          seenIds.add(deck.id);
          allDecks.push(deck);
        }
      }
    }
    return allDecks.slice(0, 20);
  }, [selectedSubjectIds, refreshKey]);

  // ── Excluded (unselected) subjects for collapsed chips ──────────────────────
  const unselectedSubjects = useMemo(
    () => enrolledSubjects.filter(s => !selectedSubjectIds.includes(s.subjectId)),
    [enrolledSubjects, selectedSubjectIds]
  );

  // ── Mutations ───────────────────────────────────────────────────────────────
  const addCountdown = useCallback(
    (data: {
      exam_id?: string;
      custom_title?: string;
      target_date: string;
      priority_indicator: string;
      qualification_group: string;
    }) => {
      if (!userId) return null;
      const result = createExamCountdown({
        user_id: userId,
        exam_id: data.exam_id ?? null,
        custom_title: data.custom_title ?? null,
        target_date: data.target_date,
        priority_indicator: data.priority_indicator,
        qualification_group: data.qualification_group,
      });
      setRefreshKey(k => k + 1);
      return result;
    },
    [userId]
  );

  const removeCountdown = useCallback((id: string) => {
    deleteExamCountdown(id);
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
