import { Suspense } from 'react';
import CoursesLibraryBrowser from '@/components/library/CoursesLibraryBrowser';

export const metadata = {
  title: 'Courses — The ANTs',
  description: 'Browse verified curriculum templates from CAIE, Edexcel, IELTS and more. Add to your account and auto-populate your Lesson Tracker and Grade Calculator.',
};

export default function CoursesLibraryPage() {
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <Suspense>
        <CoursesLibraryBrowser />
      </Suspense>
    </main>
  );
}
