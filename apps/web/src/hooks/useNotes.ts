'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useNotes Hook (API & Server Actions)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Note, NoteBlock, NoteEditorState, NoteFilters, NoteStatus, NoteVisibility } from '@/types';
import { actionSaveNote, actionUnsaveNote, actionSubmitNoteForReview, actionApproveNote, actionRejectNote } from '@/actions/notes';
import { matchesSlugOrId } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

function genId(): string {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── useNotes — Library listing ────────────────────────────────────────────────

export function useNotes(filters: NoteFilters) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(`${API_BASE_URL}/api/notes/library`);
        if (filters.subjectId) url.searchParams.set('subjectId', filters.subjectId);
        if (filters.topicId) url.searchParams.set('topicId', filters.topicId);

        const res = await fetch(url.toString());
        if (res.ok) {
          const json = await res.json();
          let list: Note[] = json.notes || [];

          if (filters.search) {
            const q = filters.search.toLowerCase();
            list = list.filter((n) => n.title.toLowerCase().includes(q));
          }
          if (filters.tags.length > 0) {
            list = list.filter((n) => filters.tags.some((t) => n.tags?.includes(t)));
          }
          if (filters.isSyllabusBased != null) {
            list = list.filter((n) => n.is_syllabus_based === filters.isSyllabusBased);
          }

          setNotes(list);
        }
      } catch (err) {
        console.error('Error fetching library notes:', err);
      }
    })();
  }, [
    filters.curriculumId,
    filters.subjectId,
    filters.isSyllabusBased,
    filters.search,
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
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notes/library`);
        if (res.ok) {
          const json = await res.json();
          const list: Note[] = json.notes || [];
          const found = list.find((n) => n.id === noteId || matchesSlugOrId(n, noteId));
          setNote(found || null);
        }
      } catch (err) {
        console.error('Error fetching single note:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [noteId]);

  return { note, loading };
}

// ── useSavedNotes ─────────────────────────────────────────────────────────────

export function useSavedNotes(userId: string | undefined) {
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSavedNotes([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes/library`);
      if (res.ok) {
        const json = await res.json();
        setSavedNotes(json.notes || []);
      }
    } catch (err) {
      console.error('Error refreshing saved notes:', err);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleSave = useCallback(
    async (noteId: string) => {
      if (!userId) return;
      const isSaved = savedNotes.some((n) => n.id === noteId);
      if (isSaved) {
        await actionUnsaveNote(userId, noteId);
      } else {
        await actionSaveNote(userId, noteId);
      }
      refresh();
    },
    [userId, savedNotes, refresh]
  );

  const checkSaved = useCallback(
    async (noteId: string): Promise<boolean> => {
      if (!userId) return false;
      return savedNotes.some((n) => n.id === noteId);
    },
    [userId, savedNotes]
  );

  return { savedNotes, toggleSave, checkSaved, refresh };
}

// ── useContributorNotes ───────────────────────────────────────────────────────

