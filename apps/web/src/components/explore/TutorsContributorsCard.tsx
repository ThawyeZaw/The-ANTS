'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TutorsContributorsCard
// Person card for the Tutors & Contributors directory.
// Shows avatar, name, @username, specialty line, and role badge pills.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { GraduationCap, Pencil, Star, ArrowRight } from 'lucide-react';
import AvatarImage from '@/components/ui/AvatarImage';
import { cn } from '@/lib/utils';

export interface TeamProfile {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  title: string | null;
  bio: string | null;
  role: string;
  roles: string[];
  founder_type: string | null;
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

function isTutor(roles: string[]) {
  return roles.some((r) => r === 'tutor' || r === 'teacher');
}

function isContributor(roles: string[]) {
  return roles.some((r) => r === 'contributor' || r === 'main_contributor');
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TutorsContributorsCard({ profile }: { profile: TeamProfile }) {
  const roles = profile.roles && profile.roles.length > 0 ? profile.roles : [profile.role || 'student'];
  const showTutor = isTutor(roles);
  const showContributor = isContributor(roles);
  const founderType = profile.founder_type as 'founder' | 'co_founder' | null;

  return (
    <Link href={`/profile/${profile.username}`} className="block group h-full">
      <div className="relative flex flex-col h-full bg-background-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        {/* Avatar + identity */}
        <div className="flex items-start gap-3 mb-3">
          <AvatarImage
            avatar={profile.avatar_url ?? ''}
            name={profile.name}
            size="sm"
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
              {profile.name}
            </h3>
            <p className="text-xs text-foreground-muted truncate font-mono">@{profile.username}</p>
            {profile.title && (
              <p className="text-xs text-foreground-secondary mt-0.5 truncate">{profile.title}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-foreground-secondary line-clamp-2 mb-3 leading-relaxed flex-1">
            {profile.bio}
          </p>
        )}
        {!profile.bio && <div className="flex-1" />}

        {/* Badge pills */}
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/40">
          {showTutor && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
              <GraduationCap className="h-3 w-3" />
              Tutor
            </span>
          )}
          {showContributor && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border text-violet-500 bg-violet-500/10 border-violet-500/20">
              <Pencil className="h-3 w-3" />
              Contributor
            </span>
          )}
          {founderType === 'founder' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border text-amber-500 bg-amber-500/10 border-amber-500/20">
              <Star className="h-3 w-3" />
              Founder
            </span>
          )}
          {founderType === 'co_founder' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border text-amber-500 bg-amber-500/10 border-amber-500/20">
              <Star className="h-3 w-3" />
              Co-Founder
            </span>
          )}
        </div>

        {/* View profile CTA */}
        <div className="flex items-center gap-1 text-xs font-semibold mt-3 text-primary opacity-70 group-hover:opacity-100 transition-opacity">
          View Profile <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
