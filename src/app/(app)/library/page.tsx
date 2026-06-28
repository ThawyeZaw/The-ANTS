// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Notes Library Page
// Route: /library — accessible to all authenticated users.
// ──────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import NotesLibrary from '@/components/notes/NotesLibrary';

export const metadata: Metadata = {
  title: 'Notes Library — The ANTS',
  description: 'Browse, search, and save curriculum-aligned study notes created by expert contributors.',
};

export default function LibraryPage() {
  return <NotesLibrary />;
}
