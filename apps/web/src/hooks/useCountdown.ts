'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useCountdown Hook (Hono API / D1)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import type { ExamCountdown, Exam } from '@/types';
import { actionClearSourceQueue } from '@/actions/notifications';
import {
  createExamCountdown,
  deleteExamCountdown,
  listExamCountdownsForUser,
  listExams,
} from '@/actions/exam-data';

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export interface CountdownWithTime extends ExamCountdown {
  timeLeft: TimeLeft;
}

export type GroupedCountdowns = Record<string, CountdownWithTime[]>;

function deriveQualificationGroup(countdown: {
  exam_board?: string | null;
  is_custom?: boolean;
  qualification_group?: string | null;
}): string {
  if (countdown.qualification_group) return countdown.qualification_group;
  const board = (countdown.exam_board ?? '').toUpperCase();
  if (board.includes('CAIE') || board.includes('CAMBRIDGE')) return 'CAIE';
  if (board.includes('EDEXCEL') || board.includes('PEARSON')) return 'Edexcel';
  if (countdown.is_custom) return 'Custom';
  return 'Official';
}

function sortCountdowns(list: CountdownWithTime[]): CountdownWithTime[] {
  return [...list].sort((a, b) => {
    const pinA = (a as any).is_pinned ? 1 : 0;
    const pinB = (b as any).is_pinned ? 1 : 0;
    if (pinB !== pinA) return pinB - pinA;
    const customA = (a as any).is_custom ? 1 : 0;
    const customB = (b as any).is_custom ? 1 : 0;
    if (customB !== customA) return customB - customA;
    const dateA = new Date(a.target_date ?? 0).getTime();
    const dateB = new Date(b.target_date ?? 0).getTime();
    return dateA - dateB;
  });
}

function calculateTimeLeft(targetDate: string | null): TimeLeft {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };

  const difference = new Date(targetDate).getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isPast: false,
  };
}

export function useCountdown(userId: string | undefined) {
  const [countdowns, setCountdowns] = useState<CountdownWithTime[]>([]);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [cdRows, examRows] = await Promise.all([
          listExamCountdownsForUser(userId),
          listExams(),
        ]);

        setCountdowns(
          sortCountdowns(
            cdRows.map((c) => ({
              ...c,
              custom_title: c.custom_title ?? (c.title as string | null) ?? null,
              target_date: (c.exam_date || c.target_date) as string | null,
              qualification_group: deriveQualificationGroup(c),
              timeLeft: calculateTimeLeft((c.exam_date || c.target_date) as string | null),
            })) as CountdownWithTime[]
          )
        );
        setAvailableExams(examRows as unknown as Exam[]);
      } catch (err) {
        console.error('Error loading countdowns:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Timer tick
  useEffect(() => {
    if (countdowns.length === 0) return;

    const interval = setInterval(() => {
      setCountdowns((prev) =>
        prev.map((c) => ({
          ...c,
          timeLeft: calculateTimeLeft(c.target_date),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [countdowns.length]);

  const handleCreateCountdown = useCallback(
    async (data: {
      exam_id?: string;
      custom_title?: string;
      target_date?: string;
      priority_indicator?: string;
      qualification_group?: string;
      subject_id?: string;
      exam_board?: string;
    }) => {
      if (!userId) {
        throw new Error('You must be signed in to add a countdown.');
      }

      let title = data.custom_title?.trim();
      let target = data.target_date;
      let group = data.qualification_group;
      let subjectId = data.subject_id;
      let examBoard = data.exam_board;

      if (data.exam_id) {
        const exam = availableExams.find((e) => e.id === data.exam_id) as any;
        if (exam) {
          title = title || exam.title || exam.subject_name || exam.subject || '';
          target = target || exam.exam_date || exam.date || '';
          subjectId = subjectId || exam.subject_id || undefined;
          examBoard = examBoard || exam.exam_board || undefined;
          group = group || exam.exam_board || exam.qualification || 'Official';
        }
      }

      const resolvedTitle = (title || 'Upcoming Exam').trim();
      const resolvedDate =
        target && !Number.isNaN(new Date(target).getTime())
          ? new Date(target).toISOString()
          : new Date(Date.now() + 30 * 86400000).toISOString();

      try {
        const json = await createExamCountdown({
          userId,
          examId: data.exam_id ?? undefined,
          title: resolvedTitle,
          examDate: resolvedDate,
          colorCode: '#EF4444',
          isCustom: !data.exam_id,
          isPinned: true,
          subjectId: subjectId ?? undefined,
          examBoard: examBoard ?? undefined,
        });

        if (!json.success) {
          throw new Error(json.error || 'Failed to create countdown. Please try again.');
        }

        const newCountdown = json.countdown;
        setCountdowns((prev) =>
          sortCountdowns([
            ...prev,
            {
              ...newCountdown,
              target_date: newCountdown.exam_date,
              qualification_group: deriveQualificationGroup({
                ...newCountdown,
                qualification_group: group,
              }),
              timeLeft: calculateTimeLeft(newCountdown.exam_date as string | null),
            } as CountdownWithTime,
          ])
        );
      } catch (err) {
        console.error('Error creating countdown:', err);
        throw err;
      }
    },
    [userId, availableExams]
  );

  const handleDeleteCountdown = useCallback(
    async (id: string) => {
      if (!userId) return;
      try {
        const res = await deleteExamCountdown(userId, id);
        if (res.success) {
          actionClearSourceQueue('exam_countdown', id);
          setCountdowns((prev) => prev.filter((c) => c.id !== id));
        }
      } catch (err) {
        console.error('Error deleting countdown:', err);
      }
    },
    [userId]
  );

  const groupedCountdowns: GroupedCountdowns = sortCountdowns(countdowns).reduce(
    (acc, current) => {
      const group = current.qualification_group || 'Custom';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(current);
      return acc;
    },
    {} as GroupedCountdowns
  );

  return {
    groupedCountdowns,
    countdowns,
    availableExams,
    isLoading,
    createCountdown: handleCreateCountdown,
    deleteCountdown: handleDeleteCountdown,
  };
}
