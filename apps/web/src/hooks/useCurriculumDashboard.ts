'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useCurriculumDashboard Hook (Hono API / Neon Backend)
// Aggregates exam countdowns, notes, and flashcard decks filtered by the
// user's enrolled subjects. Powers the Curriculum Dashboard page.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import type { ExamCountdown, Note, Deck } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

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
  const [notes, setNotes] = useState<Note[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;

      try {
        const [currRes, cdRes, examsRes, notesRes, decksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/curriculum/user-curriculums?userId=${encodeURIComponent(userId)}`),
          fetch(`${API_BASE_URL}/api/exams/countdowns?userId=${encodeURIComponent(userId)}`),
          fetch(`${API_BASE_URL}/api/exams`),
          fetch(`${API_BASE_URL}/api/notes/library`),
          fetch(`${API_BASE_URL}/api/flashcards/decks?isPublic=true`),
        ]);

        if (currRes.ok) {
          const json = await currRes.json();
          if (json.success && json.userCurriculums) {
            const list: EnrolledSubjectInfo[] = [];
            for (const item of json.userCurriculums) {
              const c = item.curriculum;
              if (c && c.subjects) {
                for (const s of c.subjects) {
                  list.push({
                    enrollmentId: item.id,
                    subjectId: s.id,
                    subjectTitle: s.title,
                    curriculumId: c.id,
                    curriculumTitle: c.title,
                    examBoard: c.exam_board ?? null,
                  });
                }
              }
            }
            setEnrolledSubjects(list);
          }
        }

        if (cdRes.ok) {
          const json = await cdRes.json();
          if (json.success && json.countdowns) {
            setRawCountdowns(json.countdowns);
          }
        }

        if (examsRes.ok) {
          const json = await examsRes.json();
          if (json.success && json.exams) {
            setAvailableExams(json.exams);
          }
        }

        if (notesRes.ok) {
          const json = await notesRes.json();
          if (json.success && json.notes) {
            setNotes(json.notes);
          }
        }

        if (decksRes.ok) {
          const json = await decksRes.json();
          if (json.success && json.decks) {
            setDecks(json.decks);
          }
        }
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

  const filteredNotes = useMemo(() => {
    if (selectedSubjectIds.length === 0) return [];
    return notes.filter((n) => !n.subject_id || selectedSubjectIds.includes(n.subject_id));
  }, [notes, selectedSubjectIds]);

  const filteredDecks = useMemo(() => {
    if (selectedSubjectIds.length === 0) return [];
    return decks.filter((d) => !d.subject_id || selectedSubjectIds.includes(d.subject_id));
  }, [decks, selectedSubjectIds]);

  const totalCompletedTopics = 0;
  const totalTopics = 0;

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    enrolledSubjects,
    selectedSubjectIds,
    toggleSubject,
    selectAll,
    deselectAll,
    countdowns: filteredCountdowns,
    urgentCountdowns,
    notes: filteredNotes,
    decks: filteredDecks,
    progress: {
      completedTopics: totalCompletedTopics,
      totalTopics,
      percentage: totalTopics > 0 ? Math.round((totalCompletedTopics / totalTopics) * 100) : 0,
    },
    canEdit,
    refresh,
  };
}
