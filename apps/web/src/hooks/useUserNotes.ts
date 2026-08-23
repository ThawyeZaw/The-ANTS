'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useUserNotes Hook (Typed API / Neon Backend)
// CRUD for personal notes on user_notes.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserNote } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

export function useUserNotes(topicId?: string | null) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/api/notes/user-notes`);
      url.searchParams.set('userId', userId);
      if (topicId) url.searchParams.set('topicId', topicId);

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.notes) {
          setNotes(json.notes);
        }
      }
    } catch (err) {
      console.error('Error fetching user notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, topicId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = useCallback(
    async (noteData: Partial<UserNote>) => {
      if (!userId) return { success: false as const, error: 'Not authenticated' };
      try {
        const res = await fetch(`${API_BASE_URL}/api/notes/user-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            title: noteData.title || 'Untitled Note',
            content: noteData.content,
            blocks: noteData.blocks || [],
            tags: noteData.tags || [],
            color: noteData.color,
            isPinned: noteData.is_pinned,
            topicId: noteData.topic_id || topicId,
            subjectId: noteData.subject_id,
            curriculumId: noteData.curriculum_id,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.note) {
            setNotes((prev) => [json.note, ...prev]);
            return { success: true as const, data: json.note as UserNote };
          }
        }
        const err = await res.json().catch(() => ({}));
        return { success: false as const, error: err.error || 'Failed to create note' };
      } catch (err: any) {
        return { success: false as const, error: err.message || 'Failed to create note' };
      }
    },
    [userId, topicId]
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<UserNote>) => {
      if (!userId) return { success: false as const, error: 'Not authenticated' };
      try {
        const res = await fetch(`${API_BASE_URL}/api/notes/user-notes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            title: updates.title,
            content: updates.content,
            blocks: updates.blocks,
            tags: updates.tags,
            color: updates.color,
            isPinned: updates.is_pinned,
            topicId: updates.topic_id,
            subjectId: updates.subject_id,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.note) {
            setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...json.note } : n)));
            return { success: true as const };
          }
        }
        return { success: false as const, error: 'Failed to update note' };
      } catch (err: any) {
        return { success: false as const, error: err.message || 'Failed to update note' };
      }
    },
    [userId]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!userId) return { success: false as const, error: 'Not authenticated' };
      try {
        const res = await fetch(`${API_BASE_URL}/api/notes/user-notes/${id}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setNotes((prev) => prev.filter((n) => n.id !== id));
          return { success: true as const };
        }
        return { success: false as const, error: 'Failed to delete note' };
      } catch (err: any) {
        return { success: false as const, error: err.message || 'Failed to delete note' };
      }
    },
    [userId]
  );

  return { notes, isLoading, fetchNotes, createNote, updateNote, deleteNote };
}

// ── useSingleUserNote ─────────────────────────────────────────────────────────

export function useSingleUserNote(noteId: string | null) {
  const { user } = useAuth();
  const [note, setNote] = useState<UserNote | null>(null);
  const [isLoading, setIsLoading] = useState(!!noteId);

  useEffect(() => {
    if (!noteId || !user?.id) {
      setIsLoading(false);
      return;
    }
    const userId = user.id;
    setIsLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notes/user-notes?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.notes) {
            const found = (json.notes as UserNote[]).find((n) => n.id === noteId);
            setNote(found || null);
          }
        }
      } catch (err) {
        console.error('Error fetching single note:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [noteId, user?.id]);

  return { note, isLoading };
}
