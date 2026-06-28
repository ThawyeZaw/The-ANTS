'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Profile Hero Component
// Hero banner for the public contributor profile page.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import {
  Globe,
  Settings,
  ExternalLink,
} from 'lucide-react';

/** Lightweight brand SVGs — lucide-react doesn't include brand/social icons */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}
import { RoleBadge } from '@/components/ui/Badge';
import { cn, getInitials } from '@/lib/utils';
import { ROLE_METADATA, type Profile } from '@/types';

interface ProfileHeroProps {
  profile: Profile;
  isOwnProfile: boolean;
}

export default function ProfileHero({ profile, isOwnProfile }: ProfileHeroProps) {
  const roleMeta = ROLE_METADATA[profile.role];

  const socialLinks = [
    { key: 'website', icon: <Globe className="h-4 w-4" />, url: profile.socialLinks?.website, label: 'Website' },
    { key: 'linkedin', icon: <LinkedinIcon className="h-4 w-4" />, url: profile.socialLinks?.linkedin, label: 'LinkedIn' },
    { key: 'github', icon: <GithubIcon className="h-4 w-4" />, url: profile.socialLinks?.github, label: 'GitHub' },
    { key: 'facebook', icon: <FacebookIcon className="h-4 w-4" />, url: profile.socialLinks?.facebook, label: 'Facebook' },
  ].filter((link) => link.url);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-background-card">
      {/* Gradient Banner */}
      <div
        className={cn(
          'h-32 sm:h-40 bg-gradient-to-br',
          roleMeta.gradient
        )}
        style={{ opacity: 0.85 }}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-32 h-32 rounded-full border-2 border-white/30" />
          <div className="absolute bottom-2 left-12 w-20 h-20 rounded-full border-2 border-white/20" />
          <div className="absolute top-8 left-1/3 w-12 h-12 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6 -mt-12 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-background-card">
              {getInitials(profile.name)}
            </div>
          </div>

          {/* Name + Meta */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
              <RoleBadge role={profile.role} />
            </div>
            {profile.title && (
              <p className="text-sm text-foreground-secondary mt-1">{profile.title}</p>
            )}
            <p className="text-xs text-foreground-muted mt-0.5">@{profile.username}</p>
          </div>

          {/* Edit button (own profile only) */}
          {isOwnProfile && (
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 shrink-0"
            >
              <Settings className="h-4 w-4" />
              Edit Profile
            </Link>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-sm text-foreground-secondary leading-relaxed max-w-2xl">
            {profile.bio}
          </p>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {socialLinks.map((link) => (
              <a
                key={link.key}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-secondary border border-border text-xs font-medium text-foreground-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
              >
                {link.icon}
                {link.label}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
