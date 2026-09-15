'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCountdown } from '@/hooks/useCountdown';
import { CountdownCard } from './CountdownCard';
import { Plus, Timer, BookMarked, BookOpen, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLessonContext, type CatalogCurriculum } from '@/context/LessonContext';
import {
  listUpcomingExamsBySubject,
  switchExamCountdownSession,
} from '@/actions/exam-data';
import { actionEnqueueExamReminders, actionClearSourceQueue } from '@/actions/notifications';
import { cn } from '@/lib/utils';

const AddCountdownModal = dynamic(() => import('./AddCountdownModal').then(m => ({ default: m.AddCountdownModal })), {
  loading: () => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--foreground)]/10 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 animate-shimmer" style={{ minHeight: 400 }} />
    </div>
  ),
});

interface CountdownManagerProps {
  userId: string;
}

// ── Pending timetable card for subjects with no exam date ──────────────────

function PendingTimetableCard({ subjectId }: { subjectId: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-card)]/50 p-5 flex flex-col items-center justify-center text-center gap-3 min-h-[160px]">
      <Calendar className="h-8 w-8 text-[var(--foreground-muted)]" />
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">Timetable not released yet</p>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">We'll update this automatically when exam dates are available.</p>
      </div>
    </div>
  );
}

// ── Session switcher dropdown ──────────────────────────────────────────────

