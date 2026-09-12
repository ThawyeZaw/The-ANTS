'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Unified Public Profile Page (Student, Tutor, Contributor, Admin)
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import StaffPublicProfile from '@/components/profile/StaffPublicProfile';
import PortfolioSections from '@/components/profile/PortfolioSections';
import { canHavePublicProfile } from '@the-ants/shared-types';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const username = params.username as string;

  // Handle "me" → redirect to actual username
  useEffect(() => {
    if (username === 'me' && user) {
      router.replace(`/profile/${user.profile.username}`);
    }
  }, [username, user, router]);

  const {
    profile,
    tutorProfile,
    contributorProfile,
    stats,
    activities: timelineActivities,
    certifications: profileCerts,
    isLoading,
    isOwnProfile,
    notFound,
    unavailableReason,
  } = useProfile(username);

  // Loading state
  if (username === 'me' || isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 animate-fade-in">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-sm font-medium text-foreground-muted">Loading profile...</p>
      </div>
    );
  }

  // 404 state
  if (notFound || !profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 animate-fade-in">
        <h1 className="text-xl font-bold text-foreground mb-3">Profile Unavailable</h1>
        <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
          The user <span className="font-mono text-foreground font-semibold">@{username}</span>{' '}
          {unavailableReason === 'student_only'
            ? 'does not have a public profile. Student accounts are private on The ANTS.'
            : unavailableReason === 'private'
              ? 'has set their profile to private.'
              : 'could not be found, or their profile is unavailable.'}
        </p>
        <BackButton href="/team" label="Browse Tutors & Contributors" />
      </div>
    );
  }

  const userRoles = profile.roles || [profile.role];
  const staffEligible = canHavePublicProfile(userRoles);
  const showTutor =
    userRoles.includes('tutor') || userRoles.includes('teacher') || !!tutorProfile;
  const showContributor =
    userRoles.includes('contributor') ||
    userRoles.includes('admin') ||
    userRoles.includes('main_contributor');

  if (staffEligible) {
    return (
      <StaffPublicProfile
        profile={profile}
        tutorProfile={tutorProfile}
        contributorProfile={contributorProfile}
        stats={stats}
        activities={timelineActivities}
        certifications={profileCerts}
        isOwnProfile={isOwnProfile}
        showTutor={showTutor}
        showContributor={showContributor}
      />
    );
  }

  if (isOwnProfile) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
        <BackButton href="/settings" label="Back to Settings" />
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">Student profile preview</p>
            <p className="text-xs text-foreground-muted mt-1">
              Student accounts cannot be listed publicly. Only you can see this preview while signed in.
            </p>
          </div>
          <Link
            href="/settings/profile"
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
          >
            Edit Profile
          </Link>
        </div>
        <PortfolioSections profile={profile} certifications={profileCerts} activities={timelineActivities} />
      </div>
    );
  }

  return null;
}
