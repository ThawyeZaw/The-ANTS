'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — useUserNotes Hook
// CRUD for personal notes on the user_notes table (Supabase).
// Available to every role — students included. Notes are private (RLS owner-only).
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import type { UserNote } from '@/types';

// Helper to bypass Supabase generated types for tables not yet in types/supabase.ts
function userNotes(supabase: ReturnType<typeof createClient>): any {
  return (supabase as any).from('user_notes');
}

export function useUserNotes(topicId?: string | null) {
  const { user } = useAuth();
  const supabase = createClient();
  if (!supabase) return;
  const userId = user?.id ?? null;
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!userId || !supabase) return;
    setIsLoading(true);
    let query = userNotes(supabase)
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (topicId) {
      query = query.eq('topic_id', topicId);
    }

    const { data } = await query;
    setNotes((data ?? []) as UserNote[]);
    setIsLoading(false);
  }, [userId, supabase, topicId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = useCallback(async (noteData: Partial<UserNote>) => {
    if (!userId || !supabase) return { success: false as const, error: 'Not connected' };
    const { data, error } = await userNotes(supabase)
      .insert({
        ...noteData,
        user_id: userId,
        blocks: noteData.blocks ?? [],
        tags: noteData.tags ?? [],
      })
      .select()
      .single();
    if (error) return { success: false as const, error: error.message };
    setNotes((prev) => [data as UserNote, ...prev]);
    return { success: true as const, data: data as UserNote };
  }, [userId, supabase]);

  const updateNote = useCallback(async (id: string, updates: Partial<UserNote>) => {
    if (!userId || !supabase) return { success: false as const, error: 'Not connected' };
    const { error } = await userNotes(supabase)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return { success: false as const, error: error.message };
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    return { success: true as const };
  }, [userId, supabase]);

  const deleteNote = useCallback(async (id: string) => {
    if (!userId || !supabase) return { success: false as const, error: 'Not connected' };
    const { error } = await userNotes(supabase)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return { success: false as const, error: error.message };
    setNotes((prev) => prev.filter((n) => n.id !== id));
    return { success: true as const };
  }, [userId, supabase]);

  return { notes, isLoading, fetchNotes, createNote, updateNote, deleteNote };
}

// ── useSingleUserNote — load one personal note (for the editor) ───────────────

export function useSingleUserNote(noteId: string | null) {
  const { user } = useAuth();
  const supabase = createClient();
  if (!supabase) return;
  const [note, setNote] = useState<UserNote | null>(null);
  const [isLoading, setIsLoading] = useState(!!noteId);

  useEffect(() => {
    if (!noteId || !user?.id || !supabase) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    (async () => {
      const { data } = await userNotes(supabase)
        .select('*')
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single();
      setNote((data as UserNote) ?? null);
      setIsLoading(false);
    })();
  }, [noteId, user?.id, supabase]);

  return { note, isLoading };
}
