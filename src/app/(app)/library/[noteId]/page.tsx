'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Individual Note View Page
// Route: /library/[noteId] — accessible to all authenticated users.
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { use } from 'react';
import Link from 'next/link';
import { useSingleNote } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import NoteViewer from '@/components/notes/NoteViewer';

function NotePageContent({ noteId }: { noteId: string }) {
  const { note, loading } = useSingleNote(noteId);
  const { user, isLoading: authLoading } = useAuth();

  if (loading || authLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-background-secondary rounded-xl w-32" />
        <div className="h-48 bg-background-secondary rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-background-secondary rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Determine access rights
  const isAuthor = user?.id === note?.contributor_id;
  const isPrivate = note?.visibility === 'private';
  const hasAccess = note && (!isPrivate || isAuthor);

  if (!note || !hasAccess) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-4 py-20 text-center">
        <div className="text-5xl">📭</div>
        <h1 className="text-xl font-bold text-foreground">Note Not Available</h1>
        <p className="text-foreground-muted text-sm">
          This note doesn't exist, is private, or hasn't been approved yet.
        </p>
        <BackButton href="/library" label="Back to Library" />
      </div>
    );
  }

  return <NoteViewer note={note} />;
}

export default function NoteViewPage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params);
  return <NotePageContent noteId={noteId} />;
}
