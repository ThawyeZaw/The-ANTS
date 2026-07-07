'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Public Club Showcase Page
// Polished landing page for each club showing hero, projects, milestones,
// members, and announcements. No authentication required.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import MilestoneTracker from '@/components/clubs/MilestoneTracker';
import {
  MessageSquare,
  Users,
  CalendarDays,
  Megaphone,
  Link as LinkIcon,
  Trophy,
  FolderGit2,
  ArrowRight,
  Home,
  Target,
  Share2,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  getClub,
  getClubMembers,
  getClubAnnouncements,
  getClubProjects,
  getClubMilestones,
  getMemberContributions,
  getClubCurriculumLinks,
  getClubSubjectLinks,
  getProfile,
  getCurriculum,
} from '@/lib/mock/database';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { ClubFeatureKey, DEFAULT_CLUB_FEATURES } from '@/types';

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
  activity_timeline: 'Activity',
  leaderboard: 'Leaderboard',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  archived: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function PublicClubDetailPage() {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const params = useParams();
  const clubId = params.id as string;
  const club = getClub(clubId);

  const handleCopy = async () => {
    const shareUrl = club?.custom_domain_slug
      ? `${window.location.origin}/c/${club.custom_domain_slug}`
      : url;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!club) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <MessageSquare className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Club not found</h1>
          <p className="text-foreground-muted mb-6">This club does not exist or may have been removed.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/"><Button variant="secondary" icon={<Home className="h-4 w-4" />}>Go Home</Button></Link>
            <Link href="/explore/clubs"><Button iconRight={<ArrowRight className="h-4 w-4" />}>Browse Clubs</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const members = getClubMembers(clubId);
  const activeMembers = members.filter(m => m.membership_status === 'active');
  const leader = getProfile(club.created_by);
  const enabledFeatures = club.enabled_features || DEFAULT_CLUB_FEATURES;
  const publicFeatures = enabledFeatures.filter(f => f.public_visible).map(f => f.key);
  const curriculumLinks = getClubCurriculumLinks(club.id);
  const subjectLinks = getClubSubjectLinks(club.id);
  const announcements = getClubAnnouncements(club.id).filter(a => a.title || a.content);
  const projects = getClubProjects(club.id);
  const milestones = getClubMilestones(club.id);
  const contributions = getMemberContributions(club.id);

  const topicTags = [
    ...curriculumLinks.map(link => getCurriculum(link.curriculum_id)?.title).filter(Boolean),
    ...subjectLinks.map(link => link.subject_id),
  ];

  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const milestoneProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  // Top contributors
  const contributorMap = new Map<string, number>();
  for (const c of contributions) {
    contributorMap.set(c.user_id, (contributorMap.get(c.user_id) || 0) + 1);
  }
  const topContributors = Array.from(contributorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-background-card">
        {club.cover_image_url && (
          <div className="absolute inset-0">
            <img src={club.cover_image_url} alt="" className="h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background-card to-transparent" />
          </div>
        )}
        <div className="relative mx-auto max-w-4xl px-4 py-12">
          <BackButton href="/explore/clubs" label="Back to Clubs" />

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {club.is_showcase && (
                  <Badge variant="warning">Showcase</Badge>
                )}
                <Badge variant="default">
                  {club.join_mode === 'approval_based' ? 'Approval Required' :
                   club.join_mode === 'invite_link' ? 'Invite Only' : 'Open'}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground lg:text-4xl">{club.name}</h1>
              {club.tagline && (
                <p className="mt-2 text-lg text-foreground-secondary italic">{club.tagline}</p>
              )}
              {!club.tagline && club.description && (
                <p className="mt-2 text-foreground-secondary">{club.description}</p>
              )}

              {topicTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {topicTags.map((tag, i) => (
                    <Badge key={i}>{tag as string}</Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-foreground-muted">
                <span>Led by {leader?.name || 'Club leader'}</span>
                <span>{activeMembers.length} {activeMembers.length === 1 ? 'member' : 'members'}</span>
                <span>Created {formatDate(club.created_at)}</span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <Link href="/signup">
                <Button size="lg" iconRight={<ArrowRight className="h-5 w-5" />}>
                  Join The ANTS
                </Button>
              </Link>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Share2 className="h-3.5 w-3.5" />}
                {copied ? 'Link copied!' : 'Share this club'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Description (if tagline exists) */}
        {club.tagline && club.description && (
          <section className="rounded-2xl border border-border bg-background-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">About</h2>
            <p className="text-foreground-secondary">{club.description}</p>
          </section>
        )}

        {/* Project Gallery */}
        {publicFeatures.includes('projects') && projects.length > 0 && (
          <section className="rounded-2xl border border-border bg-background-card p-6">
            <div className="mb-5 flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Projects</h2>
              <span className="ml-auto text-xs text-foreground-muted">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => {
                const creator = getProfile(project.created_by);
                return (
                  <div key={project.id} className="group rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{project.title}</h3>
                      {project.status && (
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[project.status] || ''}`}>
                          {project.status}
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="mt-2 text-sm text-foreground-secondary line-clamp-2">{project.description}</p>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.tags.map((tag) => (
                          <span key={tag} className="rounded-md bg-primary/5 px-2 py-0.5 text-xs text-primary">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-foreground-muted">
                        by {creator?.name || 'Member'} &middot; {formatDate(project.created_at)}
                      </span>
                      {project.links && project.links.length > 0 && (
                        <div className="flex items-center gap-2">
                          {project.links.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Milestone Progress */}
        {milestones.length > 0 && (
          <section className="rounded-2xl border border-border bg-background-card p-6">
            <div className="mb-5 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Progress</h2>
              <span className="ml-auto text-xs text-foreground-muted">
                {completedMilestones}/{milestones.length} milestones
              </span>
            </div>
            {milestones.length > 0 && (
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${milestoneProgress}%` }}
                />
              </div>
            )}
            <MilestoneTracker
              milestones={milestones}
              isLeader={false}
              onAdd={async () => ({ success: false, error: 'Sign in required.' })}
              onUpdateStatus={async () => ({ success: false, error: 'Sign in required.' })}
              onDelete={async () => ({ success: false, error: 'Sign in required.' })}
            />
          </section>
        )}

        {/* Announcements */}
        {publicFeatures.includes('announcements') && announcements.length > 0 && (
          <section className="rounded-2xl border border-border bg-background-card p-6">
            <div className="mb-5 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Announcements</h2>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 5).map((announcement) => {
                const poster = getProfile(announcement.created_by);
                return (
                  <div key={announcement.id} className="rounded-lg border border-border bg-background p-4">
                    {announcement.title && (
                      <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                    )}
                    {announcement.content && (
                      <p className="mt-1 text-sm text-foreground-secondary">{announcement.content}</p>
                    )}
                    <p className="mt-2 text-xs text-foreground-muted">
                      Posted by {poster?.name || 'Leader'} on {formatDate(announcement.created_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Member Spotlight */}
        <section className="rounded-2xl border border-border bg-background-card p-6">
          <div className="mb-5 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Members</h2>
            <span className="ml-auto text-xs text-foreground-muted">{activeMembers.length} {activeMembers.length === 1 ? 'member' : 'members'}</span>
          </div>

          {/* Top Contributors */}
          {topContributors.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-foreground-muted">Top Contributors</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {topContributors.map(([userId, count]) => {
                  const profile = getProfile(userId);
                  return (
                    <div key={userId} className="flex flex-col items-center rounded-xl border border-border bg-background p-4 text-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(profile?.name || 'User')}
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground truncate w-full">{profile?.name || 'Unknown'}</p>
                      <p className="text-xs text-foreground-muted">{count} {count === 1 ? 'contribution' : 'contributions'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Members */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {activeMembers.map((member) => {
              const profile = getProfile(member.user_id);
              return (
                <div key={member.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(profile?.name || 'User')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{profile?.name || 'Unknown'}</p>
                    <p className="text-xs text-foreground-muted">
                      {member.role === 'admin' ? 'Admin' : member.role === 'moderator' ? 'Moderator' : 'Member'}
                    </p>
                  </div>
                  {(member.role === 'admin' || member.role === 'moderator') && (
                    <Badge variant="warning">Leader</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Features */}
        {publicFeatures.length > 0 && (
          <section className="rounded-2xl border border-border bg-background-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Features</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {publicFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                  <span className="text-primary">{FEATURE_ICONS[feature]}</span>
                  <span className="text-sm text-foreground">{FEATURE_NAMES[feature] || feature}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="text-center py-6">
          <p className="text-sm text-foreground-muted mb-4">Ready to join this club?</p>
          <Link href="/signup">
            <Button size="lg" iconRight={<ArrowRight className="h-5 w-5" />}>
              Join The ANTS — It's Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
