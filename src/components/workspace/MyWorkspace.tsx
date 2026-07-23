'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — MyWorkspace
// Unified personal hub with 4 tabs: My Courses, My Notes, My Decks, My Exams.
// Each tab renders comprehensive card previews with detailed metadata,
// clickable navigation to full-detail views, error detection, and loading states.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen, NotebookPen, Layers, Clock,
  Plus, ExternalLink, Search, Briefcase,
  ArrowRight, BookMarked, SquareStack,
  GraduationCap, CalendarDays, Pencil, Trash2,
  Eye, Share2, Globe, Lock, BarChart3,
  AlertTriangle, TrendingUp, Loader2, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCourseManager } from '@/hooks/useCourseManager';
import { useCountdown } from '@/hooks/useCountdown';
import { getUserWorkspace, getDecksByUser, deleteDeck } from '@/lib/mock/database';
import { cn } from '@/lib/utils';
import type { Note, Deck, ExamCountdown } from '@/types';
import type { EnrollmentWithDetails } from '@/hooks/useCourseManager';
import WorkspaceErrorBoundary from './WorkspaceErrorBoundary';
import { useWorkspaceToast } from './WorkspaceToast';
import { GridSkeleton, TabContentSkeleton } from './WorkspaceSkeleton';

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'courses', label: 'My Courses', icon: GraduationCap, color: 'text-emerald-500' },
  { key: 'notes', label: 'My Notes', icon: NotebookPen, color: 'text-violet-500' },
  { key: 'decks', label: 'My Decks', icon: Layers, color: 'text-blue-500' },
  { key: 'exams', label: 'My Exams', icon: Clock, color: 'text-amber-500' },
] as const;

type TabKey = typeof TABS[number]['key'];

// ── Deck gradient config ──────────────────────────────────────────────────────

const DECK_GRADIENTS: Record<string, string> = {
  Physics:     'bg-linear-to-br from-blue-600 via-blue-500 to-cyan-400',
  Biology:     'bg-linear-to-br from-emerald-600 via-green-500 to-teal-400',
  Chemistry:   'bg-linear-to-br from-purple-600 via-violet-500 to-fuchsia-400',
  Mathematics: 'bg-linear-to-br from-orange-600 via-amber-500 to-yellow-400',
  IELTS:       'bg-linear-to-br from-rose-600 via-pink-500 to-rose-400',
  History:     'bg-linear-to-br from-amber-700 via-amber-500 to-yellow-500',
  Custom:      'bg-linear-to-br from-slate-600 via-slate-500 to-slate-400',
};

const DEFAULT_DECK_GRADIENT = 'bg-linear-to-br from-indigo-600 via-blue-500 to-violet-400';

function getDeckGradient(category: string | null): string {
  if (!category) return DEFAULT_DECK_GRADIENT;
  return DECK_GRADIENTS[category] ?? DEFAULT_DECK_GRADIENT;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeLeft(daysLeft: number): string {
  if (daysLeft < 0) return 'Past';
  if (daysLeft === 0) return 'Today';
  if (daysLeft === 1) return 'Tomorrow';
  if (daysLeft <= 7) return `${daysLeft} days`;
  if (daysLeft <= 30) return `${Math.ceil(daysLeft / 7)} weeks`;
  return `${Math.ceil(daysLeft / 30)} months`;
}

// ── Error alert ───────────────────────────────────────────────────────────────

function WorkspaceErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 mb-4">
      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">Error loading content</p>
        <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-xs text-red-500 underline hover:no-underline cursor-pointer shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
}

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

// ── Courses tab ───────────────────────────────────────────────────────────────

