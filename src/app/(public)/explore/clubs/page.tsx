'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Public Club Discovery Page
// Browse all clubs without authentication. Anyone can view this page.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Home,
  MessageSquare,
  Users,
  ArrowRight,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { getClub, getClubMembers, getClubCurriculumLinks, getClubs } from '@/lib/mock/database';

export default function ExploreClubsPage() {
  const clubs = getClubs();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClubs = clubs.filter((club) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      club.name.toLowerCase().includes(q) ||
      (club.description && club.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <h1 className="text-3xl font-bold text-foreground mt-2">Explore Clubs</h1>
              <p className="text-foreground-secondary mt-1">
                Discover community spaces for subjects, CCAs, and projects.
              </p>
            </div>
            <Link href="/signup">
              <Button size="sm" iconRight={<ArrowRight className="h-4 w-4" />}>
                Join The ANTS
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>
      </header>

      {/* Club Grid */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {filteredClubs.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
            <p className="text-foreground-secondary text-lg">No clubs found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => {
              const memberCount = getClubMembers(club.id).filter(m => m.membership_status === 'active').length;
              const curriculumLinks = getClubCurriculumLinks(club.id);
              const features = club.enabled_features || [];

              return (
                <Link
                  key={club.id}
                  href={`/explore/clubs/${club.id}`}
                  className="block group"
                >
                  <div className="bg-background-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-blue-400 text-white">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      {club.join_mode === 'approval_based' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Approval
                        </span>
                      )}
                      {club.join_mode === 'invite_link' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
                          Invite
                        </span>
                      )}
                      {club.join_mode === 'open' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Open
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {club.name}
                    </h3>
                    <p className="text-sm text-foreground-secondary line-clamp-2 mb-4">
                      {club.description || 'No description'}
                    </p>

                    {/* Feature tags */}
                    {features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {features.slice(0, 4).map((f) => (
                          <span
                            key={f}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-background-secondary text-foreground-muted border border-border"
                          >
                            {f.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {features.length > 4 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-background-secondary text-foreground-muted">
                            +{features.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </span>
                      <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </span>
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