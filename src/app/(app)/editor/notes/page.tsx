'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Notes Editor Page
// Route: /editor/notes — Contributor and Main Contributor only.
// ──────────────────────────────────────────────────────────────────────────────

import { Suspense } from 'react';

import NotesEditor from '@/components/notes/NotesEditor';

function EditorGuard() {


  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <NotesEditor />
    </Suspense>
  );
}

export default function NotesEditorPage() {
  return <EditorGuard />;
}