function CoursesTab({
  enrollments,
  isLoading,
}: {
  enrollments: ReturnType<typeof useCourseManager>['enrollments'];
  isLoading: boolean;
}) {
  const router = useRouter();
  const { showToast } = useWorkspaceToast();

  if (isLoading) return <TabContentSkeleton tab="courses" />;

  if (enrollments.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No courses yet"
        description="Browse Courses to add verified curriculum templates. Adding a course auto-populates your Lesson Tracker and Grade Calculator."
        cta="Browse Library"
        ctaHref="/library/courses"
      />
    );
  }

  // Group by curriculum
  const grouped = enrollments.reduce<Record<string, { curriculum: EnrollmentWithDetails['curriculum']; subjects: EnrollmentWithDetails[] }>>((acc, e) => {
    const key = e.curriculum.id;
    if (!acc[key]) acc[key] = { curriculum: e.curriculum, subjects: [] };
    acc[key].subjects.push(e);
    return acc;
  }, {});

  const handleSubjectClick = useCallback((curriculumId: string, subjectId: string, subjectTitle: string) => {
    try {
      router.push(`/lessons/${curriculumId}/${subjectId}`);
    } catch {
      showToast(`Failed to open "${subjectTitle}". Please try again.`, 'error', {
        label: 'Go to Lesson Tracker',
        onClick: () => router.push('/lessons'),
      });
    }
  }, [router, showToast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--foreground-secondary)]">
          {Object.keys(grouped).length} qualification{Object.keys(grouped).length !== 1 ? 's' : ''}
          {' · '}
          {enrollments.length} subject{enrollments.length !== 1 ? 's' : ''}
        </p>
        <Link
          href="/library/courses"
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
        >
          <Plus size={12} /> Add Course
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(grouped).map(({ curriculum, subjects }) => {
          const curriculumId = curriculum.id;

          return (
            <div
              key={curriculum.id}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 hover:border-[var(--primary)]/30 hover:shadow-sm transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  {curriculum.exam_board && (
                    <span className="text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full">
                      {curriculum.exam_board} · {curriculum.qualification}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-[var(--foreground)] mt-1.5">
                    {curriculum.title}
                  </h3>
                </div>
                <Link
                  href={`/lessons`}
                  className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors p-1"
                  title="Open Lesson Tracker"
                >
                  <ExternalLink size={14} />
                </Link>
              </div>

              {/* Subject rows */}
              <div className="space-y-1.5">
                {subjects.map(e => {
                  return (
                    <button
                      key={e.id}
                      onClick={() => handleSubjectClick(curriculumId, e.subject_id, e.subject.title)}
                      className="w-full flex items-center justify-between rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--primary)]/5 px-3 py-2 text-left transition-all cursor-pointer focus-ring group/subject"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-[var(--foreground)] group-hover/subject:text-[var(--primary)] transition-colors">
                          {e.subject.title}
                        </span>
                        {e.exam && (
                          <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">
                            {e.exam.exam_series || e.exam.syllabus_code}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] font-semibold text-[var(--primary)]">
                          Open
                          <span className="hidden sm:inline"> Tracker</span> →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom actions */}
              <div className="mt-3 pt-3 border-t border-[var(--border)]/50 flex gap-2">
                <Link
                  href="/lessons"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] py-1.5 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all"
                >
                  <BarChart3 size={12} />
                  Lesson Tracker
                </Link>
                <Link
                  href="/calculator"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] py-1.5 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all"
                >
                  <TrendingUp size={12} />
                  Grade Calc
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Notes tab ─────────────────────────────────────────────────────────────────

function NotesTab({
  notes,
  savedNotes,
  isLoading,
}: {
  notes: Note[];
  savedNotes: Note[];
  isLoading: boolean;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');
  const { showToast } = useWorkspaceToast();

  const displayNotes = activeTab === 'created' ? notes : savedNotes;
  const filtered = displayNotes.filter(n =>
    !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <TabContentSkeleton tab="notes" />;

  if (notes.length === 0 && savedNotes.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No notes yet"
        description="Create your own study notes with AI assistance, or browse Notes to save approved notes to your workspace."
        cta="Browse Notes"
        ctaHref="/library"
      />
    );
  }

  const handleViewNote = useCallback((noteId: string, noteTitle: string) => {
    try {
      router.push(`/editor/notes?id=${noteId}`);
    } catch {
      showToast(`Failed to open "${noteTitle}". Please try again.`, 'error');
    }
  }, [router, showToast]);

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        {(['created', 'saved'] as const).map(t => {
          const count = t === 'created' ? notes.length : savedNotes.length;
          return (
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
              {t === 'created' ? 'Created' : 'Saved'} ({count})
            </button>
          );
        })}

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
        <p className="text-sm text-center text-[var(--foreground-muted)] py-8">
          {searchQuery ? 'No notes match your search.' : 'No notes found.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(note => (
            <div
              key={note.id}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-4 hover:border-[var(--primary)]/30 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => handleViewNote(note.id, note.title)}
              role="article"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') handleViewNote(note.id, note.title); }}
            >
              {/* Header with visibility */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                    {note.title}
                  </h3>
                  {note.summary && (
                    <p className="text-xs text-[var(--foreground-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                      {note.summary}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {note.visibility === 'public' ? (
                    <span title="Public"><Globe size={12} className="text-green-500" /></span>
                  ) : note.visibility === 'link' ? (
                    <span title="Link sharing"><Share2 size={12} className="text-blue-500" /></span>
                  ) : (
                    <span title="Private"><Lock size={12} className="text-[var(--foreground-muted)]" /></span>
                  )}
                </div>
              </div>

              {/* Metadata badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {note.tags && note.tags.length > 0 ? (
                  note.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] bg-[var(--background-secondary)] text-[var(--foreground-muted)] px-2 py-0.5 rounded-md">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[var(--foreground-muted)] italic">No tags</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-[var(--border)]/50">
                <button
                  onClick={(e) => { e.stopPropagation(); handleViewNote(note.id, note.title); }}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-[var(--border)] py-1.5 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all cursor-pointer"
                >
                  <Eye size={11} /> Preview
                </button>
                {activeTab === 'created' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/editor/notes?id=${note.id}&edit=true`); }}
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

function DecksTab({ userId, isLoading }: { userId: string; isLoading: boolean }) {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { showToast } = useWorkspaceToast();

  // Load decks on mount
  useEffect(() => {
    try {
      setDecks(getDecksByUser(userId));
    } catch {
      showToast('Failed to load your decks. Please refresh the page.', 'error', {
        label: 'Refresh',
        onClick: () => window.location.reload(),
      });
    }
  }, [userId, showToast]);

  // ── Hooks defined BEFORE any early return (Rules of Hooks) ────────────────

  const handleStudy = useCallback((deckId: string) => {
    router.push(`/flashcards/${deckId}?mode=study`);
  }, [router]);

  const handleDelete = useCallback((deckId: string, deckName: string) => {
    try {
      const res = deleteDeck(deckId);
      if (res.success) {
        setDecks(prev => prev.filter(d => d.id !== deckId));
        showToast(`"${deckName}" has been removed.`, 'info');
      } else {
        setDeleteError(`Failed to delete "${deckName}".`);
      }
    } catch {
      showToast(`Failed to delete "${deckName}". Please try again.`, 'error');
    }
  }, [showToast]);

  // ── Derived data below hooks ───────────────────────────────────────────────

  const filtered = decks.filter(d =>
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <TabContentSkeleton tab="decks" />;

  if (decks.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No flashcard decks yet"
        description="Create your own deck or add approved decks from the library. All decks support spaced repetition (SRS)."
        cta="Browse Library"
        ctaHref="/library/flashcards"
      />
    );
  }

  return (
    <div className="space-y-4">
      {deleteError && (
        <WorkspaceErrorBanner message={deleteError} onDismiss={() => setDeleteError(null)} />
      )}
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

      {filtered.length === 0 ? (
        <p className="text-sm text-center text-[var(--foreground-muted)] py-8">No decks match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(deck => {
            const examBoard = deck.exam_board;
            const syllabusCode = deck.syllabus_code;
            const visibility = deck.visibility ?? (deck.is_public ? 'public' : 'private');
            const cardCount = (deck as any).card_count ?? (deck as any).cards?.length ?? null;
            const srsDue = (deck as any).srs_due_count ?? null;

            return (
              <button
                key={deck.id}
                onClick={() => handleStudy(deck.id)}
                className="group w-full text-left rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden hover:border-[var(--primary)]/30 hover:shadow-md transition-all cursor-pointer focus-ring"
              >
                {/* Gradient preview card */}
                <div className="relative h-28 w-full overflow-hidden">
                  <div className={cn('absolute inset-0', getDeckGradient(deck.category))} />
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative flex items-center justify-center h-full px-4">
                    <span className="text-xl font-bold text-white/90 drop-shadow-md text-center line-clamp-2">
                      {deck.name}
                    </span>
                  </div>
                </div>

                {/* Card info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {examBoard && (
                          <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md">
                            {examBoard}
                          </span>
                        )}
                        {syllabusCode && (
                          <span className="text-[10px] font-mono bg-[var(--background-secondary)] text-[var(--foreground-muted)] px-1.5 py-0.5 rounded-md">
                            {syllabusCode}
                          </span>
                        )}
                        {deck.category && (
                          <span className="text-[10px] font-medium bg-[var(--background-secondary)] text-[var(--foreground-muted)] px-1.5 py-0.5 rounded-md">
                            {deck.category}
                          </span>
                        )}
                      </div>
                      {deck.description && (
                        <p className="text-xs text-[var(--foreground-muted)] line-clamp-1">
                          {deck.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      {visibility === 'public' ? (
                        <span title="Public"><Globe size={12} className="text-green-500" /></span>
                      ) : visibility === 'link' ? (
                        <span title="Link sharing"><Share2 size={12} className="text-blue-500" /></span>
                      ) : (
                        <span title="Private"><Lock size={12} className="text-[var(--foreground-muted)]" /></span>
                      )}
                    </div>
                  </div>

                  {/* Deck stats */}
                  <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
                    {cardCount !== null && (
                      <span className="flex items-center gap-1">
                        <BookOpen size={11} />
                        {cardCount} card{cardCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {srsDue !== null && srsDue > 0 && (
                      <span className="flex items-center gap-1 text-orange-500 font-semibold">
                        <Sparkles size={11} />
                        {srsDue} due
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Exams tab ─────────────────────────────────────────────────────────────────

function ExamsTab({
  countdowns,
  isLoading,
}: {
  countdowns: ReturnType<typeof useCountdown>['groupedCountdowns'];
  isLoading: boolean;
}) {
  const router = useRouter();
  const { showToast } = useWorkspaceToast();
  const allCountdowns = Object.values(countdowns).flat();

  if (isLoading) return <TabContentSkeleton tab="exams" />;

  if (allCountdowns.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No exam countdowns yet"
        description="Add official exam dates or create custom countdowns. Track days remaining and study with purpose."
        cta="Browse Exams"
        ctaHref="/library/exams"
      />
    );
  }

  const handleOpenCountdown = useCallback((id: string) => {
    try {
      router.push(`/countdown`);
    } catch {
      showToast('Failed to open countdown. Please try again.', 'error');
    }
  }, [router, showToast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--foreground-secondary)]">
          {allCountdowns.length} countdown{allCountdowns.length !== 1 ? 's' : ''}
        </p>
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
          const isCritical = daysLeft <= 7 && !isPast;
          const isWarning = daysLeft <= 30 && !isPast && !isCritical;

          return (
            <div
              key={c.id}
              onClick={() => handleOpenCountdown(c.id)}
              className={cn(
                'rounded-2xl border p-4 transition-all cursor-pointer group',
                isPast
                  ? 'border-[var(--border)] bg-[var(--background-secondary)] opacity-60 hover:opacity-80'
                  : isCritical
                    ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50 shadow-sm'
                    : isWarning
                      ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 shadow-sm'
                      : 'border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--primary)]/30 hover:shadow-sm'
              )}
              role="article"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') handleOpenCountdown(c.id); }}
            >
              {/* Priority + qualification */}
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
                <span className="text-[10px] text-[var(--foreground-muted)] font-medium">
                  {c.qualification_group}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                {c.custom_title}
              </h3>

              {/* Countdown or past */}
              {isPast ? (
                <p className="text-xs text-[var(--foreground-muted)] italic">
                  Exam has passed — {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''} ago
                </p>
              ) : (
                <>
                  {/* Visual progress bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-[var(--foreground-muted)]">Time remaining</span>
                      <span className={cn(
                        'font-bold',
                        isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-[var(--foreground)]'
                      )}>
                        {formatTimeLeft(daysLeft)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-[var(--primary)]'
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, 100 - (daysLeft / 365) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Digital countdown */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { value: c.timeLeft.days, label: 'Days' },
                      { value: c.timeLeft.hours, label: 'Hours' },
                      { value: c.timeLeft.minutes, label: 'Mins' },
                    ].map(({ value, label }) => (
                      <div key={label} className="text-center bg-[var(--background)] rounded-lg py-2 group-hover:bg-[var(--primary)]/5 transition-colors">
                        <p className={cn(
                          'text-base font-black tabular-nums',
                          isCritical ? 'text-red-600 dark:text-red-400' : 'text-[var(--foreground)]'
                        )}>
                          {String(Math.max(0, value)).padStart(2, '0')}
                        </p>
                        <p className="text-[9px] text-[var(--foreground-muted)]">{label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MyWorkspace() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = (searchParams.get('tab') as TabKey | null) ?? 'courses';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const { showToast } = useWorkspaceToast();

  // ── Data hooks ──────────────────────────────────────────────────────────────

  const { enrollments, enrolledCurriculumIds, isLoading: coursesLoading } = useCourseManager();
  const { groupedCountdowns } = useCountdown(user?.id);

  // Workspace data loaded via useEffect (no side-effects in useMemo)
  const [workspace, setWorkspace] = useState<ReturnType<typeof getUserWorkspace> | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWorkspace(null);
      setWorkspaceLoading(true);
      return;
    }
    try {
      const data = getUserWorkspace(user.id);
      setWorkspace(data);
      setGlobalError(null);
      setWorkspaceLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error loading workspace data.';
      setGlobalError(message);
      setWorkspace(null);
      setWorkspaceLoading(false);
    }
  }, [user]);

  // ── Error recovery ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (globalError) {
      showToast('Workspace data failed to load. Some sections may be incomplete.', 'warning', {
        label: 'Retry',
        onClick: () => {
          setGlobalError(null);
          window.location.reload();
        },
      });
    }
  }, [globalError, showToast]);

  // ── Loading state ───────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader2 className="h-6 w-6 text-[var(--primary)] animate-spin" />
        <p className="text-sm text-[var(--foreground-muted)]">Loading workspace…</p>
      </div>
    );
  }

  // ── Derived counts ──────────────────────────────────────────────────────────

  const tabCounts: Record<TabKey, number> = {
    courses: Object.keys(
      enrollments.reduce((acc, e) => ({ ...acc, [e.curriculum.id]: true }), {})
    ).length,
    notes: workspace ? workspace.createdNotes.length + workspace.savedNotes.length : 0,
    decks: workspace?.decks?.length ?? 0,
    exams: Object.values(groupedCountdowns).flat().length,
  };

  const isLoading = workspaceLoading || !workspace;

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

      {/* Global error banner */}
      {globalError && (
        <WorkspaceErrorBanner message={globalError} onDismiss={() => setGlobalError(null)} />
      )}

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
            <span className="text-2xl font-black text-[var(--foreground)] tabular-nums">
              {isLoading ? '—' : tabCounts[tab.key]}
            </span>
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
            <span className="sm:hidden tabular-nums">{tabCounts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Tab content with error boundary per tab */}
      <WorkspaceErrorBoundary>
        <div>
          {activeTab === 'courses' && (
            <CoursesTab enrollments={enrollments} isLoading={isLoading} />
          )}

          {activeTab === 'notes' && workspace && (
            <NotesTab
              notes={workspace.createdNotes}
              savedNotes={workspace.savedNotes}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'notes' && !workspace && <TabContentSkeleton tab="notes" />}

          {activeTab === 'decks' && user && (
            <DecksTab userId={user.id} isLoading={isLoading} />
          )}
          {activeTab === 'decks' && !user && <TabContentSkeleton tab="decks" />}

          {activeTab === 'exams' && (
            <ExamsTab countdowns={groupedCountdowns} isLoading={isLoading} />
          )}
        </div>
      </WorkspaceErrorBoundary>
    </div>
  );
}
