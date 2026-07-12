import { Suspense } from 'react';
import FlashcardsLibraryBrowser from '@/components/library/FlashcardsLibraryBrowser';

export const metadata = {
  title: 'Flashcards Library — The ANTs',
  description: 'Browse contributor-approved flashcard decks tagged by exam board and syllabus code. Add to your study collection instantly.',
};

export default function FlashcardsLibraryPage() {
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <Suspense>
        <FlashcardsLibraryBrowser />
      </Suspense>
    </main>
  );
}
