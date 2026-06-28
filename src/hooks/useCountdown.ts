import { useState, useEffect, useCallback } from 'react';
import { ExamCountdown, Exam } from '@/types';
import {
  getUserCountdowns,
  getExams,
  createExamCountdown,
  deleteExamCountdown,
} from '@/lib/mock/database';

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
    if (userId) {
      const initialCountdowns = getUserCountdowns(userId).map(c => ({
        ...c,
        timeLeft: calculateTimeLeft(c.target_date),
      }));
      setCountdowns(initialCountdowns);
    }
    setAvailableExams(getExams());
  }, [userId]);

  // Timer tick
  useEffect(() => {
    if (countdowns.length === 0) return;

    const interval = setInterval(() => {
      setCountdowns(prev => 
        prev.map(c => ({
          ...c,
          timeLeft: calculateTimeLeft(c.target_date)
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [countdowns.length]); // Only re-run if number of countdowns changes, preventing too many effect re-runs

  const handleCreateCountdown = useCallback((
    data: {
      exam_id?: string;
      custom_title?: string;
      target_date?: string;
      priority_indicator?: string;
      qualification_group?: string;
    }
  ) => {
    if (!userId) return;

    // Use exam data if exam_id is provided and we don't have explicit custom details
    let title = data.custom_title;
    let target = data.target_date;
    let group = data.qualification_group;

    if (data.exam_id) {
      const exam = availableExams.find(e => e.id === data.exam_id);
      if (exam) {
        title = title || exam.title || '';
        target = target || exam.exam_date || '';
      }
    }

    const newCountdown = createExamCountdown({
      user_id: userId,
      exam_id: data.exam_id || null,
      custom_title: title || null,
      target_date: target || null,
      priority_indicator: data.priority_indicator || 'medium',
      qualification_group: group || 'Custom',
    });

    setCountdowns(prev => [
      ...prev,
      { ...newCountdown, timeLeft: calculateTimeLeft(newCountdown.target_date) }
    ]);
  }, [userId, availableExams]);

  const handleDeleteCountdown = useCallback((id: string) => {
    const res = deleteExamCountdown(id);
    if (res.success) {
      setCountdowns(prev => prev.filter(c => c.id !== id));
    }
  }, []);

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
