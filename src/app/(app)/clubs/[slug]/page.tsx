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

// ── Field Display Constants ──────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  computer_science: 'Computer Science',
  mathematics: 'Mathematics',
  science: 'Science',
  engineering: 'Engineering',
  medicine: 'Medicine',
  literature: 'Literature',
  arts: 'Arts',
  music: 'Music',
  debate: 'Debate',
  entrepreneurship: 'Entrepreneurship',
  architecture: 'Architecture',
  volunteering: 'Volunteering',
  other: 'Other',
};

const FIELD_BADGE_STYLES: Record<string, string> = {
  computer_science: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  mathematics: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  science: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  engineering: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  medicine: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  literature: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  arts: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  music: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  debate: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  entrepreneurship: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  architecture: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  volunteering: 'bg-green-500/15 text-green-400 border-green-500/20',
  other: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
};

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
  const [leaving, setLeaving] = useState(false);

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

  const handleLeave = async () => {
    if (!user || !club) return;
    setLeaving(true);
    setFeedback('');
    const result = await clubStore.leaveClub(club.id, user.id);
    if (result.success) {
      setMembership(null);
      setFeedback('You left this club.');
    } else {
      setFeedback(result.error || 'Could not leave club.');
    }
    setLeaving(false);
  };

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
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <BackButton href="/clubs" label="Back to Clubs" />

      {/* ── Club Header Card ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
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

            <h1 className="mt-3 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              {club.name}
            </h1>

            {club.tagline && (
              <p className="mt-2 text-base text-[var(--foreground-secondary)]">{club.tagline}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-muted)]">
              {leaderProfiles.length > 0 && (
                <span>
                  Led by{' '}
                  {leaderProfiles
                    .slice(0, 2)
                    .map((p: any) => p.name)
                    .join(', ')}
                  {leaderProfiles.length > 2 && ` +${leaderProfiles.length - 2} more`}
                </span>
              )}
              <span>
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
              <span>Created {formatDate(club.created_at)}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-row sm:flex-col gap-3 w-full sm:w-auto">
            <a
              href={`/explore/clubs/${club.custom_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm font-medium text-foreground-secondary hover:border-border-hover hover:text-foreground transition-colors cursor-pointer"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">View Public Page</span>
            </a>
            {isLeader && (
              <Link href={`/clubs/${slug}/manage`} className="flex-1 sm:flex-none">
                <Button variant="secondary" fullWidth>
                  Manage Club
                </Button>
              </Link>
            )}
          </div>
        </div>

        {feedback && <p className="mt-4 text-sm text-[var(--foreground-muted)]">{feedback}</p>}
      </section>

      {/* ── Projects Section ─────────────────────────────────────────────── */}
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

      {/* ── Announcements Section ────────────────────────────────────────── */}
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

      {/* ── Members Section ──────────────────────────────────────────────── */}
      <MembersSection members={members} leaderUserIds={leaderUserIds} />

      {/* ── Leave Club Button ────────────────────────────────────────────── */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          isLoading={leaving}
          icon={<LogOut className="h-4 w-4" />}
          onClick={handleLeave}
        >
          Leave Club
        </Button>
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const links = linkLabel && linkUrl ? [{ label: linkLabel, url: linkUrl }] : [];

    const result = await onAddProject({
      title: title.trim(),
      description: description || undefined,
      cover_image_url: coverImageUrl || undefined,
      tags: tags.length > 0 ? tags : undefined,
      links: links.length > 0 ? links : undefined,
    });

    if (result.success) {
      setTitle('');
      setDescription('');
      setCoverImageUrl('');
      setTagsInput('');
      setLinkLabel('');
      setLinkUrl('');
      setShowForm(false);
    } else {
      setError(result.error || 'Could not add project.');
    }
    setSubmitting(false);
  };

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
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project title"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of the project"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                Cover Image URL
              </label>
              <input
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                Tags (comma-separated)
              </label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="react, typescript, api"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                Link Label
              </label>
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="GitHub"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                Link URL
              </label>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            {error && <p className="text-sm text-[var(--error)]">{error}</p>}
            <Button type="submit" size="sm" isLoading={submitting} icon={<Plus className="h-4 w-4" />}>
              Create Project
            </Button>
          </div>
        </form>
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
        <div className="grid gap-4 sm:grid-cols-2">
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
}: {
  members: any[];
  leaderUserIds: Set<string>;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
          <Users className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Members</h2>
        <span className="text-sm text-[var(--foreground-muted)]">
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-[var(--foreground-muted)]" />
          <p className="mt-3 font-semibold text-[var(--foreground)]">No members yet</p>
          <p className="text-sm text-[var(--foreground-muted)]">
            Invite others to join this club.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {members.map((member: any) => {
            const profile = member.profiles;
            const isLeaderMember = leaderUserIds.has(member.user_id);
            return (
              <div
                key={member.id}
                className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition-all hover:border-[var(--primary)]/30"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white',
                    isLeaderMember
                      ? 'bg-gradient-to-br from-[var(--warning)] to-orange-400'
                      : 'bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]'
                  )}
                >
                  {getInitials(profile?.name || 'M')}
                </div>
                <span className="max-w-full truncate text-center text-sm font-medium text-[var(--foreground)]">
                  {profile?.name || 'Member'}
                </span>
                {isLeaderMember && <Badge variant="warning">Leader</Badge>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
