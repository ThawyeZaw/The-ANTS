'use client';

import Link from 'next/link';
import {
  Globe,
  Settings,
  ExternalLink,
  Code2,
  Camera,
  Music2,
  Link2,
  BadgeCheck,
} from 'lucide-react';
import { RoleBadge } from '@/components/ui/Badge';
import AvatarImage from '@/components/ui/AvatarImage';
import { type Profile, type SocialPlatform } from '@/types';

/** Map social platform icons */
function SocialPlatformIcon({ platform, className }: { platform: SocialPlatform | 'custom'; className?: string }) {
  switch (platform) {
    case 'github': return <Code2 className={className} />;
    case 'facebook': return <Camera className={className} />;
    case 'instagram': return <Camera className={className} />;
    case 'tiktok': return <Music2 className={className} />;
    case 'website': return <Globe className={className} />;
    default: return <Link2 className={className} />;
  }
}

interface ProfileHeroProps {
  profile: Profile;
  isOwnProfile: boolean;
}

export default function ProfileHero({ profile, isOwnProfile }: ProfileHeroProps) {
  const visibleLinks = (profile.socialLinks || []).filter(link => link.visible && link.url);

  return (
    <div className="flex flex-col items-center text-center py-10">
      {/* Avatar — no border ring, just the avatar itself */}
      <div className="shrink-0 mb-6">
        <AvatarImage avatar={profile.avatar} name={profile.name} size="xl" />
      </div>

      {/* Name + Meta */}
      <div className="flex flex-col items-center mb-3">
        <div className="flex flex-wrap justify-center items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">{profile.name}</h1>
          <RoleBadge role={profile.role} />
        </div>
        {profile.title && (
          <p className="text-base font-medium text-foreground-secondary">{profile.title}</p>
        )}
        <p className="text-sm text-primary/80 font-mono mt-1">@{profile.username}</p>
      </div>

      {/* The ANTS Org Affiliation */}
      <div className="flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary/80 text-xs font-medium">
        <BadgeCheck className="h-3.5 w-3.5" />
        The ANTS Member
      </div>

      {/* Bio — plain text, no card */}
      {profile.bio && (
        <p className="text-sm text-foreground-secondary leading-relaxed max-w-2xl mt-2 px-4">
          {profile.bio}
        </p>
      )}

      {/* Social Links — minimal pills, no background */}
      {visibleLinks.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-lg">
          {visibleLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-foreground-secondary hover:text-foreground transition-all duration-300 group"
            >
              <span className="text-primary/70 group-hover:text-primary transition-colors shrink-0">
                <SocialPlatformIcon platform={link.platform} className="h-4 w-4" />
              </span>
              <span className="truncate max-w-[120px]">{link.label}</span>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          ))}
        </div>
      )}

      {/* Edit button — plain link, no card */}
      {isOwnProfile && (
        <div className="mt-8">
          <Link
            href="/settings/profile"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>
      )}
    </div>
  );
}
