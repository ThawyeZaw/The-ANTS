'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useCountdown Hook (Hono API / D1)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import type { ExamCountdown, Exam } from '@/types';
import { actionClearSourceQueue } from '@/actions/notifications';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

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

  // Load initial data
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        const [cdRes, exRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/exams/countdowns?userId=${encodeURIComponent(userId)}`),
          fetch(`${API_BASE_URL}/api/exams`),
        ]);

        if (cdRes.ok && exRes.ok) {
          const [cdJson, exJson] = await Promise.all([cdRes.json(), exRes.json()]);
          if (cdJson.success && cdJson.countdowns) {
            setCountdowns(
              (cdJson.countdowns as any[]).map((c) => ({
                ...c,
                target_date: c.exam_date || c.target_date,
                timeLeft: calculateTimeLeft(c.exam_date || c.target_date),
              }))
            );
          }
          if (exJson.success && exJson.exams) {
            setAvailableExams(exJson.exams as unknown as Exam[]);
          }
        }
      } catch (err) {
        console.error('Error loading countdowns:', err);
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
    }) => {
      if (!userId) return;

      let title = data.custom_title;
      let target = data.target_date;
      let group = data.qualification_group;

      if (data.exam_id) {
        const exam = availableExams.find((e) => e.id === data.exam_id) as any;
        if (exam) {
          title = title || exam.title || exam.subject || '';
          target = target || exam.exam_date || exam.date || '';
        }
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/exams/countdowns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            examId: data.exam_id || undefined,
            title: title || 'Upcoming Exam',
            examDate: target || new Date(Date.now() + 30 * 86400000).toISOString(),
            colorCode: '#EF4444',
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.countdown) {
            const newCountdown = json.countdown;
            setCountdowns((prev) => [
              ...prev,
              {
                ...newCountdown,
                target_date: newCountdown.exam_date,
                qualification_group: group || 'Custom',
                timeLeft: calculateTimeLeft(newCountdown.exam_date),
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Error creating countdown:', err);
      }
    },
    [userId, availableExams]
  );

  const handleDeleteCountdown = useCallback(
    async (id: string) => {
      if (!userId) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/exams/countdowns/${id}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          actionClearSourceQueue('exam_countdown', id);
          setCountdowns((prev) => prev.filter((c) => c.id !== id));
        }
      } catch (err) {
        console.error('Error deleting countdown:', err);
      }
    },
    [userId]
  );

  const groupedCountdowns: GroupedCountdowns = countdowns.reduce((acc, current) => {
    const group = current.qualification_group || 'Custom';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(current);
    return acc;
  }, {} as GroupedCountdowns);

  return {
    groupedCountdowns,
    availableExams,
    createCountdown: handleCreateCountdown,
    deleteCountdown: handleDeleteCountdown,
  };
}
