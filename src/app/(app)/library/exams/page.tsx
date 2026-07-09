import { Suspense } from 'react';
import ExamsLibraryBrowser from '@/components/library/ExamsLibraryBrowser';

export const metadata = {
  title: 'Exams Library — The ANTs',
  description: 'Browse exam dates and papers by board. Add IGCSE, A Level, IELTS and more exams directly to your countdown dashboard.',
};

export default function ExamsLibraryPage() {
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <Suspense>
        <ExamsLibraryBrowser />
      </Suspense>
    </main>
  );
}
