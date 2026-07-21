import type { Metadata } from 'next';
import ClubsPageContent from '@/components/explore/ClubsPageContent';

export const metadata: Metadata = {
  title: 'Explore Clubs | The ANTs',
  description: 'Discover community spaces for subjects, CCAs, and projects.',
};

export default function ExploreClubsPage() {
  return <ClubsPageContent />;
}
