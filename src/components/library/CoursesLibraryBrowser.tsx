'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CoursesLibraryBrowser
// Single-page reactive experience. Select subjects → cards auto-sort by match.
// Matched boards are promoted; non-matching boards collapse into a disclosure.
// Subject chips have distinct selected state with Check icon for instant feedback.
// State persists via URL query param (shallow, non-navigating).
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, BookOpen, Star, ChevronRight,
  Sparkles, Check, Layers,
  GraduationCap, Globe, BookMarked, Info, ChevronDown, ChevronUp, ScrollText,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useCourseManager } from '@/hooks/useCourseManager';
import { autoPopulateLessonTracker, autoPopulateGradeCalculator } from '@/lib/mock/database';
import { QUALIFICATION_REGISTRY } from '@/constants/qualifications';
import { buildSubjectBoardMap } from '@/lib/subject-board-mapping';
import { cn } from '@/lib/utils';
import type { CurriculumSummary } from '@/hooks/useCourseManager';

// ── Types ────────────────────────────────────────────────────────────────────

interface EnrichedCurriculum extends CurriculumSummary {
  subjectCount: number;
  isEnrolled: boolean;
  matchCount: number; // how many selected subjects this curriculum has
  matchedSubjectTitles: string[];
}

// ── Exam Board Card ──────────────────────────────────────────────────────────

interface ExamBoardCardProps {
  curriculum: EnrichedCurriculum;
  onAdd: (id: string) => void;
  isAdding: boolean;
  totalSelected: number;
  isTopMatch: boolean;
}

