'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useLessons
// Hook for lesson tracker cross-feature data: linked content, weekly activity,
// and progress statistics. Pulls data through the mock database facade only.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import {
  getTopicLinkedContent,
  getWeeklyStudyActivity,
  getLessonTrackerStats,
} from '@/lib/mock/database';
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
    const result = getTopicLinkedContent(topicId);
    setData(result);
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
    const result = getWeeklyStudyActivity(userId);
    setData(result);
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
    const result = getLessonTrackerStats(userId, curriculumId);
    setData(result);
    setLoading(false);
  }, [user?.id, curriculumId]);

  return { data, loading };
}