function SessionSwitcher({ subjectId, onSwitch }: { subjectId: string; onSwitch: (examId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listUpcomingExamsBySubject(subjectId);
      setSessions(
        data.map((exam) => ({
          id: exam.id,
          subject: exam.title,
          series: exam.series ?? exam.season ?? '',
          date: exam.exam_date
            ? new Date(exam.exam_date).toISOString().split('T')[0]
            : '',
        }))
      );
    } catch (err) {
      console.error('[CountdownManager] Failed to load sessions:', err);
      setSessions([]);
    }
    setLoading(false);
  }, [subjectId]);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open && sessions.length === 0) fetchSessions(); }}
        className="text-xs text-[var(--primary)] hover:underline underline-offset-2 transition-colors"
      >
        Switch session
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-30 w-56 rounded-xl border border-[var(--border)] bg-[var(--background-card)] shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--foreground-muted)]">Upcoming sessions</p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-[var(--foreground-muted)] p-3 text-center">No upcoming sessions found.</p>
            ) : (
              sessions.map((exam: any) => (
                <button
                  key={exam.id}
                  onClick={() => { onSwitch(exam.id); setOpen(false); }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--background-secondary)] transition-colors"
                >
                  <span className="font-medium text-[var(--foreground)]">{exam.subject}</span>
                  <span className="block text-xs text-[var(--foreground-muted)]">{exam.series} — {exam.date}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function CountdownManager({ userId }: CountdownManagerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { groupedCountdowns, availableExams, createCountdown, deleteCountdown } = useCountdown(userId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { countdowns: autoCountdowns, countdownsLoading, enrolledCurriculums, catalogCurriculums } = useLessonContext();

  const [filterCurriculumId, setFilterCurriculumId] = useState(searchParams.get('curriculum') ?? 'all');
  const [filterSubjectId, setFilterSubjectId] = useState(searchParams.get('subject') ?? 'all');

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
      for (const subj of curr.subjects) {
        map.set(subj.id, curr.id);
      }
    }
    for (const curr of enrolledCurriculums) {
      for (const subj of curr.subjects) {
        map.set(subj.id, curr.id);
      }
    }
    return map;
  }, [catalog, enrolledCurriculums]);

  const subjectsForFilter = useMemo(() => {
    if (filterCurriculumId === 'all') return catalog.flatMap((c) => c.subjects);
    return catalog.find((c) => c.id === filterCurriculumId)?.subjects ?? [];
  }, [catalog, filterCurriculumId]);

  const writeFilters = (curriculumId: string, subjectId: string) => {
    setFilterCurriculumId(curriculumId);
    setFilterSubjectId(subjectId);
    const params = new URLSearchParams(searchParams.toString());
    if (curriculumId === 'all') params.delete('curriculum');
    else params.set('curriculum', curriculumId);
    if (subjectId === 'all') params.delete('subject');
    else params.set('subject', subjectId);
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

  const subjectNameMap: Record<string, string> = {};
  for (const curr of catalog) {
    for (const subj of curr.subjects) {
      subjectNameMap[subj.id] = subj.title;
    }
  }
  for (const curr of enrolledCurriculums) {
    for (const subj of curr.subjects) {
      subjectNameMap[subj.id] = subj.title;
    }
  }

  // Stats
  const autoWithExam = autoCountdowns.filter(cd => cd.exam !== null).length;

  const groupOrder = ['IGCSE', 'A LEVEL', 'OSSD', 'IELTS', 'Custom'];

  // Sort groups based on groupOrder, then any others
  const sortedGroups = Object.keys(groupedCountdowns).sort((a, b) => {
    const indexA = groupOrder.indexOf(a.toUpperCase());
    const indexB = groupOrder.indexOf(b.toUpperCase());

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const handleSwitchSession = useCallback(async (subjectId: string, examId: string) => {
    const exam = autoCountdowns.find(cd => cd.subjectId === subjectId)?.exam;
    if (!exam) return;

    const result = await switchExamCountdownSession({
      userId,
      subjectId,
      oldExamId: exam.id,
      newExamId: examId,
    });

    if (!result.success || !result.countdown || !result.exam) return;

    if (result.removedCountdownId) {
      void actionClearSourceQueue('exam_countdown', result.removedCountdownId);
    }

    void actionEnqueueExamReminders(
      result.countdown.id,
      userId,
      result.exam.title || 'Exam',
      new Date(result.exam.exam_date || Date.now())
    );

    window.location.reload();
  }, [userId, autoCountdowns]);

  // Filter groups
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>('all');

  const boards = [
    { id: 'all', label: 'All Countdowns' },
    { id: 'CAIE', label: 'Cambridge (CAIE)' },
    { id: 'Edexcel', label: 'Pearson Edexcel' },
    { id: 'Custom', label: 'Custom' },
  ];

  const filteredOfficialExams = availableExams.filter((exam) => {
    const curriculumId = (exam as any).curriculum_id || (exam as any).curriculum?.id;
    if (!matchesSubjectFilter(exam.subject_id, curriculumId)) return false;
    if (selectedBoardFilter === 'all') return true;
    if (selectedBoardFilter === 'Custom') return false;
    return (
      (exam.exam_board && exam.exam_board.toUpperCase().includes(selectedBoardFilter.toUpperCase())) ||
      (exam.title && exam.title.toUpperCase().includes(selectedBoardFilter.toUpperCase()))
    );
  });

  const groupedOfficialExams = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredOfficialExams.forEach(exam => {
      const series = (exam.exam_series || (exam as any).season || (exam as any).series || 'Other') as string;
      if (!groups[series]) groups[series] = [];
      groups[series].push(exam);
    });
    return groups;
  }, [filteredOfficialExams]);

  const filteredAutoCountdowns = autoCountdowns.filter((cd) => matchesSubjectFilter(cd.subjectId));

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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <span className="hidden sm:block h-4 w-px bg-[var(--border)]" aria-hidden />
          <h1 className="truncate text-lg font-bold text-[var(--foreground)] tracking-tight">
            Exam Countdowns
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/curriculum"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Subjects
          </Link>
          <Link
            href="/past-papers"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
          >
            <BookMarked className="h-3.5 w-3.5" />
            Papers
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            aria-label="Add a new custom countdown"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Curriculum / subject + board filters */}
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
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
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
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
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
              Subject
            </span>
            <select
              value={filterSubjectId}
              onChange={(e) => writeFilters(filterCurriculumId, e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="all">All subjects</option>
              {subjectsForFilter.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBoardFilter(b.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                selectedBoardFilter === b.id
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                  : 'bg-[var(--background-card)] text-[var(--foreground-secondary)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/30'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 1: Enrolled Subjects Countdowns ─────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-4 w-4 text-[var(--primary)]" />
            <h2 className="text-lg font-bold text-[var(--foreground)]">Enrolled Subjects</h2>
            <span className="text-xs font-medium text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-full px-2.5 py-0.5 border border-[var(--border)]">
              {autoWithExam} of {autoCountdowns.length} scheduled
            </span>
          </div>
        </div>

        {countdownsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 min-h-[160px] animate-pulse" />
            ))}
          </div>
        ) : filteredAutoCountdowns.length === 0 && autoCountdowns.length > 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-card)]/60 p-8 text-center">
            <p className="text-sm text-[var(--foreground)] font-semibold">No enrolled subjects match this filter</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">Try another curriculum or subject, or clear the filters.</p>
          </div>
        ) : autoCountdowns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-card)]/60 p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[var(--foreground-muted)] mb-3" />
            <p className="text-sm text-[var(--foreground)] font-semibold">No enrolled subjects yet</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1 max-w-md mx-auto">
              Enroll in subjects from the Curriculum Hub to automatically track upcoming exam schedules and deadlines.
            </p>
            <Link
              href="/curriculum"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors shadow-sm"
            >
              Explore Curriculum Hub
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAutoCountdowns
              .map((cd) => {
              if (cd.exam) {
                const examDate = (cd.exam as any).date || (cd.exam as any).exam_date || new Date().toISOString();
                return (
                  <CountdownCard
                    key={cd.subjectId}
                    countdown={{
                      id: cd.exam.id,
                      user_id: userId,
                      exam_id: cd.exam.id,
                      subject_id: cd.subjectId,
                      custom_title: subjectNameMap[cd.subjectId] ?? (cd.exam as any).subject ?? 'Exam',
                      target_date: examDate,
                      qualification_group: (cd.exam as any).series ?? 'Official',
                      exam_board: (cd.exam as any).exam_board ?? undefined,
                      paper_name: (cd.exam as any).paper_number ? `Paper ${ (cd.exam as any).paper_number}` : undefined,
                      target_grade: (cd.exam as any).target_grade,
                    }}
                    canDelete={false}
                  />
                );
              }
              return <PendingTimetableCard key={cd.subjectId} subjectId={cd.subjectId} />;
            })}
          </div>
        )}
      </section>

      {/* ── Section 2: Custom Countdowns ──────────────────────────────────── */}
      {sortedGroups.length === 0 && autoCountdowns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-secondary)]/50 py-16 text-center">
          <Timer className="h-12 w-12 text-[var(--foreground-muted)] mb-3" />
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">No Active Countdowns Yet</h3>
          <p className="text-xs text-[var(--foreground-secondary)] max-w-sm mb-5">
            Keep track of your exam deadlines by enrolling in curriculum subjects or creating a custom target.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[var(--primary-hover)] shadow-sm"
            aria-label="Create your first exam countdown"
          >
            <Plus className="h-4 w-4" />
            Create Custom Countdown
          </button>
        </div>
      ) : sortedGroups.length > 0 ? (
        <section className="space-y-6">
          <div className="flex items-center gap-2.5">
            <Timer className="h-4 w-4 text-[var(--primary)]" />
            <h2 className="text-lg font-bold text-[var(--foreground)]">My Pinned & Custom Countdowns</h2>
          </div>

          <div className="space-y-8">
            {sortedGroups
              .filter((group) => {
                if (selectedBoardFilter === 'all') return true;
                if (selectedBoardFilter === 'Custom') return group.toLowerCase() === 'custom';
                return group.toUpperCase().includes(selectedBoardFilter.toUpperCase());
              })
              .map((group) => {
                const countdowns = (groupedCountdowns[group] ?? []).filter((c) =>
                  matchesSubjectFilter((c as any).subject_id, (c as any).curriculum_id)
                );
                if (countdowns.length === 0) return null;

                return (
                  <div key={group} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-bold text-[var(--foreground-secondary)] tracking-wider uppercase">
                        {group}
                      </h3>
                      <div className="h-px flex-1 bg-[var(--border)]"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {countdowns
                        .map((countdown) => (
                        <CountdownCard
                          key={countdown.id}
                          countdown={countdown}
                          onDelete={deleteCountdown}
                          canDelete={true}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      ) : null}

      {/* ── Section 3: Official Exam Timetable Catalog ──────────────────────── */}
      {availableExams.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-amber-500" />
              <h2 className="text-lg font-bold text-[var(--foreground)]">Official Exam Timetable</h2>
              <span className="text-xs font-medium text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-full px-2.5 py-0.5 border border-[var(--border)]">
                {filteredOfficialExams.length} sessions
              </span>
            </div>
          </div>

          {Object.keys(groupedOfficialExams).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-card)]/60 p-8 text-center">
              <p className="text-sm text-[var(--foreground)] font-semibold">No official sessions match this filter</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">Choose a different curriculum or subject to see timetable dates.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedOfficialExams).map(([series, exams]) => (
                <div key={series} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-[var(--foreground)] tracking-wide">
                        {series}
                      </h3>
                      <div className="h-px w-12 bg-[var(--border)]"></div>
                    </div>
                    <button
                      onClick={() => {
                        exams.forEach(ex => {
                          const isAlreadyTracked =
                            groupedCountdowns &&
                            Object.values(groupedCountdowns).some((arr) =>
                              arr.some((c) => (c as any).exam_id === ex.id)
                            );
                          if (!isAlreadyTracked) {
                            handleQuickPinOfficialExam(ex);
                          }
                        });
                      }}
                      className="text-xs font-semibold text-[var(--primary)] hover:underline"
                    >
                      Track All {series} Papers
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exams.map((exam) => {
                      const isAlreadyTracked =
                        groupedCountdowns &&
                        Object.values(groupedCountdowns).some((arr) =>
                          arr.some((c) => (c as any).exam_id === exam.id)
                        );

                      const examDateStr = (exam as any).exam_date || (exam as any).date;
                      const formattedDate = examDateStr
                        ? new Intl.DateTimeFormat('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(examDateStr))
                        : 'Date TBD';

                      return (
                        <div
                          key={exam.id}
                          className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 hover:border-[var(--primary)]/40 transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                                {exam.exam_board || 'Official'}
                              </span>
                              {(exam as any).syllabus_code && (
                                <span className="text-xs font-mono text-[var(--foreground-muted)]">
                                  {(exam as any).syllabus_code}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-[var(--foreground)] line-clamp-2">
                              {exam.title || (exam as any).subject || 'Exam Paper'}
                            </h4>
                            <p className="text-xs text-[var(--foreground-secondary)] mt-1 flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-[var(--foreground-muted)]" />
                              {formattedDate}
                            </p>
                          </div>

                          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-end">
                            {isAlreadyTracked ? (
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                ✓ Tracking
                              </span>
                            ) : (
                              <button
                                onClick={() => handleQuickPinOfficialExam(exam)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline underline-offset-2"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Track Countdown
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
    </div>
  );
}
