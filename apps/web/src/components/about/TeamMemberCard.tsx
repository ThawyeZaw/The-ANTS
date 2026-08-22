'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { type OrgTeamMember } from '@/types';

export default function TeamMemberCard({ member }: { member: OrgTeamMember }) {
  return (
    <div className="group relative bg-background-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      {/* Photo placeholder */}
      <div className="w-20 h-20 rounded-full bg-background-secondary border-2 border-border flex items-center justify-center mb-4 mx-auto overflow-hidden group-hover:border-primary/30 transition-colors">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-bold text-foreground-muted select-none">
            {member.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Alumni badge */}
      {member.isAlumni && (
        <span className="absolute top-4 right-4 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
          Alumni
        </span>
      )}

      {/* Name & Title */}
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {member.name}
        </h3>
        <p className="text-xs font-medium text-primary/70 mt-1">{member.title}</p>
      </div>

      {/* Bio */}
      <p className="text-sm text-foreground-secondary text-center leading-relaxed">
        {member.bio}
      </p>

      {/* Profile link */}
      {member.linkedProfileUsername && (
        <div className="mt-4 text-center">
          <Link
            href={`/profile/${member.linkedProfileUsername}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground-muted hover:text-primary transition-colors"
          >
            View Profile
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
