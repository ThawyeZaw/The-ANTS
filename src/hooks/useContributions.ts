'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

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

    const userId = user.id;

    async function fetchContributions() {
      const supabase = createClient();
      if (!supabase) { setIsLoading(false); return; }

      try {
        const [
          { data: notes },
          { data: decks },
          { data: quizzes },
        ] = await Promise.all([
          supabase.from('notes').select('*').eq('contributor_id', userId),
          supabase.from('decks').select('*').eq('owner_id', userId),
          (supabase as any).from('quizzes_standalone').select('*').eq('created_by', userId),
        ]);

        const items: ContributionItem[] = [];

        (notes ?? []).forEach((n: any) => {
          items.push({
            id: n.id,
            type: 'note',
            title: n.title,
            status: n.status || 'published',
            lastModified: n.updated_at || n.created_at || new Date().toISOString(),
            editHref: `/editor/notes?id=${n.id}&edit=true`,
          });
        });

        (decks ?? []).forEach((d: any) => {
          items.push({
            id: d.id,
            type: 'flashcard',
            title: d.name,
            status: d.visibility || 'private',
            lastModified: d.created_at || new Date().toISOString(),
            editHref: `/flashcards/${d.id}`,
          });
        });

        (quizzes ?? []).forEach((q: any) => {
          items.push({
            id: q.id,
            type: 'quiz',
            title: q.title,
            status: q.status || 'draft',
            lastModified: q.created_at || new Date().toISOString(),
            editHref: `/classrooms`,
          });
        });

        items.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        setContributions(items);
      } catch (e) {
        setContributions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContributions();
  }, [user]);

  return { contributions, isLoading };
}
