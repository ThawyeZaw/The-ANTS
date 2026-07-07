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

/** Map social platform to branded icon + color */
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

function platformColor(platform: SocialPlatform | 'custom'): string {
  switch (platform) {
    case 'github': return 'border-white/15 hover:border-white/30 hover:bg-white/10 text-white';
    case 'facebook': return 'border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/10 text-blue-400';
    case 'instagram': return 'border-pink-500/20 hover:border-pink-500/40 hover:bg-pink-500/10 text-pink-400';
    case 'tiktok': return 'border-white/15 hover:border-white/30 hover:bg-white/10 text-white';
    case 'website': return 'border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400';
    default: return 'border-white/15 hover:border-white/30 hover:bg-white/10 text-white/70';
  }
}

interface ProfileHeroProps {
  profile: Profile;
  isOwnProfile: boolean;
}

export default function ProfileHero({ profile, isOwnProfile }: ProfileHeroProps) {
  const visibleLinks = (profile.socialLinks || []).filter(link => link.visible && link.url);

  return (
    <div className="relative">
      {/* Glass card background with gradient */}
      <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        {/* Subtle top gradient accent line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="flex flex-col items-center text-center py-12 px-6">
          {/* Avatar with gradient ring and glow */}
          <div className="shrink-0 mb-8 relative">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-110" />
            {/* Gradient ring */}
            <div className="relative rounded-full p-[3px] bg-gradient-to-br from-primary via-violet-500 to-amber-500 shadow-lg shadow-primary/20">
              <div className="rounded-full p-[2px] bg-background">
                <AvatarImage avatar={profile.avatar} name={profile.name} size="xl" />
              </div>
            </div>
          </div>

          {/* Name + Role */}
          <div className="flex flex-col items-center mb-4 animate-fade-in">
            <div className="flex flex-wrap justify-center items-center gap-3 mb-1.5">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {profile.name}
              </h1>
              <RoleBadge role={profile.role} />
            </div>
            {profile.title && (
              <p className="text-base font-medium text-foreground-secondary/80">{profile.title}</p>
            )}
            <p className="text-sm text-primary/70 font-mono mt-1.5">@{profile.username}</p>
          </div>

          {/* The ANTS Org Affiliation */}
          <div className="flex items-center gap-1.5 mb-5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary/80 text-xs font-medium backdrop-blur-sm">
            <BadgeCheck className="h-3.5 w-3.5" />
            The ANTS Member
          </div>

          {/* Bio — styled quote block */}
          {profile.bio && (
            <div className="relative max-w-2xl mt-1 mb-2 animate-slide-up">
              <div className="absolute -top-1 left-0 text-4xl text-primary/20 leading-none select-none">&ldquo;</div>
              <p className="text-sm text-foreground-secondary/90 leading-relaxed px-6 py-1 italic">
                {profile.bio}
              </p>
              <div className="absolute -bottom-4 right-0 text-4xl text-primary/20 leading-none select-none">&rdquo;</div>
            </div>
          )}

          {/* Social Links — premium pill buttons */}
          {visibleLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2.5 mt-6 max-w-lg animate-fade-in">
              {visibleLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-sm transition-all duration-300 group ${platformColor(link.platform)}`}
                >
                  <span className="shrink-0 transition-transform group-hover:scale-110">
                    <SocialPlatformIcon platform={link.platform} className="h-4 w-4" />
                  </span>
                  <span className="truncate max-w-[120px]">{link.label}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit button — positioned below the card */}
      {isOwnProfile && (
        <div className="flex justify-center mt-6">
          <Link
            href="/settings/profile"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md text-sm font-medium text-foreground-secondary hover:text-foreground hover:border-white/20 transition-all duration-300"
          >
            <Settings className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>
      )}
    </div>
  );
}
