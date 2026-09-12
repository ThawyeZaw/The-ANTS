// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — /team (Tutors & Contributors Directory)
// ──────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import TutorsContributorsPageContent from '@/components/explore/TutorsContributorsPageContent';

export const metadata: Metadata = {
  title: 'Tutors & Contributors | The ANTS',
  description:
    'Meet the tutors, academic contributors, and founders behind The ANTS. Browse profiles, filter by role, and connect with educators and curriculum authors.',
};

export default function TeamPage() {
  return <TutorsContributorsPageContent />;
}
