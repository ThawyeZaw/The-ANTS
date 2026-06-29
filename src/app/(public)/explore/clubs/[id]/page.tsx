'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Public Club Detail Page
// View a club's public information, members, and enabled features.
// No authentication required. Anyone with the link can view.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Users,
  CalendarDays,
  Megaphone,
  Link as LinkIcon,
  Trophy,
  FolderGit2,
  ArrowRight,
  Home,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getClub, getClubMembers, getClubCurriculumLinks, getClubSubjectLinks, getProfile, getCurriculum } from '@/lib/mock/database';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { ClubFeature } from '@/types';

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageSquare className="h-4 w-4" />,
  announcements: <Megaphone className="h-4 w-4" />,
  links: <LinkIcon className="h-4 w-4" />,
  members: <Users className="h-4 w-4" />,
  projects: <FolderGit2 className="h-4 w-4" />,
  activity_timeline: <CalendarDays className="h-4 w-4" />,
  leaderboard: <Trophy className="h-4 w-4" />,
};

const FEATURE_NAMES: Record<string, string> = {
  chat: 'Chat',
  announcements: 'Announcements',
  links: 'Links',
  members: 'Members',
  projects: 'Projects',
  activity_timeline: 'Activity Timeline',
  leaderboard: 'Leaderboard',
};

export default function PublicClubDetailPage() {
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const params = useParams();
  const clubId = params.id as string;
  const club = getClub(clubId);

  if (!club) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <MessageSquare className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Club not found</h1>
          <p className="text-foreground-muted mb-6">This club does not exist or may have been removed.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <Button variant="secondary" icon={<Home className="h-4 w-4" />}>Go Home</Button>
            </Link>
            <Link href="/explore/clubs">
              <Button iconRight={<ArrowRight className="h-4 w-4" />}>Browse Clubs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const members = getClubMembers(clubId);
  const activeMembers = members.filter(m => m.membership_status === 'active');
  const leader = getProfile(club.created_by);
  const enabledFeatures = club.enabled_features || ['chat', 'announcements', 'links', 'members'];
  const curriculumLinks = getClubCurriculumLinks(club.id);
  const subjectLinks = getClubSubjectLinks(club.id);

  const topicTags = [
    ...curriculumLinks.map(link => getCurriculum(link.curriculum_id)?.title).filter(Boolean),
    ...subjectLinks.map(link => link.subject_id),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {/* Back Navigation */}
        <Link
          href="/explore/clubs"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background-card border border-border shadow-sm hover:shadow-md hover:border-primary/40 text-sm font-medium text-foreground transition-all duration-300 w-fit"
        >
          <ArrowLeft className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:-translate-x-0.5 transition-all duration-300" />
          <Home className="h-3.5 w-3.5" />
          Back to Clubs
        </Link>

        {/* Club Header */}
        <section className="bg-background-card border border-border rounded-2xl p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge>
                  {club.join_mode === 'approval_based' ? 'Approval Required' :
                   club.join_mode === 'invite_link' ? 'Invite Only' : 'Open'}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground">{club.name}</h1>
              <p className="mt-2 text-foreground-secondary">{club.description || 'No description'}</p>

              {/* Tags */}
              {topicTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {topicTags.map((tag, i) => (
                    <Badge key={i}>{tag as string}</Badge>
                  ))}
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-foreground-muted">
                <span>Led by {leader?.name || 'Club leader'}</span>
                <span>{activeMembers.length} {activeMembers.length === 1 ? 'member' : 'members'}</span>
                <span>Created {formatDate(club.created_at)}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="w-full lg:w-56 shrink-0">
              <Link href="/signup">
                <Button fullWidth iconRight={<ArrowRight className="h-4 w-4" />}>
                  Join The ANTS
                </Button>
              </Link>
              <p className="text-xs text-foreground-muted mt-2 text-center">
                Sign up to join this club
              </p>
            </div>
          </div>
        </section>

        {/* Enabled Features */}
        <section className="bg-background-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Club Features</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {enabledFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-background-secondary border border-border"
              >
                <span className="text-primary">{FEATURE_ICONS[feature]}</span>
                <span className="text-sm text-foreground">{FEATURE_NAMES[feature] || feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Members */}
        <section className="bg-background-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Members</h2>
            <span className="text-xs text-foreground-muted ml-auto">{activeMembers.length} {activeMembers.length === 1 ? 'member' : 'members'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeMembers.map((member) => {
              const profile = getProfile(member.user_id);
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-all">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(profile?.name || 'User')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{profile?.name || 'Unknown'}</p>
                    <p className="text-xs text-foreground-muted">{member.role === 'leader' ? 'Leader' : 'Member'}</p>
                  </div>
                  {member.role === 'leader' && (
                    <Badge variant="warning">Leader</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Shareable Link Info */}
        <div className="bg-background-card border border-border rounded-2xl p-6 text-center">
          <p className="text-sm text-foreground-muted">
            Share this page link to let others discover this club.
          </p>
          <p className="text-xs text-foreground-muted mt-1 font-mono">
            {url}
          </p>
        </div>

        {/* CTA to Join */}
        <div className="text-center py-4">
          <p className="text-sm text-foreground-muted mb-4">Want to participate in this club?</p>
          <Link href="/signup">
            <Button size="lg" iconRight={<ArrowRight className="h-5 w-5" />}>
              Join The ANTS &mdash; It{"'"}s Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}