// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Take Quiz Page
// Route: /quizzes/[id]/take — Async quiz-taking mode.
// ──────────────────────────────────────────────────────────────────────────────

import TakeQuizClient from '@/components/quizzes/TakeQuizClient';

export const metadata = {
  title: 'Take Quiz — The ANTs',
  description: 'Take an interactive quiz to test your knowledge. Choose from multiple choice, true/false, and short answer questions.',
};

export default async function TakeQuizPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <TakeQuizClient quizId={id} />;
}
