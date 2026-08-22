// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Quiz Detail Page
// Route: /quizzes/[id] — Shows a single quiz with questions and actions.
// ──────────────────────────────────────────────────────────────────────────────

import QuizDetailClient from '@/components/quizzes/QuizDetailClient';

export const metadata = {
  title: 'Quiz Details — The ANTs',
  description: 'View and manage your quiz. Host a live session, take the quiz, or share with others.',
};

export default async function QuizDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <QuizDetailClient quizId={id} />;
}
