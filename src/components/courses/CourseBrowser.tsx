'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CourseBrowser
// Single-page browse + multi-select enrol experience.
// Replaces the old multi-step CourseManagerWizard wizard flow.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen, Plus, Check, X, Search, GraduationCap, Trash2,
  Undo2, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCourseManager, type EnrollmentWithDetails } from '@/hooks/useCourseManager';
import type { CurriculumSummary, SubjectSummary } from '@/hooks/useCourseManager';

// ── Types ────────────────────────────────────────────────────────────────────

interface SubjectWithCurriculum {
  subject: SubjectSummary;
  curriculum: CurriculumSummary;
}

interface EnrolMessage {
  type: 'success' | 'error';
  text: string;
}

interface UndoEntry {
  enrollment: EnrollmentWithDetails;
  timer: ReturnType<typeof setTimeout>;
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function CourseBrowserSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in motion-reduce:animate-none">
      {/* Filter chips skeleton */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 animate-shimmer rounded-full" />
        ))}
      </div>
      {/* Search skeleton */}
      <div className="h-10 w-full animate-shimmer rounded-xl mb-6" />
      {/* Subject cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-background-card p-5 animate-shimmer">
            <div className="h-5 w-3/4 rounded-lg mb-2" />
            <div className="h-3 w-1/2 rounded-lg mb-3" />
            <div className="h-3 w-1/3 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Undo Toast ───────────────────────────────────────────────────────────────

function UndoToast({
  subjectName,
  onUndo,
  onDismiss,
  secondsLeft,
}: {
  subjectName: string;
  onUndo: () => void;
  onDismiss: () => void;
  secondsLeft: number;
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-border bg-background-elevated px-5 py-3 shadow-lg animate-fade-in-up motion-reduce:animate-none"
    >
      <span className="text-sm text-foreground">
        Removed <span className="font-semibold">{subjectName}</span>
      </span>
      <button
        onClick={onUndo}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
        aria-label={`Undo removing ${subjectName}`}
      >
        <Undo2 className="h-3.5 w-3.5" />
        Undo ({secondsLeft}s)
      </button>
      <button
        onClick={onDismiss}
        className="rounded-lg p-1 text-foreground-muted hover:text-foreground transition-colors"
        aria-label="Dismiss undo notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CourseBrowser() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    allCurriculums,
    getSubjectsForCurriculum,
    enrollments,
    isLoading: hookLoading,
    enroll,
    unenroll,
  } = useCourseManager();

  // ── Pre-select from query param (e.g. /courses?curriculum=curr-igcse-cie) ──
  const preselectedCurriculumId = searchParams.get('curriculum');

  // ── Local state ──────────────────────────────────────────────────────────
  const [selectedExamBoard, setSelectedExamBoard] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stagedSubjectKeys, setStagedSubjectKeys] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);
  const [enrolMessage, setEnrolMessage] = useState<EnrolMessage | null>(null);
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(5);
  const [showMyCourses, setShowMyCourses] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enrolMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-set filters from query param on mount ───────────────────────────
  useEffect(() => {
    if (!preselectedCurriculumId) return;
    const curriculum = allCurriculums.find(c => c.id === preselectedCurriculumId);
    if (curriculum) {
      if (curriculum.exam_board) setSelectedExamBoard(curriculum.exam_board);
      setSearchQuery(curriculum.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [preselectedCurriculumId]);

  // ── Derived: flat list of all subjects with curriculum info ──────────────

  const allSubjectsWithCurriculum = useMemo<SubjectWithCurriculum[]>(() => {
    const result: SubjectWithCurriculum[] = [];
    for (const curriculum of allCurriculums) {
      const subjects = getSubjectsForCurriculum(curriculum.id);
      for (const subject of subjects) {
        result.push({ subject, curriculum });
      }
    }
    return result;
  }, [allCurriculums, getSubjectsForCurriculum]);

  // ── Derived: distinct exam boards ────────────────────────────────────────

  const examBoards = useMemo(() => {
    const boards = new Set<string>();
    for (const c of allCurriculums) {
      if (c.exam_board) boards.add(c.exam_board);
    }
    return ['all', ...Array.from(boards).sort()];
  }, [allCurriculums]);

  // ── Derived: already enrolled subject keys ───────────────────────────────

  const enrolledSubjectKeys = useMemo(() => {
    return new Set(
      enrollments.map(e => `${e.curriculum_id}::${e.subject_id}`)
    );
  }, [enrollments]);

  // ── Derived: filtered subjects ───────────────────────────────────────────
  // Strategy: chip narrows first, search narrows further (combined filter)

  const filteredSubjects = useMemo(() => {
    let filtered = allSubjectsWithCurriculum;

    if (selectedExamBoard !== 'all') {
      filtered = filtered.filter(
        item => item.curriculum.exam_board === selectedExamBoard
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        item =>
          item.subject.title.toLowerCase().includes(q) ||
          item.curriculum.title.toLowerCase().includes(q) ||
          (item.curriculum.exam_board ?? '').toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [allSubjectsWithCurriculum, selectedExamBoard, searchQuery]);

  // ── Derived: my courses grouped by curriculum ────────────────────────────

  const myCoursesGrouped = useMemo(() => {
    const grouped: Record<string, EnrollmentWithDetails[]> = {};
    for (const enr of enrollments) {
      const key = enr.curriculum_id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(enr);
    }
    return grouped;
  }, [enrollments]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const subjectKey = useCallback((curriculumId: string, subjectId: string) =>
    `${curriculumId}::${subjectId}`, []);

  const toggleSubjectStaged = useCallback((curriculumId: string, subjectId: string) => {
    const key = subjectKey(curriculumId, subjectId);
    setStagedSubjectKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    // Clear any previous enrol message
    setEnrolMessage(null);
  }, [subjectKey]);

  const clearEnrolMessage = useCallback(() => {
    setEnrolMessage(null);
  }, []);

  // ── Bulk enrol ───────────────────────────────────────────────────────────

  const handleBulkEnrol = useCallback(async () => {
    if (stagedSubjectKeys.size === 0) return;
    setEnrolling(true);
    setEnrolMessage(null);

    const keysToEnrol = Array.from(stagedSubjectKeys);
    const failed: string[] = [];
    let successCount = 0;

    for (const key of keysToEnrol) {
      const [curriculumId, subjectId] = key.split('::');
      if (!curriculumId || !subjectId) continue;

      const result = await enroll(curriculumId, subjectId, null);
      if (result.success) {
        successCount++;
      } else {
        // Find subject name for error reporting
        const item = allSubjectsWithCurriculum.find(
          s => s.subject.id === subjectId && s.curriculum.id === curriculumId
        );
        failed.push(item?.subject.title ?? subjectId);
      }
    }

    setStagedSubjectKeys(new Set());
    setEnrolling(false);

    if (failed.length === 0) {
      setEnrolMessage({
        type: 'success',
        text: `Successfully enrolled in ${successCount} subject${successCount !== 1 ? 's' : ''}.`,
      });
    } else {
      setEnrolMessage({
        type: 'error',
        text: `Enrolled in ${successCount} subject${successCount !== 1 ? 's' : ''}. Failed: ${failed.join(', ')}.`,
      });
    }
  }, [stagedSubjectKeys, enroll, allSubjectsWithCurriculum]);

  // ── Inline drop with undo ────────────────────────────────────────────────

  const handleRemoveCourse = useCallback((enrollment: EnrollmentWithDetails) => {
    // Clear any existing undo
    if (undoEntry) {
      clearTimeout(undoEntry.timer);
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    }

    const timer = setTimeout(async () => {
      // Undo timer expired — actually drop the course
      await unenroll(enrollment.id);
      setUndoEntry(null);
      setUndoCountdown(5);
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    }, 5000);

    setUndoEntry({ enrollment, timer });
    setUndoCountdown(5);

    // Start countdown
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    undoIntervalRef.current = setInterval(() => {
      setUndoCountdown(prev => {
        if (prev <= 1) return 1;
        return prev - 1;
      });
    }, 1000);
  }, [undoEntry, unenroll]);

  const handleUndoRemove = useCallback(() => {
    if (!undoEntry) return;
    clearTimeout(undoEntry.timer);
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    setUndoEntry(null);
    setUndoCountdown(5);
  }, [undoEntry]);

  const handleDismissUndo = useCallback(() => {
    if (!undoEntry) return;
    clearTimeout(undoEntry.timer);
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    // Immediately drop without waiting
    unenroll(undoEntry.enrollment.id);
    setUndoEntry(null);
    setUndoCountdown(5);
  }, [undoEntry, unenroll]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (undoEntry) clearTimeout(undoEntry.timer);
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
      if (enrolMessageTimerRef.current) clearTimeout(enrolMessageTimerRef.current);
    };
  }, [undoEntry]);

  // ── Auto-clear enrol message after 5s ───────────────────────────────────

  useEffect(() => {
    if (enrolMessage) {
      if (enrolMessageTimerRef.current) clearTimeout(enrolMessageTimerRef.current);
      enrolMessageTimerRef.current = setTimeout(() => {
        setEnrolMessage(null);
      }, 5000);
    }
  }, [enrolMessage]);

  // ── Exclude already-enrolled subjects from the staged count ─────────────

  const stagedCount = useMemo(() => {
    let count = 0;
    for (const key of stagedSubjectKeys) {
      if (!enrolledSubjectKeys.has(key)) count++;
    }
    return count;
  }, [stagedSubjectKeys, enrolledSubjectKeys]);

  const hasEnrollments = enrollments.length > 0;

  // ── Auth guard ──────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Authentication Required</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          Please log in to access the Course Manager.
        </p>
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────

  if (hookLoading) {
    return <CourseBrowserSkeleton />;
  }

  // ── Error state ─────────────────────────────────────────────────────────

  if (dataError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="h-12 w-12 text-error mb-4" />
        <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
        <p className="mt-2 text-sm text-foreground-muted">{dataError}</p>
        <button
          onClick={() => { setDataError(null); window.location.reload(); }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in motion-reduce:animate-none">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Learn</p>
        <h1 className="text-3xl font-bold text-foreground mt-1 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Course Manager
        </h1>
        <p className="text-foreground-muted mt-2 max-w-2xl text-sm leading-relaxed">
          Browse curricula, select subjects, and manage your enrolled courses in one place.
        </p>
      </div>

      {/* ── Main layout: browse area + my courses sidebar ─────────────────── */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8">
        {/* ── Left: Browse area ───────────────────────────────────────────── */}
        <div className="min-w-0">
          {/* ── Exam board filter chips ───────────────────────────────────── */}
          <div
            className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1"
            role="group"
            aria-label="Filter by exam board"
          >
            {examBoards.map(board => {
              const isActive = selectedExamBoard === board;
              return (
                <button
                  key={board}
                  onClick={() => setSelectedExamBoard(board)}
                  aria-pressed={isActive}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 min-h-[44px] flex items-center focus-ring',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background-card text-foreground-muted hover:border-primary/50 hover:text-foreground'
                  )}
                >
                  {board === 'all' ? 'All' : board}
                </button>
              );
            })}
          </div>

          {/* ── Search box ────────────────────────────────────────────────── */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects, curricula, or exam boards..."
              className="w-full rounded-xl border border-border bg-background-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              aria-label="Search subjects"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-foreground-muted hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* ── Enrol message ─────────────────────────────────────────────── */}
          {enrolMessage && (
            <div
              className={cn(
                'mb-4 rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-3',
                enrolMessage.type === 'success'
                  ? 'border-accent/30 bg-accent/10 text-accent'
                  : 'border-error/30 bg-error/10 text-error'
              )}
              role="alert"
            >
              <span>{enrolMessage.text}</span>
              <button
                onClick={clearEnrolMessage}
                className="shrink-0 rounded-lg p-1 hover:bg-foreground/10 transition-colors"
                aria-label="Dismiss message"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── Subject cards ─────────────────────────────────────────────── */}
          {filteredSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-10 w-10 text-foreground-muted mb-4" />
              <p className="text-foreground-muted font-medium">
                {searchQuery || selectedExamBoard !== 'all'
                  ? 'No subjects match your search'
                  : 'No subjects available'}
              </p>
              <p className="text-sm text-foreground-muted mt-1">
                {searchQuery || selectedExamBoard !== 'all'
                  ? 'Try adjusting your filters or search term.'
                  : 'Curricula data may not have been loaded yet.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSubjects.map(item => {
                const key = subjectKey(item.curriculum.id, item.subject.id);
                const isEnrolled = enrolledSubjectKeys.has(key);
                const isStaged = stagedSubjectKeys.has(key);

                return (
                  <div
                    key={key}
                    className={cn(
                      'rounded-2xl border p-4 transition-all duration-150',
                      isStaged
                        ? 'border-primary bg-primary/5'
                        : isEnrolled
                          ? 'border-accent/30 bg-accent/5'
                          : 'border-border bg-background-card hover:border-border-hover'
                    )}
                  >
                    {/* Subject name */}
                    <p className="font-semibold text-foreground text-sm leading-tight">
                      {item.subject.title}
                    </p>

                    {/* Curriculum + exam board */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs text-foreground-muted flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {item.curriculum.title}
                      </span>
                      {item.curriculum.exam_board && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {item.curriculum.exam_board}
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="mt-3">
                      {isEnrolled ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent">
                          <Check className="h-3 w-3" />
                          Enrolled
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleSubjectStaged(item.curriculum.id, item.subject.id)}
                          aria-pressed={isStaged}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 min-h-[36px] focus-ring',
                            isStaged
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border text-foreground-muted hover:border-primary hover:text-primary'
                          )}
                        >
                          {isStaged ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              Add
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: My Courses sidebar (desktop) ─────────────────────────── */}
        <aside className="hidden lg:block">
          <MyCoursesPanel
            myCoursesGrouped={myCoursesGrouped}
            hasEnrollments={hasEnrollments}
            handleRemoveCourse={handleRemoveCourse}
            router={router}
          />
        </aside>
      </div>

      {/* ── Mobile: My Courses collapsible section ────────────────────────── */}
      <div className="lg:hidden mt-8">
        <button
          onClick={() => setShowMyCourses(v => !v)}
          className="w-full flex items-center justify-between rounded-xl border border-border bg-background-card px-5 py-3 text-left"
          aria-expanded={showMyCourses}
          aria-controls="my-courses-mobile"
        >
          <span className="font-semibold text-foreground">
            My Courses {hasEnrollments && `(${enrollments.length})`}
          </span>
          {showMyCourses ? (
            <ChevronUp className="h-4 w-4 text-foreground-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-foreground-muted" />
          )}
        </button>
        {showMyCourses && (
          <div id="my-courses-mobile" className="mt-4">
            <MyCoursesPanel
              myCoursesGrouped={myCoursesGrouped}
              hasEnrollments={hasEnrollments}
              handleRemoveCourse={handleRemoveCourse}
              router={router}
            />
          </div>
        )}
      </div>

      {/* ── Sticky bulk-enrol bar ─────────────────────────────────────────── */}
      {stagedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background-elevated/95 backdrop-blur-sm px-4 py-4 lg:px-8 shadow-lg">
          <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">
              <span className="text-primary font-bold">{stagedCount}</span>{' '}
              subject{stagedCount !== 1 ? 's' : ''} selected
            </p>
            <button
              onClick={handleBulkEnrol}
              disabled={enrolling}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-150 min-h-[44px]',
                enrolling
                  ? 'opacity-50 cursor-wait'
                  : 'hover:bg-primary-hover'
              )}
            >
              {enrolling ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Enrol in {stagedCount} subject{stagedCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Bottom padding equal to sticky bar height when visible */}
      {stagedCount > 0 && <div className="h-20" />}

      {/* ── Undo toast ────────────────────────────────────────────────────── */}
      {undoEntry && (
        <UndoToast
          subjectName={undoEntry.enrollment.subject.title}
          onUndo={handleUndoRemove}
          onDismiss={handleDismissUndo}
          secondsLeft={undoCountdown}
        />
      )}
    </div>
  );
}

// ── My Courses Panel (shared between desktop sidebar and mobile collapsible) ─

function MyCoursesPanel({
  myCoursesGrouped,
  hasEnrollments,
  handleRemoveCourse,
  router,
}: {
  myCoursesGrouped: Record<string, EnrollmentWithDetails[]>;
  hasEnrollments: boolean;
  handleRemoveCourse: (enrollment: EnrollmentWithDetails) => void;
  router: ReturnType<typeof useRouter>;
}) {
  if (!hasEnrollments) {
    return (
      <div className="rounded-2xl border border-border bg-background-card p-6 text-center">
        <BookOpen className="h-8 w-8 text-foreground-muted mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground-muted">No courses yet</p>
        <p className="text-xs text-foreground-muted mt-1">
          Browse subjects and add them to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        My Courses
      </h2>
      {Object.entries(myCoursesGrouped).map(([curriculumId, items]) => {
        const curriculum = items[0].curriculum;
        return (
          <div
            key={curriculumId}
            className="rounded-2xl border border-border bg-background-card overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-background-secondary/50">
              <GraduationCap className="h-4 w-4 text-primary" />
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {curriculum.title}
                </h3>
                {curriculum.exam_board && (
                  <span className="text-xs text-foreground-muted">
                    {curriculum.exam_board}
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-border">
              {items.map(enr => (
                <div
                  key={enr.id}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {enr.subject.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => router.push('/lessons')}
                      className="rounded-lg p-2 text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-ring"
                      aria-label={`View topics for ${enr.subject.title}`}
                      title="View Topics"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveCourse(enr)}
                      className="rounded-lg p-2 text-foreground-muted hover:text-error hover:bg-error/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-ring"
                      aria-label={`Remove ${enr.subject.title}`}
                      title="Remove course"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
