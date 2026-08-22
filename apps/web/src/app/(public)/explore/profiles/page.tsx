import type { Metadata } from 'next';
import ProfilesPageContent from '@/components/explore/ProfilesPageContent';

export const metadata: Metadata = {
  title: 'Explore Profiles | The ANTs',
  description: 'Discover students, teachers, and contributors in the community. Browse portfolios, projects, and achievements.',
};

export default function ExploreProfilesPage() {
  return <ProfilesPageContent />;
}
