'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Contributor Public Profile Page
// Displays a user's public profile by username.
// Handles "me" → redirects to the current user's actual profile URL.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, UserX, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileActivity from '@/components/profile/ProfileActivity';

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

  const { profile, stats, activities, isLoading, isOwnProfile, notFound } = useProfile(username);

  // Show loading while resolving "me" redirect
  if (username === 'me') {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-foreground-muted">Redirecting to your profile...</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Skeleton hero */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="h-36 bg-background-secondary animate-pulse" />
          <div className="px-6 pb-6 -mt-12">
            <div className="flex items-end gap-4">
              <div className="h-24 w-24 rounded-2xl bg-background-secondary animate-pulse ring-4 ring-background-card" />
              <div className="flex-1 pb-1 space-y-2">
                <div className="h-6 w-48 bg-background-secondary rounded animate-pulse" />
                <div className="h-4 w-32 bg-background-secondary rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        {/* Skeleton stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-background-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // 404 state
  if (notFound || !profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-error/10 text-error mb-4">
          <UserX className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Profile Not Found</h1>
        <p className="text-foreground-muted mb-6">
          No user with the username <span className="font-mono text-foreground">@{username}</span> was found.
        </p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    );
  }

  const isContributor = profile.role === 'contributor' || profile.role === 'main_contributor';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-background-card border border-border shadow-sm hover:shadow-md hover:border-primary/40 text-sm font-medium text-foreground transition-all duration-300 cursor-pointer w-fit"
      >
        <ArrowLeft className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:-translate-x-0.5 transition-all duration-300" />
        Go Back
      </button>

      {/* Profile Hero */}
      <ProfileHero profile={profile} isOwnProfile={isOwnProfile} />

      {/* Stats (contributor/main_contributor only) */}
      {isContributor && stats && (
        <ProfileStats stats={stats} memberSince={profile.createdAt} />
      )}

      {/* Activity Feed (contributor/main_contributor only) */}
      {isContributor && <ProfileActivity activities={activities} />}

      {/* Non-contributor minimal profile note */}
      {!isContributor && (
        <div className="bg-background-card border border-border rounded-2xl p-8 text-center">
          <p className="text-sm text-foreground-muted">
            {isOwnProfile
              ? 'Upgrade to a Contributor role to unlock your public profile with stats and activity feed.'
              : `${profile.name} has a ${profile.role === 'student' ? 'student' : 'teacher'} profile. Contributor stats are only available for contributor roles.`}
          </p>
        </div>
      )}
    </div>
  );
}
