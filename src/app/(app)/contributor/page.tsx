'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Layers,
  Star,
  Globe,
  User,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useContributorNotes } from '@/hooks/useNotes';
import DeckCard from '@/components/flashcards/DeckCard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import {
  getContributorDashboardStats,
  mockDecks,
  mockContributorProfiles,
} from '@/lib/mock/database';

export default function ContributorDashboard() {
  const { user } = useAuth();
  const { role, isContributor } = useRole();
  const router = useRouter();
  const { notes: contributorNotes } = useContributorNotes(user?.id);

  useEffect(() => {
    if (role && !isContributor) {
      router.replace(`/${role === 'main_contributor' ? 'main-contributor' : role}`);
    }
  }, [role, isContributor, router]);

  if (!user || !isContributor) return null;

  const firstName = user.profile.name.split(' ')[0];
  const welcomeSubtitle = "Your contributions are making a difference. Here's your creator overview.";
  const stats = getContributorDashboardStats(user.id);

  // Decks owned by this contributor
  const myDecks = mockDecks.filter(d => d.owner_id === user.id);

  // Contributor profile details
  const profileDetails = mockContributorProfiles.find(p => p.id === user.id) || {
    title: user.profile.title || 'Contributor',
    bio: user.profile.bio || 'Building curriculum resources for students.',
    website_url: null,
    github_url: null,
    linkedin_url: null,
    facebook_url: null,
  };

  const handleStudyDeck = (deckId: string) => {
    router.push(`/flashcards/${deckId}`);
  };

  const handleEditDeck = (deckId: string) => {
    router.push(`/editor/flashcards?id=${deckId}`);
  };

  const mainContent = (
    <div className="space-y-6">
      {/* My Submissions */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-500" />
            My Submissions
          </h2>
          <Link href="/editor/notes" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Create Note
          </Link>
        </div>

        {contributorNotes.length === 0 ? (
          <div className="bg-background-secondary/50 border border-dashed border-border rounded-xl p-6 text-center text-foreground-muted">
            <p className="text-sm font-medium">No notes created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contributorNotes.slice(0, 4).map((note) => (
              <Link key={note.id}
                href={note.status === 'draft' || note.status === 'rejected' ? `/editor/notes?id=${note.id}` : `/library/${note.id}`}
                className="group flex flex-col gap-1.5 bg-background-card/50 border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    note.status === 'approved' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    note.status === 'pending_review' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                    note.status === 'draft' && 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
                    note.status === 'rejected' && 'bg-red-500/10 text-red-600 dark:text-red-400',
                  )}>
                    {note.status === 'pending_review' ? 'Pending' : note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-1">
                  {note.title}
                </h4>
                <p className="text-xs text-foreground-muted mt-0.5">{note.blocks?.length || 0} blocks</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My Decks */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" />
            My Decks
          </h2>
          <Link href="/flashcards" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Create Deck
          </Link>
        </div>

        {myDecks.length === 0 ? (
          <div className="bg-background-secondary/50 border border-dashed border-border rounded-xl p-6 text-center text-foreground-muted">
            <p className="text-sm font-medium">No decks created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myDecks.slice(0, 2).map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                userId={user.id}
                isOwned={true}
                onStudy={handleStudyDeck}
                onEdit={handleEditDeck}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="space-y-6">
      {/* Creator Profile */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-foreground text-lg">
            <User className="h-5 w-5 text-purple-500" />
            Creator Profile
          </h3>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-foreground">{profileDetails.title}</h4>
            <p className="text-xs text-foreground-muted mt-1 leading-relaxed">{profileDetails.bio}</p>
          </div>

          {/* Social Links */}
          {(profileDetails.website_url || profileDetails.github_url || profileDetails.linkedin_url) && (
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Links</span>
              {profileDetails.website_url && (
                <a href={profileDetails.website_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Website
                </a>
              )}
              {profileDetails.github_url && (
                <a href={profileDetails.github_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
              {profileDetails.linkedin_url && (
                <a href={profileDetails.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      firstName={firstName}
      welcomeSubtitle={welcomeSubtitle}
      stats={stats}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
    />
  );
}
