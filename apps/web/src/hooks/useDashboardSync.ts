'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useDashboardSync hook (Hono API / D1)
// Aggregates real data for dashboard display:
// - Enrolled courses & synced resources (via useCourseSync)
// - User exam countdowns (via useCountdown)
// - Computed dashboard stats from live data
// ──────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useCourseSync } from './useCourseSync';
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

  const { syncedCourses, isLoading: coursesLoading } = useCourseSync();
  const { groupedCountdowns, availableExams } = useCountdown(userId);

  const hasEnrollments = syncedCourses.length > 0;

  const totalResources = useMemo(() => {
    return syncedCourses.reduce(
      (acc, c) =>
        acc +
        c.subjects.reduce(
          (sAcc, s) => sAcc + s.exams.length + s.countdowns.length,
          0
        ),
      0
    );
  }, [syncedCourses]);

  const allCountdowns = useMemo(() => {
    return Object.values(groupedCountdowns)
      .flat()
      .sort((a, b) => a.timeLeft.days - b.timeLeft.days);
  }, [groupedCountdowns]);

  const upcomingExams = useMemo(() => {
    return allCountdowns.filter((c) => !c.timeLeft.isPast).slice(0, 5);
  }, [allCountdowns]);

  const stats = useMemo((): DashboardStat[] => {
    const s: DashboardStat[] = [];

    s.push({
      key: 'enrolled-courses',
      label: 'Enrolled Courses',
      value: syncedCourses.length,
      color: 'emerald',
    });

    s.push({
      key: 'synced-resources',
      label: 'Synced Resources',
      value: totalResources,
      color: 'amber',
    });

    const nextExam = allCountdowns.find((c) => !c.timeLeft.isPast);
    s.push({
      key: 'next-exam',
      label: 'Next Exam',
      value: nextExam ? `${nextExam.timeLeft.days}d` : 'N/A',
      color: 'red',
    });

    s.push({
      key: 'active-countdowns',
      label: 'Active Countdowns',
      value: allCountdowns.filter((c) => !c.timeLeft.isPast).length,
      color: 'pink',
    });

    return s;
  }, [syncedCourses, totalResources, allCountdowns]);

  const isLoading = coursesLoading;

  return {
    syncedCourses,
    hasEnrollments,
    totalResources,
    upcomingExams,
    allCountdowns,
    availableExams,
    stats,
    isLoading,
  };
}
