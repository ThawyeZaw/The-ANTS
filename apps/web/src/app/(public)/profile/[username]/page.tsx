import type { Metadata } from 'next';
import ProfileView from '@/components/profile/ProfileView';
import { actionGetFullProfile } from '@/actions/profile';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  if (!username || username === 'me') {
    return {
      title: 'Profile | The ANTs',
      description: 'View scholar profile on The ANTs.',
    };
  }

  try {
    const data = await actionGetFullProfile(username, null);
    if (!data.profile || data.notFound) {
      return {
        title: `@${username} | The ANTs`,
        description: `Profile of @${username} on The ANTs.`,
      };
    }

    const title = `${data.profile.name} (@${data.profile.username}) | The ANTs`;
    const description =
      data.profile.bio ||
      data.profile.title ||
      `${data.profile.name}'s verified scholar profile on The ANTs.`;

    const avatarUrl = data.profile.avatar;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://the-ants.org/profile/${data.profile.username}`,
        siteName: 'The ANTs',
        images: avatarUrl
          ? [{ url: avatarUrl }]
          : [{ url: '/og-image.png', width: 1200, height: 630, alt: data.profile.name }],
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images: avatarUrl ? [avatarUrl] : ['/og-image.png'],
      },
    };
  } catch {
    return {
      title: `@${username} | The ANTs`,
      description: `View @${username}'s profile on The ANTs.`,
    };
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  return <ProfileView username={username} />;
}
