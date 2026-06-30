'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Public Profile Discovery Page
// Browse all public profiles with role-based filtering.
// Anyone can view this page without authentication.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  ArrowLeft,
  Home,
  Users,
  ArrowRight,
  Search,
  GraduationCap,
  BookOpen,
  Pencil,
  Shield,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { getPublicProfiles } from '@/lib/mock/database';
import { UserRole, ROLE_METADATA } from '@/types';
import { cn } from '@/lib/utils';
import AvatarImage from '@/components/ui/AvatarImage';

const ROLE_FILTERS: { label: string; roles: UserRole[]; icon: React.ReactNode }[] = [
  { label: 'All', roles: [], icon: <Users className="h-4 w-4" /> },
  { label: 'Students', roles: ['student'], icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Teachers', roles: ['teacher'], icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Contributors', roles: ['contributor'], icon: <Pencil className="h-4 w-4" /> },
  { label: 'Main Contributors', roles: ['main_contributor'], icon: <Shield className="h-4 w-4" /> },
];

function ExploreProfilesContent() {
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get('role') as UserRole | null;

  const [activeFilter, setActiveFilter] = useState<string>(
    initialRoleParam || 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const activeFilterConfig = ROLE_FILTERS.find(f => f.label === activeFilter) || ROLE_FILTERS[0];
  const profiles = getPublicProfiles(
    activeFilterConfig.roles.length > 0 ? activeFilterConfig.roles : undefined
  );

  const filteredProfiles = profiles.filter((profile) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      profile.name.toLowerCase().includes(q) ||
      profile.username.toLowerCase().includes(q) ||
      (profile.bio && profile.bio.toLowerCase().includes(q)) ||
      (profile.title && profile.title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background-card">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-foreground-secondary hover:text-primary hover:bg-background-secondary transition-all mb-6 w-fit"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                <Home className="h-3.5 w-3.5" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-foreground mt-2">Explore Profiles</h1>
              <p className="text-foreground-secondary mt-1">
                Discover students, teachers, and contributors in the community.
              </p>
            </div>
            <Link href="/signup">
              <Button size="sm" iconRight={<ArrowRight className="h-4 w-4" />}>
                Join The ANTS
              </Button>
            </Link>
          </div>

          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search by name, username, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {ROLE_FILTERS.map((filter) => (
              <button
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                  activeFilter === filter.label
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground-secondary border-border hover:border-primary/30 hover:text-foreground'
                )}
              >
                {filter.icon}
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
            <p className="text-foreground-secondary text-lg">No profiles found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => {
              const roleMeta = ROLE_METADATA[profile.role];
              const projectCount = profile.projects?.length || 0;
              const activityCount = profile.activities?.length || 0;
              const achievementCount = profile.achievements?.length || 0;

              return (
                <Link
                  key={profile.id}
                  href={`/profile/${profile.username}`}
                  className="block group"
                >
                  <div className="bg-background-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <AvatarImage avatar={profile.avatar} name={profile.name} size="sm" className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {profile.name}
                        </h3>
                        <p className="text-sm text-foreground-muted truncate">@{profile.username}</p>
                        {profile.title && (
                          <p className="text-xs text-foreground-secondary mt-0.5 truncate">{profile.title}</p>
                        )}
                      </div>
                      <div className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0',
                        `${roleMeta.color} bg-${roleMeta.color.replace('text-', '')}/10`
                      )}>
                        {profile.role === 'student' && <GraduationCap className="h-3 w-3" />}
                        {profile.role === 'teacher' && <BookOpen className="h-3 w-3" />}
                        {profile.role === 'contributor' && <Pencil className="h-3 w-3" />}
                        {profile.role === 'main_contributor' && <Shield className="h-3 w-3" />}
                        {roleMeta.displayName}
                      </div>
                    </div>
                    {profile.bio && (
                      <p className="text-sm text-foreground-secondary line-clamp-2 mb-4">{profile.bio}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-foreground-muted">
                      {projectCount > 0 && <span>{projectCount} project{projectCount !== 1 ? 's' : ''}</span>}
                      {activityCount > 0 && <span>{activityCount} activit{activityCount !== 1 ? 'ies' : 'y'}</span>}
                      {achievementCount > 0 && <span>{achievementCount} achievement{achievementCount !== 1 ? 's' : ''}</span>}
                      {projectCount === 0 && activityCount === 0 && achievementCount === 0 && <span>No portfolio yet</span>}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      View Profile <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ExploreProfilesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground-muted">Loading...</p>
      </div>
    }>
      <ExploreProfilesContent />
    </Suspense>
  );
}