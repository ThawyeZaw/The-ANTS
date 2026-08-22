'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Club Member View Page
// Authenticated club members can view projects, announcements, other members,
// manage their own projects, and leave the club. Leaders get manage link.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FolderGit2, Megaphone, Users, Plus, Trash2, LogOut, Globe } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { useClub } from '@/hooks/useClub';
import { cn, formatDate, getInitials } from '@/lib/utils';
import type { Club } from '@/types';
import { FIELD_LABELS, FIELD_BADGE_STYLES } from '@/constants/clubs';
import AddProjectForm from '@/components/clubs/AddProjectForm';

// ── Main Page Component ──────────────────────────────────────────────────────

export default function ClubMemberPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { user } = useAuth();
  const clubStore = useClub();

  // ── State ──────────────────────────────────────────────────────────────

  const [club, setClub] = useState<Club | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  // ── Data Fetching ──────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const c = await clubStore.getClubBySlug(slug);
      setClub(c);
      if (!c) {
        setLoading(false);
        return;
      }

      const clubId = c.id;
      const [p, a, m, l] = await Promise.all([
        clubStore.getClubProjects(clubId),
        clubStore.getClubAnnouncements(clubId),
        clubStore.getClubMembers(clubId),
        clubStore.getClubLeaders(clubId),
      ]);
      setProjects(p);
      setAnnouncements(a);
      setLeaders(l);

      // Merge leaders into members list (deduplicate by user_id)
      const memberUserIds = new Set(m.map((member: any) => member.user_id));
      const mergedMembers = [...m];
      l.forEach((leader: any) => {
        if (!memberUserIds.has(leader.user_id)) {
          mergedMembers.push({
            id: leader.id,
            club_id: leader.club_id,
            user_id: leader.user_id,
            joined_at: null,
            profiles: leader.profiles,
          });
        }
      });
      setMembers(mergedMembers);

      setLoading(false);
    })();
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect for membership (depends on user authentication)
  useEffect(() => {
    if (!user || !club) {
      setMembership(null);
      return;
    }
    clubStore.getUserClubMembership(club.id, user.id).then(setMembership);
  }, [club?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived Values ─────────────────────────────────────────────────────

  const leaderUserIds = new Set(leaders.map((l: any) => l.user_id));
  const isLeader = !!user && leaderUserIds.has(user.id);
  const isActiveMember = !!membership || isLeader;
  const leaderProfiles = leaders.map((l: any) => l.profiles).filter(Boolean);

  // ── Handlers ───────────────────────────────────────────────────────────
  

  const handleJoin = async () => {
    if (!user || !club) return;
    setFeedback('');
    const result = await clubStore.joinClub(club.id, user.id);
    if (result.success) {
      const mem = await clubStore.getUserClubMembership(club.id, user.id);
      setMembership(mem);
      setFeedback('You joined this club!');
    } else {
      setFeedback(result.error || 'Could not join club.');
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!club) return;
    setFeedback('');
    const result = await clubStore.removeMember(club.id, user!.id, targetUserId);
    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
      setFeedback('Member removed.');
    } else {
      setFeedback(result.error || 'Could not remove member.');
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <p className="mt-4 text-sm text-[var(--foreground-muted)]">Loading club...</p>
      </div>
    );
  }

  // ── Club Not Found ─────────────────────────────────────────────────────

  if (!club) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-8 text-center">
        <FolderGit2 className="mx-auto h-10 w-10 text-[var(--foreground-muted)]" />
        <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">Club not found</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">
          This club may have been removed or no longer exists.
        </p>
        <div className="mt-6">
          <BackButton href="/clubs" label="Back to Clubs" />
        </div>
      </div>
    );
  }

  // ── Not a Member (authenticated) ───────────────────────────────────────

  if (user && !isActiveMember) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <BackButton href="/clubs" label="Back to Clubs" />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-[var(--foreground-muted)]" />
          <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">
            You are not a member of this club
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[var(--foreground-muted)]">
            Join {club.name} to view projects, announcements, and connect with members.
          </p>
          {feedback && <p className="mt-3 text-sm text-[var(--foreground-muted)]">{feedback}</p>}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={handleJoin} icon={<Plus className="h-4 w-4" />}>
              Join Club
            </Button>
            <Link href="/clubs">
              <Button variant="secondary">Go Back</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Not Signed In ──────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <BackButton href="/clubs" label="Back to Clubs" />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-[var(--foreground-muted)]" />
          <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">
            You are not a member of this club
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[var(--foreground-muted)]">
            Sign in to join {club.name} and access member features.
          </p>
          <div className="mt-6">
            <Link href={`/login?redirect=/clubs/${slug}`}>
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Full Member View ───────────────────────────────────────────────────

  return (
    <div className="mx-auto space-y-6 pb-20">
      <BackButton href="/clubs" label="Back to Clubs" />

      {/* ── Side-by-side layout: sidebar (club info) + content on large screens ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* ── Left Sidebar: Club Info + Actions (sticky) ── */}
        <div className="space-y-6">
          <section className="sticky top-24 space-y-6">
            {/* ── Club Header Card ─────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                      FIELD_BADGE_STYLES[club.field] || FIELD_BADGE_STYLES.other
                    )}
                  >
                    {FIELD_LABELS[club.field] || club.field}
                  </span>
                  {isLeader && <Badge variant="warning">Leader</Badge>}
                </div>

                <h1 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">
                  {club.name}
                </h1>

                {club.tagline && (
                  <p className="text-sm text-[var(--foreground-secondary)]">{club.tagline}</p>
                )}

                <div className="space-y-1.5 text-sm text-[var(--foreground-muted)]">
                  {leaderProfiles.length > 0 && (
                    <p>
                      Led by{' '}
                      {leaderProfiles
                        .slice(0, 2)
                        .map((p: any) => p.name)
                        .join(', ')}
                      {leaderProfiles.length > 2 && ` +${leaderProfiles.length - 2} more`}
                    </p>
                  )}
                  <p>
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </p>
                  <p>Created {formatDate(club.created_at)}</p>
                </div>

                {/* ── Actions ── */}
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <a
                    href={`/explore/clubs/${club.custom_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm font-medium text-foreground-secondary hover:border-border-hover hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Globe className="h-4 w-4" />
                    <span>View Public Page</span>
                  </a>
                  {isLeader && (
                    <Link href={`/clubs/${slug}/manage`} className="block">
                      <Button variant="secondary" fullWidth>
                        Manage Club
                      </Button>
                    </Link>
                  )}
                </div>

                {feedback && <p className="text-sm text-[var(--foreground-muted)]">{feedback}</p>}
              </div>
            </div>

            {/* ── Members List (sidebar) ── */}
            <MembersSection
              members={members}
              leaderUserIds={leaderUserIds}
              isLeader={isLeader}
              userId={user.id}
              onRemoveMember={handleRemoveMember}
            />
          </section>
        </div>

        {/* ── Right Content: Projects, Announcements ── */}
        <div className="space-y-6 min-w-0">
          <ProjectsSection
            userId={user.id}
            projects={projects}
            onAddProject={async (data) => {
              if (!club) return { success: false, error: 'Club not found' };
              const result = await clubStore.addProject(club.id, user.id, data);
              if (result.success) {
                const updated = await clubStore.getClubProjects(club.id);
                setProjects(updated);
              }
              return result;
            }}
            onDeleteProject={async (projectId) => {
              if (!club) return { success: false, error: 'Club not found' };
              const result = await clubStore.deleteProject(projectId, user.id);
              if (result.success) {
                const updated = await clubStore.getClubProjects(club.id);
                setProjects(updated);
              }
              return result;
            }}
          />

          <AnnouncementsSection
            announcements={announcements}
            isLeader={isLeader}
            onPostAnnouncement={async (title, content) => {
              if (!club) return { success: false, error: 'Club not found' };
              const result = await clubStore.postAnnouncement(club.id, user.id, title, content);
              if (result.success) {
                const updated = await clubStore.getClubAnnouncements(club.id);
                setAnnouncements(updated);
              }
              return result;
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Projects Section ─────────────────────────────────────────────────────────

interface AddProjectData {
  title: string;
  description?: string;
  cover_image_url?: string;
  tags?: string[];
  links?: { label: string; url: string }[];
}

function ProjectsSection({
  userId,
  projects,
  onAddProject,
  onDeleteProject,
}: {
  userId: string;
  projects: any[];
  onAddProject: (data: AddProjectData) => Promise<{ success: boolean; error?: string }>;
  onDeleteProject: (projectId: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId);
    setError('');
    const result = await onDeleteProject(projectId);
    if (!result.success) {
      setError(result.error || 'Could not delete project.');
    }
    setDeletingId(null);
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 sm:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Projects</h2>
          <span className="text-sm text-[var(--foreground-muted)]">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </span>
        </div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(!showForm)} className="self-end sm:self-auto">
          {showForm ? 'Cancel' : 'Add Project'}
        </Button>
      </div>

      {/* Add project form */}
      {showForm && (
        <AddProjectForm
          onAddProject={onAddProject}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
          <FolderGit2 className="mx-auto h-8 w-8 text-[var(--foreground-muted)]" />
          <p className="mt-3 font-semibold text-[var(--foreground)]">No projects yet</p>
          <p className="text-sm text-[var(--foreground-muted)]">
            Share your first project with the club.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => {
            const creator = project.profiles;
            const isOwn = project.created_by === userId;
            return (
              <div
                key={project.id}
                className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] transition-all duration-200 hover:shadow-md"
              >
                {/* Cover image */}
                {project.cover_image_url && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={project.cover_image_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-[var(--foreground)]">{project.title}</h3>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        className="shrink-0 cursor-pointer rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--error)]/10 hover:text-[var(--error)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {project.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--foreground-secondary)]">
                      {project.description}
                    </p>
                  )}

                  {project.tags && project.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.tags.map((tag: string) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--foreground-muted)]">
                    <span>
                      {creator?.name || 'Member'} &middot; {formatDate(project.created_at)}
                    </span>
                    {project.links && project.links.length > 0 && (
                      <a
                        href={project.links[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--primary)] hover:underline"
                      >
                        {project.links[0].label || 'Link'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Announcements Section (read-only for members, leaders can post) ──────────

function AnnouncementsSection({
  announcements,
  isLeader,
  onPostAnnouncement,
}: {
  announcements: any[];
  isLeader: boolean;
  onPostAnnouncement: (
    title: string,
    content: string
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    setError('');
    const result = await onPostAnnouncement(title, content);
    if (result.success) {
      setTitle('');
      setContent('');
    } else {
      setError(result.error || 'Could not post announcement.');
    }
    setSubmitting(false);
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--warning)]/10 text-[var(--warning)]">
          <Megaphone className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Announcements</h2>
      </div>

      {/* Leader post form */}
      {isLeader && (
        <form
          onSubmit={handlePost}
          className="mb-6 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-5"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Announcement content"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
          <div className="flex items-center justify-between">
            {error && <p className="text-sm text-[var(--error)]">{error}</p>}
            <Button
              type="submit"
              size="sm"
              isLoading={submitting}
              icon={<Megaphone className="h-4 w-4" />}
            >
              Post Announcement
            </Button>
          </div>
        </form>
      )}

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-[var(--foreground-muted)]" />
          <p className="mt-3 font-semibold text-[var(--foreground)]">No announcements yet</p>
          <p className="text-sm text-[var(--foreground-muted)]">
            {isLeader
              ? 'Post the first announcement for your club.'
              : 'Check back later for updates.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item: any) => {
            const poster = item.profiles;
            return (
              <article
                key={item.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--warning)]/10 text-xs font-bold text-[var(--warning)]">
                    {getInitials(poster?.name || 'A')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[var(--foreground)]">{item.title}</h3>
                    {item.content && (
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground-secondary)]">
                        {item.content}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-[var(--foreground-muted)]">
                      {poster?.name || 'Leader'} &middot; {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Members Section ──────────────────────────────────────────────────────────

function MembersSection({
  members,
  leaderUserIds,
  isLeader,
  userId,
  onRemoveMember,
}: {
  members: any[];
  leaderUserIds: Set<string>;
  isLeader: boolean;
  userId: string;
  onRemoveMember: (targetUserId: string) => Promise<void>;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
          <Users className="h-4 w-4" />
        </div>
        <h2 className="font-semibold text-[var(--foreground)]">Members</h2>
        <span className="text-sm text-[var(--foreground-muted)]">
          ({members.length})
        </span>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 text-center">
          <Users className="mx-auto h-6 w-6 text-[var(--foreground-muted)]" />
          <p className="mt-2 text-sm font-medium text-[var(--foreground)]">No members yet</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {members.map((member: any) => {
            const profile = member.profiles;
            const isLeaderMember = leaderUserIds.has(member.user_id);
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 py-2.5"
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                    isLeaderMember
                      ? 'bg-gradient-to-br from-[var(--warning)] to-orange-400'
                      : 'bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]'
                  )}
                >
                  {getInitials(profile?.name || 'M')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {profile?.name || 'Member'}
                  </p>
                </div>
                {isLeaderMember && (
                  <span className="shrink-0 rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--warning)]">
                    Leader
                  </span>
                )}
                {isLeader && !isLeaderMember && member.user_id !== userId && (
                  <button
                    onClick={() => onRemoveMember(member.user_id)}
                    className="shrink-0 cursor-pointer rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--error)]/10 hover:text-[var(--error)]"
                    title="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
