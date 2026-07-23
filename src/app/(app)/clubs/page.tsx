'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Club Dashboard
// Shows the user's club memberships and clubs they lead.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useClub } from '@/hooks/useClub';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Users, Plus, Building2, ChevronRight } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { Club, ClubLeader } from '@/types';

// ── Field display mapping ────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  architecture: 'Architecture',
  computer_science: 'Computer Science',
  volunteering: 'Volunteering',
  mathematics: 'Mathematics',
  science: 'Science',
  literature: 'Literature',
  arts: 'Arts',
  music: 'Music',
  debate: 'Debate',
  entrepreneurship: 'Entrepreneurship',
  engineering: 'Engineering',
  medicine: 'Medicine',
  other: 'Other',
};

const FIELD_COLORS: Record<string, string> = {
  architecture: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  computer_science: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  volunteering: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  mathematics: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  science: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  literature: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  arts: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  music: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  debate: 'bg-red-500/10 text-red-400 border-red-500/20',
  entrepreneurship: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  engineering: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  medicine: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

// ── Types ────────────────────────────────────────────────────────────────────

interface MembershipWithClub {
  id: string;
  club_id: string;
  user_id: string;
  joined_at: string | null;
  clubs: Club;
}

// ── Club Card ────────────────────────────────────────────────────────────────

function ClubCard({ club, isLeader }: { club: Club; isLeader?: boolean }) {
  const initials = getInitials(club.name || 'C');
  const fieldLabel = FIELD_LABELS[club.field] || club.field;
  const fieldColor = FIELD_COLORS[club.field] || FIELD_COLORS.other;

  return (
    <Link
      href={`/clubs/${club.custom_slug}`}
      className="group block rounded-2xl border border-border bg-background-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-border-hover hover:-translate-y-0.5"
    >
      {/* Cover */}
      {club.cover_image_url ? (
        <div
          className="h-36 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${club.cover_image_url})` }}
        />
      ) : (
        <div
          className="h-36 w-full flex items-center justify-center"
          style={{
            background: club.accent_color
              ? `linear-gradient(135deg, ${club.accent_color}22, ${club.accent_color}44)`
              : 'linear-gradient(135deg, #6366f122, #6366f144)',
          }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold text-white"
            style={{ backgroundColor: club.accent_color || '#6366f1' }}
          >
            {initials}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge className={`border ${fieldColor}`}>{fieldLabel}</Badge>
          {isLeader && (
            <span className="text-xs font-medium text-primary">Leader</span>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {club.name}
          </h3>
          {club.tagline && (
            <p className="text-sm text-foreground-muted line-clamp-2 mt-1">
              {club.tagline}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-sm text-foreground-muted">
            <Users className="h-4 w-4" />
            <span>Members</span>
          </div>
          <ChevronRight className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 mb-6">
        <Building2 className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">No clubs yet</h2>
      <p className="text-foreground-muted max-w-md mb-8">
        Clubs are where students with shared interests come together. Create your
        first club and start building your community.
      </p>
      <Link href="/clubs/create">
        <Button size="lg" icon={<Plus className="h-5 w-5" />}>
          Create your first club
        </Button>
      </Link>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ClubDashboardPage() {
  const { user } = useAuth();
  const { getUserClubs, getClubLeaders } = useClub();

  const [memberClubs, setMemberClubs] = useState<Club[]>([]);
  const [leaderClubs, setLeaderClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get all clubs the user is a member of
        const memberships = (await getUserClubs(user.id)) as MembershipWithClub[];
        const allClubs = memberships
          .filter((m) => m.clubs)
          .map((m) => m.clubs);

        // Determine which clubs the user leads by fetching leaders for each club
        const leaderClubIds = new Set<string>();

        // The user automatically leads clubs they created
        allClubs.forEach((club) => {
          if (club.created_by === user.id) {
            leaderClubIds.add(club.id);
          }
        });

        // Also check club_leaders for clubs where user was added as leader
        // but isn't the creator
        const nonCreatorClubs = allClubs.filter(
          (club) => club.created_by !== user.id
        );

        if (nonCreatorClubs.length > 0) {
          const leadersResults = await Promise.all(
            nonCreatorClubs.map((club) => getClubLeaders(club.id))
          );

          nonCreatorClubs.forEach((club, i) => {
            const leaders = leadersResults[i] as ClubLeader[];
            if (leaders?.some((l) => l.user_id === user.id)) {
              leaderClubIds.add(club.id);
            }
          });
        }

        setLeaderClubs(allClubs.filter((c) => leaderClubIds.has(c.id)));
        setMemberClubs(allClubs.filter((c) => !leaderClubIds.has(c.id)));
      } catch (err) {
        console.error('Failed to load clubs:', err);
        setError('Failed to load your clubs. Please try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user?.id, getUserClubs, getClubLeaders]);

  const hasClubs = leaderClubs.length > 0 || memberClubs.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Clubs</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Manage your club memberships and communities
          </p>
        </div>
        <Link href="/clubs/create">
          <Button icon={<Plus className="h-4 w-4" />}>
            Create a Club
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-background-card p-5 space-y-4 animate-pulse"
            >
              <div className="h-4 w-20 rounded-full bg-background-secondary" />
              <div className="h-6 w-48 rounded bg-background-secondary" />
              <div className="h-4 w-full rounded bg-background-secondary" />
              <div className="h-4 w-24 rounded bg-background-secondary" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && !hasClubs && <EmptyState />}

      {/* Clubs You Lead */}
      {!isLoading && leaderClubs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              Your Leaders
            </h2>
            <span className="text-sm text-foreground-muted">
              ({leaderClubs.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaderClubs.map((club) => (
              <ClubCard key={club.id} club={club} isLeader />
            ))}
          </div>
        </section>
      )}

      {/* Clubs You're a Member Of */}
      {!isLoading && memberClubs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              Your Clubs
            </h2>
            <span className="text-sm text-foreground-muted">
              ({memberClubs.length})
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberClubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
