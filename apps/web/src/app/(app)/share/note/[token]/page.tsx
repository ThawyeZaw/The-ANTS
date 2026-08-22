import { Suspense } from 'react';
import SharedNoteView from '@/components/share/SharedNoteView';

export const metadata = {
  title: 'Shared Note — The ANTs',
  description: 'View a shared study note.',
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharedNotePage({ params }: Props) {
  const { token } = await params;
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <Suspense>
        <SharedNoteView token={token} />
      </Suspense>
    </main>
  );
}
