'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useNotes Hook
// Provides data access and state management for the Notes feature.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Note,
  NoteBlock,
  NoteEditorState,
  NoteFilters,

  NoteStatus,
} from '@/types';
import {
  getNotes,
  getNoteById,
  getUserSavedNotes,
  getNotesByContributor,
  getPendingNotes,
  isNoteSaved,
  createNote,
  updateNote,
  submitNoteForReview,
  saveNote,
  unsaveNote,
  approveNote,
  rejectNote,
  deleteNote,
} from '@/lib/mock/database';

// ── Utility ───────────────────────────────────────────────────────────────────

function genId(): string {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── useNotes — Library listing ────────────────────────────────────────────────

export function useNotes(filters: NoteFilters) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const result = getNotes({
      curriculumId: filters.curriculumId ?? undefined,
      subjectId: filters.subjectId ?? undefined,
      isSyllabusBased: filters.isSyllabusBased ?? undefined,
      search: filters.search || undefined,
      tags: filters.tags.length > 0 ? filters.tags : undefined,
    });
    setNotes(result);
  }, [
    filters.curriculumId,
    filters.subjectId,
    filters.isSyllabusBased,
    filters.search,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filters.tags),
  ]);

  return { notes };
}

// ── useSingleNote ─────────────────────────────────────────────────────────────

export function useSingleNote(noteId: string) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const found = getNoteById(noteId);
    setNote(found ?? null);
    setLoading(false);
  }, [noteId]);

  return { note, loading };
}

// ── useSavedNotes ─────────────────────────────────────────────────────────────

export function useSavedNotes(userId: string | undefined) {
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);

  const refresh = useCallback(() => {
    if (!userId) { setSavedNotes([]); return; }
    setSavedNotes(getUserSavedNotes(userId));
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleSave = useCallback((noteId: string) => {
    if (!userId) return;
    if (isNoteSaved(userId, noteId)) {
      unsaveNote(userId, noteId);
    } else {
      saveNote(userId, noteId);
    }
    refresh();
  }, [userId, refresh]);

  const checkSaved = useCallback((noteId: string): boolean => {
    if (!userId) return false;
    return isNoteSaved(userId, noteId);
  }, [userId]);

  return { savedNotes, toggleSave, checkSaved, refresh };
}

// ── useContributorNotes ───────────────────────────────────────────────────────

export function useContributorNotes(contributorId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);

  const refresh = useCallback(() => {
    if (!contributorId) { setNotes([]); return; }
    setNotes(getNotesByContributor(contributorId));
  }, [contributorId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { notes, refresh };
}

// ── usePendingNotes (Review Queue) ────────────────────────────────────────────

export function usePendingNotes() {
  const [pendingNotes, setPendingNotes] = useState<Note[]>([]);

  const refresh = useCallback(() => {
    setPendingNotes(getPendingNotes());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const approve = useCallback((noteId: string, reviewerId: string) => {
    const result = approveNote(noteId, reviewerId);
    refresh();
    return result;
  }, [refresh]);

  const reject = useCallback((noteId: string, reviewerId: string, feedback: string) => {
    const result = rejectNote(noteId, reviewerId, feedback);
    refresh();
    return result;
  }, [refresh]);

  return { pendingNotes, approve, reject, refresh };
}

// ── useNoteEditor — Full editor state machine ─────────────────────────────────

const EMPTY_EDITOR: NoteEditorState = {
  noteId: null,
  title: '',
  summary: '',
  curriculumId: null,
  subjectId: null,
  topicId: null,
  syllabusPoint: '',
  isSyllabusBased: false,
  tags: [],
  blocks: [],
  isDirty: false,
  isSaving: false,
  status: 'draft',
  visibility: 'private',
};

export function useNoteEditor(existingNoteId?: string) {
  const [state, setState] = useState<NoteEditorState>(EMPTY_EDITOR);
  const initialised = useRef(false);

  // Load existing note into editor on mount
  useEffect(() => {
    if (!existingNoteId || initialised.current) return;
    const note = getNoteById(existingNoteId);
    if (note) {
      setState({
        noteId: note.id,
        title: note.title,
        summary: note.summary ?? '',
        curriculumId: note.curriculum_id,
        subjectId: note.subject_id,
        topicId: note.topic_id,
        syllabusPoint: note.syllabus_point ?? '',
        isSyllabusBased: note.is_syllabus_based,
        tags: note.tags,
        blocks: note.blocks,
        isDirty: false,
        isSaving: false,
        status: note.status,
        visibility: note.visibility,
      });
    }
    initialised.current = true;
  }, [existingNoteId]);

  // ── Field setters ──────────────────────────────────────────────────────────

  const setField = useCallback(<K extends keyof NoteEditorState>(
    key: K,
    value: NoteEditorState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value, isDirty: true }));
  }, []);

  // ── Block operations ───────────────────────────────────────────────────────

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

    setState((prev) => ({
      ...prev,
      blocks: [...prev.blocks, block],
      isDirty: true,
    }));
  }, []);

  const updateBlock = useCallback((blockId: string, updates: Partial<NoteBlock>) => {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === blockId ? { ...b, ...updates } as NoteBlock : b
      ),
      isDirty: true,
    }));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== blockId),
      isDirty: true,
    }));
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

  // ── Import blocks parsed from AI response ─────────────────────────────────

  const importParsedBlocks = useCallback((parsed: NoteBlock[]) => {
    setState((prev) => ({
      ...prev,
      blocks: [...prev.blocks, ...parsed],
      isDirty: true,
    }));
  }, []);

  // ── Save draft ─────────────────────────────────────────────────────────────

  const saveDraft = useCallback((contributorId: string) => {
    setState((prev) => ({ ...prev, isSaving: true }));

    const noteData = {
      title: state.title,
      summary: state.summary,
      curriculum_id: state.curriculumId,
      subject_id: state.subjectId,
      topic_id: state.topicId,
      syllabus_point: state.syllabusPoint || undefined,
      is_syllabus_based: state.isSyllabusBased,
      tags: state.tags,
      blocks: state.blocks,
      visibility: state.visibility,
    };

    let result: { success: boolean; note?: Note; error?: string };

    if (state.noteId) {
      const r = updateNote(state.noteId, contributorId, noteData);
      result = r.success ? { success: true, note: r.note } : { success: false, error: r.error };
    } else {
      const created = createNote(contributorId, noteData);
      if (!isNoteSaved(contributorId, created.id)) {
        saveNote(contributorId, created.id);
      }
      result = { success: true, note: created };
    }

    setState((prev) => ({
      ...prev,
      noteId: result.success && result.note ? result.note.id : prev.noteId,
      isDirty: false,
      isSaving: false,
    }));

    return result;
  }, [state]);

  // ── Submit for review ──────────────────────────────────────────────────────

  const submitForReview = useCallback((contributorId: string) => {
    if (!state.noteId) return { success: false as const, error: 'Save the note first.' };
    const result = submitNoteForReview(state.noteId, contributorId);
    if (result.success) {
      setState((prev) => ({ ...prev, status: 'pending_review', isDirty: false }));
    }
    return result;
  }, [state.noteId]);

  // ── Delete note ────────────────────────────────────────────────────────────

  const remove = useCallback((contributorId: string) => {
    if (!state.noteId) return { success: false as const, error: 'No note to delete.' };
    return deleteNote(state.noteId, contributorId);
  }, [state.noteId]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setState(EMPTY_EDITOR);
    initialised.current = false;
  }, []);

  return {
    state,
    setField,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    importParsedBlocks,
    saveDraft,
    submitForReview,
    remove,
    reset,
  };
}
