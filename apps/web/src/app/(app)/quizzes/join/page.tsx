// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Join Live Session Page
// Route: /quizzes/join — Enter a join code to participate in a live session.
// ──────────────────────────────────────────────────────────────────────────────

import JoinSessionClient from '@/components/quizzes/JoinSessionClient';

export const metadata = {
  title: 'Join a Live Quiz — The ANTs',
  description: 'Enter a join code to participate in a live quiz session. Real-time questions, instant scoring, and friendly competition.',
};

export default function JoinSessionPage() {
  return <JoinSessionClient />;
}
