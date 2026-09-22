'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCountdown } from '@/hooks/useCountdown';
import { CountdownCard } from './CountdownCard';
import { EditCountdownModal } from './EditCountdownModal';
import { groupEdexcelIalSubjects } from '@/lib/edexcel-ial';
import {
  Plus,
  Timer,
  BookMarked,
  BookOpen,
  Calendar,
  ArrowLeft,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useLessonContext, type CatalogCurriculum } from '@/context/LessonContext';
import { cn } from '@/lib/utils';
import { boardFromCurriculumCode, examMatchesMyanmarPaper } from '@/lib/exam-papers/myanmar-papers';
import { formatExamDateTime } from '@/lib/exam-datetime';
import { parseSessionLabel } from '@/lib/grading';
import type { CountdownWithTime } from '@/hooks/useCountdown';

const AddCountdownModal = dynamic(
  () => import('./AddCountdownModal').then((m) => ({ default: m.AddCountdownModal })),
  {
    loading: () => (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-sm"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          className="w-full max-w-md animate-shimmer rounded-2xl border border-border bg-background-card p-6"
          style={{ minHeight: 400 }}
        />
      </div>
    ),
  }
);

interface CountdownManagerProps {
  userId: string;
}

function countdownWasEdited(countdown: CountdownWithTime, exams: { id: string; title?: string | null; exam_date?: string | Date | null; date?: string | null }[]) {
  if (!countdown.exam_id) return false;
  const exam = exams.find((item) => item.id === countdown.exam_id);
  if (!exam) return false;
  const officialTime = new Date(exam.exam_date || exam.date || 0).getTime();
  const personalTime = new Date(countdown.exam_date || countdown.target_date || 0).getTime();
  const officialTitle = (exam.title || '').trim();
  const personalTitle = (countdown.custom_title || countdown.title || '').trim();
  if (!officialTime || !personalTime) return officialTitle !== personalTitle;
  return officialTime !== personalTime || (officialTitle.length > 0 && officialTitle !== personalTitle);
}

type PageTab = 'mine' | 'browse';


