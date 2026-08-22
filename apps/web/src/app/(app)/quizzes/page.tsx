// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — My Quizzes Page
// Route: /quizzes — Shows the user's quizzes with create/manage actions.
// ──────────────────────────────────────────────────────────────────────────────

import QuizzesPageClient from '@/components/quizzes/QuizzesPageClient';

export const metadata = {
  title: 'My Quizzes — The ANTs',
  description: 'Create, manage, and host interactive quizzes. Challenge friends in real-time or study at your own pace with custom question decks.',
};

export default function QuizzesPage() {
  return <QuizzesPageClient />;
}
