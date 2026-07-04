'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — MyWorkspace
// Unified personal hub with 4 tabs: My Courses, My Notes, My Decks, My Exams.
// Replaces fragmented views across /my-notes, /flashcards (personal), /countdown.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen, NotebookPen, Layers, Clock,
  Plus, ExternalLink, Search, Briefcase,
  ArrowRight, BookMarked, SquareStack,
  GraduationCap, CalendarDays, Pencil, Trash2,
  Eye, Share2, Globe, Lock,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCourseManager } from '@/hooks/useCourseManager';
import { useCountdown } from '@/hooks/useCountdown';
import { getUserWorkspace, getDecksByUser, deleteDeck } from '@/lib/mock/database';
import { cn } from '@/lib/utils';
import type { Note, Deck, ExamCountdown } from '@/types';

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'courses', label: 'My Courses', icon: GraduationCap, color: 'text-emerald-500' },
  { key: 'notes', label: 'My Notes', icon: NotebookPen, color: 'text-violet-500' },
  { key: 'decks', label: 'My Decks', icon: Layers, color: 'text-blue-500' },
  { key: 'exams', label: 'My Exams', icon: Clock, color: 'text-amber-500' },
] as const;

type TabKey = typeof TABS[number]['key'];

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description, cta, ctaHref }: {
  icon: React.ElementType; title: string; description: string;
  cta: string; ctaHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--background-card)] p-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
        <Icon size={28} />
      </div>
      <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-[var(--foreground-secondary)]">{description}</p>
      <Link
        href={ctaHref}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all"
      >
        {cta}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

// ── Course tab content ────────────────────────────────────────────────────────

