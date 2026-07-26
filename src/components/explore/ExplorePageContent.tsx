'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ExplorePageContent (Unified Explore)
// Single /explore page with tabs: All · Profiles · Clubs
// Profile cards show theme accent color. Mixed results grid in "All" tab.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  MessageSquare,
  Search,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Pencil,
  Shield,
  Compass,
  TrendingUp,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import AvatarImage from '@/components/ui/AvatarImage';
import { getPublicProfiles, getClubs, getClubMembers } from '@/lib/mock/database';
import { UserRole, ROLE_METADATA, PROFILE_THEME_PRESETS } from '@/types';
import { cn } from '@/lib/utils';

// ── Tab types ─────────────────────────────────────────────────────────────────

type TabType = 'all' | 'profiles' | 'clubs';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'profiles', label: 'Profiles', icon: <Users className="h-4 w-4" /> },
  { key: 'clubs', label: 'Clubs', icon: <MessageSquare className="h-4 w-4" /> },
];

// ── Role filter config ────────────────────────────────────────────────────────

const ROLE_FILTERS: { label: string; role: UserRole | null; icon: React.ReactNode }[] = [
  { label: 'All roles', role: null, icon: <Users className="h-3.5 w-3.5" /> },
  { label: 'Students', role: 'student', icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { label: 'Teachers', role: 'teacher', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { label: 'Contributors', role: 'contributor', icon: <Pencil className="h-3.5 w-3.5" /> },
  { label: 'Main Contributors', role: 'main_contributor', icon: <Shield className="h-3.5 w-3.5" /> },
];

const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  student: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  teacher: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  contributor: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  main_contributor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
};

// ── Profile card with accent color ───────────────────────────────────────────

function ProfileCard({ profile }: { profile: any }) {
  const roleMeta = ROLE_METADATA[profile.role as UserRole];

  // Derive accent color from profile theme
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
        className="relative bg-background-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 h-full"
        style={accentHex ? { borderColor: `${accentHex}30` } : undefined}
      >
        {/* Accent color top bar */}
        {accentHex && (
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${accentHex}, ${accentHex}88)` }}
          />
        )}

        <div className="p-5">
          {/* Header: avatar + name + role */}
          <div className="flex items-start gap-3 mb-3">
            <div className="relative shrink-0">
              {accentHex && (
                <div
                  className="absolute inset-0 rounded-full blur-md opacity-40 scale-110"
                  style={{ background: accentHex }}
                />
              )}
              <AvatarImage avatar={profile.avatar} name={profile.name} size="sm" className="relative" />
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
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0',
              ROLE_BADGE_CLASSES[profile.role as UserRole]
            )}>
              {profile.role === 'student' && <GraduationCap className="h-3 w-3" />}
              {profile.role === 'teacher' && <BookOpen className="h-3 w-3" />}
              {profile.role === 'contributor' && <Pencil className="h-3 w-3" />}
              {profile.role === 'main_contributor' && <Shield className="h-3 w-3" />}
              {roleMeta.displayName}
            </span>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-foreground-secondary line-clamp-2 mb-3 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-foreground-muted">
            {projectCount > 0 && <span>{projectCount} project{projectCount !== 1 ? 's' : ''}</span>}
            {activityCount > 0 && <span>{activityCount} activit{activityCount !== 1 ? 'ies' : 'y'}</span>}
            {achievementCount > 0 && <span>{achievementCount} award{achievementCount !== 1 ? 's' : ''}</span>}
            {projectCount === 0 && activityCount === 0 && achievementCount === 0 && (
              <span className="italic text-foreground-muted/60">No portfolio yet</span>
            )}
          </div>

          {/* View profile arrow */}
          <div
            className="flex items-center gap-1 text-sm font-semibold mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: accentHex || 'var(--primary)' }}
          >
            View Profile <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Club card ─────────────────────────────────────────────────────────────────

function ClubCard({ club }: { club: any }) {
  const memberCount = getClubMembers(club.id).filter((m: any) => m.membership_status === 'active').length;

  return (
    <Link href={`/explore/clubs/${club.id}`} className="block group">
      <div className="bg-background-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-blue-400 text-white shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <span className={cn(
            'text-xs px-2.5 py-1 rounded-full border font-medium',
            club.join_mode === 'open' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            club.join_mode === 'approval_based' && 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            club.join_mode === 'invite_link' && 'bg-violet-500/10 text-violet-600 border-violet-500/20',
          )}>
            {club.join_mode === 'open' ? 'Open' : club.join_mode === 'approval_based' ? 'Approval' : 'Invite'}
          </span>
        </div>

        <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
          {club.name}
        </h3>
        <p className="text-sm text-foreground-secondary line-clamp-2 mb-4 leading-relaxed">
          {club.description || 'No description'}
        </p>

        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            View <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Type discriminator card for "All" tab ─────────────────────────────────────

type MixedItem =
  | { kind: 'profile'; data: any }
  | { kind: 'club'; data: any };

// ── Main content ──────────────────────────────────────────────────────────────

function ExploreContent() {
  const searchParams = useSearchParams();
  const initTab = (searchParams.get('tab') as TabType) || 'all';
  const initRole = searchParams.get('role') as UserRole | null;

  const [activeTab, setActiveTab] = useState<TabType>(initTab);
  const [roleFilter, setRoleFilter] = useState<UserRole | null>(initRole);
  const [searchQuery, setSearchQuery] = useState('');

  // Load data
  const allProfiles = useMemo(() => getPublicProfiles(), []);
  const allClubs    = useMemo(() => getClubs(), []);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    let profiles = roleFilter ? allProfiles.filter(p => p.role === roleFilter) : allProfiles;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      profiles = profiles.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        (p.bio && p.bio.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q))
      );
    }
    return profiles;
  }, [allProfiles, roleFilter, searchQuery]);

  // Filter clubs
  const filteredClubs = useMemo(() => {
    if (!searchQuery.trim()) return allClubs;
    const q = searchQuery.toLowerCase();
    return allClubs.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [allClubs, searchQuery]);

  // Mixed items for "All" tab (interleave profiles and clubs)
  const mixedItems = useMemo((): MixedItem[] => {
    const items: MixedItem[] = [];
    const maxLen = Math.max(filteredProfiles.length, filteredClubs.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < filteredProfiles.length) items.push({ kind: 'profile', data: filteredProfiles[i] });
      if (i < filteredClubs.length) items.push({ kind: 'club', data: filteredClubs[i] });
    }
    return items;
  }, [filteredProfiles, filteredClubs]);

  const totalResults = activeTab === 'profiles'
    ? filteredProfiles.length
    : activeTab === 'clubs'
    ? filteredClubs.length
    : mixedItems.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <BackButton href="/dashboard" label="Back" />
      </div>

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden border-b border-border bg-background-card">
        {/* Decorative ambient blobs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.06] pointer-events-none bg-primary" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-[0.04] pointer-events-none bg-accent" />

        <div className="relative max-w-6xl mx-auto px-4 py-10">
          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              Explore <span className="font-brand text-primary">The ANTs</span>
            </h1>
          </div>
          <p className="text-foreground-secondary text-base mb-8 max-w-xl">
            Discover students, teachers, contributors, and community clubs all in one place.
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              placeholder={activeTab === 'clubs' ? 'Search clubs...' : activeTab === 'profiles' ? 'Search by name, username, or bio...' : 'Search profiles and clubs...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-background rounded-xl border border-border w-fit">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Role filter (only shown on Profiles tab or All tab) */}
          {(activeTab === 'profiles' || activeTab === 'all') && (
            <div className="flex flex-wrap gap-2 mt-4">
              {ROLE_FILTERS.map(f => (
                <button
                  key={f.label}
                  onClick={() => setRoleFilter(f.role)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer',
                    roleFilter === f.role
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground-secondary border-border hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Stats line */}
          <div className="flex items-center gap-2 mt-4 text-xs text-foreground-muted">
            <span className="font-semibold text-foreground">{totalResults}</span>
            <span>{activeTab === 'clubs' ? 'clubs' : activeTab === 'profiles' ? 'profiles' : 'results'}</span>
            {searchQuery && <span>for &ldquo;{searchQuery}&rdquo;</span>}
          </div>
        </div>
      </div>

      {/* ── Grid Content ── */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Join CTA */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-foreground-secondary">
            {activeTab === 'all' && `Showing ${filteredProfiles.length} profiles · ${filteredClubs.length} clubs`}
            {activeTab === 'profiles' && `${filteredProfiles.length} profile${filteredProfiles.length !== 1 ? 's' : ''} found`}
            {activeTab === 'clubs' && `${filteredClubs.length} club${filteredClubs.length !== 1 ? 's' : ''} found`}
          </p>
          <Link href="/signup">
            <Button size="sm" iconRight={<ArrowRight className="h-4 w-4" />}>
              Join <span className="font-brand">The ANTs</span>
            </Button>
          </Link>
        </div>

        {/* Profiles only */}
        {activeTab === 'profiles' && (
          filteredProfiles.length === 0 ? (
            <EmptyState message="No profiles found matching your search." icon={<Users className="h-12 w-12" />} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProfiles.map(p => <ProfileCard key={p.id} profile={p} />)}
            </div>
          )
        )}

        {/* Clubs only */}
        {activeTab === 'clubs' && (
          filteredClubs.length === 0 ? (
            <EmptyState message="No clubs found matching your search." icon={<MessageSquare className="h-12 w-12" />} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClubs.map(c => <ClubCard key={c.id} club={c} />)}
            </div>
          )
        )}

        {/* All: mixed interleaved grid */}
        {activeTab === 'all' && (
          mixedItems.length === 0 ? (
            <EmptyState message="Nothing found. Try a different search." icon={<Compass className="h-12 w-12" />} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mixedItems.map((item, i) =>
                item.kind === 'profile'
                  ? <ProfileCard key={`p-${item.data.id}`} profile={item.data} />
                  : <ClubCard key={`c-${item.data.id}`} club={item.data} />
              )}
            </div>
          )
        )}
      </main>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="text-center py-24">
      <div className="text-foreground-muted mx-auto mb-4 opacity-40">
        {icon}
      </div>
      <p className="text-foreground-secondary text-lg">{message}</p>
    </div>
  );
}

// ── Default export with Suspense ──────────────────────────────────────────────

export default function ExplorePageContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground-muted">Loading explore...</p>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