function ExamBoardCard({ curriculum, onAdd, isAdding, totalSelected, isTopMatch }: ExamBoardCardProps) {
  const qualKey = curriculum.exam_board && curriculum.qualification
    ? `${curriculum.exam_board}_${curriculum.qualification}` as keyof typeof QUALIFICATION_REGISTRY
    : null;
  const qualMeta = qualKey && QUALIFICATION_REGISTRY[qualKey] ? QUALIFICATION_REGISTRY[qualKey] : null;

  const gradingLabel: Record<string, string> = {
    raw_marks_AG: 'A*–G Grades',
    raw_marks_91: '9–1 Grades',
    ums: 'UMS System',
    band: 'Band 0–9',
    percentage: 'Percentage',
    scaled: '145–200 Scale',
  };

  const hasSelection = totalSelected > 0;
  const matchesAll = curriculum.matchCount === totalSelected;
  const partialMatch = hasSelection && curriculum.matchCount > 0 && !matchesAll;
  const noMatch = hasSelection && curriculum.matchCount === 0;

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-2xl border p-5 transition-all duration-300',
        'hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5',
        isTopMatch && 'border-[var(--primary)]/40 shadow-[var(--shadow-glow)]',
        !isTopMatch && curriculum.isEnrolled && 'border-[var(--primary)]/30 bg-[var(--primary)]/5',
        !isTopMatch && !curriculum.isEnrolled && 'border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--primary)]/30',
        noMatch && 'opacity-70 hover:opacity-100',
      )}
    >
      {/* Enrolled badge */}
      {curriculum.isEnrolled && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
          <Check size={10} />
          Enrolled
        </div>
      )}

      {/* Board + Qualification badge */}
      <div className="flex items-center gap-2 mb-3">
        {qualMeta ? (
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', qualMeta.colorClass)}>
            {qualMeta.boardCode} · {qualMeta.shortLabel}
          </span>
        ) : (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--background-secondary)] text-[var(--foreground-secondary)]">
            {curriculum.exam_board ?? 'General'} · {curriculum.qualification ?? 'Curriculum'}
          </span>
        )}
        {curriculum.syllabus_code && (
          <span className="text-xs font-mono text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-0.5 rounded-md">
            {curriculum.syllabus_code}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-[var(--foreground)] mb-1 leading-tight">
        {curriculum.title}
      </h3>
      {curriculum.description && (
        <p className="text-xs text-[var(--foreground-secondary)] mb-4 line-clamp-2">
          {curriculum.description}
        </p>
      )}

      {/* Subject count / match badge */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Match badge — only shown when subjects are selected */}
        {matchesAll && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
            <Check size={11} />
            All {curriculum.matchCount} subject{curriculum.matchCount !== 1 ? 's' : ''} match
          </span>
        )}
        {partialMatch && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--amber-500)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--amber-500)]">
            {curriculum.matchCount} of {totalSelected} subjects match
          </span>
        )}

        {/* Total subjects available (always shown when no match info) */}
        <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
          <Layers size={12} />
          {curriculum.subjectCount} subject{curriculum.subjectCount !== 1 ? 's' : ''} available
        </span>

        {curriculum.grading_system && (
          <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
            <Star size={12} />
            {gradingLabel[curriculum.grading_system] ?? curriculum.grading_system}
          </span>
        )}
      </div>

      {/* Matched subjects list (when subjects selected and there are matches) */}
      {hasSelection && curriculum.matchedSubjectTitles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {curriculum.matchedSubjectTitles.map(title => (
            <span
              key={title}
              className="rounded-md bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]"
            >
              {title}
            </span>
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        id={`add-course-${curriculum.id}`}
        onClick={() => onAdd(curriculum.id)}
        disabled={curriculum.isEnrolled || isAdding}
        className={cn(
          'mt-auto w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all cursor-pointer',
          curriculum.isEnrolled
            ? 'bg-[var(--primary)]/10 text-[var(--primary)] cursor-default'
            : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-glow)]'
        )}
      >
        {curriculum.isEnrolled ? (
          <>
            <Check size={15} />
            Added to My Courses
          </>
        ) : isAdding ? (
          <span className="animate-pulse">Adding…</span>
        ) : (
          <>
            <GraduationCap size={15} />
            Add to My Courses
            <ChevronRight size={14} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CoursesLibraryBrowser() {
  const { user } = useAuth();
  const { role } = useRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allCurriculums, enrolledCurriculumIds, enroll, getSubjectsForCurriculum } = useCourseManager();

  // ── Local state ───────────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
  const [smartFilter, setSmartFilter] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showOtherBoards, setShowOtherBoards] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── URL sync: hydrate from query param on mount ──────────────────────────

  useEffect(() => {
    const subjectsParam = searchParams.get('subjects');
    if (!subjectsParam) return;
    const ids = subjectsParam.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return;
    // Validate against the mapping (built later, but we can do a simple set)
    setSelectedSubjectIds(new Set(ids));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── URL sync: write selection to query param (shallow, non-navigating) ──

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedSubjectIds.size > 0) {
      params.set('subjects', Array.from(selectedSubjectIds).join(','));
    } else {
      params.delete('subjects');
    }
    const newParamsStr = params.toString();
    const currentPath = window.location.pathname;
    const newUrl = newParamsStr ? `${currentPath}?${newParamsStr}` : currentPath;
    if (newUrl !== `${currentPath}?${searchParams.toString()}` && newUrl !== currentPath) {
      router.replace(newUrl, { scroll: false });
    }
  }, [selectedSubjectIds, searchParams, router]);

  // ── Derived data ─────────────────────────────────────────────────────────

  // Build flat subject list across all curricula
  const allSubjectsList = useMemo(() => {
    const seen = new Map<string, { id: string; title: string; examBoards: Set<string> }>();
    for (const c of allCurriculums) {
      const subjects = getSubjectsForCurriculum(c.id);
      for (const s of subjects) {
        const existing = seen.get(s.title);
        if (existing) {
          if (c.exam_board) existing.examBoards.add(c.exam_board);
        } else {
          seen.set(s.title, {
            id: s.id,
            title: s.title,
            examBoards: new Set(c.exam_board ? [c.exam_board] : []),
          });
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [allCurriculums, getSubjectsForCurriculum]);

  // Build subject→board mapping (for match computation)
  const subjectBoardMap = useMemo(
    () => buildSubjectBoardMap(allCurriculums, getSubjectsForCurriculum),
    [allCurriculums, getSubjectsForCurriculum],
  );

  // Enrich curriculums with subject counts, enrollment, AND match data
  const enrichedCurriculums = useMemo((): EnrichedCurriculum[] => {
    const selectedIds = Array.from(selectedSubjectIds);
    return allCurriculums.map(c => {
      const subjects = getSubjectsForCurriculum(c.id);
      const subjectIds = new Set(subjects.map(s => s.id));

      // Compute match: how many selected subjects are in this curriculum?
      let matchCount = 0;
      const matchedSubjectTitles: string[] = [];
      if (selectedIds.length > 0) {
        for (const sId of selectedIds) {
          if (subjectIds.has(sId)) {
            matchCount++;
            const subj = subjects.find(s => s.id === sId);
            if (subj) matchedSubjectTitles.push(subj.title);
          }
        }
      }

      return {
        ...c,
        subjectCount: subjects.length,
        isEnrolled: enrolledCurriculumIds.includes(c.id),
        matchCount,
        matchedSubjectTitles,
      };
    });
  }, [allCurriculums, enrolledCurriculumIds, selectedSubjectIds, getSubjectsForCurriculum]);

  // Get enrolled boards for smart filter
  const enrolledBoards = useMemo(() => {
    const enrolledCurriculums = enrichedCurriculums.filter(c => c.isEnrolled);
    return new Set(enrolledCurriculums.map(c => c.exam_board).filter(Boolean));
  }, [enrichedCurriculums]);

  // Split enriched curriculums: matched (all subjects) vs non-matching vs rest
  const { matchedCurriculums, nonMatchingCurriculums, filteredCurriculums } = useMemo(() => {
    const selectedIds = Array.from(selectedSubjectIds);
    const hasSelection = selectedIds.length > 0;

    let list = enrichedCurriculums;

    // Smart filter
    if (smartFilter && enrolledBoards.size > 0) {
      list = list.filter(c => c.exam_board && enrolledBoards.has(c.exam_board));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.exam_board?.toLowerCase().includes(q) ||
        c.qualification?.toLowerCase().includes(q) ||
        c.syllabus_code?.toLowerCase().includes(q)
      );
    }

    // When subjects selected: split into matched + non-matching
    let matched: EnrichedCurriculum[] = [];
    let nonMatching: EnrichedCurriculum[] = [];

    if (hasSelection) {
      for (const c of list) {
        if (c.matchCount === selectedIds.length) {
          matched.push(c);
        } else {
          nonMatching.push(c);
        }
      }
      // Sort matched by matchCount desc, then alphabetically
      matched.sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        return a.title.localeCompare(b.title);
      });
      // Sort non-matching by matchCount desc for the disclosure
      nonMatching.sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        return a.title.localeCompare(b.title);
      });
    } else {
      // No subjects selected — all curriculums are "matched"
      matched = list;
    }

    return { matchedCurriculums: matched, nonMatchingCurriculums: nonMatching, filteredCurriculums: list };
  }, [enrichedCurriculums, smartFilter, enrolledBoards, selectedSubjectIds, searchQuery]);

  const totalSelected = selectedSubjectIds.size;
  const hasSelection = totalSelected > 0;
  const hasMatches = matchedCurriculums.length > 0;
  const hasNonMatching = nonMatchingCurriculums.length > 0;
  const totalBoards = new Set(allCurriculums.map(c => c.exam_board).filter(Boolean)).size;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setShowOtherBoards(false); // reset disclosure when selection changes
  };

  const handleAdd = async (curriculumId: string) => {
    if (!user) return;
    setAddingId(curriculumId);
    try {
      const subjects = getSubjectsForCurriculum(curriculumId);
      for (const subject of subjects) {
        enroll(curriculumId, subject.id, null);
      }
      autoPopulateLessonTracker(user.id, curriculumId);
      autoPopulateGradeCalculator(user.id, curriculumId);
      showToast('Course added! Lesson Tracker and Grade Calculator have been populated.', 'success');
      setTimeout(() => router.push('/courses'), 1500);
    } catch {
      showToast('Failed to add course. Please try again.', 'error');
    } finally {
      setAddingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg animate-slide-in-right',
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        )}>
          {toast.message}
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-blue-500/10 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <BookMarked size={12} /> Verified by Contributors
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              Courses
            </h1>
            <p className="max-w-xl text-sm md:text-base text-[var(--foreground-secondary)]">
              Browse verified curriculum templates from CAIE, Edexcel, IELTS and more.
              Adding a course automatically populates your Lesson Tracker and Grade Calculator.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--foreground)]">{allCurriculums.length}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Curricula</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--foreground)]">{totalBoards}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Boards</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-4">
        {/* Smart toggle + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            id="smart-filter-toggle"
            onClick={() => setSmartFilter(!smartFilter)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer shrink-0',
              smartFilter
                ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'
                : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            )}
          >
            {smartFilter ? <Sparkles size={14} /> : <Globe size={14} />}
            {smartFilter ? 'For My Courses' : 'Browse All'}
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" />
            <input
              id="courses-library-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, board, code…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] pl-10 pr-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* ── Single explainer (replaces per-card hierarchy strip) ───────── */}
        <div className="flex items-start gap-2 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-2.5 text-xs text-[var(--foreground-secondary)]">
          <Info size={14} className="shrink-0 mt-0.5 text-[var(--primary)]" />
          <span>
            <strong>Select your subjects below</strong> to automatically see matching exam boards sorted by relevance.{' '}
            <span className="text-[var(--foreground-muted)]">
              <ScrollText size={11} className="inline-block mr-0.5" />
              Each curriculum follows a Subject → Paper → Topic hierarchy for your lessons.
            </span>
          </span>
        </div>

        {/* ── Subject selection chips ────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 items-center">
          {allSubjectsList.map(subject => {
            const isSelected = selectedSubjectIds.has(subject.id);
            return (
              <button
                key={subject.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleSubject(subject.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 focus-ring',
                  isSelected
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                    : 'bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--background-secondary)]'
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                {subject.title}
              </button>
            );
          })}
        </div>

        {/* ── Selected-subjects summary bar ──────────────────────────────── */}
        {hasSelection && (
          <div className="flex items-center gap-3 text-sm" aria-live="polite">
            <span className="font-semibold text-[var(--foreground)]">
              {totalSelected} subject{totalSelected !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedSubjectIds(new Set())}
              className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] underline underline-offset-2 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── State-aware status line ────────────────────────────────────── */}
        <div className="text-xs" aria-live="polite">
          {!hasSelection ? (
            <span className="text-[var(--foreground-muted)]">
              Showing all {totalBoards} exam boards — select subjects above to filter to your matches
            </span>
          ) : hasMatches ? (
            <span className="text-[var(--foreground-muted)]">
              <span className="font-semibold text-[var(--primary)]">{matchedCurriculums.length}</span> of{' '}
              {totalBoards} boards match all {totalSelected} selected subject{totalSelected !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-[var(--foreground-muted)]">
              No single exam board covers all {totalSelected} selected subjects
            </span>
          )}
        </div>
      </div>

      {/* ── Zero-match empty state ────────────────────────────────────────── */}
      {hasSelection && !hasMatches && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-[var(--amber-500)]/30 bg-[var(--amber-500)]/5 p-6 sm:p-8 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--amber-500)]/10 text-[var(--amber-500)]">
            <Info size={20} />
          </div>
          <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">
            No single exam board covers all {totalSelected} selected subjects
          </h3>
          <p className="mb-4 max-w-sm text-sm text-[var(--foreground-secondary)]">
            Try removing one, or view boards that partially match below.
          </p>
          <button
            onClick={() => setSelectedSubjectIds(new Set())}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer focus-ring"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* ── Partial match boards (zero-match fallback) ────────────────────── */}
      {hasSelection && !hasMatches && hasNonMatching && (
        <div className="w-full">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Boards that partially match ({nonMatchingCurriculums.length}):
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonMatchingCurriculums.map(c => (
              <ExamBoardCard
                key={c.id}
                curriculum={c}
                onAdd={handleAdd}
                isAdding={addingId === c.id}
                totalSelected={totalSelected}
                isTopMatch={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Matched curriculum grid ───────────────────────────────────────── */}
      {hasMatches && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {matchedCurriculums.map((c, idx) => (
            <ExamBoardCard
              key={c.id}
              curriculum={c}
              onAdd={handleAdd}
              isAdding={addingId === c.id}
              totalSelected={totalSelected}
              // Top match = highest matchCount tier
              isTopMatch={hasSelection && c.matchCount === totalSelected && idx === 0}
            />
          ))}
        </div>
      )}

      {/* ── "Other boards" disclosure (non-matching) ──────────────────────── */}
      {hasSelection && hasMatches && hasNonMatching && (
        <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowOtherBoards(!showOtherBoards)}
            className="w-full flex items-center justify-between px-5 py-3 text-left bg-[var(--background-card)] hover:bg-[var(--background-secondary)] transition-colors cursor-pointer focus-ring"
            aria-expanded={showOtherBoards}
            aria-controls="other-boards-section"
          >
            <span className="text-sm font-medium text-[var(--foreground)]">
              {nonMatchingCurriculums.length} other exam board{nonMatchingCurriculums.length !== 1 ? 's' : ''}{' '}
              that don&apos;t cover all your selected subjects
            </span>
            {showOtherBoards ? (
              <ChevronUp size={16} className="text-[var(--foreground-muted)]" />
            ) : (
              <ChevronDown size={16} className="text-[var(--foreground-muted)]" />
            )}
          </button>
          {showOtherBoards && (
            <div id="other-boards-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-[var(--background-secondary)]/50">
              {nonMatchingCurriculums.map(c => (
                <ExamBoardCard
                  key={c.id}
                  curriculum={c}
                  onAdd={handleAdd}
                  isAdding={addingId === c.id}
                  totalSelected={totalSelected}
                  isTopMatch={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── No results (no selection, empty search) ──────────────────────── */}
      {!hasSelection && filteredCurriculums.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--background-card)] p-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
            <BookOpen size={28} />
          </div>
          <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">No curricula found</h3>
          <p className="mb-6 max-w-sm text-sm text-[var(--foreground-secondary)]">
            {smartFilter
              ? 'No library courses match your enrolled boards. Switch to "Browse All" to see everything.'
              : 'No curricula match your current filters. Try clearing some filters.'}
          </p>
          <button
            onClick={() => { setSmartFilter(false); setSelectedSubjectIds(new Set()); setSearchQuery(''); }}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
          >
            Browse All Curricula
          </button>
        </div>
      )}
    </div>
  );
}
