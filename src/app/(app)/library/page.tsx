'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Unified Resources Hub
// Route: /library — accessible to all authenticated users.
// Tabbed layout combining Courses, Notes, Flashcards, Exams & Tools.
// URL-driven tab state: /library?tab=all|courses|notes|flashcards|exams|tools
// ──────────────────────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Layers,
  Clock,
  Calculator,
  NotebookPen,
  ScrollText,
  CalendarDays,
  Timer,
  GraduationCap,
  ArrowRight,
  Sparkles,
  FlaskConical,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CoursesLibraryBrowser from '@/components/library/CoursesLibraryBrowser';
import FlashcardsLibraryBrowser from '@/components/library/FlashcardsLibraryBrowser';
import ExamsLibraryBrowser from '@/components/library/ExamsLibraryBrowser';
import NotesLibrary from '@/components/notes/NotesLibrary';
import QuizLibraryBrowser from '@/components/quizzes/QuizLibraryBrowser';

// ── Tab Definition ───────────────────────────────────────────────────────────

type TabId = 'all' | 'courses' | 'notes' | 'flashcards' | 'exams' | 'tools' | 'quizzes';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
}

const TABS: Tab[] = [
  {
    id: 'all',
    label: 'All',
    icon: <Sparkles className="h-3.5 w-3.5" />,
    accentColor: 'from-primary to-accent',
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    accentColor: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: <NotebookPen className="h-3.5 w-3.5" />,
    accentColor: 'from-amber-500 to-orange-500',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    icon: <Layers className="h-3.5 w-3.5" />,
    accentColor: 'from-violet-500 to-purple-500',
  },
  {
    id: 'exams',
    label: 'Exams',
    icon: <FlaskConical className="h-3.5 w-3.5" />,
    accentColor: 'from-rose-500 to-pink-500',
  },
  {
    id: 'quizzes',
    label: 'Quizzes',
    icon: <Brain className="h-3.5 w-3.5" />,
    accentColor: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: <Clock className="h-3.5 w-3.5" />,
    accentColor: 'from-sky-500 to-blue-500',
  },
];

// ── Overview Cards (for "All" tab) ───────────────────────────────────────────

interface OverviewCard {
  id: string;
  label: string;
  description: string;
  tabTarget: TabId;
  icon: React.ReactNode;
  accentColor: string;
  badge?: string;
}

const OVERVIEW_CARDS: OverviewCard[] = [
  {
    id: 'courses',
    label: 'Courses',
    description: 'Browse exam boards & enrol in subjects to unlock related resources',
    tabTarget: 'courses',
    icon: <GraduationCap className="h-5 w-5" />,
    accentColor: 'from-emerald-500 to-teal-500',
    badge: 'Start here',
  },
  {
    id: 'notes',
    label: 'Notes',
    description: 'Curriculum-aligned study notes from verified contributors',
    tabTarget: 'notes',
    icon: <ScrollText className="h-5 w-5" />,
    accentColor: 'from-amber-500 to-orange-500',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    description: 'Spaced-repetition decks tagged by exam board & syllabus',
    tabTarget: 'flashcards',
    icon: <Layers className="h-5 w-5" />,
    accentColor: 'from-violet-500 to-purple-500',
  },
  {
    id: 'exams',
    label: 'Exams',
    description: 'Official exam dates & papers — add to your countdown',
    tabTarget: 'exams',
    icon: <FlaskConical className="h-5 w-5" />,
    accentColor: 'from-rose-500 to-pink-500',
  },
  {
    id: 'quizzes',
    label: 'Quizzes',
    description: 'Official interactive quizzes from contributors — test your knowledge',
    tabTarget: 'quizzes',
    icon: <Brain className="h-5 w-5" />,
    accentColor: 'from-amber-500 to-yellow-500',
    badge: 'New',
  },
];

// ── Tool Items ───────────────────────────────────────────────────────────────

interface ToolItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accentColor: string;
  isNew?: boolean;
}

const TOOLS: ToolItem[] = [
  {
    id: 'countdown',
    label: 'Exam Countdown',
    description: 'Track time until your important exams',
    href: '/countdown',
    icon: <Clock className="h-5 w-5" />,
    accentColor: 'from-sky-500 to-blue-500',
  },
  {
    id: 'calculator',
    label: 'Grade Calculator',
    description: 'Predict grades by qualification & components',
    href: '/calculator',
    icon: <Calculator className="h-5 w-5" />,
    accentColor: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    description: 'Organize your weekly study schedule',
    href: '/timetable',
    icon: <CalendarDays className="h-5 w-5" />,
    accentColor: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro Timer',
    description: 'Stay focused with timed study sessions',
    href: '/pomodoro',
    icon: <Timer className="h-5 w-5" />,
    accentColor: 'from-rose-500 to-red-500',
  },
];

