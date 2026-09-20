'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCountdown } from '@/hooks/useCountdown';
import { CountdownCard } from './CountdownCard';
import { groupEdexcelIalSubjects } from '@/lib/edexcel-ial';
import { Plus, Timer, BookMarked, BookOpen, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLessonContext, type CatalogCurriculum } from '@/context/LessonContext';
import { cn } from '@/lib/utils';
import { boardFromCurriculumCode, examMatchesMyanmarPaper } from '@/lib/exam-papers/myanmar-papers';
import { formatExamDateTime } from '@/lib/exam-datetime';
import { parseSessionLabel } from '@/lib/grading';
import type { CountdownWithTime } from '@/hooks/useCountdown';

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

function PendingTimetableCard({ subjectId: _subjectId }: { subjectId: string }) {
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

// ── Main Component ─────────────────────────────────────────────────────────

export function CountdownManager({ userId }: CountdownManagerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { groupedCountdowns, countdowns, availableExams, createCountdown, deleteCountdown } = useCountdown(userId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { countdownsLoading, enrolledCurriculums, catalogCurriculums, enrolledSubjectIds: hubEnrolledIds } = useLessonContext();

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

  const groupedSubjectsForFilter = useMemo(() => groupEdexcelIalSubjects(subjectsForFilter), [subjectsForFilter]);

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
  const groupOrder = ['CAIE', 'Edexcel', 'IGCSE', 'A LEVEL', 'Official', 'Custom'];

  const enrolledSubjectIds = useMemo(
    () => new Set(hubEnrolledIds),
    [hubEnrolledIds]
  );

  const isUserManagedCountdown = useCallback(
    (c: CountdownWithTime) => {
      const isCustom = Boolean((c as any).is_custom);
      const subjectId = (c as any).subject_id as string | null | undefined;
      if (isCustom) return true;
      if (subjectId && enrolledSubjectIds.has(subjectId)) return false;
      return true;
    },
    [enrolledSubjectIds]
  );

  // Sort groups based on groupOrder, then any others
  const sortedGroups = Object.keys(groupedCountdowns).sort((a, b) => {
    const indexA = groupOrder.indexOf(a.toUpperCase());
    const indexB = groupOrder.indexOf(b.toUpperCase());

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

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

  const enrolledPaperCountdowns = countdowns.filter((c) => {
    if (c.is_custom) return false;
    if (c.timeLeft?.isPast) return false;
    return matchesSubjectFilter(c.subject_id, (c as any).curriculum_id);
  });

  const enrolledPapersBySubject = (() => {
    const groups = new Map<string, CountdownWithTime[]>();
    for (const c of enrolledPaperCountdowns) {
      const sid = c.subject_id || 'unknown';
      const list = groups.get(sid) ?? [];
      list.push(c);
      groups.set(sid, list);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => {
        const ta = new Date((a as any).exam_date || 0).getTime();
        const tb = new Date((b as any).exam_date || 0).getTime();
        return ta - tb;
      });
    }
    return [...groups.entries()].sort((a, b) =>
      (subjectNameMap[a[0]] ?? a[0]).localeCompare(subjectNameMap[b[0]] ?? b[0])
    );
  })();

  const pendingEnrolledSubjects = enrolledCurriculums
    .flatMap((curr) => curr.subjects)
    .filter((s) => enrolledSubjectIds.has(s.id) && matchesSubjectFilter(s.id))
    .filter((s) => !countdowns.some((c) => !c.is_custom && c.subject_id === s.id));

  const allPastExams = useMemo(() => {
    const past: any[] = [];
    Object.keys(groupedCountdowns).forEach((group) => {
      groupedCountdowns[group].forEach((c) => {
        if (c.timeLeft.isPast && matchesSubjectFilter((c as any).subject_id, (c as any).curriculum_id)) {
          past.push(c);
        }
      });
    });
    return past;
  }, [groupedCountdowns, filterSubjectId, filterCurriculumId]);

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
      <p className="text-xs text-[var(--foreground-muted)] -mt-2">
        Official sitting times are shown in Myanmar time (MMT). Morning papers start at 09:00.
      </p>
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

      {/* ── Section 1: Pinned & Custom Countdowns (top priority) ───── */}
      {sortedGroups.length === 0 && enrolledPaperCountdowns.length === 0 && hubEnrolledIds.length === 0 ? (
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
                  !c.timeLeft.isPast &&
                  matchesSubjectFilter((c as any).subject_id, (c as any).curriculum_id) &&
                  isUserManagedCountdown(c)
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
                      {countdowns.map((countdown) => (
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

      {/* ── Section 2: Enrolled Subjects Countdowns ─────────────────── */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-4 w-4 text-[var(--primary)]" />
            <h2 className="text-lg font-bold text-[var(--foreground)]">Enrolled papers</h2>
            <span className="text-xs font-medium text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-full px-2.5 py-0.5 border border-[var(--border)]">
              {enrolledPaperCountdowns.length} paper{enrolledPaperCountdowns.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {countdownsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 min-h-[160px] animate-pulse" />
            ))}
          </div>
        ) : enrolledPaperCountdowns.length === 0 && pendingEnrolledSubjects.length === 0 && hubEnrolledIds.length > 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-card)]/60 p-8 text-center">
            <p className="text-sm text-[var(--foreground)] font-semibold">No enrolled papers match this filter</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">Try another curriculum or subject, or clear the filters.</p>
          </div>
        ) : hubEnrolledIds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-card)]/60 p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[var(--foreground-muted)] mb-3" />
            <p className="text-sm text-[var(--foreground)] font-semibold">No enrolled subjects yet</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1 max-w-md mx-auto">
              Add a subject in Curriculum and choose its exam series. Every paper (or IAL unit) is then tracked automatically.
            </p>
            <Link
              href="/curriculum"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors shadow-sm"
            >
              Explore Curriculum Hub
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {enrolledPapersBySubject.map(([subjectId, papers]) => (
              <div key={subjectId} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold text-[var(--foreground-secondary)] tracking-wider uppercase">
                    {subjectNameMap[subjectId] ?? 'Subject'}
                  </h3>
                  <span className="font-mono text-[10px] text-[var(--foreground-muted)]">
                    {papers.length} paper{papers.length === 1 ? '' : 's'}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {papers.map((countdown) => (
                    <CountdownCard
                      key={countdown.id}
                      countdown={countdown}
                      canDelete={false}
                    />
                  ))}
                </div>
              </div>
            ))}
            {pendingEnrolledSubjects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pendingEnrolledSubjects.map((subject) => (
                  <PendingTimetableCard key={subject.id} subjectId={subject.id} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Section 3: Past Exams ───────────────────────────────────────── */}
      {allPastExams.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-[var(--border)] opacity-70">
          <div className="flex items-center gap-2.5">
            <Timer className="h-4 w-4 text-[var(--foreground-muted)]" />
            <h2 className="text-lg font-bold text-[var(--foreground-muted)]">Past Exams (Concluded)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allPastExams.map((countdown) => (
              <CountdownCard
                key={countdown.id}
                countdown={countdown}
                onDelete={deleteCountdown}
                canDelete={true}
              />
            ))}
          </div>
        </section>
      )}

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
              {Object.entries(groupedOfficialExams)
                .sort(([a], [b]) => {
                  const pa = parseSessionLabel(a);
                  const pb = parseSessionLabel(b);
                  if (!pa && !pb) return a.localeCompare(b);
                  if (!pa) return 1;
                  if (!pb) return -1;
                  if (pa.year !== pb.year) return pa.year - pb.year;
                  const rank = (season: string) =>
                    season === 'Jan' ? 1 : season === 'Feb/March' ? 2 : season === 'May/June' ? 3 : 4;
                  return rank(pa.season) - rank(pb.season);
                })
                .map(([series, exams]) => (
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
                      const formattedDate = formatExamDateTime(examDateStr);

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