function CoursesTab({ enrollments }: { enrollments: ReturnType<typeof useCourseManager>['enrolledWithDetails'] }) {
  const router = useRouter();

  if (enrollments.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No courses yet"
        description="Browse the Courses Library to add verified curriculum templates. Adding a course auto-populates your Lesson Tracker and Grade Calculator."
        cta="Browse Library"
        ctaHref="/library/courses"
      />
    );
  }

  // Group by curriculum
  const grouped = enrollments.reduce((acc, e) => {
    const key = e.curriculum.id;
    if (!acc[key]) acc[key] = { curriculum: e.curriculum, subjects: [] };
    acc[key].subjects.push(e);
    return acc;
  }, {} as Record<string, { curriculum: typeof enrollments[0]['curriculum']; subjects: typeof enrollments }>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--foreground-secondary)]">
          {Object.keys(grouped).length} qualification{Object.keys(grouped).length !== 1 ? 's' : ''} · {enrollments.length} subject{enrollments.length !== 1 ? 's' : ''}
        </p>
        <Link
          href="/library/courses"
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
        >
          <Plus size={12} /> Add Course
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(grouped).map(({ curriculum, subjects }) => (
          <div key={curriculum.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 hover:border-[var(--primary)]/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                {curriculum.exam_board && (
                  <span className="text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full">
                    {curriculum.exam_board} · {curriculum.qualification}
                  </span>
                )}
                <h3 className="text-sm font-bold text-[var(--foreground)] mt-1.5">{curriculum.title}</h3>
              </div>
              <button
                onClick={() => router.push('/courses')}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <ExternalLink size={14} />
              </button>
            </div>

            <div className="space-y-1.5">
              {subjects.map(e => (
                <div key={e.id} className="flex items-center justify-between rounded-xl bg-[var(--background-secondary)] px-3 py-2">
                  <span className="text-xs font-medium text-[var(--foreground)]">{e.subject.title}</span>
                  <button
                    onClick={() => router.push(`/lessons?curriculum=${e.curriculum_id}&subject=${e.subject_id}`)}
                    className="text-[10px] text-[var(--primary)] hover:underline"
                  >
                    Tracker →
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <Link
                href="/lessons"
                className="flex-1 text-center rounded-lg border border-[var(--border)] py-1.5 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all"
              >
                Lesson Tracker
              </Link>
              <Link
                href="/calculator"
                className="flex-1 text-center rounded-lg border border-[var(--border)] py-1.5 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all"
              >
                Grade Calc
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notes tab ─────────────────────────────────────────────────────────────────

function NotesTab({ notes, savedNotes }: { notes: Note[]; savedNotes: Note[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');

  const displayNotes = activeTab === 'created' ? notes : savedNotes;
  const filtered = displayNotes.filter(n =>
    !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (notes.length === 0 && savedNotes.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No notes yet"
        description="Create your own study notes with AI assistance, or browse the Notes Library to save approved notes to your workspace."
        cta="Browse Notes Library"
        ctaHref="/library"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['created', 'saved'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer',
              activeTab === t
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            )}
          >
            {t === 'created' ? `Created (${notes.length})` : `Saved (${savedNotes.length})`}
          </button>
        ))}

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] pl-9 pr-4 py-2 text-sm placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-center text-[var(--foreground-muted)] py-8">No notes found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(note => (
            <div key={note.id} className="group rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-4 hover:border-[var(--primary)]/30 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] line-clamp-1">{note.title}</h3>
                  {note.summary && <p className="text-xs text-[var(--foreground-secondary)] mt-0.5 line-clamp-1">{note.summary}</p>}
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {note.visibility === 'public' ? (
                    <Globe size={12} className="text-green-500" />
                  ) : note.visibility === 'link' ? (
                    <Share2 size={12} className="text-blue-500" />
                  ) : (
                    <Lock size={12} className="text-[var(--foreground-muted)]" />
                  )}
                </div>
              </div>

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] bg-[var(--background-secondary)] text-[var(--foreground-muted)] px-1.5 py-0.5 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-[var(--border)]/50">
                <button
                  onClick={() => router.push(`/editor/notes?id=${note.id}`)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-[var(--border)] py-1.5 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all cursor-pointer"
                >
                  <Eye size={11} /> View
                </button>
                {activeTab === 'created' && (
                  <button
                    onClick={() => router.push(`/editor/notes?id=${note.id}&edit=true`)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[var(--primary)] text-white py-1.5 text-xs font-semibold hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Decks tab ─────────────────────────────────────────────────────────────────

function DecksTab({ userId }: { userId: string }) {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>(() => getDecksByUser(userId));
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = decks.filter(d =>
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (decks.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No flashcard decks yet"
        description="Create your own deck or add approved decks from the Flashcards Library. All decks support spaced repetition (SRS)."
        cta="Browse Flashcards Library"
        ctaHref="/library/flashcards"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search decks…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] pl-9 pr-4 py-2 text-sm placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
        <Link
          href="/flashcards"
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline shrink-0"
        >
          <Plus size={12} /> New Deck
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(deck => {
          const examBoard = (deck as Record<string, unknown>).exam_board as string | null;
          const syllabusCode = (deck as Record<string, unknown>).syllabus_code as string | null;
          const visibility = (deck as Record<string, unknown>).visibility as string ?? (deck.is_public ? 'public' : 'private');

          return (
            <div key={deck.id} className="group rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-4 hover:border-[var(--primary)]/30 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {examBoard && <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md">{examBoard}</span>}
                    {syllabusCode && <span className="text-[10px] font-mono bg-[var(--background-secondary)] text-[var(--foreground-muted)] px-1.5 py-0.5 rounded-md">{syllabusCode}</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] line-clamp-1">{deck.name}</h3>
                  {deck.category && <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{deck.category}</p>}
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {visibility === 'public' ? (
                    <Globe size={12} className="text-green-500" />
                  ) : visibility === 'link' ? (
                    <Share2 size={12} className="text-blue-500" />
                  ) : (
                    <Lock size={12} className="text-[var(--foreground-muted)]" />
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-[var(--border)]/50">
                <button
                  onClick={() => router.push(`/flashcards/${deck.id}?mode=study`)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[var(--primary)] text-white py-1.5 text-xs font-semibold hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
                >
                  Study
                </button>
                <button
                  onClick={() => {
                    const res = deleteDeck(deck.id);
                    if (res.success) setDecks(prev => prev.filter(d => d.id !== deck.id));
                  }}
                  className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Delete deck"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Exams tab ─────────────────────────────────────────────────────────────────

function ExamsTab({ countdowns }: { countdowns: ReturnType<typeof useCountdown>['groupedCountdowns'] }) {
  const router = useRouter();
  const allCountdowns = Object.values(countdowns).flat();

  if (allCountdowns.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No exam countdowns yet"
        description="Browse the Exams Library to add official exam dates, or create custom countdowns for any event."
        cta="Browse Exams Library"
        ctaHref="/library/exams"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--foreground-secondary)]">{allCountdowns.length} countdown{allCountdowns.length !== 1 ? 's' : ''}</p>
        <Link
          href="/countdown"
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
        >
          <ExternalLink size={12} /> Manage All
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allCountdowns.map(c => {
          const daysLeft = c.timeLeft.days;
          const isPast = c.timeLeft.isPast;
          return (
            <div key={c.id} className={cn(
              'rounded-2xl border p-4 transition-all',
              isPast
                ? 'border-[var(--border)] bg-[var(--background-secondary)] opacity-60'
                : daysLeft <= 7
                  ? 'border-red-500/30 bg-red-500/5'
                  : daysLeft <= 30
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-[var(--border)] bg-[var(--background-card)]'
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                  c.priority_indicator === 'high'
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                    : c.priority_indicator === 'medium'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
                )}>
                  {c.priority_indicator ?? 'medium'}
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">{c.qualification_group}</span>
              </div>

              <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 line-clamp-2">
                {c.custom_title}
              </h3>

              {isPast ? (
                <p className="text-xs text-[var(--foreground-muted)]">Exam has passed</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { value: c.timeLeft.days, label: 'd' },
                    { value: c.timeLeft.hours, label: 'h' },
                    { value: c.timeLeft.minutes, label: 'm' },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center bg-[var(--background)] rounded-lg py-2">
                      <p className="text-base font-black text-[var(--foreground)]">{String(value).padStart(2, '0')}</p>
                      <p className="text-[9px] text-[var(--foreground-muted)]">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MyWorkspace() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = (searchParams.get('tab') as TabKey | null) ?? 'courses';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const { enrollments, enrolledCurriculumIds } = useCourseManager();

  const { groupedCountdowns } = useCountdown(user?.id);

  const workspace = useMemo(() => {
    if (!user) return null;
    return getUserWorkspace(user.id);
  }, [user]);

  if (!user || !workspace) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-[var(--foreground-muted)]">
        Loading workspace…
      </div>
    );
  }

  const tabCounts: Record<TabKey, number> = {
    courses: Object.keys(
      enrollments.reduce((acc, e) => ({ ...acc, [e.curriculum.id]: true }), {})
    ).length,
    notes: workspace.createdNotes.length + workspace.savedNotes.length,
    decks: workspace.decks.length,
    exams: Object.values(groupedCountdowns).flat().length,
  };


  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[var(--primary)]" />
            <h1 className="text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
              My Workspace
            </h1>
          </div>
          <p className="text-sm text-[var(--foreground-secondary)]">
            Your personal study hub — all your courses, notes, decks and exams in one place.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/library/courses"
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all"
          >
            <BookMarked size={13} /> Library
          </Link>
          <Link
            href="/editor/notes"
            className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--primary-hover)] transition-all"
          >
            <Plus size={13} /> New Note
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl border p-4 transition-all cursor-pointer',
              activeTab === tab.key
                ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5'
                : 'border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--primary)]/20'
            )}
          >
            <tab.icon className={cn('h-5 w-5 mb-2', activeTab === tab.key ? 'text-[var(--primary)]' : tab.color)} />
            <span className="text-2xl font-black text-[var(--foreground)]">{tabCounts[tab.key]}</span>
            <span className="text-[11px] text-[var(--foreground-muted)] mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 p-1 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]">
        {TABS.map(tab => (
          <button
            key={tab.key}
            id={`workspace-tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer',
              activeTab === tab.key
                ? 'bg-[var(--background-card)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            )}
          >
            <tab.icon size={14} className={activeTab === tab.key ? tab.color : ''} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tabCounts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'courses' && <CoursesTab enrollments={enrollments} />}

        {activeTab === 'notes' && (
          <NotesTab notes={workspace.createdNotes} savedNotes={workspace.savedNotes} />
        )}
        {activeTab === 'decks' && <DecksTab userId={user.id} />}
        {activeTab === 'exams' && <ExamsTab countdowns={groupedCountdowns} />}
      </div>
    </div>
  );
}
