'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Pencil, Layers, Award } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import TutorPublicProfile from './TutorPublicProfile';
import ContributorPublicProfile from './ContributorPublicProfile';
import PortfolioSections from './PortfolioSections';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';
import type {
  TutorProfileData,
  ContributorProfileData,
  ContributorStatsData,
  ActivityItem,
} from '@/hooks/useProfile';

type StaffTab = 'overview' | 'tutor' | 'contributor' | 'portfolio';

interface StaffPublicProfileProps {
  profile: Profile;
  tutorProfile: TutorProfileData | null;
  contributorProfile: ContributorProfileData | null;
  stats: ContributorStatsData | null;
  activities: ActivityItem[];
  certifications: any[];
  isOwnProfile: boolean;
  showTutor: boolean;
  showContributor: boolean;
}

export default function StaffPublicProfile({
  profile,
  tutorProfile,
  contributorProfile,
  stats,
  activities,
  certifications,
  isOwnProfile,
  showTutor,
  showContributor,
}: StaffPublicProfileProps) {
  const dualRole = showTutor && showContributor;
  const [activeTab, setActiveTab] = useState<StaffTab>(
    dualRole ? 'overview' : showTutor ? 'tutor' : showContributor ? 'contributor' : 'portfolio'
  );

  if (!dualRole) {
    if (showTutor) {
      return (
        <TutorPublicProfile
          profile={profile}
          tutorProfile={tutorProfile}
          certifications={certifications}
          isOwnProfile={isOwnProfile}
        />
      );
    }
    if (showContributor) {
      return (
        <ContributorPublicProfile
          profile={profile}
          contributorProfile={contributorProfile}
          stats={stats}
          certifications={certifications}
          isOwnProfile={isOwnProfile}
        />
      );
    }
  }

  const tabs: { id: StaffTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
    ...(showTutor ? [{ id: 'tutor' as const, label: 'Tutoring', icon: <GraduationCap className="w-4 h-4" /> }] : []),
    ...(showContributor
      ? [{ id: 'contributor' as const, label: 'Contributing', icon: <Pencil className="w-4 h-4" /> }]
      : []),
    { id: 'portfolio', label: 'Portfolio', icon: <Award className="w-4 h-4" /> },
  ];

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

      <div className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {showTutor && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
              <GraduationCap className="w-3.5 h-3.5" />
              Tutor
            </span>
          )}
          {showContributor && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Pencil className="w-3.5 h-3.5" />
              Contributor
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{profile.name}</h1>
        <p className="text-sm text-foreground-muted font-mono">@{profile.username}</p>
        {profile.bio && (
          <p className="text-sm text-foreground-secondary leading-relaxed max-w-3xl">{profile.bio}</p>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {showTutor && (
            <div className="rounded-2xl border border-border bg-background-card p-5 space-y-2">
              <h2 className="text-sm font-bold text-foreground">Tutoring</h2>
              <p className="text-xs text-foreground-muted">
                {(tutorProfile?.teaching_subjects || profile.teachingSubjects || []).slice(0, 4).join(' · ') ||
                  'Subjects not listed yet'}
              </p>
            </div>
          )}
          {showContributor && (
            <div className="rounded-2xl border border-border bg-background-card p-5 space-y-2">
              <h2 className="text-sm font-bold text-foreground">Contributing</h2>
              <p className="text-xs text-foreground-muted">
                {stats?.published_resources ?? 0} approved resources in The ANTS library
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tutor' && showTutor && (
        <TutorPublicProfile
          profile={profile}
          tutorProfile={tutorProfile}
          certifications={certifications}
          isOwnProfile={isOwnProfile}
          embedded
        />
      )}

      {activeTab === 'contributor' && showContributor && (
        <ContributorPublicProfile
          profile={profile}
          contributorProfile={contributorProfile}
          stats={stats}
          certifications={certifications}
          isOwnProfile={isOwnProfile}
          embedded
        />
      )}

      {activeTab === 'portfolio' && (
        <PortfolioSections profile={profile} certifications={certifications} activities={activities} />
      )}
    </div>
  );
}