// ── Overview Card Component ──────────────────────────────────────────────────

function OverviewCardComponent({ card, onClick }: { card: OverviewCard; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl border border-border',
        'bg-background-card hover:bg-background-secondary',
        'transition-all duration-200 text-left cursor-pointer w-full'
      )}
    >
      <div
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 mt-0.5',
          'bg-gradient-to-br text-white shadow-sm',
          card.accentColor
        )}
      >
        {card.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">{card.label}</h3>
          {card.badge && (
            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
              {card.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-foreground-muted mt-0.5 leading-snug line-clamp-1">
          {card.description}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
    </button>
  );
}

// ── Tool Card Component ──────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: ToolItem }) {
  return (
    <Link
      href={tool.href}
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl border border-border',
        'bg-background-card hover:bg-background-secondary',
        'transition-all duration-200'
      )}
    >
      <div
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 mt-0.5',
          'bg-gradient-to-br text-white shadow-sm',
          tool.accentColor
        )}
      >
        {tool.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">{tool.label}</h3>
          {tool.isNew && (
            <span className="text-[9px] font-bold uppercase tracking-wide bg-accent/15 text-accent px-1.5 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>
        <p className="text-xs text-foreground-muted mt-0.5 leading-snug line-clamp-1">
          {tool.description}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
    </Link>
  );
}

// ── All Tab Content ──────────────────────────────────────────────────────────

function AllTabContent({ onTabChange }: { onTabChange: (tab: TabId) => void }) {
  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 px-5 py-4">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Resources
            </h1>
            <p className="text-xs text-foreground-secondary max-w-md">
              Courses, notes, flashcards, exams, quizzes &amp; study tools — all in one place.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      </div>

      {/* Resource overview */}
      <section>
        <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
          Browse by category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {OVERVIEW_CARDS.map((card) => (
            <OverviewCardComponent
              key={card.id}
              card={card}
              onClick={() => onTabChange(card.tabTarget)}
            />
          ))}
        </div>
      </section>

      {/* Tools */}
      <section>
        <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
          Study tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* Quick links */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl bg-background-card border border-border">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs text-foreground-muted">Quick links:</span>
        <button
          onClick={() => onTabChange('courses')}
          className="text-xs font-medium text-primary hover:underline underline-offset-2 cursor-pointer"
        >
          Browse all courses
        </button>
        <span className="text-foreground-muted/40">&middot;</span>
        <Link
          href="/my-notes"
          className="text-xs font-medium text-foreground-secondary hover:text-foreground hover:underline underline-offset-2"
        >
          My Notes
        </Link>
        <span className="text-foreground-muted/40">&middot;</span>
        <Link
          href="/flashcards"
          className="text-xs font-medium text-foreground-secondary hover:text-foreground hover:underline underline-offset-2"
        >
          My Decks
        </Link>
      </div>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────

function LibraryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as TabId | null;
  const activeTab: TabId = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'all';

  const setActiveTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  };

  const isAllTab = activeTab === 'all';

  return (
    <div className="animate-fade-in space-y-4">
      {/* ═══ Filter Tabs (always visible) ══════════════════════════════════════ */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-background-secondary border border-border overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0',
              activeTab === tab.id
                ? 'bg-background-card text-foreground shadow-sm border border-border'
                : 'text-foreground-muted hover:text-foreground hover:bg-background-card/50'
            )}
          >
            <span
              className={cn(
                activeTab === tab.id ? 'text-primary' : 'text-foreground-muted'
              )}
            >
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab Content ════════════════════════════════════════════════════════ */}
      {isAllTab && <AllTabContent onTabChange={setActiveTab} />}

      {activeTab === 'courses' && (
        <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
          <CoursesLibraryBrowser />
        </Suspense>
      )}

      {activeTab === 'notes' && (
        <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
          <NotesLibrary />
        </Suspense>
      )}

      {activeTab === 'flashcards' && (
        <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
          <FlashcardsLibraryBrowser />
        </Suspense>
      )}

      {activeTab === 'exams' && (
        <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
          <ExamsLibraryBrowser />
        </Suspense>
      )}

      {activeTab === 'quizzes' && (
        <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
          <QuizLibraryBrowser />
        </Suspense>
      )}

      {activeTab === 'tools' && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-indigo-500/10 px-5 py-4">
            <div className="relative z-10 space-y-0.5">
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                Study Tools
              </h2>
              <p className="text-xs text-foreground-secondary max-w-md">
                Productivity tools to boost your study efficiency
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Exported Page (wrapped in Suspense for useSearchParams) ───────────────────

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-background-secondary animate-pulse" />}>
      <LibraryPageInner />
    </Suspense>
  );
}
