'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Public Club Showcase Page
// Modern landing page for each club featuring hero, about, projects, members,
// and announcements. Sections honour the club's visibility settings.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Megaphone,
  FolderGit2,
  Share2,
  ArrowRight,
  Check,
  Home,
  Building2,
  ExternalLink,
  UserPlus,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import BackButton from '@/components/ui/BackButton';
import { useClub } from '@/hooks/useClub';
import { useAuth } from '@/hooks/useAuth';
import type { Club, ClubSection, ClubProject, ClubAnnouncement } from '@/types';

// ── Constants ────────────────────────────────────────────────────────────────

const FIELD_BADGE_VARIANTS: Record<string, string> = {
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

const SECTION_ICONS: Record<string, React.ReactNode> = {
  about: <Building2 className="h-5 w-5" />,
  projects: <FolderGit2 className="h-5 w-5" />,
  members: <Users className="h-5 w-5" />,
  announcements: <Megaphone className="h-5 w-5" />,
};

const SECTION_LABELS: Record<string, string> = {
  about: 'About',
  projects: 'Projects Gallery',
  members: 'Members',
  announcements: 'Announcements',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// If accent_color is a valid hex, use it; otherwise fall back to indigo.
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6 && clean.length !== 3) return `rgba(99, 102, 241, ${alpha})`;
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(99, 102, 241, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ClubShowcasePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const clubStore = useClub();
  const { user, isAuthenticated } = useAuth();

  const [club, setClub] = useState<Club | null>(null);
  const [sections, setSections] = useState<ClubSection[]>([]);
  const [projects, setProjects] = useState<ClubProject[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      const c = await clubStore.getClubBySlug(slug);
      if (cancelled) return;
      setClub(c);
      if (!c) {
        setLoading(false);
        return;
      }
      const clubId = c.id;
      const [s, p, m, a, l, membership] = await Promise.all([
        clubStore.getClubSections(clubId),
        clubStore.getClubProjects(clubId),
        clubStore.getClubMembers(clubId),
        clubStore.getClubAnnouncements(clubId),
        clubStore.getClubLeaders(clubId),
        user ? clubStore.getUserClubMembership(clubId, user.id) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setSections(s);
      setProjects(p as unknown as ClubProject[]);
      setAnnouncements(a as unknown as ClubAnnouncement[]);
      setLeaders(l);

      // Merge leaders into members list (deduplicate by user_id) so they appear in the members grid
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

      // Check membership using already-fetched leaders + membership
      if (user) {
        const isLeader = l.some((ld: any) => ld.user_id === user.id);
        setJoined(!!membership || isLeader);
      }

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, user?.id]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = pageUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!user || !club) return;
    setJoining(true);
    setJoinError(null);
    const result = await clubStore.joinClub(club.id, user.id);
    if (result.success) {
      setJoined(true);
      router.push(`/clubs/${club.custom_slug}`);
    } else {
      setJoinError(result.error || 'Failed to join. Please try again.');
    }
    setJoining(false);
  };

  // ── Derived data ──────────────────────────────────────────────────────

  const sortedSections = [...sections].sort((a, b) => a.order_no - b.order_no);
  const visibleSections = sortedSections.filter((s) => s.visible);

  const leaderIds = new Set(leaders.map((l: any) => l.user_id));
  const leaderProfiles = leaders.map((l: any) => l.profiles).filter(Boolean);

  const accentColor = club?.accent_color || '#6366f1';

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--foreground-muted)]">Loading club...</p>
        </div>
      </div>
    );
  }

  // ── Not-found state ────────────────────────────────────────────────────

  if (!club) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* Illustration */}
          <div className="mx-auto mb-8 relative w-40 h-40">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-transparent blur-3xl" />
            <div className="relative flex items-center justify-center h-full">
              <Building2 className="h-16 w-16 text-[var(--foreground-muted)]" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
            Club not found
          </h1>
          <p className="text-[var(--foreground-secondary)] mb-8 leading-relaxed">
            This club doesn&apos;t exist or may have been removed by its leaders.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/">
              <Button variant="secondary" icon={<Home className="h-4 w-4" />}>
                Go Home
              </Button>
            </Link>
            <Link href="/explore/clubs">
              <Button iconRight={<ArrowRight className="h-4 w-4" />}>
                Browse Clubs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}08 50%, transparent 100%)`,
          }}
        />

        {/* Cover image overlay */}
        {club.cover_image_url && (
          <div className="absolute inset-0">
            <img
              src={club.cover_image_url}
              alt=""
              className="h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/60 via-transparent to-[var(--background)]" />
          </div>
        )}

        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${accentColor} 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Hero content */}
        <div className="relative mx-auto max-w-5xl px-4 pt-8 pb-16 sm:pb-24">
          <BackButton href="/explore/clubs" label="Back to Clubs" />

          <div className="mt-8 sm:mt-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            {/* Left: Club identity */}
            <div className="flex-1 max-w-2xl">
              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: hexToRgba(accentColor, 0.12),
                    color: accentColor,
                    borderColor: hexToRgba(accentColor, 0.25),
                  }}
                >
                  {FIELD_LABELS[club.field] || club.field}
                </span>
                {club.created_at && (
                  <span className="text-xs text-[var(--foreground-muted)]">
                    Founded {formatDate(club.created_at)}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
                {club.name}
              </h1>

              {/* Tagline */}
              {club.tagline && (
                <p className="mt-3 text-base text-[var(--foreground-secondary)] sm:text-lg max-w-xl leading-relaxed">
                  {club.tagline}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 mt-6 text-sm">
                {leaderProfiles.length > 0 && (
                  <span className="flex items-center gap-2 text-[var(--foreground-muted)]">
                    <span className="flex -space-x-2">
                      {leaderProfiles.slice(0, 3).map((p: any, i: number) => (
                        <div
                          key={i}
                          className="h-7 w-7 rounded-full ring-2 ring-[var(--background)] bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white text-[10px] font-bold"
                        >
                          {getInitials(p.name || 'L')}
                        </div>
                      ))}
                    </span>
                    <span>
                      Led by{' '}
                      {leaderProfiles
                        .slice(0, 2)
                        .map((p: any) => p.name)
                        .join(', ')}
                      {leaderProfiles.length > 2 && ` +${leaderProfiles.length - 2}`}
                    </span>
                  </span>
                )}
                <span className="text-[var(--foreground-muted)]">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
                {projects.length > 0 && (
                  <span className="text-[var(--foreground-muted)]">
                    {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 lg:items-end shrink-0">
              {joinError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                  {joinError}
                </p>
              )}
              {isAuthenticated ? (
                joined ? (
                  <Button variant="secondary" disabled icon={<Check className="h-5 w-5" />}>
                    You&apos;re a Member
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    isLoading={joining}
                    icon={<UserPlus className="h-5 w-5" />}
                    onClick={handleJoin}
                  >
                    Join this Club
                  </Button>
                )
              ) : (
                <Link href={`/signup?redirect=/explore/clubs/${slug}`}> 
                  <Button size="lg" icon={<UserPlus className="h-5 w-5" />}>
                    Join this Club
                  </Button>
                </Link>
              )}

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-[var(--success)]" />
                    <span className="text-[var(--success)]">Link copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Share club
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--background)] to-transparent" />
      </section>

      {/* ── Content Sections ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 pb-20 -mt-6 relative z-10 space-y-8">
        {visibleSections.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="h-10 w-10 text-[var(--foreground-muted)] mx-auto mb-3" />
            <p className="text-[var(--foreground-secondary)]">
              This club hasn&apos;t published any sections yet.
            </p>
          </div>
        )}

        {visibleSections.map((section) => {
          const sectionKey = section.section_key;
          const title = section.title_override || SECTION_LABELS[sectionKey] || sectionKey;

          switch (sectionKey) {
            // ── About Section ────────────────────────────────────────────
            case 'about':
              return club.description ? (
                <section
                  key={section.id}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 sm:p-8"
                >
                  {/* Accent top bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
                  />
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="flex items-center justify-center h-10 w-10 rounded-xl"
                      style={{
                        backgroundColor: hexToRgba(accentColor, 0.1),
                        color: accentColor,
                      }}
                    >
                      {SECTION_ICONS[sectionKey]}
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">{title}</h2>
                  </div>
                  <div className="prose-sm sm:prose max-w-none text-[var(--foreground-secondary)] leading-relaxed">
                    <p>{club.description}</p>
                  </div>
                </section>
              ) : null;

            // ── Projects Section ──────────────────────────────────────────
            case 'projects':
              if (projects.length === 0) return null;
              return (
                <section
                  key={section.id}
                  className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 sm:p-8"
                >
                  {/* Accent top bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
                  />
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="flex items-center justify-center h-10 w-10 rounded-xl"
                      style={{
                        backgroundColor: hexToRgba(accentColor, 0.1),
                        color: accentColor,
                      }}
                    >
                      {SECTION_ICONS[sectionKey]}
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">{title}</h2>
                    <span className="ml-auto text-sm text-[var(--foreground-muted)]">
                      {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                    </span>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {projects.map((project: any) => {
                      const creator = project.profiles;
                      return (
                        <div
                          key={project.id}
                          className="group/card relative rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden transition-all duration-300 hover:shadow-lg"
                          style={{
                            ['--card-accent' as string]: accentColor,
                          }}
                        >
                          {/* Cover image or gradient fallback */}
                          {project.cover_image_url ? (
                            <div className="aspect-[16/9] overflow-hidden">
                              <img
                                src={project.cover_image_url}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                              />
                            </div>
                          ) : (
                            <div
                              className="aspect-[16/9] flex items-center justify-center"
                              style={{
                                background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.15)}, ${hexToRgba(accentColor, 0.05)})`,
                              }}
                            >
                              <FolderGit2
                                className="h-10 w-10"
                                style={{ color: hexToRgba(accentColor, 0.3) }}
                              />
                            </div>
                          )}

                          <div className="p-5">
                            <h3 className="font-semibold text-[var(--foreground)] group-hover/card:text-[var(--primary)] transition-colors">
                              {project.title}
                            </h3>

                            {/* Description -- hidden for non-authenticated users */}
                            {project.description && isAuthenticated && (
                              <p className="mt-2 text-sm text-[var(--foreground-secondary)] line-clamp-2">
                                {project.description}
                              </p>
                            )}
                            {project.description && !isAuthenticated && (
                              <p className="mt-2 text-sm text-[var(--foreground-muted)] italic">
                                Sign in to view project details
                              </p>
                            )}

                            {/* Tags */}
                            {project.tags && project.tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {project.tags.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium"
                                    style={{
                                      backgroundColor: hexToRgba(accentColor, 0.08),
                                      color: accentColor,
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Footer */}
                            <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
                              <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                                {creator && (
                                  <div
                                    className="h-5 w-5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white text-[8px] font-bold"
                                  >
                                    {getInitials(creator.name || 'M')}
                                  </div>
                                )}
                                <span>
                                  {creator?.name || 'Member'}
                                </span>
                              </div>
                              {project.links && project.links.length > 0 && (
                                <a
                                  href={project.links[0].url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {project.links[0].label}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );

            // ── Members Section ──────────────────────────────────────────
            case 'members':
              if (members.length === 0) return null;
              return (
                <section
                  key={section.id}
                  className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 sm:p-8"
                >
                  {/* Accent top bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
                  />
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="flex items-center justify-center h-10 w-10 rounded-xl"
                      style={{
                        backgroundColor: hexToRgba(accentColor, 0.1),
                        color: accentColor,
                      }}
                    >
                      {SECTION_ICONS[sectionKey]}
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">{title}</h2>
                    <span className="ml-auto text-sm text-[var(--foreground-muted)]">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  {/* Member grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {members.map((member: any) => {
                      const profile = member.profiles;
                      const isLeader = leaderIds.has(member.user_id);
                      return (
                        <div
                          key={member.id}
                          className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition-all duration-200 hover:border-[var(--primary)]/30 hover:shadow-sm"
                        >
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{
                              background: isLeader
                                ? `linear-gradient(135deg, ${accentColor}, ${hexToRgba(accentColor, 0.6)})`
                                : 'linear-gradient(135deg, var(--primary), var(--accent))',
                              boxShadow: isLeader
                                ? `0 0 0 2px ${hexToRgba(accentColor, 0.2)}`
                                : 'none',
                            }}
                          >
                            {getInitials(profile?.name || 'M')}
                          </div>
                          <span className="text-sm text-[var(--foreground)] font-medium truncate max-w-full text-center">
                            {profile?.name || 'Member'}
                          </span>
                          {isLeader && (
                            <span
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: hexToRgba(accentColor, 0.1),
                                color: accentColor,
                              }}
                            >
                              Leader
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );

            // ── Announcements Section ────────────────────────────────────
            case 'announcements':
              if (announcements.length === 0) return null;
              return (
                <section
                  key={section.id}
                  className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 sm:p-8"
                >
                  {/* Accent top bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
                  />
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="flex items-center justify-center h-10 w-10 rounded-xl"
                      style={{
                        backgroundColor: hexToRgba(accentColor, 0.1),
                        color: accentColor,
                      }}
                    >
                      {SECTION_ICONS[sectionKey]}
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">{title}</h2>
                  </div>

                  <div className="space-y-4">
                    {(announcements as any[]).map((announcement) => {
                      const poster = announcement.profiles;
                      return (
                        <div
                          key={announcement.id}
                          className="group/ann relative rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 transition-all duration-200 hover:border-[var(--primary)]/20 hover:shadow-sm"
                        >
                          {/* Accent left bar on hover */}
                          <div
                            className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-opacity duration-200 opacity-0 group-hover/ann:opacity-100"
                            style={{ backgroundColor: accentColor }}
                          />

                          <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                              <div
                                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{
                                  background: `linear-gradient(135deg, ${accentColor}, ${hexToRgba(accentColor, 0.6)})`,
                                }}
                              >
                                {getInitials(poster?.name || 'A')}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[var(--foreground)]">
                                {announcement.title}
                              </h3>
                              {announcement.content && (
                                <p className="mt-1.5 text-sm text-[var(--foreground-secondary)] leading-relaxed">
                                  {announcement.content}
                                </p>
                              )}
                              <div className="mt-3 flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
                                <span>{poster?.name || 'Leader'}</span>
                                <span>&middot;</span>
                                <span>{formatRelativeTime(announcement.created_at ?? '')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );

            default:
              return null;
          }
        })}

        {/* ── CTA Section ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] p-6 sm:p-8 md:p-12 text-center">
          {/* Gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.08)} 0%, transparent 50%)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${accentColor} 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative">
            <div
              className="mx-auto mb-5 flex items-center justify-center h-14 w-14 rounded-2xl"
              style={{
                backgroundColor: hexToRgba(accentColor, 0.1),
                color: accentColor,
              }}
            >
              <UserPlus className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              Join {club.name}
            </h2>
            <p className="mt-3 text-[var(--foreground-secondary)] max-w-md mx-auto">
              Collaborate with fellow members, contribute to projects, and help grow this community.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {joinError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 w-full sm:w-auto text-center">
                  {joinError}
                </p>
              )}
              {isAuthenticated ? (
                joined ? (
                  <Button variant="secondary" disabled icon={<Check className="h-5 w-5" />}>
                    You&apos;re a Member
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    isLoading={joining}
                    icon={<UserPlus className="h-5 w-5" />}
                    onClick={handleJoin}
                  >
                    Join this Club
                  </Button>
                )
              ) : (
                <Link href={`/signup?redirect=/explore/clubs/${slug}`}>
                  <Button size="lg" icon={<UserPlus className="h-5 w-5" />}>
                    Join this Club
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
