'use client';

import Link from 'next/link';
import {
  Star,
  Globe,
  ExternalLink,
  Code2,
  Camera,
  Music2,
  Link2,
  Send,
  Pencil,
} from 'lucide-react';
import type { Profile, SocialPlatform } from '@/types';
import { RoleBadge } from '@/components/ui/Badge';
import AvatarImage from '@/components/ui/AvatarImage';
import BackButton from '@/components/ui/BackButton';
import ShareProfileButton from './ShareProfileButton';
import CertificationSection from './CertificationSection';
import { cn } from '@/lib/utils';
import type { ContributorProfileData, ContributorStatsData } from '@/hooks/useProfile';

function socialPlatformIcon(platform: SocialPlatform | 'custom', className: string) {
  switch (platform) {
    case 'github': return <Code2 className={className} />;
    case 'facebook': return <Camera className={className} />;
    case 'instagram': return <Camera className={className} />;
    case 'tiktok': return <Music2 className={className} />;
    case 'website': return <Globe className={className} />;
    default: return <Link2 className={className} />;
  }
}

interface ContributorPublicProfileProps {
  profile: Profile;
  contributorProfile?: ContributorProfileData | null;
  stats?: ContributorStatsData | null;
  certifications?: any[];
  isOwnProfile?: boolean;
  embedded?: boolean;
  className?: string;
}

export default function ContributorPublicProfile({
  profile,
  contributorProfile,
  stats,
  certifications = [],
  isOwnProfile = false,
  embedded = false,
  className,
}: ContributorPublicProfileProps) {
  const visibleLinks = (profile.socialLinks || []).filter((l) => l.visible && l.url);
  const contributorLinks = [
    contributorProfile?.website_url && { label: 'Website', url: contributorProfile.website_url },
    contributorProfile?.github_url && { label: 'GitHub', url: contributorProfile.github_url },
    contributorProfile?.linkedin_url && { label: 'LinkedIn', url: contributorProfile.linkedin_url },
  ].filter(Boolean) as { label: string; url: string }[];

  const statItems = [
    { label: 'Resources', value: stats?.published_resources ?? 0, icon: <Globe className="h-4 w-4" /> },
    { label: 'Curricula', value: stats?.published_curriculums ?? 0, icon: <Pencil className="h-4 w-4" /> },
  ];

  const content = (
    <div className={cn('space-y-8', className)}>
      {!embedded && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <BackButton href="/team" label="Back to Tutors & Contributors" />
          <div className="flex items-center gap-2">
            <ShareProfileButton username={profile.username} customSlug={profile.customUrlSlug} />
            {isOwnProfile && (
              <Link
                href="/settings/profile?tab=contributor"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-background-card border border-border hover:border-primary text-foreground transition-all"
              >
                Edit Contributor Profile
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-border bg-background-card overflow-hidden shadow-sm">
        <div className="h-28 bg-gradient-to-r from-primary/20 via-amber-500/15 to-background-secondary" />
        <div className="px-6 sm:px-8 pb-8 -mt-14 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <AvatarImage avatar={profile.avatar} name={profile.name} size="xl" className="ring-4 ring-background-card" />
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{profile.name}</h1>
                <RoleBadge role={profile.role} />
              </div>
              <p className="text-sm text-foreground-muted font-mono">@{profile.username}</p>
              {profile.title && <p className="text-sm font-medium text-foreground-secondary">{profile.title}</p>}
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            The ANTS Contributor
          </div>

          {profile.bio && (
            <p className="text-sm text-foreground-secondary leading-relaxed max-w-3xl">{profile.bio}</p>
          )}

          <div className="grid grid-cols-2 gap-3 max-w-md">
            {statItems.map((s) => (
              <div key={s.label} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-background-secondary/50">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">{s.icon}</div>
                <div>
                  <p className="text-lg font-bold text-foreground tabular-nums font-mono">{s.value}</p>
                  <p className="text-[11px] text-foreground-muted uppercase tracking-wider">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {profile.telegramHandle && (
              <a
                href={`https://t.me/${profile.telegramHandle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-background-secondary hover:border-primary/30 transition-colors"
              >
                <Send className="h-4 w-4 text-primary" />
                @{profile.telegramHandle.replace('@', '')}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}
            {contributorLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-background-secondary hover:border-primary/30 transition-colors"
              >
                {link.label}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            ))}
            {visibleLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-background-secondary hover:border-primary/30 transition-colors"
              >
                {socialPlatformIcon(link.platform, 'h-4 w-4')}
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {certifications.length > 0 && <CertificationSection certifications={certifications} />}
    </div>
  );

  if (embedded) return content;

  return (
    <main className="max-w-5xl mx-auto px-4 pb-16 pt-4 animate-fade-in">
      {content}
    </main>
  );
}