export function CountdownManager({ userId }: CountdownManagerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const {
    countdowns,
    availableExams,
    createCountdown,
    updateCountdown,
    deleteCountdown,
  } = useCountdown(userId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CountdownWithTime | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pageTab, setPageTab] = useState<PageTab>(
    (searchParams.get('tab') as PageTab) === 'browse' ? 'browse' : 'mine'
  );

  const { enrolledCurriculums, catalogCurriculums, enrolledSubjectIds: hubEnrolledIds } =
    useLessonContext();

  const [filterCurriculumId, setFilterCurriculumId] = useState(
    searchParams.get('curriculum') ?? 'all'
  );
  const [filterSubjectId, setFilterSubjectId] = useState(searchParams.get('subject') ?? 'all');
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>('all');
  const [pastOpen, setPastOpen] = useState(false);

  const catalog: CatalogCurriculum[] = useMemo(() => {
    if (catalogCurriculums.length > 0) return catalogCurriculums;

    const byId = new Map<string, CatalogCurriculum>();
    for (const exam of availableExams as any[]) {
      const curriculumId = exam.curriculum_id || exam.curriculum?.id;
      if (!curriculumId) continue;
      const existing: CatalogCurriculum = byId.get(curriculumId) ?? {
        id: curriculumId,
        title: exam.curriculum_name || exam.curriculum?.name || exam.exam_board || 'Curriculum',
        exam_board: exam.exam_board ?? null,
        subjects: [],
      };
      const subjectId = exam.subject_id || exam.subject?.id;
      if (subjectId && !existing.subjects.some((s) => s.id === subjectId)) {
        existing.subjects.push({
          id: subjectId,
          curriculum_id: curriculumId,
          title: exam.subject_name || exam.subject?.name || exam.title || 'Subject',
        });
      }
      byId.set(curriculumId, existing);
    }
    return [...byId.values()];
  }, [catalogCurriculums, availableExams]);

  const subjectToCurriculum = useMemo(() => {
    const map = new Map<string, string>();
    for (const curr of catalog) {
      for (const subj of curr.subjects) map.set(subj.id, curr.id);
    }
    for (const curr of enrolledCurriculums) {
      for (const subj of curr.subjects) map.set(subj.id, curr.id);
    }
    return map;
  }, [catalog, enrolledCurriculums]);

  const subjectsForFilter = useMemo(() => {
    if (filterCurriculumId === 'all') return catalog.flatMap((c) => c.subjects);
    return catalog.find((c) => c.id === filterCurriculumId)?.subjects ?? [];
  }, [catalog, filterCurriculumId]);

  const groupedSubjectsForFilter = useMemo(
    () => groupEdexcelIalSubjects(subjectsForFilter),
    [subjectsForFilter]
  );

  const writeFilters = (curriculumId: string, subjectId: string, tab: PageTab = pageTab) => {
    setFilterCurriculumId(curriculumId);
    setFilterSubjectId(subjectId);
    setPageTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (curriculumId === 'all') params.delete('curriculum');
    else params.set('curriculum', curriculumId);
    if (subjectId === 'all') params.delete('subject');
    else params.set('subject', subjectId);
    if (tab === 'mine') params.delete('tab');
    else params.set('tab', tab);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const matchesSubjectFilter = (subjectId?: string | null, examCurriculumId?: string | null) => {
    if (filterSubjectId !== 'all') return subjectId === filterSubjectId;
    if (filterCurriculumId === 'all') return true;
    if (examCurriculumId) return examCurriculumId === filterCurriculumId;
    if (!subjectId) return false;
    return subjectToCurriculum.get(subjectId) === filterCurriculumId;
  };

  const enrolledSubjectIds = useMemo(() => new Set(hubEnrolledIds), [hubEnrolledIds]);

  const boards = [
    { id: 'all', label: 'All' },
    { id: 'CAIE', label: 'Cambridge' },
    { id: 'Edexcel', label: 'Edexcel' },
    { id: 'Custom', label: 'Custom' },
  ];

  const filteredOfficialExams = availableExams.filter((exam) => {
    const curriculumId = (exam as any).curriculum_id || (exam as any).curriculum?.id;
    if (!matchesSubjectFilter(exam.subject_id, curriculumId)) return false;

    const board = boardFromCurriculumCode(
      (exam as any).curriculum_code ?? (exam as any).curriculum?.code
    );
    const syllabusCode = (exam as any).syllabus_code ?? '';
    const paperNumber = (exam as any).paper_number as string | null | undefined;
    if (board && syllabusCode && paperNumber) {
      if (
        !examMatchesMyanmarPaper(paperNumber, syllabusCode, board, {
          series: (exam as any).season || (exam as any).series || (exam as any).exam_series,
        })
      )
        return false;
    }

    if (selectedBoardFilter === 'all') return true;
    if (selectedBoardFilter === 'Custom') return false;
    return (
      (exam.exam_board &&
        exam.exam_board.toUpperCase().includes(selectedBoardFilter.toUpperCase())) ||
      (exam.title && exam.title.toUpperCase().includes(selectedBoardFilter.toUpperCase()))
    );
  });

  const groupedOfficialExams = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredOfficialExams.forEach((exam) => {
      const series = (exam.exam_series ||
        (exam as any).season ||
        (exam as any).series ||
        'Other') as string;
      if (!groups[series]) groups[series] = [];
      groups[series].push(exam);
    });
    return groups;
  }, [filteredOfficialExams]);

  const matchesBoard = (countdown: CountdownWithTime) => {
    if (selectedBoardFilter === 'all') return true;
    if (selectedBoardFilter === 'Custom') return Boolean(countdown.is_custom);
    return (countdown.exam_board || '')
      .toUpperCase()
      .includes(selectedBoardFilter.toUpperCase());
  };

  const activeCountdowns = useMemo(() => {
    const seen = new Set<string>();
    return countdowns.filter((countdown) => {
      if (countdown.timeLeft.isPast) return false;
      if (!matchesSubjectFilter(countdown.subject_id, (countdown as any).curriculum_id)) return false;
      if (!matchesBoard(countdown)) return false;
      const key = countdown.exam_id || countdown.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [countdowns, filterSubjectId, filterCurriculumId, selectedBoardFilter, subjectToCurriculum]);

  const sortedActive = useMemo(
    () =>
      [...activeCountdowns].sort(
        (a, b) =>
          new Date(a.exam_date || a.target_date || 0).getTime() -
          new Date(b.exam_date || b.target_date || 0).getTime()
      ),
    [activeCountdowns]
  );

  const pendingEnrolledSubjects = enrolledCurriculums
    .flatMap((curr) => curr.subjects)
    .filter((s) => enrolledSubjectIds.has(s.id) && matchesSubjectFilter(s.id))
    .filter(
      (s) =>
        !availableExams.some(
          (exam) => exam.subject_id === s.id && Boolean(exam.exam_date || (exam as any).date)
        )
    );

  const allPastExams = useMemo(() => {
    return countdowns.filter(
      (c) =>
        c.timeLeft.isPast &&
        matchesSubjectFilter((c as any).subject_id, (c as any).curriculum_id)
    );
  }, [countdowns, filterSubjectId, filterCurriculumId]);

  const handleQuickPinOfficialExam = async (exam: any) => {
    const examDate = exam.exam_date || exam.date;
    await createCountdown({
      exam_id: exam.id,
      custom_title: exam.title || exam.subject_name || exam.subject?.name || 'Official Exam',
      target_date: examDate ? new Date(examDate).toISOString() : new Date().toISOString(),
      priority_indicator: 'high',
      qualification_group: exam.exam_board || exam.qualification_type || exam.qualification || 'Official',
      subject_id: exam.subject_id || exam.subject?.id,
      exam_board: exam.exam_board,
    });
  };

  const isAlreadyTracked = (examId: string) =>
    countdowns.some((c) => (c as any).exam_id === examId);

  const mineEmpty = activeCountdowns.length === 0 && pendingEnrolledSubjects.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
            Exam Countdowns
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/curriculum"
            className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground sm:inline-flex"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Subjects
          </Link>
          <Link
            href="/past-papers"
            className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground sm:inline-flex"
          >
            <BookMarked className="h-3.5 w-3.5" />
            Papers
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Add a new custom countdown"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      <p className="-mt-2 text-xs text-foreground-muted">
        Edits and removals stay on your account. Times are shown in Myanmar time (MMT).
      </p>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-background-secondary/60 p-1">
        {(
          [
            { id: 'mine' as const, label: 'My exams', icon: Timer },
            { id: 'browse' as const, label: 'Browse timetable', icon: Search },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => writeFilters(filterCurriculumId, filterSubjectId, tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:text-sm',
                pageTab === tab.id
                  ? 'bg-background-card text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Curriculum
            </span>
            <select
              value={filterCurriculumId}
              onChange={(e) => {
                const nextCurriculum = e.target.value;
                const stillValid =
                  filterSubjectId !== 'all' &&
                  catalog
                    .find((c) => c.id === nextCurriculum)
                    ?.subjects.some((s) => s.id === filterSubjectId);
                writeFilters(nextCurriculum, stillValid ? filterSubjectId : 'all');
              }}
              className="w-full rounded-xl border border-border bg-background-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All curriculums</option>
              {catalog.map((curr) => (
                <option key={curr.id} value={curr.id}>
                  {curr.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Subject
            </span>
            <select
              value={filterSubjectId}
              onChange={(e) => writeFilters(filterCurriculumId, e.target.value)}
              className="w-full rounded-xl border border-border bg-background-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All subjects</option>
              {groupedSubjectsForFilter.map((group) => {
                if (!group.isVirtual) {
                  return (
                    <option key={group.id} value={group.id}>
                      {group.title}
                    </option>
                  );
                }
                return (
                  <optgroup key={group.id} label={`Edexcel IAL ${group.title}`}>
                    {group.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.title}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBoardFilter(b.id)}
              className={cn(
                'whitespace-nowrap rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all',
                selectedBoardFilter === b.id
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-border bg-background-card text-foreground-secondary hover:border-primary/30 hover:text-foreground'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── My exams tab ─────────────────────────────────────────────── */}
      {pageTab === 'mine' && (
        <div className="space-y-5">
          {mineEmpty ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background-secondary/50 py-16 text-center">
              <Timer className="mb-3 h-12 w-12 text-foreground-muted" />
              <h3 className="mb-1 text-lg font-bold text-foreground">No exam countdowns yet</h3>
              <p className="mb-5 max-w-sm text-xs text-foreground-secondary">
                Add papers from the timetable, or enroll a subject in Curriculum to track its sittings.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-hover"
                >
                  <Plus className="h-4 w-4" />
                  Add countdown
                </button>
                <button
                  type="button"
                  onClick={() => writeFilters(filterCurriculumId, filterSubjectId, 'browse')}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background-card px-5 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-primary/40"
                >
                  <Search className="h-4 w-4" />
                  Browse timetable
                </button>
              </div>
            </div>
          ) : activeCountdowns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background-card/60 p-8 text-center">
              <p className="text-sm font-semibold text-foreground">No countdowns match this filter</p>
              <p className="mt-1 text-xs text-foreground-muted">
                Try another curriculum or subject, or clear the filters.
              </p>
            </div>
          ) : (
            <section className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Timer className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Your exams</h2>
                <span className="rounded-full border border-border bg-background-secondary px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
                  {activeCountdowns.length}
                </span>
              </div>

              <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(17.5rem,1fr))]">
                {sortedActive.map((countdown) => (
                  <CountdownCard
                    key={countdown.id}
                    countdown={countdown}
                    edited={countdownWasEdited(countdown, availableExams)}
                    onEdit={setEditing}
                    onDelete={(id) => {
                      setPendingDeleteId(null);
                      void deleteCountdown(id);
                    }}
                    confirmDelete={pendingDeleteId === countdown.id}
                    onAskDelete={setPendingDeleteId}
                    onCancelDelete={() => setPendingDeleteId(null)}
                  />
                ))}
              </div>

              {pendingEnrolledSubjects.length > 0 && (
                <p className="text-xs text-foreground-muted">
                  Timetable not released yet for{' '}
                  {pendingEnrolledSubjects.map((subject) => subject.title).join(', ')}.
                </p>
              )}
            </section>
          )}

          {allPastExams.length > 0 && (
            <section className="space-y-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setPastOpen(!pastOpen)}
                className="flex w-full items-center gap-2.5 text-left"
              >
                <Timer className="h-4 w-4 text-foreground-muted" />
                <h2 className="text-sm font-bold text-foreground-muted">Past exams</h2>
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground-muted">
                  {allPastExams.length}
                </span>
              </button>
              {pastOpen && (
                <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(17.5rem,1fr))]">
                  {allPastExams.map((countdown) => (
                    <CountdownCard
                      key={countdown.id}
                      countdown={countdown}
                      edited={countdownWasEdited(countdown, availableExams)}
                      onEdit={setEditing}
                      onDelete={(id) => {
                        setPendingDeleteId(null);
                        void deleteCountdown(id);
                      }}
                      confirmDelete={pendingDeleteId === countdown.id}
                      onAskDelete={setPendingDeleteId}
                      onCancelDelete={() => setPendingDeleteId(null)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* ── Browse timetable tab ─────────────────────────────────────── */}
      {pageTab === 'browse' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-bold text-foreground">Official exam timetable</h2>
            <span className="rounded-full border border-border bg-background-secondary px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
              {filteredOfficialExams.length} sessions
            </span>
          </div>

          {availableExams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background-card/60 p-8 text-center">
              <p className="text-sm font-semibold text-foreground">No timetable data loaded</p>
              <p className="mt-1 text-xs text-foreground-muted">
                Official dates appear here once the catalog is seeded.
              </p>
            </div>
          ) : Object.keys(groupedOfficialExams).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background-card/60 p-8 text-center">
              <p className="text-sm font-semibold text-foreground">
                No official sessions match this filter
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                Choose a different curriculum or subject to see timetable dates.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedOfficialExams)
                .sort(([a], [b]) => {
                  const pa = parseSessionLabel(a);
                  const pb = parseSessionLabel(b);
                  if (!pa && !pb) return a.localeCompare(b);
                  if (!pa) return 1;
                  if (!pb) return -1;
                  if (pa.year !== pb.year) return pa.year - pb.year;
                  const rank = (season: string) =>
                    season === 'Jan'
                      ? 1
                      : season === 'Feb/March'
                        ? 2
                        : season === 'May/June'
                          ? 3
                          : 4;
                  return rank(pa.season) - rank(pb.season);
                })
                .map(([series, exams]) => (
                  <div key={series} className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold tracking-wide text-foreground">
                          {series}
                        </h3>
                        <div className="h-px w-12 bg-border" />
                      </div>
                      <button
                        onClick={() => {
                          exams.forEach((ex) => {
                            if (!isAlreadyTracked(ex.id)) handleQuickPinOfficialExam(ex);
                          });
                        }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Track all {series} papers
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                      {exams.map((exam) => {
                        const tracked = isAlreadyTracked(exam.id);
                        const examDateStr = (exam as any).exam_date || (exam as any).date;
                        const formattedDate = formatExamDateTime(examDateStr);

                        return (
                          <div
                            key={exam.id}
                            className="flex flex-col justify-between rounded-xl border border-border bg-background-card p-4 transition-all hover:border-primary/40"
                          >
                            <div>
                              <div className="mb-1.5 flex items-center justify-between gap-2">
                                <span className="rounded px-2 py-0.5 text-[11px] font-semibold border border-primary/20 bg-primary/10 text-primary">
                                  {exam.exam_board || 'Official'}
                                </span>
                                {(exam as any).syllabus_code && (
                                  <span className="font-mono text-xs text-foreground-muted">
                                    {(exam as any).syllabus_code}
                                  </span>
                                )}
                              </div>
                              <h4 className="line-clamp-2 text-sm font-bold text-foreground">
                                {exam.title || (exam as any).subject || 'Exam Paper'}
                              </h4>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground-secondary">
                                <Calendar className="h-3 w-3 text-foreground-muted" />
                                {formattedDate}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-end border-t border-border pt-3">
                              {tracked ? (
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  ✓ Tracking
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleQuickPinOfficialExam(exam)}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Track countdown
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      )}

      {isModalOpen && (
        <AddCountdownModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          availableExams={availableExams}
          catalogCurriculums={catalog}
          initialCurriculumId={filterCurriculumId}
          initialSubjectId={filterSubjectId}
          onCreate={createCountdown}
        />
      )}

      {editing && (
        <EditCountdownModal
          countdown={editing}
          onClose={() => setEditing(null)}
          onSave={async (data) => {
            await updateCountdown(editing.id, data);
          }}
          onRestoreOfficial={
            editing.exam_id
              ? async () => {
                  await updateCountdown(editing.id, { restoreOfficial: true });
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
