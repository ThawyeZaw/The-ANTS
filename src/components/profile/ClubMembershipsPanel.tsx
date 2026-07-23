'use client';

import { Users } from 'lucide-react';
import Link from 'next/link';

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

const roleLabels: Record<string, string> = {
  admin: 'Leader',
  moderator: 'Moderator',
  member: 'Member',
};

export default function ClubMembershipsPanel({ memberships }: ClubMembershipsPanelProps) {
  if (memberships.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-background-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Clubs</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {memberships.map((club) => (
          <Link
            key={club.id}
            href={`/clubs/${club.custom_slug}`}
            className="group flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-all hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {club.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                {club.name}
              </p>
              <p className="text-xs text-foreground-muted">
                {roleLabels[club.role] || club.role}
                <span className="mx-1.5">·</span>
                {club.memberCount} {club.memberCount === 1 ? 'member' : 'members'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
