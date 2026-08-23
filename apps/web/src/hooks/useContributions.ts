'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useContributions Hook (Hono API / Neon Backend)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

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
    if (!user) {
      setIsLoading(false);
      return;
    }

    const userId = user.id;

    async function fetchContributions() {
      try {
        const [notesRes, decksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/notes/library`),
          fetch(`${API_BASE_URL}/api/flashcards/decks?userId=${encodeURIComponent(userId)}`),
        ]);

        const items: ContributionItem[] = [];

        if (notesRes.ok) {
          const json = await notesRes.json();
          const notes: any[] = json.notes || [];
          notes
            .filter((n) => n.contributor_id === userId)
            .forEach((n) => {
              items.push({
                id: n.id,
                type: 'note',
                title: n.title,
                status: n.status || 'published',
                lastModified: n.updated_at || n.created_at || new Date().toISOString(),
                editHref: `/editor/notes?id=${n.id}&edit=true`,
              });
            });
        }

        if (decksRes.ok) {
          const json = await decksRes.json();
          const decks: any[] = json.decks || [];
          decks
            .filter((d) => d.owner_id === userId)
            .forEach((d) => {
              items.push({
                id: d.id,
                type: 'flashcard',
                title: d.name,
                status: d.is_public ? 'public' : 'private',
                lastModified: d.created_at || new Date().toISOString(),
                editHref: `/editor/flashcards?id=${d.id}&edit=true`,
              });
            });
        }

        setContributions(items);
      } catch (err) {
        console.error('Error fetching contributions:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContributions();
  }, [user]);

  return { contributions, isLoading };
}
