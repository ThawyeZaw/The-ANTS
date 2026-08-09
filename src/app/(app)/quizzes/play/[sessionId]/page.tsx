// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Play Session Page
// Route: /quizzes/play/[sessionId] — Real-time quiz session (player or host).
// ──────────────────────────────────────────────────────────────────────────────

import PlaySessionClient from '@/components/quizzes/PlaySessionClient';

export const metadata = {
  title: 'Playing Quiz — The ANTs',
  description: 'Participate in a live quiz session. Answer questions in real-time and compete on the leaderboard.',
};

export default async function PlaySessionPage(props: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await props.params;
  return <PlaySessionClient sessionId={sessionId} />;
}