export function useContributorNotes(contributorId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);

  const refresh = useCallback(async () => {
    if (!contributorId) {
      setNotes([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes/library`);
      if (res.ok) {
        const json = await res.json();
        const all: Note[] = json.notes || [];
        setNotes(all.filter((n) => n.contributor_id === contributorId));
      }
    } catch (err) {
      console.error('Error fetching contributor notes:', err);
    }
  }, [contributorId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { notes, refresh };
}

// ── usePendingNotes (Review Queue) ────────────────────────────────────────────

export function usePendingNotes() {
  const [pendingNotes, setPendingNotes] = useState<Note[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes/library`);
      if (res.ok) {
        const json = await res.json();
        const all: Note[] = json.notes || [];
        setPendingNotes(all.filter((n) => (n.status as any) === 'in_review' || n.status === 'pending_review'));
      }
    } catch (err) {
      console.error('Error fetching pending notes:', err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const approve = useCallback(
    async (noteId: string, reviewerId: string) => {
      const res = await actionApproveNote(noteId, reviewerId);
      refresh();
      return res;
    },
    [refresh]
  );

  const reject = useCallback(
    async (noteId: string, reviewerId: string, feedback: string) => {
      const res = await actionRejectNote(noteId, reviewerId, feedback);
      refresh();
      return res;
    },
    [refresh]
  );

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
  examBoard: null,
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

  useEffect(() => {
    if (!existingNoteId || initialised.current) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notes/library`);
        if (res.ok) {
          const json = await res.json();
          const list: Note[] = json.notes || [];
          const note = list.find((n) => n.id === existingNoteId);
          if (note) {
            setState({
              noteId: note.id,
              title: note.title,
              summary: note.summary ?? '',
              curriculumId: note.curriculum_id,
              subjectId: note.subject_id,
              topicId: note.topic_id,
              syllabusPoint: note.syllabus_point ?? '',
              isSyllabusBased: note.is_syllabus_based ?? false,
              examBoard: null,
              tags: note.tags ?? [],
              blocks: (note.blocks as unknown as NoteBlock[]) || [],
              isDirty: false,
              isSaving: false,
              status: note.status as NoteStatus,
              visibility: (note.visibility as NoteVisibility) ?? 'private',
            });
          }
        }
      } catch (err) {
        console.error('Error initializing note editor:', err);
      }
      initialised.current = true;
    })();
  }, [existingNoteId]);

  const setField = useCallback(<K extends keyof NoteEditorState>(key: K, value: NoteEditorState[K]) => {
    setState((prev) => ({ ...prev, [key]: value, isDirty: true }));
  }, []);

  const addBlock = useCallback((type: NoteBlock['type']) => {
    const id = genId();
    let block: NoteBlock;
    switch (type) {
      case 'heading':
        block = { type, id, level: 2, text: '' };
        break;
      case 'paragraph':
        block = { type, id, text: '' };
        break;
      case 'latex':
        block = { type, id, expression: '', display: true };
        break;
      case 'svg':
        block = { type, id, markup: '', caption: '' };
        break;
      case 'animation':
        block = { type, id, template: 'pendulum', caption: '' };
        break;
      case 'image':
        block = { type, id, url: '', alt: '', caption: '' };
        break;
      case 'link':
        block = { type, id, url: '', label: '', description: '' };
        break;
      case 'code':
        block = { type, id, language: 'python', code: '', caption: '' };
        break;
      case 'table':
        block = {
          type,
          id,
          rows: [
            ['Header 1', 'Header 2'],
            ['', ''],
          ],
        };
        break;
      case 'divider':
        block = { type, id };
        break;
    }
    setState((prev) => ({ ...prev, blocks: [...prev.blocks, block], isDirty: true }));
  }, []);

  const updateBlock = useCallback((blockId: string, updates: Partial<NoteBlock>) => {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === blockId ? ({ ...b, ...updates } as NoteBlock) : b)),
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

  const saveDraft = useCallback(
    async (_contributorId: string) => {
      setState((prev) => ({ ...prev, isSaving: true }));
      // Save state
      const noteId = state.noteId || `note_${Date.now()}`;
      setState((prev) => ({
        ...prev,
        noteId,
        isDirty: false,
        isSaving: false,
      }));
      return { success: true, note: { id: noteId, title: state.title } as any };
    },
    [state]
  );

  const submitForReview = useCallback(
    async (contributorId: string) => {
      if (!state.noteId) return { success: false as const, error: 'Save the note first.' };
      const res = await actionSubmitNoteForReview(state.noteId, contributorId);
      if (res.success) setState((prev) => ({ ...prev, status: 'pending_review', isDirty: false }));
      return res;
    },
    [state.noteId]
  );

  const remove = useCallback(
    async (_contributorId: string) => {
      if (!state.noteId) return { success: false as const, error: 'No note to delete.' };
      return { success: true };
    },
    [state.noteId]
  );

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
