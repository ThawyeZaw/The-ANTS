'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — NotesLibrary
// Main notes library page with filtering, search, and save functionality.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Filter, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteFilters } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useCourseManager } from '@/hooks/useCourseManager';

import NoteCard from './NoteCard';
import NoteFiltersPanel from './NoteFilters';
import NoteReaderModal from './NoteReaderModal';
import { createClient } from '@/lib/supabase/client';
import { actionSaveNote, actionUnsaveNote } from '@/actions/notes';
import type { Note } from '@/types';

const DEFAULT_FILTERS: NoteFilters = {
  search: '',
  curriculumId: null,
  subjectId: null,
  topicId: null,
  isSyllabusBased: null,
  tags: [],
};

export default function NotesLibrary() {
  const { user } = useAuth();

  const [filters, setFilters] = useState<NoteFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [savedNoteIds, setSavedNoteIds] = useState<Set<string>>(new Set());
  const [rawNotes, setRawNotes] = useState<Note[]>([]);

  const { enrolledCurriculumIds } = useCourseManager();

  // Fetch notes and saved state from Supabase
  useEffect(() => {
    async function fetchNotesData() {
      const supabase = createClient();
      if (!supabase) return;

      let query = supabase.from('notes').select('*');
      if (filters.curriculumId) query = query.eq('curriculum_id', filters.curriculumId);
      if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);

      const { data } = await query;
      if (data) setRawNotes(data as unknown as Note[]);

      if (user) {
        const { data: savedRows } = await supabase
          .from('user_saved_notes')
          .select('note_id')
          .eq('user_id', user.id);
        if (savedRows) {
          setSavedNoteIds(new Set(savedRows.map((s: any) => s.note_id)));
        }
      }
    }

    fetchNotesData();
  }, [user, filters.curriculumId, filters.subjectId]);

  // Filter notes client-side for search & tags
  const notes = useMemo(() => {
    let list = rawNotes;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(n => n.title.toLowerCase().includes(q) || n.summary?.toLowerCase().includes(q));
    }
    if (filters.tags && filters.tags.length > 0) {
      list = list.filter(n => filters.tags.some(t => n.tags?.includes(t)));
    }
    return list;
  }, [rawNotes, filters.search, filters.tags]);

  // Toggle save using server action
  const toggleSave = useCallback(async (noteId: string) => {
    if (!user) return;
    const isSaved = savedNoteIds.has(noteId);
    if (isSaved) {
      await actionUnsaveNote(user.id, noteId);
      setSavedNoteIds(prev => { const next = new Set(prev); next.delete(noteId); return next; });
    } else {
      await actionSaveNote(user.id, noteId);
      setSavedNoteIds(prev => new Set([...prev, noteId]));
    }
  }, [user, savedNoteIds]);

  // Build a contributor name lookup map
  const [contributorNames, setContributorNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    async function fetchProfiles() {
      if (notes.length === 0) return;
      const supabase = createClient();
      if (!supabase) return;

      const contributorIds = [...new Set(notes.map(n => n.contributor_id).filter(Boolean))];
      if (contributorIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', contributorIds);

      if (profiles) {
        const map = new Map<string, string>();
        ((profiles as any[]) ?? []).forEach((p: any) => map.set(p.id, p.name || 'Anonymous'));
        setContributorNames(map);
      }
    }

    fetchProfiles();
  }, [notes]);

  // Apply enrolled filter
  const displayNotes = useMemo(() => {
    if (!showEnrolledOnly) return notes;
    return notes.filter(n => n.curriculum_id && enrolledCurriculumIds.includes(n.curriculum_id));
  }, [notes, showEnrolledOnly, enrolledCurriculumIds]);

  const activeFilterCount = [
    filters.curriculumId,
    filters.subjectId,
    filters.isSyllabusBased !== null ? filters.isSyllabusBased : null,
  ].filter(Boolean).length + filters.tags.length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Notes Library</h1>
            <p className="text-sm text-foreground-muted">
              {notes.length} note{notes.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Smart Filter */}
        <div className="flex border border-[var(--border)] rounded-xl bg-[var(--background-secondary)] p-1 shrink-0">
          <button
            onClick={() => setShowEnrolledOnly(false)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              !showEnrolledOnly
                ? 'bg-[var(--background-card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            All Notes
          </button>
          <button
            onClick={() => setShowEnrolledOnly(true)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              showEnrolledOnly
                ? 'bg-[var(--background-card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            My Courses
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle (mobile) */}
          <button
            id="notes-toggle-filters"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer',
              showFilters || activeFilterCount > 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background-card text-foreground-muted hover:text-foreground'
            )}
          >
            {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            Filters
            {activeFilterCount > 0 && (
              <span className="text-xs bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Create note button */}
          <Link
            href="/editor/notes"
            id="create-note-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
          >
            <Plus className="h-4 w-4" />
            Create Note
          </Link>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ── Sidebar Filters (desktop always visible, mobile toggle) ── */}
        <aside className={cn(
          'w-64 shrink-0 space-y-4',
          'lg:block',
          showFilters ? 'block' : 'hidden',
          'lg:sticky lg:top-24 lg:self-start'
        )}>
          <div className="bg-background-card border border-border rounded-2xl p-4">
            <NoteFiltersPanel filters={filters} onFiltersChange={setFilters} />
          </div>
        </aside>

        {/* ── Notes Grid ── */}
        <main className="flex-1 min-w-0">
          {displayNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="text-5xl">📚</div>
              <p className="text-lg font-semibold text-foreground">No notes found</p>
              <p className="text-foreground-muted text-sm max-w-xs">
                {filters.search
                  ? `No notes match "${filters.search}". Try a different search.`
                  : 'Adjust your filters or check back later for new notes.'}
              </p>
              <Link
                href="/editor/notes"
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Be the first to create one
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isSaved={user ? savedNoteIds.has(note.id) : false}
                  onToggleSave={toggleSave}
                  contributorName={contributorNames.get(note.contributor_id)}
                  onRead={setActiveNoteId}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Inline Reader Overlay ── */}
      <NoteReaderModal
        noteId={activeNoteId}
        onClose={() => setActiveNoteId(null)}
        allNotes={notes}
      />
    </div>
  );
}
