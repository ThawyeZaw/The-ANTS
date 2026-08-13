'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useLessons
// Hook for lesson tracker cross-feature data: linked content, weekly activity,
// and progress statistics. Pulls data directly from Supabase.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Note } from '@/types';
import { useAuthContext } from '@/context/AuthContext';

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

  const fetch = useCallback(async () => {
    if (!topicId) {
      setData(null);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }

    const [{ data: notes }, { data: decks }] = await Promise.all([
      supabase.from('notes').select('*').eq('topic_id', topicId),
      supabase.from('decks').select('id').eq('subject_id', topicId).limit(1),
    ]);

    const deckId = (decks && decks.length > 0) ? (decks[0] as { id: string }).id : null;
    setData({
      notes: (notes ?? []) as unknown as Note[],
      dueCards: 0,
      deckId,
    });
    setLoading(false);
  }, [topicId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, refetch: fetch };
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
    async function fetchActivity() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }

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
    }
    fetchActivity();
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
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }

      const { data: progress } = await supabase
        .from('topic_progress')
        .select('*')
        .eq('user_id', uid);

      const completed = (progress ?? []).filter(p => p.status === 'completed').length;
      const total = progress?.length ?? 0;
      const overallPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      setData({
        overallPercent,
        subjectBreakdown: [],
        currentStreak: 1,
        confidenceTrend: [],
      });
      setLoading(false);
    }

    fetchStats(userId);
  }, [user?.id, curriculumId]);

  return { data, loading };
}
