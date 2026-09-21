'use client';

import BackButton from '@/components/ui/BackButton';
import Link from 'next/link';
import PortfolioSections from './PortfolioSections';
import ProfileHero from './ProfileHero';
import { ScholarStatsStrip } from '@/components/gamification/ScholarStatsStrip';
import type { Profile } from '@/types';
import type { ActivityItem } from '@/hooks/useProfile';

interface StaffPublicProfileProps {
  profile: Profile;
  tutorProfile: any;
  contributorProfile: any;
  stats: any;
  activities: ActivityItem[];
  certifications: any[];
  isOwnProfile: boolean;
  showTutor: boolean;
  showContributor: boolean;
}

export default function StaffPublicProfile({
  profile,
  activities,
  certifications,
  isOwnProfile,
}: StaffPublicProfileProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <BackButton href="/team" label="Back to Tutors & Contributors" />
        {isOwnProfile && (
          <Link
            href="/settings/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-background-card border border-border hover:border-primary text-foreground transition-all"
          >
            Edit Profile
          </Link>
        )}
      </div>

      <ProfileHero profile={profile} isOwnProfile={isOwnProfile} />

      {profile.leaderboardVisible !== false && (
        <ScholarStatsStrip userId={profile.id} />
      )}

      <div className="pt-6 border-t border-border">
        <PortfolioSections profile={profile} certifications={certifications} activities={activities} />
      </div>
    </div>
  );
}
