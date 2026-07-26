// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — /explore page
// Unified explore hub: All · Profiles · Clubs with tab navigation.
// ──────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import ExplorePageContent from '@/components/explore/ExplorePageContent';

export const metadata: Metadata = {
  title: 'Explore | The ANTs',
  description: 'Discover students, teachers, contributors, and community clubs in The ANTs community.',
};

export default function ExplorePage() {
  return <ExplorePageContent />;
}
