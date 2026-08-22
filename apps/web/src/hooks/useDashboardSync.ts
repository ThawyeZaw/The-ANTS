'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useDashboardSync hook
// Aggregates real Supabase data for dashboard display:
// - Enrolled courses & synced resources (via useCourseSync)
// - Saved notes (via useSavedNotes)
// - User exam countdowns (via useCountdown)
// - Computed dashboard stats from live data
// ──────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useCourseSync } from './useCourseSync';
import { useSavedNotes } from './useNotes';
import { useCountdown } from './useCountdown';

export interface DashboardStat {
  key: string;
  label: string;
  value: string | number;
  color: string;
}

export function useDashboardSync() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    syncedCourses,
    hasEnrollments,
    totalResources,
    isLoading: coursesLoading,
  } = useCourseSync();

  const { savedNotes } = useSavedNotes(userId);
  const { groupedCountdowns, availableExams } = useCountdown(userId);

  // ── Flattened countdowns sorted by time left ──────────────────────────────
  const allCountdowns = useMemo(() => {
    return Object.values(groupedCountdowns)
      .flat()
      .sort((a, b) => a.timeLeft.days - b.timeLeft.days);
  }, [groupedCountdowns]);

  // ── Upcoming exams (not past, sorted nearest first, limited to 5) ─────────
  const upcomingExams = useMemo(() => {
    return allCountdowns
      .filter((c) => !c.timeLeft.isPast)
      .slice(0, 5);
  }, [allCountdowns]);

  // ── Dashboard stats computed from real data ────────────────────────────────
  const stats = useMemo((): DashboardStat[] => {
    const s: DashboardStat[] = [];

    // Enrolled courses
    s.push({
      key: 'enrolled-courses',
      label: 'Enrolled Courses',
      value: syncedCourses.length,
      color: 'emerald',
    });

    // Synced resources total
    s.push({
      key: 'synced-resources',
      label: 'Synced Resources',
      value: totalResources,
      color: 'amber',
    });

    // Saved notes
    s.push({
      key: 'saved-notes',
      label: 'Saved Notes',
      value: savedNotes.length,
      color: 'violet',
    });

    // Next exam countdown
    const nextExam = allCountdowns.find((c) => !c.timeLeft.isPast);
    s.push({
      key: 'next-exam',
      label: 'Next Exam',
      value: nextExam ? `${nextExam.timeLeft.days}d` : 'N/A',
      color: 'red',
    });

    // Flashcard decks
    const totalDecks = syncedCourses.reduce(
      (acc, c) => acc + c.subjects.reduce((sAcc, s) => sAcc + s.flashcards.length, 0),
      0
    );
    s.push({
      key: 'flashcard-decks',
      label: 'Decks',
      value: totalDecks,
      color: 'teal',
    });

    // Active countdowns
    s.push({
      key: 'active-countdowns',
      label: 'Active Countdowns',
      value: allCountdowns.filter((c) => !c.timeLeft.isPast).length,
      color: 'pink',
    });

    return s;
  }, [syncedCourses, totalResources, savedNotes, allCountdowns]);

  const isLoading = coursesLoading;

  return {
    syncedCourses,
    hasEnrollments,
    totalResources,
    savedNotes,
    upcomingExams,
    allCountdowns,
    availableExams,
    stats,
    isLoading,
  };
}
