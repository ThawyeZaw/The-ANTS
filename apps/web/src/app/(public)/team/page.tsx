// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — /team (Tutors & Contributors Directory)
// ──────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import TutorsContributorsPageContent from '@/components/explore/TutorsContributorsPageContent';

export const metadata: Metadata = {
  title: 'Tutors & Contributors | The ANTS',
  description:
    'Meet the tutors, academic contributors, and founders behind The ANTS. Browse profiles, filter by role, and connect with educators and curriculum authors.',
  openGraph: {
    title: 'Tutors & Contributors | The ANTS',
    description:
      'Meet the tutors, academic contributors, and founders behind The ANTS. Browse profiles, filter by role, and connect with educators and curriculum authors.',
    url: 'https://the-ants.org/team',
    siteName: 'The ANTs',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tutors & Contributors | The ANTS',
    description: 'Meet the tutors, academic contributors, and founders behind The ANTS.',
    images: ['/og-image.png'],
  },
};

export default function TeamPage() {
  return <TutorsContributorsPageContent />;
}
