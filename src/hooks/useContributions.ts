'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { mockNotes, mockDecks, mockQuizzes, mockCurriculums, mockExamCountdowns } from '@/lib/mock/database';

export type ContributionItem = {
  id: string;
  type: 'note' | 'flashcard' | 'quiz' | 'curriculum' | 'exam';
  title: string;
  status: string;
  lastModified: string;
  editHref: string;
};

export function useContributions() {
  const { user } = useAuth();
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    try {
      const items: ContributionItem[] = [];

      // Notes
      mockNotes.filter(n => n.contributor_id === user.id).forEach(n => {
        items.push({
          id: n.id, type: 'note', title: n.title,
          status: n.status,
          lastModified: n.updated_at || n.created_at,
          editHref: `/editor/notes?id=${n.id}&edit=true`,
        });
      });

      // Decks/Flashcards
      mockDecks.filter(d => d.owner_id === user.id).forEach(d => {
        items.push({
          id: d.id, type: 'flashcard', title: d.name,
          status: d.is_public ? 'public' : 'private',
          lastModified: d.created_at,
          editHref: `/flashcards/${d.id}`,
        });
      });

      // Quizzes
      mockQuizzes.filter(q => q.created_by === user.id).forEach(q => {
        items.push({
          id: q.id, type: 'quiz', title: q.title,
          status: q.status,
          lastModified: q.created_at,
          editHref: `/classrooms/${q.classroom_id}`,
        });
      });

      // Curriculums — has `created_by` field in mock data
      // TODO: when a proper Curriculum type is added, use a typed filter
      mockCurriculums.forEach(c => {
        items.push({
          id: c.id, type: 'curriculum', title: c.title,
          status: c.status || 'active',
          lastModified: c.updated_at || c.created_at || new Date().toISOString(),
          editHref: `/editor/curriculum?id=${c.id}`,
        });
      });

      // Exam countdowns — uses `user_id` field (not `created_by`)
      mockExamCountdowns.filter(c => c.user_id === user.id).forEach(c => {
        items.push({
          id: c.id, type: 'exam', title: c.custom_title || 'Untitled Countdown',
          status: 'active',
          lastModified: c.created_at,
          editHref: `/countdown`,
        });
      });

      setContributions(items);
    } catch (e) {
      console.error('Failed to load contributions:', e);
    }
    setIsLoading(false);
  }, [user]);

  return { contributions, isLoading };
}
