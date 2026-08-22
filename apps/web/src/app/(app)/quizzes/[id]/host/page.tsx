// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Host Live Session Page
// Route: /quizzes/[id]/host — Creates and manages a live quiz session.
// ──────────────────────────────────────────────────────────────────────────────

import HostSessionClient from '@/components/quizzes/HostSessionClient';

export const metadata = {
  title: 'Host Live Quiz — The ANTs',
  description: 'Host a live quiz session. Control the pace, see real-time results, and engage participants with Kahoot-style gameplay.',
};

export default async function HostSessionPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <HostSessionClient quizId={id} />;
}
