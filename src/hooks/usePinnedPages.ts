'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — usePinnedPages Hook
// Manages pinned pages per user via localStorage.
// Usage: const { pinnedPages, isLoaded, pinPage, unpinPage, isPinned } = usePinnedPages();
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface PinnedPage {
  href: string;
  label: string;
  pinnedAt: string; // ISO date string
}

const STORAGE_KEY_PREFIX = 'ants_pinned_';

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export function usePinnedPages() {
  const { user } = useAuth();
  const [pinnedPages, setPinnedPages] = useState<PinnedPage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load pinned pages from localStorage when user changes
  useEffect(() => {
    if (!user) {
      setPinnedPages([]);
      setIsLoaded(true);
      return;
    }
    try {
      const key = getStorageKey(user.id);
      const stored = localStorage.getItem(key);
      if (stored) {
        setPinnedPages(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load pinned pages:', e);
    }
    setIsLoaded(true);
  }, [user]);

  const pinPage = useCallback(
    (href: string, label: string) => {
      if (!user) return;
      const userId = user.id;
      const newPage: PinnedPage = {
        href,
        label,
        pinnedAt: new Date().toISOString(),
      };
      setPinnedPages((prev) => {
        // Don't add duplicates
        if (prev.some((p) => p.href === href)) return prev;
        const updated = [...prev, newPage];
        try {
          localStorage.setItem(
            getStorageKey(userId),
            JSON.stringify(updated)
          );
        } catch (e) {
          console.error('Failed to save pinned pages:', e);
        }
        return updated;
      });
    },
    [user]
  );

  const unpinPage = useCallback(
    (href: string) => {
      if (!user) return;
      const userId = user.id;
      setPinnedPages((prev) => {
        const updated = prev.filter((p) => p.href !== href);
        try {
          localStorage.setItem(
            getStorageKey(userId),
            JSON.stringify(updated)
          );
        } catch (e) {
          console.error('Failed to save pinned pages:', e);
        }
        return updated;
      });
    },
    [user]
  );

  const isPinned = useCallback(
    (href: string) => {
      return pinnedPages.some((p) => p.href === href);
    },
    [pinnedPages]
  );

  return { pinnedPages, isLoaded, pinPage, unpinPage, isPinned };
}
