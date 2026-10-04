'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useDashboardSync hook (Hono API / D1)
// Aggregates real data for dashboard display:
// - Enrolled subjects & progress (via getMySubjectsHub)
// - User exam countdowns (via useCountdown)
// - Computed dashboard stats from live data
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useCountdown } from './useCountdown';
import { getMySubjectsHub, type HubSubject } from '@/actions/curriculum';
import { groupEdexcelIalSubjects } from '@/lib/edexcel-ial';

export interface DashboardStat {
  key: string;
  label: string;
  value: string | number;
  color: string;
}

export function useDashboardSync() {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id;

  const [subjects, setSubjects] = useState<HubSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    if (!userId) {
      if (!authLoading) {
        setSubjects([]);
        setSubjectsLoading(false);
      }
      return;
    }
    setSubjectsLoading(true);
    setSubjectsError(null);
    try {
      const res = await getMySubjectsHub(userId);
      setSubjects(res.subjects ?? []);
    } catch (err) {
      console.error('[useDashboardSync] getMySubjectsHub error:', err);
      setSubjectsError('Could not load your subjects. Check your connection and try again.');
    } finally {
      setSubjectsLoading(false);
    }
  }, [userId, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      void fetchSubjects();
    }
  }, [authLoading, fetchSubjects]);

  const { countdowns, groupedCountdowns, availableExams, isLoading: countdownsLoading } = useCountdown(userId);

  const groups = useMemo(() => groupEdexcelIalSubjects(subjects), [subjects]);

  const allCountdowns = useMemo(() => {
    return countdowns
      .filter((c) => !c.timeLeft.isPast)
      .sort((a, b) => {
        const dateA = new Date(a.exam_date || a.target_date || 0).getTime();
        const dateB = new Date(b.exam_date || b.target_date || 0).getTime();
        return dateA - dateB;
      });
  }, [countdowns]);

  const upcomingExams = useMemo(() => {
    return allCountdowns.slice(0, 5);
  }, [allCountdowns]);

  // Find next exam from countdowns or enrolled subjects
  const nextExamDays = useMemo(() => {
    if (allCountdowns.length > 0) {
      return `${allCountdowns[0].timeLeft.days}d`;
    }
    const subjectsWithDates = subjects
      .filter((s) => s.nextExamDate)
      .map((s) => new Date(s.nextExamDate!).getTime())
      .filter((t) => !Number.isNaN(t) && t > Date.now())
      .sort((a, b) => a - b);
    if (subjectsWithDates.length > 0) {
      const diffMs = subjectsWithDates[0] - Date.now();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return `${days}d`;
    }
    return 'N/A';
  }, [allCountdowns, subjects]);

  const stats = useMemo((): DashboardStat[] => {
    const s: DashboardStat[] = [];
    const enrolledCount = groups.length > 0 ? groups.length : subjects.length;

    s.push({
      key: 'enrolled-courses',
      label: 'Enrolled Subjects',
      value: enrolledCount,
      color: 'emerald',
    });

    s.push({
      key: 'next-exam',
      label: 'Next Exam',
      value: nextExamDays,
      color: 'red',
    });

    s.push({
      key: 'active-countdowns',
      label: 'Active Countdowns',
      value: allCountdowns.length,
      color: 'pink',
    });

    return s;
  }, [groups.length, subjects.length, nextExamDays, allCountdowns.length]);

  return {
    subjects,
    groups,
    subjectsLoading,
    subjectsError,
    refetchSubjects: fetchSubjects,
    hasEnrollments: subjects.length > 0,
    upcomingExams,
    allCountdowns,
    groupedCountdowns,
    availableExams,
    stats,
    isLoading: authLoading || subjectsLoading || countdownsLoading,
  };
}
