'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CoursesLibraryBrowser
// Subject-first selection flow:
//   1. Pick subjects →  2. See matching exam boards →  3. Enrol per board
// No wizard. No multi-step forms. Just select → review → act.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, BookOpen, Star, ChevronRight, X,
  Sparkles, Check, Layers,
  GraduationCap, Globe, BookMarked, Info, ChevronDown, ChevronUp,
  ScrollText, ArrowRight,
} from 'lucide-react';
import { useCourseManager } from '@/hooks/useCourseManager';
import { QUALIFICATION_REGISTRY } from '@/constants/qualifications';
import { cn } from '@/lib/utils';
import type { CurriculumSummary } from '@/hooks/useCourseManager';

// ── Types ────────────────────────────────────────────────────────────────────

interface FlatSubject {
  id: string;
  title: string;
  boardCount: number;
  examBoards: string[];
}

interface EnrichedCurriculum extends CurriculumSummary {
  subjectCount: number;
  isEnrolled: boolean;
  matchCount: number;
  matchedSubjectTitles: string[];
}

// ── Exam Board Card ──────────────────────────────────────────────────────────

interface ExamBoardCardProps {
  curriculum: EnrichedCurriculum;
  onSelectSubjects: (id: string) => void;
  totalSelected: number;
  isTopMatch: boolean;
}

