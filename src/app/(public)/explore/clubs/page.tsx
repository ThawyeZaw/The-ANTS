'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Public Club Discovery Page
// Browse all clubs with a modern, visually stunning gallery layout.
// Uses real club data via the useClub hook. No authentication required.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  Shield,
  ArrowRight,
  Building2,
  Code2,
  HeartHandshake,
  Sigma,
  FlaskConical,
  BookOpen,
  Palette,
  Music,
  MicVocal,
  Briefcase,
  Cpu,
  Stethoscope,
  Globe,
  Sparkles,
  X,
  Compass,
} from 'lucide-react';
import { useClub } from '@/hooks/useClub';
import { useAuth } from '@/hooks/useAuth';
import type { Club, ClubField } from '@/types';
import { cn, getInitials } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import BackButton from '@/components/ui/BackButton';

// ── Field-to-Display & Icon Mapping ──────────────────────────────────────────

const FIELD_META: Record<ClubField, { label: string; icon: React.ReactNode; gradient: string }> = {
  architecture:       { label: 'Architecture',       icon: <Building2 className="h-3.5 w-3.5" />,       gradient: 'from-orange-500 to-rose-500' },
  computer_science:  { label: 'Computer Science',   icon: <Code2 className="h-3.5 w-3.5" />,          gradient: 'from-blue-500 to-cyan-400' },
  volunteering:      { label: 'Volunteering',        icon: <HeartHandshake className="h-3.5 w-3.5" />, gradient: 'from-emerald-500 to-teal-400' },
  mathematics:       { label: 'Mathematics',         icon: <Sigma className="h-3.5 w-3.5" />,          gradient: 'from-violet-500 to-purple-400' },
  science:           { label: 'Science',             icon: <FlaskConical className="h-3.5 w-3.5" />,   gradient: 'from-sky-500 to-indigo-500' },
  literature:        { label: 'Literature',          icon: <BookOpen className="h-3.5 w-3.5" />,       gradient: 'from-amber-500 to-yellow-400' },
  arts:              { label: 'Arts',                icon: <Palette className="h-3.5 w-3.5" />,         gradient: 'from-pink-500 to-fuchsia-400' },
  music:             { label: 'Music',               icon: <Music className="h-3.5 w-3.5" />,           gradient: 'from-rose-500 to-pink-400' },
  debate:            { label: 'Debate',              icon: <MicVocal className="h-3.5 w-3.5" />,        gradient: 'from-red-500 to-orange-400' },
  entrepreneurship:  { label: 'Entrepreneurship',    icon: <Briefcase className="h-3.5 w-3.5" />,       gradient: 'from-teal-500 to-emerald-400' },
  engineering:       { label: 'Engineering',         icon: <Cpu className="h-3.5 w-3.5" />,             gradient: 'from-slate-500 to-zinc-400' },
  medicine:          { label: 'Medicine',            icon: <Stethoscope className="h-3.5 w-3.5" />,     gradient: 'from-red-500 to-rose-400' },
  other:             { label: 'Other',               icon: <Globe className="h-3.5 w-3.5" />,           gradient: 'from-gray-500 to-slate-400' },
};

const FIELD_OPTIONS: { value: ClubField | 'all'; label: string }[] = [
  { value: 'all', label: 'All Fields' },
  ...(Object.entries(FIELD_META) as [ClubField, typeof FIELD_META[ClubField]][]).map(([key, meta]) => ({
    value: key,
    label: meta.label,
  })),
];

// ── Utility: pick a deterministic gradient color from a club id ───────────────

const CARD_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-emerald-600 to-teal-600',
  'from-violet-600 to-purple-600',
  'from-rose-600 to-pink-600',
  'from-amber-600 to-orange-600',
  'from-cyan-600 to-sky-600',
  'from-fuchsia-600 to-pink-600',
  'from-lime-600 to-green-600',
];

function getCardGradient(clubId: string): string {
  let hash = 0;
  for (let i = 0; i < clubId.length; i++) {
    hash = ((hash << 5) - hash) + clubId.charCodeAt(i);
  }
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length];
}

// ── Skeleton Component ───────────────────────────────────────────────────────

function ClubCardSkeleton() {
  return (
    <div className="bg-background-card border border-border rounded-2xl overflow-hidden animate-pulse">
      {/* Cover placeholder */}
      <div className="h-40 bg-background-secondary" />
      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="h-5 w-3/4 rounded-full bg-background-secondary" />
          <div className="h-5 w-20 rounded-full bg-background-secondary shrink-0" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-background-secondary" />
          <div className="h-3 w-2/3 rounded-full bg-background-secondary" />
        </div>
        <div className="flex items-center gap-4 pt-1">
          <div className="h-4 w-24 rounded-full bg-background-secondary" />
          <div className="h-4 w-20 rounded-full bg-background-secondary" />
        </div>
      </div>
    </div>
  );
}

function ExploreClubsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <section className="relative overflow-hidden border-b border-border bg-background-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="h-6 w-24 rounded-full bg-background-secondary animate-pulse mb-6" />
          <div className="h-10 w-64 rounded-full bg-background-secondary animate-pulse mb-3" />
          <div className="h-5 w-96 rounded-full bg-background-secondary animate-pulse" />
          <div className="mt-8 flex gap-3">
            <div className="h-10 w-48 rounded-xl bg-background-secondary animate-pulse" />
            <div className="h-10 w-36 rounded-xl bg-background-secondary animate-pulse" />
          </div>
        </div>
      </section>

      {/* Grid skeleton */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClubCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function ExploreClubsPage() {
  const { clubs, getClubsBatchData, joinClub } = useClub();
  const { user } = useAuth();
  const router = useRouter();

  // ── Search & Filter State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState<ClubField | 'all'>('all');

  // ── Leader & Member Counts ──
  const [leaderCounts, setLeaderCounts] = useState<Record<string, number>>({});
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [countsLoaded, setCountsLoaded] = useState(false);

  // ── Membership status ──
  const [membershipMap, setMembershipMap] = useState<Record<string, boolean>>({});
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // ── Single batch data fetch: leaders, members, and memberships in one call ──
  useEffect(() => {
    if (clubs.length === 0) return;

    let cancelled = false;

    (async () => {
      const clubIds = clubs.map((c) => c.id);
      const batch = await getClubsBatchData(clubIds, user?.id);

      if (cancelled) return;

      // Group leaders and members by club_id
      const leadersByClub: Record<string, any[]> = {};
      const membersByClub: Record<string, any[]> = {};
      const membershipSet = new Set(batch.memberships.map((m: any) => m.club_id));

      for (const l of batch.leaders) {
        (leadersByClub[l.club_id] ??= []).push(l);
      }
      for (const m of batch.members) {
        (membersByClub[m.club_id] ??= []).push(m);
      }

      const leaderResults: Record<string, number> = {};
      const memberResults: Record<string, number> = {};
      const membershipResults: Record<string, boolean> = {};

      for (const club of clubs) {
        const leaders = leadersByClub[club.id] ?? [];
        const members = membersByClub[club.id] ?? [];

        leaderResults[club.id] = leaders.length;

        // Count unique users across members + leaders
        const memberUserIds = new Set(members.map((m: any) => m.user_id));
        const leaderUserIds = new Set(leaders.map((l: any) => l.user_id));
        const totalUnique = new Set([...memberUserIds, ...leaderUserIds]);
        memberResults[club.id] = totalUnique.size;

        // Membership: user is in club_members or is a leader
        if (user) {
          const isLeader = leaderUserIds.has(user.id);
          membershipResults[club.id] = membershipSet.has(club.id) || isLeader;
        }
      }

      if (!cancelled) {
        setLeaderCounts(leaderResults);
        setMemberCounts(memberResults);
        if (user) setMembershipMap(membershipResults);
        setCountsLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [clubs, user?.id, getClubsBatchData]);

  // ── Handle Join ──
  const handleJoin = async (e: React.MouseEvent, club: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setJoiningClubId(club.id);
    setJoinError(null);
    const result = await joinClub(club.id, user.id);
    setJoiningClubId(null);
    if (result.success) {
      setMembershipMap((prev) => ({ ...prev, [club.id]: true }));
      setMemberCounts((prev) => ({ ...prev, [club.id]: (prev[club.id] || 0) + 1 }));
      router.push(`/clubs/${club.custom_slug}`);
    } else {
      setJoinError(result.error || 'Failed to join club. Please try again.');
    }
  };
  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = club.name.toLowerCase().includes(q);
        const matchTagline = club.tagline?.toLowerCase().includes(q) ?? false;
        const matchDesc = club.description?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchTagline && !matchDesc) return false;
      }
      // Field filter
      if (fieldFilter !== 'all' && club.field !== fieldFilter) return false;
      return true;
    });
  }, [clubs, searchQuery, fieldFilter]);

  // ── Loading state ──
  if (clubs.length === 0 && !countsLoaded) {
    return <ExploreClubsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════════════════════════════
          Hero Section
          ════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background-card to-accent/5" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="mb-6">
            <BackButton href="/" />
          </div>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              The ANTS Club Showcase
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Explore{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Clubs
              </span>
            </h1>

            <p className="mt-3 text-lg text-foreground-secondary max-w-xl">
              Discover student clubs led by The ANTS — from architecture to computer science.
            </p>
          </div>

          {/* ── Search & Filter Bar ── */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search clubs by name, tagline, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Field filter dropdown */}
            <div className="relative">
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value as ClubField | 'all')}
                className="appearance-none w-full sm:w-auto px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
              >
                {FIELD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
            </div>
          </div>

          {/* ── Active Filters Display ── */}
          {(searchQuery || fieldFilter !== 'all') && (
            <div className="mt-3 flex items-center gap-2 text-sm text-foreground-muted">
              <span>
                Showing {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''}
              </span>
              {fieldFilter !== 'all' && (
                <Badge className="inline-flex items-center gap-1">
                  {FIELD_META[fieldFilter].icon}
                  {FIELD_META[fieldFilter].label}
                </Badge>
              )}
              <button
                onClick={() => { setSearchQuery(''); setFieldFilter('all'); }}
                className="text-xs text-primary hover:text-primary-hover underline underline-offset-2 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          Club Grid
          ════════════════════════════════════════════════════════════════════ */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        {joinError && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 flex items-center justify-between">
            <span>{joinError}</span>
            <button onClick={() => setJoinError(null)} className="text-red-400 hover:text-red-300 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {filteredClubs.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-background-secondary border border-border flex items-center justify-center mb-5">
              <Compass className="h-8 w-8 text-foreground-muted" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-1">No clubs found</h3>
            <p className="text-foreground-muted max-w-sm mb-6">
              {searchQuery
                ? `No clubs match "${searchQuery}"${fieldFilter !== 'all' ? ` in ${FIELD_META[fieldFilter].label}` : ''}. Try adjusting your search or filters.`
                : 'No clubs available in this field yet. Check back soon!'}
            </p>
            <Button
              variant="secondary"
              onClick={() => { setSearchQuery(''); setFieldFilter('all'); }}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => {
              const fieldMeta = FIELD_META[club.field];
              const memberCount = memberCounts[club.id] ?? 0;
              const leaderCount = leaderCounts[club.id] ?? 0;
              const cardGradient = getCardGradient(club.id);
              const initials = getInitials(club.name);
              const hasCover = !!club.cover_image_url;

              return (
                <Link
                  key={club.id}
                  href={`/explore/clubs/${club.custom_slug}`}
                  className="group block"
                >
                  <div
                    className={cn(
                      'bg-background-card border border-border rounded-2xl overflow-hidden',
                      'hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5',
                      'transition-all duration-300 h-full flex flex-col'
                    )}
                  >
                    {/* ── Cover Image / Gradient Placeholder ── */}
                    <div className="relative h-40 overflow-hidden">
                      {hasCover ? (
                        <>
                          <img
                            src={club.cover_image_url!}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background-card/80 to-transparent" />
                        </>
                      ) : (
                        <div
                          className={cn(
                            'h-full w-full bg-gradient-to-br flex items-center justify-center',
                            cardGradient
                          )}
                        >
                          <span className="text-4xl font-bold text-white/80 select-none">
                            {initials}
                          </span>
                        </div>
                      )}

                      {/* Field badge overlay */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
                          {fieldMeta.icon}
                          {fieldMeta.label}
                        </span>
                      </div>

                      {/* Member count pill */}
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
                          <Users className="h-3 w-3" />
                          {memberCount}
                        </span>
                      </div>

                      {/* Hover "View Club" indicator */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <span
                          className={cn(
                            'px-4 py-2 rounded-xl bg-white/90 text-foreground text-sm font-medium',
                            'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0',
                            'transition-all duration-300 shadow-lg'
                          )}
                        >
                          View Club
                        </span>
                      </div>
                    </div>

                    {/* ── Card Body ── */}
                    <div className="flex flex-col flex-1 p-5">
                      <h3
                        className={cn(
                          'text-lg font-semibold text-foreground mb-1',
                          'group-hover:text-primary transition-colors line-clamp-1'
                        )}
                      >
                        {club.name}
                      </h3>

                      {club.tagline ? (
                        <p className="text-sm text-foreground-secondary line-clamp-2 mb-4 leading-relaxed">
                          {club.tagline}
                        </p>
                      ) : club.description ? (
                        <p className="text-sm text-foreground-muted line-clamp-2 mb-4 leading-relaxed">
                          {club.description}
                        </p>
                      ) : (
                        <div className="mb-4" />
                      )}

                      {/* Spacer to push stats to bottom */}
                      <div className="mt-auto" />

                      {/* ── Stats Row ── */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-3 text-xs text-foreground-muted">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5" />
                            {leaderCount} {leaderCount === 1 ? 'leader' : 'leaders'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {user && membershipMap[club.id] ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                              Joined
                            </span>
                          ) : user ? (
                            <button
                              onClick={(e) => handleJoin(e, club)}
                              disabled={joiningClubId === club.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
                            >
                              {joiningClubId === club.id ? 'Joining...' : 'Join'}
                            </button>
                          ) : (
                            <Link
                              href={`/signup?redirect=/explore/clubs/${club.custom_slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors"
                            >
                              Join
                            </Link>
                          )}
                          <ArrowRight
                            className={cn(
                              'h-4 w-4 text-primary',
                              'opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0',
                              'transition-all duration-300'
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Results Count Footer ── */}
        {filteredClubs.length > 0 && (
          <div className="mt-10 text-center text-sm text-foreground-muted">
            Showing {filteredClubs.length} of {clubs.length} club{clubs.length !== 1 ? 's' : ''}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Local ChevronDown component (avoids importing the full lucide lib again) ──

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
