'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ClubMembershipsPanel Component (v2)
// Richer club cards with stylized avatar, role badge, and member count.
// ──────────────────────────────────────────────────────────────────────────────

import { Users, Crown, Shield, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ClubMembership {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  joinMode: string;
  custom_slug?: string | null;
}

interface ClubMembershipsPanelProps {
  memberships: ClubMembership[];
}

// ── Role config ───────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  admin: {
    label: 'Leader',
    icon: <Crown className="h-3 w-3" />,
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  },
  leader: {
    label: 'Leader',
    icon: <Crown className="h-3 w-3" />,
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  },
  moderator: {
    label: 'Moderator',
    icon: <Shield className="h-3 w-3" />,
    color: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  },
  member: {
    label: 'Member',
    icon: <User className="h-3 w-3" />,
    color: 'bg-primary/10 text-primary border-primary/20',
  },
};

// ── Club initial avatar colors (deterministic by name) ────────────────────────

const AVATAR_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-pink-500 to-rose-400',
  'from-indigo-500 to-blue-400',
  'from-teal-500 to-emerald-400',
  'from-orange-500 to-red-400',
];

function clubAvatarGradient(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ── Club Card ─────────────────────────────────────────────────────────────────

function ClubCard({ club }: { club: ClubMembership }) {
  const roleConf = ROLE_CONFIG[club.role] || ROLE_CONFIG.member;
  const gradient = clubAvatarGradient(club.name);

  return (
    <Link
      href={`/clubs/${club.custom_slug || club.id}`}
      className="group flex items-center gap-4 p-4 rounded-2xl border border-border bg-background hover:border-primary/30 hover:bg-primary/5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Club Avatar */}
      <div className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white shadow-sm',
        `bg-gradient-to-br ${gradient}`
      )}>
        {club.name.charAt(0).toUpperCase()}
      </div>

      {/* Club Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate leading-tight mb-1.5">
          {club.name}
        </p>
        <div className="flex items-center gap-2">
          {/* Role badge */}
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
            roleConf.color
          )}>
            {roleConf.icon}
            {roleConf.label}
          </span>
          {/* Member count */}
          <span className="flex items-center gap-1 text-[11px] text-foreground-muted">
            <Users className="h-3 w-3" />
            {club.memberCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ClubMembershipsPanel({ memberships }: ClubMembershipsPanelProps) {
  if (memberships.length === 0) return null;

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
          <Users className="h-4 w-4 text-pink-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Club Memberships</h2>
          <p className="text-xs text-foreground-muted mt-0.5">{memberships.length} club{memberships.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {memberships.map((club) => (
          <ClubCard key={club.id} club={club} />
        ))}
      </div>
    </section>
  );
}
