import { Suspense } from 'react';
import SharedCountdownView from '@/components/share/SharedCountdownView';

export const metadata = {
  title: 'Shared Exam Countdown — The ANTS',
  description: 'View a shared exam countdown timer.',
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharedCountdownPage({ params }: Props) {
  const { token } = await params;
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <Suspense>
        <SharedCountdownView token={token} />
      </Suspense>
    </main>
  );
}
