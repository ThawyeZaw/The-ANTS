'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Layers,
  Star,
  Globe,
  User,
  Send,
  MessageSquare,
  UserCircle,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import MyWorkspace from '@/components/workspace/MyWorkspace';
import { cn } from '@/lib/utils';
import {
  getContributorDashboardStats,
  mockDecks,
  mockContributorProfiles,
  getCardsByDeck,
  getNotesByContributor,
} from '@/lib/mock/database';

// ── Category-to-gradient mapping for deck visual preview cards ───────────────
const DECK_GRADIENTS: Record<string, string> = {
  Physics:     'bg-linear-to-br from-blue-600 via-blue-500 to-cyan-400',
  Biology:     'bg-linear-to-br from-emerald-600 via-green-500 to-teal-400',
  Chemistry:   'bg-linear-to-br from-purple-600 via-violet-500 to-fuchsia-400',
  Mathematics: 'bg-linear-to-br from-orange-600 via-amber-500 to-yellow-400',
  IELTS:       'bg-linear-to-br from-rose-600 via-pink-500 to-rose-400',
  History:     'bg-linear-to-br from-amber-700 via-amber-500 to-yellow-500',
  Custom:      'bg-linear-to-br from-slate-600 via-slate-500 to-slate-400',
};

const DEFAULT_GRADIENT = 'bg-linear-to-br from-indigo-600 via-blue-500 to-violet-400';

function getDeckGradient(category: string | null): string {
  if (!category) return DEFAULT_GRADIENT;
  return DECK_GRADIENTS[category] ?? DEFAULT_GRADIENT;
}

