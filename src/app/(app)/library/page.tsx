// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Notes Library Page
// Route: /library — accessible to all authenticated users.
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import type { Metadata } from 'next';
import NotesLibrary from '@/components/notes/NotesLibrary';

export const metadata: Metadata = {
  title: 'Notes Library — The ANTS',
  description: 'Browse, search, and save curriculum-aligned study notes created by expert contributors.',
};

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Back" />
      <NotesLibrary />
    </div>
  );
}
