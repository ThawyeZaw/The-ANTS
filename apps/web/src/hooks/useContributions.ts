'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useContributions Hook
// Placeholder contributions list (notes/decks APIs retired).
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type ContributionItem = {
  id: string;
  type: 'curriculum' | 'exam';
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
      setContributions([]);
      setIsLoading(false);
      return;
    }
    setContributions([]);
    setIsLoading(false);
  }, [user]);

  return { contributions, isLoading };
}
