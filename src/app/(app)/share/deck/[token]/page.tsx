import { Suspense } from 'react';
import SharedDeckView from '@/components/share/SharedDeckView';

export const metadata = {
  title: 'Shared Flashcard Deck — The ANTS',
  description: 'View a shared flashcard deck. Study interactively with spaced repetition.',
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharedDeckPage({ params }: Props) {
  const { token } = await params;
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <Suspense>
        <SharedDeckView token={token} />
      </Suspense>
    </main>
  );
}
