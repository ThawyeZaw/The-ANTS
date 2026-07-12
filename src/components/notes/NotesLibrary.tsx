'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — NotesLibrary
// Main notes library page with filtering, search, and save functionality.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Filter, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteFilters } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useCourseManager } from '@/hooks/useCourseManager';

import { useNotes, useSavedNotes } from '@/hooks/useNotes';
import NoteCard from './NoteCard';
import NoteFiltersPanel from './NoteFilters';
import NoteReaderModal from './NoteReaderModal';
import { getProfile } from '@/lib/mock/database';

const DEFAULT_FILTERS: NoteFilters = {
  search: '',
  curriculumId: null,
  subjectId: null,
  isSyllabusBased: null,
  tags: [],
};

export default function NotesLibrary() {
  const { user } = useAuth();


  const [filters, setFilters] = useState<NoteFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);

  const { notes } = useNotes(filters);
  const { toggleSave, checkSaved } = useSavedNotes(user?.id);
  const { enrolledCurriculumIds } = useCourseManager();

  // Track saved state for displayed notes (checkSaved is async)
  const [savedNoteIds, setSavedNoteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setSavedNoteIds(new Set()); return; }
    let cancelled = false;
    Promise.all(notes.map((n) => checkSaved(n.id).then((saved) => ({ id: n.id, saved }))))
      .then((results) => {
        if (cancelled) return;
        setSavedNoteIds(new Set(results.filter((r) => r.saved).map((r) => r.id)));
      });
    return () => { cancelled = true; };
  }, [notes, user, checkSaved]);

  // Build a contributor name lookup map
  const contributorNames = useMemo(() => {
    const map = new Map<string, string>();
    notes.forEach((n) => {
      if (!map.has(n.contributor_id)) {
        const profile = getProfile(n.contributor_id);
        if (profile) map.set(n.contributor_id, profile.name);
      }
    });
    return map;
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
            <h1 className="text-2xl font-bold text-foreground">Notes Library</h1>
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
