'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Explore & Tutors Directory
// Discover peers, certified tutors, and academic contributors.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Pencil,
  Shield,
  Compass,
  TrendingUp,
  Loader2,
  Calendar,
  Send,
} from 'lucide-react';
import AvatarImage from '@/components/ui/AvatarImage';
import { UserRole, ROLE_METADATA, PROFILE_THEME_PRESETS } from '@/types';
import { cn } from '@/lib/utils';
import { getAllUsers } from '@/actions/role-upgrade';

type TabType = 'all' | 'tutors' | 'contributors' | 'students';

const TABS: { key: TabType; label: string; icon: any }[] = [
  { key: 'all', label: 'All Community', icon: TrendingUp },
  { key: 'tutors', label: 'Tutors & Teachers', icon: GraduationCap },
  { key: 'contributors', label: 'Contributors', icon: Pencil },
  { key: 'students', label: 'Students', icon: BookOpen },
];

const ROLE_BADGE_CLASSES: Record<string, string> = {
  student: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  tutor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  teacher: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  contributor: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  admin: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  main_contributor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
};

function ProfileCard({ profile }: { profile: any }) {
  const isTutor = (profile.roles || [profile.role]).some((r: string) => r === 'tutor' || r === 'teacher');
  const isContributor = (profile.roles || [profile.role]).some((r: string) => r === 'contributor');
  const isAdmin = (profile.roles || [profile.role]).some((r: string) => r === 'admin' || r === 'main_contributor');

  const primaryRole: string = isAdmin ? 'admin' : isContributor ? 'contributor' : isTutor ? 'tutor' : 'student';

  const themePreset = profile.theme
    ? PROFILE_THEME_PRESETS.find((p) => p.key === profile.theme?.preset)
    : null;
  const accentHex = profile.theme?.accentColor || themePreset?.colors.accent || null;

  const projectCount = profile.projects?.length || 0;
  const activityCount = profile.activities?.length || 0;
  const achievementCount = profile.achievements?.length || 0;

  return (
    <Link href={`/profile/${profile.username}`} className="block group">
      <div
        className="relative bg-background-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 h-full flex flex-col justify-between"
        style={accentHex ? { borderColor: `${accentHex}30` } : undefined}
      >
        {accentHex && (
          <div
            className="h-1 w-full shrink-0"
            style={{ background: `linear-gradient(90deg, ${accentHex}, ${accentHex}88)` }}
          />
        )}

        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Header: avatar + name + role */}
            <div className="flex items-start gap-3 mb-3">
              <div className="relative shrink-0">
                {accentHex && (
                  <div
                    className="absolute inset-0 rounded-full blur-md opacity-40 scale-110"
                    style={{ background: accentHex }}
                  />
                )}
                <AvatarImage avatar={profile.avatar_url} name={profile.name} size="sm" className="relative" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {profile.name}
                </h3>
                <p className="text-xs text-foreground-muted truncate font-mono">@{profile.username}</p>
                {profile.title && (
                  <p className="text-xs text-foreground-secondary mt-0.5 truncate">{profile.title}</p>
                )}
              </div>

              {/* Role badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0',
                  ROLE_BADGE_CLASSES[primaryRole] || ROLE_BADGE_CLASSES.student
                )}
              >
                {isTutor && <GraduationCap className="h-3 w-3" />}
                {isContributor && <Pencil className="h-3 w-3" />}
                {isAdmin && <Shield className="h-3 w-3" />}
                {!isTutor && !isContributor && !isAdmin && <BookOpen className="h-3 w-3" />}
                {primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1)}
              </span>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-foreground-secondary line-clamp-2 mb-3 leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Tutor specific info */}
            {isTutor && profile.teaching_subjects && profile.teaching_subjects.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {profile.teaching_subjects.slice(0, 3).map((sub: string, i: number) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-medium">
                    {sub}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs text-foreground-muted pt-2 border-t border-border/40">
              {projectCount > 0 && <span>{projectCount} project{projectCount !== 1 ? 's' : ''}</span>}
              {activityCount > 0 && <span>{activityCount} activit{activityCount !== 1 ? 'ies' : 'y'}</span>}
              {achievementCount > 0 && <span>{achievementCount} award{achievementCount !== 1 ? 's' : ''}</span>}
              {projectCount === 0 && activityCount === 0 && achievementCount === 0 && (
                <span className="italic text-foreground-muted/60">Community Member</span>
              )}
            </div>

            {/* View profile button */}
            <div
              className="flex items-center gap-1 text-xs font-semibold mt-3 text-primary opacity-80 group-hover:opacity-100 transition-opacity"
            >
              View Profile & Timetable <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const initTab = (searchParams.get('tab') as TabType) || 'all';

  const [activeTab, setActiveTab] = useState<TabType>(initTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getAllUsers()
      .then((users) => {
        setAllProfiles(users || []);
      })
      .catch((err) => {
        console.error('Failed to load explore community profiles:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredProfiles = useMemo(() => {
    return allProfiles.filter((p) => {
      const pRoles: string[] = p.roles || [p.role];

      if (activeTab === 'tutors') {
        if (!pRoles.includes('tutor') && !pRoles.includes('teacher')) return false;
      } else if (activeTab === 'contributors') {
        if (!pRoles.includes('contributor')) return false;
      } else if (activeTab === 'students') {
        if (!pRoles.includes('student')) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchUsername = (p.username || '').toLowerCase().includes(q);
        const matchBio = (p.bio || '').toLowerCase().includes(q);
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        return matchName || matchUsername || matchBio || matchTitle;
      }

      return true;
    });
  }, [allProfiles, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-background-card to-background-secondary border border-border p-6 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Compass className="h-3.5 w-3.5" />
            Explore & Connect
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Meet Tutors, Contributors & Peers
          </h1>
          <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
            Browse verified tutors offering scheduled classes, check community portfolios, and connect with academic contributors.
          </p>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search by name, role, subjects, or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-background-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-background-card text-foreground-muted hover:text-foreground border-border hover:bg-background-secondary'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-background-card border border-border rounded-2xl p-5 animate-pulse h-44" />
          ))}
        </div>
      )}

      {/* Grid of Profile Cards */}
      {!isLoading && (
        <>
          {filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-background-card border border-border rounded-2xl">
              <Users className="w-10 h-10 text-foreground-muted/40 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">No profiles found</h3>
              <p className="text-sm text-foreground-muted mt-1">
                Try adjusting your search query or selecting a different role category.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ExplorePageContent() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>}>
      <ExploreContent />
    </Suspense>
  );
}
