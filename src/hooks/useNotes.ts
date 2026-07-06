'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useNotes Hook (Supabase)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Note, NoteBlock, NoteEditorState, NoteFilters, NoteStatus } from '@/types';
import { createClient } from '@/lib/supabase/client';

function genId(): string {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── useNotes — Library listing ────────────────────────────────────────────────

export function useNotes(filters: NoteFilters) {
  const [notes, setNotes] = useState<Note[]>([]);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      let query = supabase.from('notes').select('*').eq('visibility', 'public');

      if (filters.curriculumId) query = query.eq('curriculum_id', filters.curriculumId);
      if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);
      if (filters.isSyllabusBased !== undefined) query = query.eq('is_syllabus_based', filters.isSyllabusBased);
      if (filters.search) query = query.ilike('title', `%${filters.search}%`);
      if (filters.tags.length > 0) query = query.contains('tags', filters.tags);

      const { data } = await query.order('created_at', { ascending: false });
      setNotes((data as Note[]) ?? []);
    })();
  }, [
    filters.curriculumId, filters.subjectId, filters.isSyllabusBased,
    filters.search, JSON.stringify(filters.tags), supabase,
  ]);

  return { notes };
}

// ── useSingleNote ─────────────────────────────────────────────────────────────

export function useSingleNote(noteId: string) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data } = await supabase.from('notes').select('*').eq('id', noteId).single();
      setNote((data as Note) ?? null);
      setLoading(false);
    })();
  }, [noteId, supabase]);

  return { note, loading };
}

// ── useSavedNotes ─────────────────────────────────────────────────────────────

export function useSavedNotes(userId: string | undefined) {
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    if (!userId) { setSavedNotes([]); return; }
    const { data: saved } = await supabase.from('user_saved_notes').select('note_id').eq('user_id', userId);
    const noteIds = (saved ?? []).map((s: any) => s.note_id);
    if (noteIds.length === 0) { setSavedNotes([]); return; }
    const { data: notes } = await supabase.from('notes').select('*').in('id', noteIds);
    setSavedNotes((notes as Note[]) ?? []);
  }, [userId, supabase]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleSave = useCallback(async (noteId: string) => {
    if (!userId) return;
    const { data: existing } = await supabase.from('user_saved_notes').select('id').eq('user_id', userId).eq('note_id', noteId).single();
    if (existing) {
      await supabase.from('user_saved_notes').delete().eq('id', existing.id);
    } else {
      await supabase.from('user_saved_notes').insert({ user_id: userId, note_id: noteId });
    }
    refresh();
  }, [userId, refresh, supabase]);

  const checkSaved = useCallback(async (noteId: string): Promise<boolean> => {
    if (!userId) return false;
    const { data } = await supabase.from('user_saved_notes').select('id').eq('user_id', userId).eq('note_id', noteId).single();
    return !!data;
  }, [userId, supabase]);

  return { savedNotes, toggleSave, checkSaved, refresh };
}

// ── useContributorNotes ───────────────────────────────────────────────────────

export function useContributorNotes(contributorId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    if (!contributorId) { setNotes([]); return; }
    const { data } = await supabase.from('notes').select('*').eq('contributor_id', contributorId);
    setNotes((data as Note[]) ?? []);
  }, [contributorId, supabase]);

  useEffect(() => { refresh(); }, [refresh]);

  return { notes, refresh };
}

// ── usePendingNotes (Review Queue) ────────────────────────────────────────────

