'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ContributorPublicProfile
// Public-facing profile card for contributors (contributor / main_contributor).
// Displays bio, stats, published curriculum notes, and social links with a
// premium dark glass-morphism aesthetic.
// ──────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import {
  BookOpen,
  Layers,
  Star,
  Globe,
  FileText,
  ExternalLink,
  Users,
  Clock,
  Code2,
  Camera,
  Music2,
  Link2,
} from 'lucide-react';
import type { Note, Profile, SocialPlatform } from '@/types';
import { RoleBadge } from '@/components/ui/Badge';
import AvatarImage from '@/components/ui/AvatarImage';
import {
  getNotesByContributor,
  getLibraryDecks,
  mockCurriculums,
  mockSubjects,
  mockContributorProfiles,
} from '@/lib/mock/database';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────────────────

/** Curriculum-to-gradient mapping for visual note/deck cards */
const CURRICULUM_GRADIENTS: Record<string, string> = {
  'curr-igcse-cie': 'from-rose-600 via-red-500 to-orange-400',
  'curr-igcse-edx': 'from-blue-700 via-blue-500 to-cyan-400',
  'curr-ial-edx': 'from-purple-700 via-violet-500 to-fuchsia-400',
  'curr-ielts': 'from-emerald-600 via-green-500 to-teal-400',
  'curr-1': 'from-rose-600 via-red-500 to-orange-400',
};

const FALLBACK_GRADIENT = 'from-slate-600 via-slate-500 to-slate-400';

/** Exam board accent colour ring for note cards */
const EXAM_BOARD_RINGS: Record<string, string> = {
  CAIE: 'ring-rose-500/40',
  Edexcel: 'ring-blue-500/40',
  'British Council': 'ring-emerald-500/40',
};

// ── Icon Helpers ─────────────────────────────────────────────────────────────

function socialPlatformIcon(platform: SocialPlatform | 'custom', className: string) {
  switch (platform) {
    case 'github': return <Code2 className={className} />;
    case 'facebook': return <Camera className={className} />;
    case 'instagram': return <Camera className={className} />;
    case 'tiktok': return <Music2 className={className} />;
    case 'website': return <Globe className={className} />;
    default: return <Link2 className={className} />;
  }
}

function socialPlatformRing(platform: SocialPlatform | 'custom'): string {
  switch (platform) {
    case 'github': return 'ring-white/15 hover:ring-white/30 hover:bg-white/8 text-white';
    case 'facebook': return 'ring-blue-500/20 hover:ring-blue-500/40 hover:bg-blue-500/8 text-blue-300';
    case 'instagram': return 'ring-pink-500/20 hover:ring-pink-500/40 hover:bg-pink-500/8 text-pink-300';
    case 'tiktok': return 'ring-white/15 hover:ring-white/30 hover:bg-white/8 text-white';
    case 'website': return 'ring-emerald-500/20 hover:ring-emerald-500/40 hover:bg-emerald-500/8 text-emerald-300';
    default: return 'ring-white/10 hover:ring-white/25 hover:bg-white/5 text-white/60';
  }
}

// ── Subcomponents ────────────────────────────────────────────────────────────

