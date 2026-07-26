'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ProfileHero Component (v3 — No Banner, Glass Profile Card)
// Polished glass card with avatar, typography, social links, and edit buttons.
// ──────────────────────────────────────────────────────────────────────────────

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
  Star,
  Share2,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { RoleBadge } from '@/components/ui/Badge';
import AvatarImage from '@/components/ui/AvatarImage';
import { type Profile, type SocialPlatform, PROFILE_THEME_PRESETS } from '@/types';
import { cn } from '@/lib/utils';

// ── Social platform helpers ──────────────────────────────────────────────────

function SocialPlatformIcon({ platform, className }: { platform: SocialPlatform | 'custom'; className?: string }) {
  switch (platform) {
    case 'github':    return <Code2 className={className} />;
    case 'facebook':  return <Camera className={className} />;
    case 'instagram': return <Camera className={className} />;
    case 'tiktok':    return <Music2 className={className} />;
    case 'website':   return <Globe className={className} />;
    default:          return <Link2 className={className} />;
  }
}

function platformColor(platform: SocialPlatform | 'custom'): string {
  switch (platform) {
    case 'github':    return 'border-white/15 hover:border-white/30 hover:bg-white/10 text-white';
    case 'facebook':  return 'border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/10 text-blue-400';
    case 'instagram': return 'border-pink-500/20 hover:border-pink-500/40 hover:bg-pink-500/10 text-pink-400';
    case 'tiktok':    return 'border-white/15 hover:border-white/30 hover:bg-white/10 text-white';
    case 'website':   return 'border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400';
    default:          return 'border-white/15 hover:border-white/30 hover:bg-white/10 text-white/70';
  }
}

// ── Share button subcomponent ─────────────────────────────────────────────────
function ShareButton({ username, customSlug }: { username: string; customSlug?: string | null }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${customSlug || username}`
    : '';

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `${username}'s Profile - The ANTs`, url: profileUrl }); }
      catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(profileUrl); }
      catch { /* fallback */ }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-sm font-medium text-white/80 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all duration-300 cursor-pointer"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProfileHeroProps {
  profile: Profile;
  isOwnProfile: boolean;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProfileHero({ profile, isOwnProfile }: ProfileHeroProps) {
  const visibleLinks = (profile.socialLinks || []).filter(link => link.visible && link.url);
  const isContributor = profile.role === 'contributor' || profile.role === 'main_contributor';

  // Resolve theme styling
  const themePreset = profile.theme
    ? PROFILE_THEME_PRESETS.find(p => p.key === profile.theme!.preset)
    : null;
  const accentHex = profile.theme?.accentColor || themePreset?.colors.accent || null;

  return (
    <div className="relative pt-6 sm:pt-8">
      {/* ── Glass Profile Card ── */}
      <div className="relative rounded-3xl border border-white/10 bg-background-card/90 backdrop-blur-2xl overflow-hidden shadow-xl">
        {/* Subtle top accent line */}
        <div
          className="absolute top-0 left-10 right-10 h-px"
          style={{
            background: accentHex
              ? `linear-gradient(90deg, transparent, ${accentHex}60, transparent)`
              : 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)',
          }}
        />

        <div className="flex flex-col items-center text-center pt-10 pb-10 px-6">
          {/* ── Avatar with ring ── */}
          <div className="relative mb-5">
            {/* Ambient glow */}
            <div
              className="absolute inset-0 rounded-full blur-2xl scale-150 opacity-30"
              style={{ background: accentHex ? `radial-gradient(circle, ${accentHex}, transparent)` : 'radial-gradient(circle, #f59e0b, transparent)' }}
            />
            {/* Gradient ring */}
            <div
              className="relative rounded-full p-[3px] shadow-lg"
              style={{
                background: accentHex
                  ? `linear-gradient(135deg, ${accentHex}, ${accentHex}88)`
                  : 'linear-gradient(135deg, #f59e0b, #f97316, #ef4444)',
                boxShadow: accentHex ? `0 4px 24px ${accentHex}40` : '0 4px 24px rgba(245,158,11,0.3)',
              }}
            >
              <div className="rounded-full p-[3px] bg-background-card">
                <AvatarImage avatar={profile.avatar} name={profile.name} size="xl" />
              </div>
            </div>
          </div>

          {/* ── Name + Role ── */}
          <div className="flex flex-col items-center mb-3">
            <div className="flex flex-wrap justify-center items-center gap-3 mb-1.5">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-none">
                {profile.name}
              </h1>
              <RoleBadge role={profile.role} />
            </div>
            {profile.title && (
              <p className="text-base font-medium text-foreground-secondary/80 mt-1">{profile.title}</p>
            )}
            <p
              className="text-sm font-mono mt-1.5"
              style={{ color: accentHex ? `${accentHex}cc` : 'var(--primary)' }}
            >
              @{profile.username}
            </p>
          </div>

          {/* ── ANTs Affiliation Chip ── */}
          <div className={cn(
            'flex items-center gap-1.5 mb-5 px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm',
            isContributor
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400/90'
              : 'bg-primary/10 border border-primary/20 text-primary/90'
          )}>
            {isContributor
              ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              : <BadgeCheck className="h-3.5 w-3.5" />
            }
            <span className="font-brand">{isContributor ? 'The ANTs Verified Contributor' : 'The ANTs Member'}</span>
          </div>

          {/* ── Bio ── */}
          {profile.bio && (
            <div className="relative max-w-2xl mb-6">
              <div className="absolute -top-2 left-0 text-5xl text-primary/15 leading-none select-none font-serif">&ldquo;</div>
              <p className="text-sm text-foreground-secondary/90 leading-relaxed px-8 py-1 italic">
                {profile.bio}
              </p>
              <div className="absolute -bottom-5 right-0 text-5xl text-primary/15 leading-none select-none font-serif">&rdquo;</div>
            </div>
          )}

          {/* ── Social Links ── */}
          {visibleLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2.5 mt-3 max-w-lg">
              {visibleLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-sm transition-all duration-300 group',
                    platformColor(link.platform)
                  )}
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

          {/* ── Action Buttons (own profile) ── */}
          {isOwnProfile && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <Link
                href="/settings/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary hover:bg-primary/20 hover:border-primary/50 transition-all duration-300"
              >
                <Settings className="h-4 w-4" />
                Edit Profile
              </Link>
              <ShareButton username={profile.username} customSlug={profile.customUrlSlug} />
            </div>
          )}
          {/* ── Share button for others ── */}
          {!isOwnProfile && (
            <div className="mt-6">
              <ShareButton username={profile.username} customSlug={profile.customUrlSlug} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
