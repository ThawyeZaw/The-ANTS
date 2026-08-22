'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Personal Note Editor Page
// Route: /my-notes/editor — available to every authenticated user (incl. students).
// ──────────────────────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import UserNoteEditor from '@/components/notes/UserNoteEditor';

export default function UserNoteEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <UserNoteEditor />
    </Suspense>
  );
}
