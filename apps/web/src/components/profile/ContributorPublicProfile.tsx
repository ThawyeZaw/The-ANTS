'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ContributorPublicProfile
// Public-facing profile card for contributors (contributor / main_contributor).
// Displays bio, stats, and social links with a premium dark glass-morphism aesthetic.
// ──────────────────────────────────────────────────────────────────────────────

import {
  Star,
  Globe,
  ExternalLink,
  Users,
  Code2,
  Camera,
  Music2,
  Link2,
  Send,
} from 'lucide-react';
import type { Profile, SocialPlatform } from '@/types';
import { RoleBadge } from '@/components/ui/Badge';
import AvatarImage from '@/components/ui/AvatarImage';
import { cn } from '@/lib/utils';

// ── Icon Helpers ─────────────────────────────────────────────────────────────

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

function socialPlatformRing(platform: SocialPlatform | 'custom'): string {
  switch (platform) {
    case 'github': return 'ring-white/15 hover:ring-white/30 hover:bg-white/8 text-white';
    case 'facebook': return 'ring-blue-500/20 hover:ring-blue-500/40 hover:bg-blue-500/8 text-blue-300';
    case 'instagram': return 'ring-pink-500/20 hover:ring-pink-500/40 hover:bg-pink-500/8 text-pink-300';
    case 'tiktok': return 'ring-white/15 hover:ring-white/30 hover:bg-white/8 text-white';
    case 'website': return 'ring-emerald-500/20 hover:ring-emerald-500/40 hover:bg-emerald-500/8 text-emerald-300';
    default: return 'ring-white/10 hover:ring-white/25 hover:bg-white/5 text-white/60';
  }
}

function StatPill({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-white/6 bg-white/[0.03] backdrop-blur-sm">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-white tabular-nums">{value}</p>
        <p className="text-[11px] font-mono text-white/35 tracking-wider uppercase">{label}</p>
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface ContributorPublicProfileProps {
  profile: Profile;
  className?: string;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ContributorPublicProfile({
  profile,
  className,
}: ContributorPublicProfileProps) {
  const visibleLinks = (profile.socialLinks || []).filter((l) => l.visible && l.url);

  const statItems = [
    { label: 'Curricula', value: '4', icon: <Globe className="h-4 w-4" /> },
    { label: 'Students', value: '120+', icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <main
      className={cn(
        'relative min-h-screen flex items-start justify-center pt-16 pb-24 px-4',
        className
      )}
      style={{
        background: 'radial-gradient(circle at 50% 30%, #1e1e1e 0%, #0a0a0a 70%)',
      }}
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.04] blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,170,0,0.5) 0%, transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03] blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91,158,255,0.5) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl overflow-hidden shadow-2xl shadow-black/30">
          <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

          <div className="flex flex-col items-center text-center py-14 px-6">
            <div className="shrink-0 mb-7 relative">
              <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-2xl scale-125" />
              <div className="relative rounded-full p-[3px] bg-gradient-to-br from-amber-400 via-orange-400 to-rose-500">
                <div className="rounded-full p-[2px] bg-[#1a1a1a]">
                  <AvatarImage avatar={profile.avatar} name={profile.name} size="xl" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center mb-4">
              <div className="flex flex-wrap justify-center items-center gap-3 mb-1.5">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {profile.name}
                </h1>
                <RoleBadge role={profile.role} />
              </div>
              {profile.title && (
                <p className="text-base font-medium text-white/50">{profile.title}</p>
              )}
              {profile.bio && (
                <p className="text-sm text-white/60 leading-relaxed max-w-lg mt-3">
                  {profile.bio}
                </p>
              )}
              <p className="text-sm text-amber-400/60 font-mono mt-1.5">@{profile.username}</p>
            </div>

            <div className="flex items-center gap-1.5 mb-6 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-xs font-medium backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-brand">The ANTs</span> Verified Contributor
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-7">
              {statItems.map((s) => (
                <StatPill key={s.label} {...s} />
              ))}
            </div>

            {(visibleLinks.length > 0 || profile.telegramHandle) && (
              <div className="flex flex-wrap justify-center gap-2.5 max-w-lg">
                {profile.telegramHandle && !visibleLinks.some((l) => l.url.includes('t.me')) && (
                  <a
                    href={`https://t.me/${profile.telegramHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ring-1 ring-inset ring-sky-500/20 hover:ring-sky-500/40 hover:bg-sky-500/10 text-sky-400 backdrop-blur-md transition-all duration-300 group"
                  >
                    <span className="shrink-0 transition-transform group-hover:scale-110">
                      <Send className="h-4 w-4" />
                    </span>
                    <span>@{profile.telegramHandle.replace('@', '')}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </a>
                )}
                {visibleLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
                      'ring-1 ring-inset backdrop-blur-md transition-all duration-300 group',
                      socialPlatformRing(link.platform)
                    )}
                  >
                    <span className="shrink-0 transition-transform group-hover:scale-110">
                      {socialPlatformIcon(link.platform, 'h-4 w-4')}
                    </span>
                    <span className="truncate max-w-[120px]">{link.label}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
