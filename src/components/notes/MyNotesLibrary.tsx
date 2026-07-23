'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — MyNotesLibrary
// Personal notes workspace — only displays notes created by the logged-in user.
// To access notes from other contributors, users must save them from the Library.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Filter, BookOpen, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteFilters, Note } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import NoteCard from './NoteCard';
import NoteFiltersPanel from './NoteFilters';
import NoteReaderModal from './NoteReaderModal';
import { getNotesByContributor, deleteNote } from '@/lib/mock/database';

const DEFAULT_FILTERS: NoteFilters = {
  search: '',
  curriculumId: null,
  subjectId: null,
  isSyllabusBased: null,
  tags: [],
};

export default function MyNotesLibrary() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<NoteFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [createdNotes, setCreatedNotes] = useState<Note[]>([]);

  // Load only notes created by the current user
  useEffect(() => {
    if (user?.id) {
      setCreatedNotes(getNotesByContributor(user.id));
    }
  }, [user?.id]);

  const handleDeleteNote = (noteId: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      const result = deleteNote(noteId, user.id);
      if (result.success) {
        setCreatedNotes(prev => prev.filter(n => n.id !== noteId));
      } else {
        alert(result.error);
      }
    }
  };

  // Client-side filtering (only on user's own created notes)
  const filteredNotes = useMemo(() => {
    return createdNotes.filter((note) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(q);
        const matchesSummary = (note.summary ?? '').toLowerCase().includes(q);
        const matchesTags = note.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesTags) return false;
      }
      if (filters.curriculumId && note.curriculum_id !== filters.curriculumId) return false;
      if (filters.subjectId && note.subject_id !== filters.subjectId) return false;
      if (filters.isSyllabusBased !== null && note.is_syllabus_based !== filters.isSyllabusBased) return false;
      if (filters.tags.length > 0 && !filters.tags.some((tag) => note.tags.includes(tag))) return false;

      return true;
    });
  }, [createdNotes, filters]);

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
            <h1 className="text-2xl font-bold text-foreground">My Notes</h1>
            <p className="text-sm text-foreground-muted">
              {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} created by you
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/library"
            className="flex items-center gap-2 px-4 py-2 border border-border text-foreground-secondary font-medium rounded-xl text-sm hover:bg-background-secondary transition-all shrink-0"
          >
            <BookOpen className="h-4 w-4" />
            Browse Library
          </Link>
          <Link
            href="/editor/notes"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-xl text-sm hover:bg-primary/95 transition-all shadow-md shadow-primary/20 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Note
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Section label */}
        <p className="text-sm font-medium text-foreground-muted">
          Showing only notes you have personally created
        </p>

        <div className="flex items-center gap-2">
          {/* Filter toggle (mobile) */}
          <button
            id="my-notes-toggle-filters"
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
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center bg-background-card border border-dashed border-border rounded-2xl">
              <div className="text-5xl">📝</div>
              <p className="text-lg font-semibold text-foreground">No notes found</p>
              <p className="text-foreground-muted text-sm max-w-xs">
                {filters.search
                  ? `No notes match "${filters.search}".`
                  : "You haven't created any notes yet. Create your first note or browse the library to save notes from other contributors."}
              </p>
              {!filters.search && (
                <div className="flex gap-2 mt-2">
                  <Link
                    href="/editor/notes"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/95 transition-all shadow-md shadow-primary/20"
                  >
                    <Plus className="h-4 w-4" />
                    Create Note
                  </Link>
                  <Link
                    href="/library"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-foreground-secondary text-sm font-medium hover:bg-background-secondary transition-all"
                  >
                    <BookOpen className="h-4 w-4" />
                    Browse Library
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={(id) => window.location.href = `/editor/notes?id=${id}`}
                  onDelete={(id) => handleDeleteNote(id)}
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
        allNotes={createdNotes}
      />
    </div>
  );
}