export function usePendingNotes() {
  const [pendingNotes, setPendingNotes] = useState<Note[]>([]);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('notes').select('*').eq('status', 'pending_review');
    setPendingNotes((data as Note[]) ?? []);
  }, [supabase]);

  useEffect(() => { refresh(); }, [refresh]);

  const approve = useCallback(async (noteId: string, reviewerId: string) => {
    const { error } = await supabase.from('notes').update({
      status: 'approved', reviewer_id: reviewerId,
    }).eq('id', noteId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  const reject = useCallback(async (noteId: string, reviewerId: string, feedback: string) => {
    const { error } = await supabase.from('notes').update({
      status: 'rejected', reviewer_id: reviewerId,
      reviewer_feedback: feedback,
    }).eq('id', noteId);
    refresh();
    return error ? { success: false, error: error.message } : { success: true };
  }, [refresh, supabase]);

  return { pendingNotes, approve, reject, refresh };
}

// ── useNoteEditor — Full editor state machine ─────────────────────────────────

const EMPTY_EDITOR: NoteEditorState = {
  noteId: null, title: '', summary: '',
  curriculumId: null, subjectId: null, topicId: null,
  syllabusPoint: '', isSyllabusBased: false,
  examBoard: null, tags: [], blocks: [],
  isDirty: false, isSaving: false,
  status: 'draft', visibility: 'private',
};

export function useNoteEditor(existingNoteId?: string) {
  const [state, setState] = useState<NoteEditorState>(EMPTY_EDITOR);
  const initialised = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    if (!existingNoteId || initialised.current) return;
    (async () => {
      const { data: note } = await supabase.from('notes').select('*').eq('id', existingNoteId).single();
      if (note) {
        setState({
          noteId: note.id, title: note.title, summary: note.summary ?? '',
          curriculumId: note.curriculum_id, subjectId: note.subject_id, topicId: note.topic_id,
          syllabusPoint: note.syllabus_point ?? '', isSyllabusBased: note.is_syllabus_based,
          examBoard: note.exam_board ?? null, tags: note.tags, blocks: note.blocks,
          isDirty: false, isSaving: false,
          status: note.status as NoteStatus, visibility: note.visibility ?? 'private',
        });
      }
      initialised.current = true;
    })();
  }, [existingNoteId, supabase]);

  const setField = useCallback(<K extends keyof NoteEditorState>(key: K, value: NoteEditorState[K]) => {
    setState((prev) => ({ ...prev, [key]: value, isDirty: true }));
  }, []);

  const addBlock = useCallback((type: NoteBlock['type']) => {
    const id = genId();
    let block: NoteBlock;
    switch (type) {
      case 'heading':    block = { type, id, level: 2, text: '' }; break;
      case 'paragraph':  block = { type, id, text: '' }; break;
      case 'latex':      block = { type, id, expression: '', display: true }; break;
      case 'svg':        block = { type, id, markup: '', caption: '' }; break;
      case 'animation':  block = { type, id, template: 'pendulum', caption: '' }; break;
      case 'image':      block = { type, id, url: '', alt: '', caption: '' }; break;
      case 'link':       block = { type, id, url: '', label: '', description: '' }; break;
      case 'code':       block = { type, id, language: 'python', code: '', caption: '' }; break;
      case 'table':      block = { type, id, rows: [['Header 1', 'Header 2'], ['', '']] }; break;
      case 'divider':    block = { type, id }; break;
    }
    setState((prev) => ({ ...prev, blocks: [...prev.blocks, block], isDirty: true }));
  }, []);

  const updateBlock = useCallback((blockId: string, updates: Partial<NoteBlock>) => {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => b.id === blockId ? { ...b, ...updates } as NoteBlock : b),
      isDirty: true,
    }));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setState((prev) => ({ ...prev, blocks: prev.blocks.filter((b) => b.id !== blockId), isDirty: true }));
  }, []);

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setState((prev) => {
      const idx = prev.blocks.findIndex((b) => b.id === blockId);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.blocks.length) return prev;
      const blocks = [...prev.blocks];
      [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
      return { ...prev, blocks, isDirty: true };
    });
  }, []);

  const duplicateBlock = useCallback((blockId: string) => {
    setState((prev) => {
      const idx = prev.blocks.findIndex((b) => b.id === blockId);
      if (idx < 0) return prev;
      const copy = { ...prev.blocks[idx], id: genId() } as NoteBlock;
      const blocks = [...prev.blocks];
      blocks.splice(idx + 1, 0, copy);
      return { ...prev, blocks, isDirty: true };
    });
  }, []);

  const importParsedBlocks = useCallback((parsed: NoteBlock[]) => {
    setState((prev) => ({ ...prev, blocks: [...prev.blocks, ...parsed], isDirty: true }));
  }, []);

  const saveDraft = useCallback(async (contributorId: string) => {
    setState((prev) => ({ ...prev, isSaving: true }));

    const noteData = {
      title: state.title, summary: state.summary,
      curriculum_id: state.curriculumId, subject_id: state.subjectId, topic_id: state.topicId,
      syllabus_point: state.isSyllabusBased ? state.syllabusPoint : null,
      is_syllabus_based: state.isSyllabusBased, exam_board: state.examBoard,
      tags: state.tags, blocks: state.blocks, visibility: state.visibility,
    };

    let result: { success: boolean; note?: Note; error?: string };

    if (state.noteId) {
      const { error } = await supabase.from('notes').update(noteData).eq('id', state.noteId).eq('contributor_id', contributorId);
      if (error) {
        result = { success: false, error: error.message };
      } else {
        const { data: updated } = await supabase.from('notes').select('*').eq('id', state.noteId).single();
        result = { success: true, note: updated as Note };
      }
    } else {
      const { data: created, error } = await supabase.from('notes').insert({
        ...noteData, contributor_id: contributorId, status: 'draft',
      }).select().single();
      if (error || !created) {
        result = { success: false, error: error?.message ?? 'Failed to create note' };
      } else {
        await supabase.from('user_saved_notes').insert({ user_id: contributorId, note_id: created.id });
        result = { success: true, note: created as Note };
      }
    }

    setState((prev) => ({
      ...prev,
      noteId: result.success && result.note ? result.note.id : prev.noteId,
      isDirty: false, isSaving: false,
    }));

    return result;
  }, [state, supabase]);

  const submitForReview = useCallback(async (contributorId: string) => {
    if (!state.noteId) return { success: false as const, error: 'Save the note first.' };
    const { error } = await supabase.from('notes').update({ status: 'pending_review' }).eq('id', state.noteId).eq('contributor_id', contributorId);
    if (!error) setState((prev) => ({ ...prev, status: 'pending_review', isDirty: false }));
    return error ? { success: false, error: error.message } : { success: true };
  }, [state.noteId, supabase]);

  const remove = useCallback(async (contributorId: string) => {
    if (!state.noteId) return { success: false as const, error: 'No note to delete.' };
    const { error } = await supabase.from('notes').delete().eq('id', state.noteId).eq('contributor_id', contributorId);
    return error ? { success: false, error: error.message } : { success: true };
  }, [state.noteId, supabase]);

  const reset = useCallback(() => {
    setState(EMPTY_EDITOR);
    initialised.current = false;
  }, []);

  return { state, setField, addBlock, updateBlock, deleteBlock, moveBlock, duplicateBlock, importParsedBlocks, saveDraft, submitForReview, remove, reset };
}