function ExamBoardCard({ curriculum, onSelectSubjects, totalSelected, isTopMatch }: ExamBoardCardProps) {
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

  const handleCardClick = () => {
    if (!curriculum.isEnrolled) {
      onSelectSubjects(curriculum.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      role={curriculum.isEnrolled ? 'article' : 'button'}
      tabIndex={curriculum.isEnrolled ? -1 : 0}
      onKeyDown={(e) => {
        if (!curriculum.isEnrolled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={cn(
        'group relative flex flex-col rounded-2xl border p-5 transition-all duration-300',
        !curriculum.isEnrolled && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)]/50',
        'hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5',
        isTopMatch && 'border-[var(--primary)]/40 shadow-[var(--shadow-glow)]',
        !isTopMatch && curriculum.isEnrolled && 'border-[var(--primary)]/30 bg-[var(--primary)]/5',
        !isTopMatch && !curriculum.isEnrolled && 'border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--primary)]/30',
        noMatch && 'opacity-70 hover:opacity-100',
      )}
    >
      {/* Enrolled badge */}
      {curriculum.isEnrolled && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]">
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
      <h3 className="text-base font-semibold text-[var(--foreground)] mb-1 leading-tight">
        {curriculum.title}
      </h3>
      {curriculum.description && (
        <p className="text-xs text-[var(--foreground-secondary)] mb-4 line-clamp-2">
          {curriculum.description}
        </p>
      )}

      {/* Subject count / match badge */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {matchesAll && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
            <Check size={11} />
            All {curriculum.matchCount} subject{curriculum.matchCount !== 1 ? 's' : ''} match
          </span>
        )}
        {partialMatch && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-500">
            {curriculum.matchCount} of {totalSelected} subjects match
          </span>
        )}

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

      {/* Matched subjects list */}
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

      {/* Select subjects button */}
      <button
        id={`add-course-${curriculum.id}`}
        onClick={() => onSelectSubjects(curriculum.id)}
        disabled={curriculum.isEnrolled}
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
        ) : (
          <>
            <GraduationCap size={15} />
            Select Subjects
            <ChevronRight size={14} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
}

// ── Subject Selection Card ────────────────────────────────────────────────────

interface SubjectCardProps {
  subject: FlatSubject;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function SubjectCard({ subject, isSelected, onToggle }: SubjectCardProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onToggle(subject.id)}
      className={cn(
        'group relative flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer w-full shadow-sm',
        isSelected
          ? 'border-2 border-[var(--primary)] bg-[var(--primary)]/8 ring-2 ring-[var(--primary)]/15 shadow-[0_0_0_1px_var(--primary)]/20'
          : 'border border-[var(--border)] bg-[var(--background-secondary)]/60 hover:border-[var(--primary)]/60 hover:bg-[var(--background-secondary)] hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      {/* Check indicator */}
      <div className={cn(
        'absolute top-3 right-3 h-5.5 w-5.5 rounded-[7px] flex items-center justify-center shrink-0 transition-all duration-200',
        isSelected
          ? 'bg-[var(--primary)] text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
          : 'border-[2.5px] border-[var(--foreground-muted)]/40 bg-[var(--background-card)] group-hover:border-[var(--primary)]/70 group-hover:bg-[var(--background-card)]'
      )}>
        {isSelected && <Check size={13} strokeWidth={3} className="drop-shadow-sm" />}
      </div>

      {/* Subject name */}
      <span className={cn(
        'text-sm font-semibold pr-8 leading-tight transition-colors',
        isSelected ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
      )}>
        {subject.title}
      </span>

      {/* Board availability hint — increased contrast */}
      <span className="text-xs font-medium text-[var(--foreground-secondary)] flex items-center gap-1">
        <GraduationCap size={11} className="opacity-70" />
        {subject.boardCount} exam board{subject.boardCount !== 1 ? 's' : ''} available
      </span>
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CoursesLibraryBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allCurriculums, enrolledCurriculumIds, getSubjectsForCurriculum } = useCourseManager();

  // ── Local state ───────────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
  const [smartFilter, setSmartFilter] = useState(true);
  const [showOtherBoards, setShowOtherBoards] = useState(false);

  // ── URL sync: hydrate from query param on mount ──────────────────────────

  useEffect(() => {
    const subjectsParam = searchParams.get('subjects');
    if (!subjectsParam) return;
    const ids = subjectsParam.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return;
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

  // ── Derived: flat subject list (deduplicated by title) ──────────────────

  const allFlatSubjects = useMemo((): FlatSubject[] => {
    const seen = new Map<string, FlatSubject>();
    for (const c of allCurriculums) {
      const board = c.exam_board;
      const subjects = getSubjectsForCurriculum(c.id);
      for (const s of subjects) {
        const existing = seen.get(s.title);
        if (existing) {
          if (board && !existing.examBoards.includes(board)) {
            existing.examBoards.push(board);
            existing.boardCount = existing.examBoards.length;
          }
        } else {
          seen.set(s.title, {
            id: s.id,
            title: s.title,
            examBoards: board ? [board] : [],
            boardCount: board ? 1 : 0,
          });
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [allCurriculums, getSubjectsForCurriculum]);

  // ── Derived: filtered subjects (by search) ──────────────────────────────

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return allFlatSubjects;
    const q = searchQuery.toLowerCase();
    return allFlatSubjects.filter(
      s => s.title.toLowerCase().includes(q)
    );
  }, [allFlatSubjects, searchQuery]);

  // ── Derived: enriched curriculums with match data ───────────────────────

  const enrichedCurriculums = useMemo((): EnrichedCurriculum[] => {
    const selectedIds = Array.from(selectedSubjectIds);
    return allCurriculums.map(c => {
      const subjects = getSubjectsForCurriculum(c.id);
      const subjectIds = new Set(subjects.map(s => s.id));

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

  // ── Derived: enrolled boards set ────────────────────────────────────────

  const enrolledBoards = useMemo(() => {
    const enrolled = enrichedCurriculums.filter(c => c.isEnrolled);
    return new Set(enrolled.map(c => c.exam_board).filter(Boolean));
  }, [enrichedCurriculums]);

  // ── Derived: matched + non-matching curriculums ─────────────────────────

  const { matchedCurriculums, nonMatchingCurriculums } = useMemo(() => {
    const selectedIds = Array.from(selectedSubjectIds);
    const hasSelection = selectedIds.length > 0;

    let list = enrichedCurriculums;

    // Smart filter by enrolled boards
    if (smartFilter && enrolledBoards.size > 0) {
      list = list.filter(c => c.exam_board && enrolledBoards.has(c.exam_board));
    }

    const matched: EnrichedCurriculum[] = [];
    const nonMatching: EnrichedCurriculum[] = [];

    if (hasSelection) {
      for (const c of list) {
        if (c.matchCount === selectedIds.length) {
          matched.push(c);
        } else {
          nonMatching.push(c);
        }
      }
      matched.sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        return a.title.localeCompare(b.title);
      });
      nonMatching.sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        return a.title.localeCompare(b.title);
      });
    } else {
      matched.push(...list);
    }

    return { matchedCurriculums: matched, nonMatchingCurriculums: nonMatching };
  }, [enrichedCurriculums, smartFilter, enrolledBoards, selectedSubjectIds]);

  // ── Counts ──────────────────────────────────────────────────────────────

  const totalSelected = selectedSubjectIds.size;
  const hasSelection = totalSelected > 0;
  const hasMatches = matchedCurriculums.length > 0;
  const hasNonMatching = nonMatchingCurriculums.length > 0;
  const totalBoards = new Set(allCurriculums.map(c => c.exam_board).filter(Boolean)).size;
  const hasEnrolledBoards = enrolledBoards.size > 0;

  // ── Handlers ────────────────────────────────────────────────────────────

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setShowOtherBoards(false);
  };

  const handleSelectSubjects = (curriculumId: string) => {
    router.push(`/courses?curriculum=${encodeURIComponent(curriculumId)}`);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-7">
      {/* ═══ Stats Summary Bar ════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 px-5 py-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background-card)]/60">
        <div className="flex items-center gap-2">
          <BookMarked size={14} className="text-emerald-500" />
          <span className="text-xs font-semibold text-[var(--foreground-secondary)]">Verified Curricula</span>
        </div>
        <div className="h-5 w-px bg-[var(--border)] hidden sm:block" />
        <div className="flex items-center gap-5">
          <div className="flex items-baseline gap-1.5">
            <p className="text-lg font-bold text-[var(--foreground)]">{allCurriculums.length}</p>
            <p className="text-[11px] text-[var(--foreground-muted)]">Curricula</p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-lg font-bold text-[var(--foreground)]">{totalBoards}</p>
            <p className="text-[11px] text-[var(--foreground-muted)]">Boards</p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-lg font-bold text-[var(--foreground)]">{allFlatSubjects.length}</p>
            <p className="text-[11px] text-[var(--foreground-muted)]">Subjects</p>
          </div>
        </div>
      </div>

      {/* ═══ Phase 1: Subject Selection ═══════════════════════════════════════ */}
      <section aria-label="Subject selection">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[var(--primary)]" />
                What subjects are you studying?
              </h2>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Select all the subjects relevant to you. We&apos;ll show you which exam boards offer them.
              </p>
            </div>
            {/* Clear selection (only when there are selections) */}
            {hasSelection && (
              <button
                onClick={() => setSelectedSubjectIds(new Set())}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] underline underline-offset-2 transition-colors cursor-pointer"
              >
                <X size={12} />
                Clear all ({totalSelected})
              </button>
            )}
          </div>

          {/* Search within subjects */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" />
            <input
              id="courses-library-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search subjects by name…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] pl-10 pr-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer focus-ring"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Subject grid */}
          {filteredSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-[var(--border)]">
              <BookOpen className="h-8 w-8 text-[var(--foreground-muted)] mb-3" />
              <p className="text-sm font-medium text-[var(--foreground-muted)]">
                {searchQuery ? 'No subjects match your search' : 'No subjects available'}
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                {searchQuery ? 'Try a different search term.' : 'Curricula data may not have been loaded yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredSubjects.map(subject => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  isSelected={selectedSubjectIds.has(subject.id)}
                  onToggle={toggleSubject}
                />
              ))}
            </div>
          )}

          {/* Selection count + hint */}
          <div className="flex items-center gap-3 text-sm" aria-live="polite">
            {!hasSelection ? (
              <span className="text-[var(--foreground-muted)]">
                {allFlatSubjects.length} subjects available — start selecting above
              </span>
            ) : (
              <span className="font-semibold text-[var(--primary)]">
                {totalSelected} subject{totalSelected !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ═══ Divider ════════════════════════════════════════════════════════════ */}
      {hasSelection && (
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
            Matching Exam Boards
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
      )}

      {/* ═══ Phase 2: Exam Board Results (only when subjects are selected) ════ */}
      {hasSelection && (
        <section aria-label="Exam board results">
          <div className="space-y-5">
            {/* Controls row: smart filter toggle */}
            {hasEnrolledBoards && (
              <div className="flex items-center gap-3">
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
                <span className="text-xs text-[var(--foreground-muted)]">
                  Filtering to boards matching your enrolled courses
                </span>
              </div>
            )}

            {/* Hierarchical structure hint */}
            <div className="flex items-start gap-2 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-2.5 text-xs text-[var(--foreground-secondary)]">
              <Info size={14} className="shrink-0 mt-0.5 text-[var(--primary)]" />
              <span>
                Each curriculum follows a{' '}
                <span className="font-semibold text-[var(--foreground)]">Subject → Paper → Topic</span> hierarchy.{' '}
                <span className="text-[var(--foreground-muted)]">
                  Click <strong>Select Subjects</strong> on a board below to pick specific subjects to enrol in.
                </span>
              </span>
            </div>

            {/* Status line */}
            <div className="text-xs" aria-live="polite">
              {hasMatches ? (
                <span className="text-[var(--foreground-muted)]">
                  <span className="font-semibold text-[var(--primary)]">{matchedCurriculums.length}</span> of{' '}
                  {totalBoards} boards match all {totalSelected} of your selected subject{totalSelected !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-amber-500 font-medium">
                  No single exam board covers all {totalSelected} selected subjects.
                  See partial matches below.
                </span>
              )}
            </div>

            {/* ── Matched boards grid ──────────────────────────────────────── */}
            {hasMatches && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {matchedCurriculums.map((c, idx) => (
                  <ExamBoardCard
                    key={c.id}
                    curriculum={c}
                    onSelectSubjects={handleSelectSubjects}
                    totalSelected={totalSelected}
                    isTopMatch={c.matchCount === totalSelected && idx === 0}
                  />
                ))}
              </div>
            )}

            {/* ── No match empty state ────────────────────────────────────── */}
            {!hasMatches && !hasNonMatching && (
              <div className="flex flex-col items-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--background-card)] p-10 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
                  <Info size={20} />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
                  No boards found for your selected subjects
                </h3>
                <p className="mb-4 max-w-sm text-xs text-[var(--foreground-secondary)]">
                  Try selecting different subjects or toggling the smart filter to browse all boards.
                </p>
                <button
                  onClick={() => { setSelectedSubjectIds(new Set()); setSmartFilter(false); }}
                  className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer focus-ring"
                >
                  Start over
                </button>
              </div>
            )}

            {/* ── Non-matching boards disclosure ──────────────────────────── */}
            {hasNonMatching && (
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
                        onSelectSubjects={handleSelectSubjects}
                        totalSelected={totalSelected}
                        isTopMatch={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ Phase 0: Before any subjects are selected ════════════════════════ */}
      {!hasSelection && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--background-card)]/50 p-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <ArrowRight size={24} />
          </div>
          <h3 className="mb-1 text-base font-semibold text-[var(--foreground)]">
            Select your subjects above
          </h3>
          <p className="max-w-md text-sm text-[var(--foreground-muted)]">
            Once you pick at least one subject, matching exam boards will appear here.
            You can then choose a board and enrol in individual subjects.
          </p>
        </div>
      )}
    </div>
  );
}
