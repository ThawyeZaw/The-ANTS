'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TutorsContributorsPageContent
// Tutors & Contributors directory: filter chips, search, person card grid.
// Replaces the old /explore directory concept. Route: /team
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Search, Users, GraduationCap, Pencil, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { actionGetAllTeamProfiles } from '@/actions/org';
import TutorsContributorsCard, { type TeamProfile } from './TutorsContributorsCard';

// ── Filter chip definitions ───────────────────────────────────────────────────

type FilterKey = 'all' | 'tutors' | 'contributors' | 'founders';

const FILTERS: { key: FilterKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'all', label: 'All', icon: Users },
  { key: 'tutors', label: 'Tutors', icon: GraduationCap },
  { key: 'contributors', label: 'Contributors', icon: Pencil },
  { key: 'founders', label: 'Founders', icon: Star },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchesFilter(profile: TeamProfile, filter: FilterKey): boolean {
  const roles = profile.roles && profile.roles.length > 0 ? profile.roles : [profile.role || 'student'];
  if (filter === 'tutors') return roles.some((r) => r === 'tutor' || r === 'teacher');
  if (filter === 'contributors') return roles.some((r) => r === 'contributor' || r === 'main_contributor');
  if (filter === 'founders') return profile.founder_type != null;
  return true;
}

function matchesSearch(profile: TeamProfile, q: string): boolean {
  if (!q.trim()) return true;
  const lq = q.toLowerCase();
  return (
    profile.name.toLowerCase().includes(lq) ||
    profile.username.toLowerCase().includes(lq) ||
    (profile.bio || '').toLowerCase().includes(lq) ||
    (profile.title || '').toLowerCase().includes(lq)
  );
}

// ── Inner component (needs Suspense for useSearchParams, not used here) ───────

function TeamDirectory() {
  const [profiles, setProfiles] = useState<TeamProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsLoading(true);
    actionGetAllTeamProfiles()
      .then((data) => setProfiles(data as TeamProfile[]))
      .catch((err) => console.error('[TutorsContributorsPageContent]', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      profiles
        .filter((p) => matchesFilter(p, activeFilter))
        .filter((p) => matchesSearch(p, searchQuery)),
    [profiles, activeFilter, searchQuery]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 pb-24 space-y-8">

        {/* ── Header Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-background-card to-background-secondary border border-border p-6 sm:p-10">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Users className="h-3.5 w-3.5" />
              Tutors &amp; Contributors
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Meet the People Behind The ANTS
            </h1>
            <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
              Browse verified tutors offering IGCSE sessions, academic contributors who build
              our curriculum, and the founders who started it all.
            </p>
          </div>
          {/* Decorative blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
          />
        </div>

        {/* ── Search + Filter Chips ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              id="team-search"
              type="text"
              placeholder="Search by name, specialty, or bio…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-background-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {FILTERS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border',
                  activeFilter === key
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-background-card text-foreground-muted hover:text-foreground border-border hover:bg-background-secondary'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading skeletons ── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-background-card border border-border rounded-2xl p-5 animate-pulse h-44" />
            ))}
          </div>
        )}

        {/* ── Profile grid ── */}
        {!isLoading && (
          <>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((profile) => (
                  <TutorsContributorsCard key={profile.id} profile={profile} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-background-card border border-border rounded-2xl">
                <Users className="w-10 h-10 text-foreground-muted/40 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground">No profiles found</h3>
                <p className="text-sm text-foreground-muted mt-1">
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'No one in this category yet.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Export (wrapped in Suspense for future-safe search-param usage) ───────────

export default function TutorsContributorsPageContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <TeamDirectory />
    </Suspense>
  );
}
