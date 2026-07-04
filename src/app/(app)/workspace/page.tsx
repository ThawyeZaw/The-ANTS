import { Suspense } from 'react';
import MyWorkspace from '@/components/workspace/MyWorkspace';

export const metadata = {
  title: 'My Workspace — The ANTS',
  description: 'Your personal study hub. Access all your courses, notes, flashcard decks, and exam countdowns in one place.',
};

export default function WorkspacePage() {
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <Suspense>
        <MyWorkspace />
      </Suspense>
    </main>
  );
}
