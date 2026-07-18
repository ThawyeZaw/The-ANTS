'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — My Notes
// Single page with a tab switcher:
//   • Personal — private notes authored by the user (any role, incl. students)
//   • Official — library notes (saved by the user; created-by-me for contributors)
// Official notes can only be authored by Contributors / Main Contributors.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Plus, Lock, Landmark, AlertTriangle, ShieldCheck, PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserNote } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useUserNotes } from '@/hooks/useUserNotes';
import { useSavedNotes, useContributorNotes } from '@/hooks/useNotes';
import { useLessonContext } from '@/context/LessonContext';
import UserNoteCard from '@/components/notes/UserNoteCard';
import NoteCard from '@/components/notes/NoteCard';
import NoteReaderModal from '@/components/notes/NoteReaderModal';

type NotesTab = 'personal' | 'official';

export default function MyNotesPage() {
  const { user } = useAuth();
  const { isContributor, isMainContributor } = useRole();
  const canAuthorOfficial = isContributor || isMainContributor;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<NotesTab>('personal');

  // ── Personal notes (Supabase user_notes) ──
  const { notes: personalNotes, isLoading: personalLoading, updateNote, deleteNote } = useUserNotes();
  const [pendingDelete, setPendingDelete] = useState<UserNote | null>(null);

  // ── Official notes (Supabase notes + user_saved_notes) ──
  const { savedNotes, toggleSave } = useSavedNotes(user?.id);
  const { notes: createdOfficialNotes } = useContributorNotes(canAuthorOfficial ? user?.id : undefined);
  const [readerNoteId, setReaderNoteId] = useState<string | null>(null);

  // ── Resolve subject / topic names for personal note badges ──
  const { enrolledCurriculums } = useLessonContext();
  const nameLookup = useMemo(() => {
    const subjects = new Map<string, string>();
    const topics = new Map<string, string>();
    enrolledCurriculums.forEach((c) =>
      c.subjects.forEach((s) => {
        subjects.set(s.id, s.title);
        s.topics.forEach((t) => topics.set(t.id, t.title));
      })
    );
    return { subjects, topics };
  }, [enrolledCurriculums]);

  const officialNotes = useMemo(() => {
    // Contributors see their created notes merged with their saved notes (no dupes)
    const map = new Map(createdOfficialNotes.map((n) => [n.id, n]));
    savedNotes.forEach((n) => { if (!map.has(n.id)) map.set(n.id, n); });
    return [...map.values()];
  }, [createdOfficialNotes, savedNotes]);

  const savedIds = useMemo(() => new Set(savedNotes.map((n) => n.id)), [savedNotes]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteNote(pendingDelete.id);
    setPendingDelete(null);
  };

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
              {activeTab === 'personal'
                ? `${personalNotes.length} personal note${personalNotes.length !== 1 ? 's' : ''} — only you can see these`
                : `${officialNotes.length} official note${officialNotes.length !== 1 ? 's' : ''} from the library`}
            </p>
          </div>
        </div>

        {/* Create actions */}
        {activeTab === 'personal' ? (
          <Link
            href="/my-notes/editor"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-xl text-sm hover:bg-primary/95 transition-all shadow-md shadow-primary/20 shrink-0"
          >
            <Plus className="h-4 w-4" />
            New Personal Note
          </Link>
        ) : canAuthorOfficial ? (
          <Link
            href="/editor/notes"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl text-sm hover:opacity-90 transition-all shadow-md shrink-0"
          >
            <PenLine className="h-4 w-4" />
            Create Official Note
          </Link>
        ) : null}
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab('personal')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 border-b-2 font-medium text-sm transition-all -mb-px cursor-pointer',
            activeTab === 'personal'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-foreground-muted hover:text-foreground hover:border-border'
          )}
        >
          <Lock className="h-3.5 w-3.5" />
          Personal
        </button>
        <button
          onClick={() => setActiveTab('official')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 border-b-2 font-medium text-sm transition-all -mb-px cursor-pointer',
            activeTab === 'official'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-foreground-muted hover:text-foreground hover:border-border'
          )}
        >
          <Landmark className="h-3.5 w-3.5" />
          Official
        </button>
      </div>

      {/* ── Personal tab ── */}
      {activeTab === 'personal' && (
        personalLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : personalNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center bg-background-card border border-dashed border-border rounded-2xl">
            <div className="text-5xl">📝</div>
            <p className="text-lg font-semibold text-foreground">No personal notes yet</p>
            <p className="text-foreground-muted text-sm max-w-xs">
              Create your own private study notes with rich blocks, equations, and AI-assisted generation.
            </p>
            <Link
              href="/my-notes/editor"
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/95 transition-all shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              Create Your First Note
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {personalNotes.map((note) => (
              <UserNoteCard
                key={note.id}
                note={note}
                subjectName={note.subject_id ? nameLookup.subjects.get(note.subject_id) : null}
                topicName={note.topic_id ? nameLookup.topics.get(note.topic_id) : null}
                onEdit={(id) => router.push(`/my-notes/editor?id=${id}`)}
                onDelete={(id) => setPendingDelete(personalNotes.find((n) => n.id === id) ?? null)}
                onTogglePin={(id, pinned) => updateNote(id, { is_pinned: pinned })}
              />
            ))}
          </div>
        )
      )}

      {/* ── Official tab ── */}
      {activeTab === 'official' && (
        <>
          {!canAuthorOfficial && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-sm text-foreground-secondary">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              Official notes are written and reviewed by Contributors. Browse the library and save the ones you need.
            </div>
          )}

          {officialNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center bg-background-card border border-dashed border-border rounded-2xl">
              <div className="text-5xl">🔖</div>
              <p className="text-lg font-semibold text-foreground">No official notes here yet</p>
              <p className="text-foreground-muted text-sm max-w-xs">
                {canAuthorOfficial
                  ? "You haven't created or saved any official notes yet."
                  : "You haven't saved any official notes yet. Explore the library to add notes to your collection!"}
              </p>
              <Link
                href="/library"
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/95 transition-all shadow-md shadow-primary/20"
              >
                <BookOpen className="h-4 w-4" />
                Browse Notes Library
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {officialNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isSaved={savedIds.has(note.id)}
                  onToggleSave={toggleSave}
                  onEdit={
                    canAuthorOfficial && note.contributor_id === user?.id
                      ? (id) => router.push(`/editor/notes?id=${id}`)
                      : undefined
                  }
                  onRead={setReaderNoteId}
                />
              ))}
            </div>
          )}

          <NoteReaderModal
            noteId={readerNoteId}
            onClose={() => setReaderNoteId(null)}
            allNotes={officialNotes}
          />
        </>
      )}

      {/* ── Delete confirmation modal (personal notes) ── */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-background-card border border-border rounded-2xl p-6 shadow-xl animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Delete this note?</h3>
            </div>
            <p className="text-sm text-foreground-muted mb-5">
              &ldquo;{pendingDelete.title || 'Untitled Note'}&rdquo; will be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 rounded-xl border border-border bg-background-secondary text-sm font-medium text-foreground hover:border-border-hover transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all cursor-pointer"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
