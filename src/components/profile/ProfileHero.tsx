'use client';

import Link from 'next/link';
import {
  Globe,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { RoleBadge } from '@/components/ui/Badge';
import { cn, getInitials } from '@/lib/utils';
import { ROLE_METADATA, type Profile } from '@/types';

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
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-background-card/40 backdrop-blur-md shadow-2xl p-8">
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="shrink-0 p-1.5 bg-background/50 backdrop-blur-xl rounded-full border border-white/10 shadow-xl mb-5">
          {profile.avatar ? (
             <img src={profile.avatar} alt={profile.name} className="h-32 w-32 rounded-full object-cover" />
          ) : (
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-5xl font-bold">
              {getInitials(profile.name)}
            </div>
          )}
        </div>

        {/* Name + Meta */}
        <div className="flex flex-col items-center mb-4">
          <div className="flex flex-wrap justify-center items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">{profile.name}</h1>
            <RoleBadge role={profile.role} />
          </div>
          {profile.title && (
            <p className="text-base font-medium text-foreground-secondary">{profile.title}</p>
          )}
          <p className="text-sm text-primary/80 font-mono mt-1">@{profile.username}</p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-2 p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm max-w-2xl w-full">
            <p className="text-sm text-foreground-secondary leading-relaxed">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {socialLinks.map((link) => (
              <a
                key={link.key}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-white/10 hover:border-white/20 transition-all duration-300 group backdrop-blur-md"
              >
                <span className="text-primary/70 group-hover:text-primary transition-colors">{link.icon}</span>
                {link.label}
                <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
              </a>
            ))}
          </div>
        )}

        {/* Edit button (own profile only) */}
        {isOwnProfile && (
          <div className="mt-8">
            <Link
              href="/settings/profile"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-foreground transition-all duration-300 shadow-sm backdrop-blur-md"
            >
              <Settings className="h-4 w-4" />
              Edit Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