export default function ContributorDashboard() {
  const { user } = useAuth();
  const { role, isContributor } = useRole();
  const router = useRouter();

  const contributorNotes = user ? getNotesByContributor(user.id) : [];

  useEffect(() => {
    if (role && !isContributor) {
      router.replace(`/${role === 'main_contributor' ? 'main-contributor' : role}`);
    }
  }, [role, isContributor, router]);

  if (!user || !isContributor) return null;

  const firstName = user.profile.name.split(' ')[0];
  const welcomeSubtitle = "Your contributions are making a difference. Here's your creator overview.";
  const stats = getContributorDashboardStats(user.id);

  const myDecks = mockDecks.filter(d => d.owner_id === user.id);

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

  // ── Carousel (replicated from DashboardLayout — PM-locked) ──────────────────

  const slides = [
    {
      greeting: 'Welcome back',
      nameLine: `${firstName} 👋`,
      subtitle: welcomeSubtitle,
    },
    {
      greeting: 'Your Dashboard',
      nameLine: 'At a Glance',
      subtitle: 'Track your contributions, decks, and profile performance in one place.',
    },
    {
      greeting: 'Keep Creating',
      nameLine: 'Make an Impact',
      subtitle: 'Every note, deck, and resource you create helps students across Myanmar.',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (slides.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetTimer]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentSlide(index);
    resetTimer();
  }, [resetTimer]);

  // ── LEFT COLUMN: My Decks ──────────────────────────────────────────────────
  const leftColumn = (
    <>
      <div className="dash-col-header">
        <h2 className="dash-col-header__title">
          <Layers className="h-5 w-5 text-blue-500" />
          My Decks
        </h2>
        <Link href="/flashcards" className="dash-col-header__link">
          View All
        </Link>
      </div>

      {myDecks.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-border bg-background-secondary/50 p-6 text-center text-foreground-muted">
          <p className="text-sm font-medium">No decks created yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myDecks.slice(0, 3).map((deck) => {
            const cardCount = getCardsByDeck(deck.id).length;
            return (
              <button
                key={deck.id}
                onClick={() => handleStudyDeck(deck.id)}
                className="dash-deck-card w-full text-left"
              >
                <div className="dash-deck-card__preview">
                  <div className={cn('dash-deck-card__gradient', getDeckGradient(deck.category))} />
                  <div className="dash-deck-card__overlay">
                    <span className="text-3xl font-bold text-white/90 drop-shadow-md text-on-dark px-4 text-center line-clamp-2">
                      {deck.name}
                    </span>
                  </div>
                </div>
                <div className="dash-deck-card__info flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {deck.category && (
                      <span className="text-xs font-medium text-foreground-muted bg-background-secondary px-2 py-0.5 rounded-full">
                        {deck.category}
                      </span>
                    )}
                    <span className="text-xs text-foreground-muted flex items-center gap-1">
                      <BookOpen size={12} />
                      {cardCount} cards
                    </span>
                  </div>
                  {deck.visibility === 'public' && (
                    <Globe size={14} className="text-accent" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Link href="/flashcards" className="dash-pill-btn dash-pill-btn--primary mt-2">
        <Plus className="h-4 w-4" />
        Create Deck
      </Link>
    </>
  );

  // ── MIDDLE COLUMN: Stat Overview ────────────────────────────────────────────
  const statIconMap: Record<string, { icon: React.ReactNode; bgClass: string }> = {
    published: {
      icon: <Star className="h-5 w-5" />,
      bgClass: 'bg-violet-500/15 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400',
    },
    'pending-review': {
      icon: <Send className="h-5 w-5" />,
      bgClass: 'bg-amber-500/15 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400',
    },
    'clubs-led': {
      icon: <MessageSquare className="h-5 w-5" />,
      bgClass: 'bg-sky-500/15 text-sky-500 dark:bg-sky-500/20 dark:text-sky-400',
    },
    'profile-views': {
      icon: <UserCircle className="h-5 w-5" />,
      bgClass: 'bg-pink-500/15 text-pink-500 dark:bg-pink-500/20 dark:text-pink-400',
    },
  };

  const middleColumn = (
    <>
      <div className="dash-col-header">
        <h2 className="dash-col-header__title">
          <Star className="h-5 w-5 text-amber-500" />
          Stat Overview
        </h2>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => {
          const iconConfig = statIconMap[stat.key] ?? {
            icon: <Star className="h-5 w-5" />,
            bgClass: 'bg-slate-500/15 text-slate-500',
          };
          return (
            <div key={stat.key} className="dash-stat-pill">
              <div className={cn('dash-stat-pill__icon', iconConfig.bgClass)}>
                {iconConfig.icon}
              </div>
              <div className="flex flex-col">
                <span className="dash-stat-pill__value">{stat.value}</span>
                <span className="dash-stat-pill__label">{stat.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  // ── RIGHT COLUMN: Creator Profile + My Submissions ─────────────────────────
  const rightColumn = (
    <>
      <div className="dash-col-header">
        <h2 className="dash-col-header__title">
          <User className="h-5 w-5 text-purple-500" />
          Creator Profile
        </h2>
      </div>

      <div className="dash-info-card">
        <div className="dash-info-card__avatar bg-gradient-to-br from-purple-500 to-violet-600 text-white">
          {firstName.charAt(0).toUpperCase()}
        </div>
        <div className="dash-info-card__body">
          <h4 className="font-semibold text-sm text-foreground">{profileDetails.title}</h4>
          <p className="text-xs text-foreground-muted mt-1 leading-relaxed line-clamp-3">
            {profileDetails.bio}
          </p>
          {(profileDetails.website_url || profileDetails.github_url || profileDetails.linkedin_url) && (
            <div className="flex gap-3 mt-2 pt-2 border-t border-border">
              {profileDetails.website_url && (
                <a href={profileDetails.website_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Web
                </a>
              )}
              {profileDetails.github_url && (
                <a href={profileDetails.github_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Globe className="h-3 w-3" /> GitHub
                </a>
              )}
              {profileDetails.linkedin_url && (
                <a href={profileDetails.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Globe className="h-3 w-3" /> LinkedIn
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="dash-col-header mt-4">
        <h2 className="dash-col-header__title">
          <FileText className="h-5 w-5 text-violet-500" />
          My Submissions
        </h2>
        <Link href="/editor/notes" className="dash-col-header__link">
          <Plus className="h-3.5 w-3.5" />
          New
        </Link>
      </div>

      {contributorNotes.length === 0 ? (
        <div className="dash-info-card">
          <div className="dash-info-card__avatar bg-background-secondary text-foreground-muted">
            <FileText className="h-5 w-5" />
          </div>
          <div className="dash-info-card__body">
            <p className="text-sm text-foreground-muted">No notes created yet</p>
            <Link href="/editor/notes" className="text-xs text-primary hover:underline mt-1 inline-block">
              Create your first note
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {contributorNotes.slice(0, 4).map((note) => (
            <Link
              key={note.id}
              href={note.status === 'draft' || note.status === 'rejected' ? `/editor/notes?id=${note.id}` : `/library/${note.id}`}
              className="dash-info-card group cursor-pointer"
            >
              <div className={cn(
                'dash-info-card__avatar text-xs font-bold',
                note.status === 'approved' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                note.status === 'pending_review' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                note.status === 'draft' && 'bg-slate-500/15 text-slate-500 dark:text-slate-400',
                note.status === 'rejected' && 'bg-red-500/15 text-red-600 dark:text-red-400',
              )}>
                <FileText className="h-5 w-5" />
              </div>
              <div className="dash-info-card__body">
                <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {note.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                    note.status === 'approved' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    note.status === 'pending_review' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                    note.status === 'draft' && 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
                    note.status === 'rejected' && 'bg-red-500/10 text-red-600 dark:text-red-400',
                  )}>
                    {note.status === 'pending_review' ? 'Pending' : note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                  </span>
                  <span className="text-xs text-foreground-muted">{note.blocks?.length || 0} blocks</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {contributorNotes.length > 4 && (
        <Link href="/my-notes" className="dash-pill-btn mt-2">
          View All Submissions
        </Link>
      )}
    </>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in" data-scroll-behavior="smooth">
      {/* ── Carousel Hero (replicated from DashboardLayout — PM-locked) ────── */}
      <div className="dash-carousel">
        <div
          className="dash-carousel-track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div key={idx} className="dash-carousel-slide">
              <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-accent p-6 md:p-8 text-white">
                <div className="flex items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/70">{slide.greeting}</p>
                    <h1 className="mt-0.5 text-2xl md:text-3xl font-bold">{slide.nameLine}</h1>
                    <p className="mt-1 text-sm text-white/70 max-w-md">{slide.subtitle}</p>
                  </div>
                  <div className="hidden sm:flex items-center justify-center shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-4xl">
                      🐜
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        {slides.length > 1 && (
          <div className="dash-carousel-dots">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={cn(
                  'dash-carousel-dot',
                  idx === currentSlide && 'dash-carousel-dot--active'
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Workspace — upper position (between carousel and three columns) */}
      <div className="mt-6">
        <Suspense fallback={<div className="flex items-center justify-center py-16 text-[var(--foreground-muted)]">Loading workspace...</div>}>
          <MyWorkspace />
        </Suspense>
      </div>

      {/* Three-Column Content — moved below workspace */}
      <div className="border-t border-[var(--border)] pt-8 mt-8 flex-1 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          <div className="space-y-4 overflow-y-auto min-h-0 pr-1 pt-1">
            {leftColumn}
          </div>
          <div className="space-y-4 overflow-y-auto min-h-0 pr-1 pt-1">
            {middleColumn}
          </div>
          <div className="space-y-4 overflow-y-auto min-h-0 pr-1 pt-1">
            {rightColumn}
          </div>
        </div>
      </div>
    </div>
  );
}