/** Single published curriculum note card */
function NoteCard({ note, curriculum, subject }: {
  note: Note;
  curriculum: { title: string; exam_board?: string } | null;
  subject: { title: string } | null;
}) {
  const gradient = note.curriculum_id
    ? (CURRICULUM_GRADIENTS[note.curriculum_id] ?? FALLBACK_GRADIENT)
    : FALLBACK_GRADIENT;

  const examRing = curriculum?.exam_board
    ? (EXAM_BOARD_RINGS[curriculum.exam_board] ?? 'ring-white/15')
    : 'ring-white/15';

  return (
    <div
      className={cn(
        'relative rounded-xl border border-white/8 bg-white/[0.04] backdrop-blur-md overflow-hidden',
        'transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06]',
        'group cursor-pointer'
      )}
    >
      {/* Gradient accent bar at top */}
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />

      <div className="p-5">
        {/* Subject chip */}
        {subject && (
          <span className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium mb-2.5',
            'ring-1 ring-inset',
            examRing,
          )}>
            <BookOpen className="h-3 w-3 opacity-70" />
            {subject.title}
          </span>
        )}

        <h4 className="text-sm font-semibold text-white/90 leading-snug mb-1.5 group-hover:text-white transition-colors">
          {note.title}
        </h4>

        {note.summary && (
          <p className="text-xs text-white/50 leading-relaxed line-clamp-2 mb-3">
            {note.summary}
          </p>
        )}

        {/* Footer: curriculum + date */}
        <div className="flex items-center justify-between text-[10px] text-white/35 font-mono pt-2 border-t border-white/5">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {curriculum?.title ?? 'General'}
          </span>
          <span>{formatRelativeTime(note.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

/** Stat pill */
function StatPill({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-white/6 bg-white/[0.03] backdrop-blur-sm">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-white tabular-nums">{value}</p>
        <p className="text-[11px] font-mono text-white/35 tracking-wider uppercase">{label}</p>
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface ContributorPublicProfileProps {
  /** The contributor profile to display */
  profile: Profile;
  /** Optional className for the outer wrapper */
  className?: string;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ContributorPublicProfile({
  profile,
  className,
}: ContributorPublicProfileProps) {
  const publishedNotes = useMemo(
    () => getNotesByContributor(profile.id).filter((n) => n.visibility === 'public' && n.status === 'approved'),
    [profile.id]
  );

  const decks = useMemo(() => {
    const allDecks = getLibraryDecks();
    return allDecks.filter((d) => d.owner_id === profile.id && d.is_public);
  }, [profile.id]);

  const contributorProfile = useMemo(() => {
    const cp = mockContributorProfiles.find((c: { id: string }) => c.id === profile.id);
    return cp ?? null;
  }, [profile.id]);

  // ── Curriculum / subject lookup maps ─────────────────────────────────

  const curriculumMap = useMemo(() => {
    const map: Record<string, (typeof mockCurriculums)[number]> = {};
    for (const c of mockCurriculums) map[c.id] = c;
    return map;
  }, []);

  const subjectMap = useMemo(() => {
    const map: Record<string, (typeof mockSubjects)[number]> = {};
    for (const s of mockSubjects) map[s.id] = s;
    return map;
  }, []);

  // ── Build enriched note list ─────────────────────────────────────────

  const enrichedNotes = useMemo(() => {
    return publishedNotes.map((note) => ({
      ...note,
      curriculum: note.curriculum_id ? (curriculumMap[note.curriculum_id] ?? null) : null,
      subject: note.subject_id ? (subjectMap[note.subject_id] ?? null) : null,
    }));
  }, [publishedNotes, curriculumMap, subjectMap]);

  // ── Social links ─────────────────────────────────────────────────────

  const visibleLinks = (profile.socialLinks || []).filter((l) => l.visible && l.url);

  // ── Stats ────────────────────────────────────────────────────────────

  const statItems = [
    { label: 'Notes', value: publishedNotes.length, icon: <FileText className="h-4 w-4" /> },
    { label: 'Decks', value: decks.length, icon: <Layers className="h-4 w-4" /> },
    { label: 'Curricula', value: '4', icon: <Globe className="h-4 w-4" /> },
    { label: 'Students', value: '120+', icon: <Users className="h-4 w-4" /> },
  ];

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <main
      className={cn(
        'relative min-h-screen flex items-start justify-center pt-16 pb-24 px-4',
        className
      )}
      style={{
        background: 'radial-gradient(circle at 50% 30%, #1e1e1e 0%, #0a0a0a 70%)',
      }}
    >
      {/* ── Ambient blobs ────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.04] blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,170,0,0.5) 0%, transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03] blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91,158,255,0.5) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-5xl">

        {/* ── Profile Header Card — Glass Morphism ──────────────────────── */}
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl overflow-hidden shadow-2xl shadow-black/30">
          {/* Top accent glow line */}
          <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

          <div className="flex flex-col items-center text-center py-14 px-6">

            {/* ── Avatar with gradient ring ──────────────────────────── */}
            <div className="shrink-0 mb-7 relative">
              <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-2xl scale-125" />
              <div className="relative rounded-full p-[3px] bg-gradient-to-br from-amber-400 via-orange-400 to-rose-500">
                <div className="rounded-full p-[2px] bg-[#1a1a1a]">
                  <AvatarImage avatar={profile.avatar} name={profile.name} size="xl" />
                </div>
              </div>
            </div>

            {/* ── Name + Role ───────────────────────────────────────── */}
            <div className="flex flex-col items-center mb-4">
              <div className="flex flex-wrap justify-center items-center gap-3 mb-1.5">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {profile.name}
                </h1>
                <RoleBadge role={profile.role} />
              </div>
              {profile.title && (
                <p className="text-base font-medium text-white/50">{profile.title}</p>
              )}
              {contributorProfile?.bio && (
                <p className="text-sm text-white/60 leading-relaxed max-w-lg mt-3">
                  {contributorProfile.bio}
                </p>
              )}
              <p className="text-sm text-amber-400/60 font-mono mt-1.5">@{profile.username}</p>
            </div>

            {/* ── Verified badge ──────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 mb-6 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-xs font-medium backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-brand">The ANTs</span> Verified Contributor
            </div>

            {/* ── Stats row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mb-7">
              {statItems.map((s) => (
                <StatPill key={s.label} {...s} />
              ))}
            </div>

            {/* ── Social links ───────────────────────────────────────── */}
            {visibleLinks.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2.5 max-w-lg">
                {visibleLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
                      'ring-1 ring-inset backdrop-blur-md transition-all duration-300 group',
                      socialPlatformRing(link.platform)
                    )}
                  >
                    <span className="shrink-0 transition-transform group-hover:scale-110">
                      {socialPlatformIcon(link.platform, 'h-4 w-4')}
                    </span>
                    <span className="truncate max-w-[120px]">{link.label}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Published Notes Section ───────────────────────────────────── */}
        {enrichedNotes.length > 0 && (
          <div className="mt-10">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <BookOpen className="h-5 w-5 text-amber-400" />
                Published Notes
                <span className="ml-2 text-sm font-normal text-white/35 font-mono">
                  {enrichedNotes.length}
                </span>
              </h2>
              <p className="text-sm text-white/40 mt-1">
                Curriculum-aligned study materials by {profile.name.split(' ')[0]}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrichedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  curriculum={note.curriculum}
                  subject={note.subject}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Public Decks Section ──────────────────────────────────────── */}
        {decks.length > 0 && (
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-amber-400" />
                Flashcard Decks
                <span className="ml-2 text-sm font-normal text-white/35 font-mono">
                  {decks.length}
                </span>
              </h2>
              <p className="text-sm text-white/40 mt-1">
                Public flashcard collections for revision
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="relative rounded-xl border border-white/8 bg-white/[0.04] backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06] group"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-lg">{deck.category === 'IELTS' ? '🌍' : deck.category === 'Biology' ? '🧬' : deck.category === 'Physics' ? '⚡' : deck.category === 'Chemistry' ? '🧪' : deck.category === 'Mathematics' ? '📐' : '📚'}</span>
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ring-white/10 text-white/50">
                        {deck.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white/90 leading-snug mb-1.5 group-hover:text-white transition-colors">
                      {deck.name}
                    </h4>
                    <p className="text-xs text-white/45 leading-relaxed line-clamp-2 mb-3">
                      {deck.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-white/35 font-mono pt-2 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {deck.category ?? 'Study'} deck
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(deck.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
