'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useLessons (Hono API / Neon Backend)
// Hook for lesson tracker cross-feature data: linked content, weekly activity,
// and progress statistics.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import type { Note } from '@/types';
import { useAuthContext } from '@/context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TopicLinkedContent {
  notes: Note[];
  dueCards: number;
  deckId: string | null;
}

export interface WeeklyActivityDay {
  date: string;
  topicsCompleted: number;
  cardsReviewed: number;
}

export interface LessonTrackerStats {
  overallPercent: number;
  subjectBreakdown: { subjectId: string; name: string; percent: number }[];
  currentStreak: number;
  confidenceTrend: { topicId: string; name: string; confidence: number }[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLessonLinkedContent(topicId: string | null) {
  const [data, setData] = useState<TopicLinkedContent | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchContent = useCallback(async () => {
    if (!topicId) {
      setData(null);
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/notes/library?topicId=${encodeURIComponent(topicId)}`);
      if (res.ok) {
        const json = await res.json();
        setData({
          notes: (json.notes ?? []) as Note[],
          dueCards: 0,
          deckId: null,
        });
      }
    } catch (err) {
      console.error('Error fetching linked content:', err);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { data, loading, refetch: fetchContent };
}

export function useWeeklyActivity() {
  const { user } = useAuthContext();
  const [data, setData] = useState<WeeklyActivityDay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      setData([]);
      return;
    }
    setLoading(true);

    const days: WeeklyActivityDay[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        date: d.toISOString().split('T')[0],
        topicsCompleted: 0,
        cardsReviewed: 0,
      });
    }
    setData(days);
    setLoading(false);
  }, [user?.id]);

  return { data, loading };
}

export function useLessonStats(curriculumId: string | null) {
  const { user } = useAuthContext();
  const [data, setData] = useState<LessonTrackerStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userId = user?.id;
    if (!userId || !curriculumId) {
      setData(null);
      return;
    }
    setLoading(true);

    async function fetchStats(uid: string) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/curriculum/progress?userId=${encodeURIComponent(uid)}`);
        if (res.ok) {
          const json = await res.json();
          const progress: any[] = json.progress || [];
          const completed = progress.filter((p: any) => p.status === 'completed').length;
          const total = progress.length;
          const overallPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

          setData({
            overallPercent,
            subjectBreakdown: [],
            currentStreak: 1,
            confidenceTrend: [],
          });
        }
      } catch (err) {
        console.error('Error fetching lesson stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats(userId);
  }, [user?.id, curriculumId]);

  return { data, loading };
}
