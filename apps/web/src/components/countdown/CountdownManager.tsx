'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCountdown } from '@/hooks/useCountdown';
import { CountdownCard } from './CountdownCard';
import { EditCountdownModal } from './EditCountdownModal';
import {
  Plus,
  Timer,
  Calendar,
  ArrowLeft,
  Search,
  X,
  ChevronDown,
  AlertCircle,
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

function countdownWasEdited(
  countdown: CountdownWithTime,
  exams: { id: string; title?: string | null; exam_date?: string | Date | null; date?: string | null }[]
) {
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

  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>('all');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>(
    searchParams.get('series') ?? 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pastOpen, setPastOpen] = useState(false);

  // Map exam id -> series string
  const examSeriesMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ex of availableExams as any[]) {
      const s = ex.exam_series || ex.season || ex.series;
      if (s && ex.id) map.set(ex.id, s);
    }
    return map;
  }, [availableExams]);

  // Extract all distinct exam series available
  const availableSeries = useMemo(() => {
    const seriesSet = new Set<string>();
    for (const ex of availableExams as any[]) {
      const s = ex.exam_series || ex.season || ex.series;
      if (s) seriesSet.add(s);
    }
    for (const cd of countdowns) {
      if (cd.exam_id && examSeriesMap.has(cd.exam_id)) {
        seriesSet.add(examSeriesMap.get(cd.exam_id)!);
      }
    }
    return Array.from(seriesSet).sort((a, b) => {
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
    });
  }, [availableExams, countdowns, examSeriesMap]);

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

  const enrolledSubjectIds = useMemo(() => new Set(hubEnrolledIds), [hubEnrolledIds]);

  const writeFilters = (tab: PageTab = pageTab, series: string = selectedSeriesFilter) => {
    setPageTab(tab);
    setSelectedSeriesFilter(series);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'mine') params.delete('tab');
    else params.set('tab', tab);
    if (series === 'all') params.delete('series');
    else params.set('series', series);
    params.delete('curriculum');
    params.delete('subject');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Board matching helper
  const matchesBoard = (countdown: CountdownWithTime) => {
    if (selectedBoardFilter === 'all') return true;
    if (selectedBoardFilter === 'Custom') return Boolean(countdown.is_custom);
    const board = (countdown.exam_board || countdown.qualification_group || '').toUpperCase();
    return board.includes(selectedBoardFilter.toUpperCase());
  };

  // Series matching helper
  const matchesSeries = (countdown: CountdownWithTime) => {
    if (selectedSeriesFilter === 'all') return true;
    const series = countdown.exam_id
      ? examSeriesMap.get(countdown.exam_id)
      : (countdown as any).exam_series || (countdown as any).season || (countdown as any).series;
    return series === selectedSeriesFilter;
  };

  // Text search query matching helper
  const matchesSearch = (countdown: CountdownWithTime) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const title = (countdown.custom_title || countdown.title || '').toLowerCase();
    const paper = (countdown.paper_name || '').toLowerCase();
    const board = (countdown.exam_board || countdown.qualification_group || '').toLowerCase();
    return title.includes(q) || paper.includes(q) || board.includes(q);
  };

  // Filtered active countdowns
  const activeCountdowns = useMemo(() => {
    const seen = new Set<string>();
    return countdowns.filter((countdown) => {
      if (countdown.timeLeft.isPast) return false;
      if (!matchesBoard(countdown)) return false;
      if (!matchesSeries(countdown)) return false;
      if (!matchesSearch(countdown)) return false;
      const key = countdown.exam_id || countdown.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [countdowns, selectedBoardFilter, selectedSeriesFilter, searchQuery, examSeriesMap]);

  // Chronologically sorted active exams
  const sortedActive = useMemo(
    () =>
      [...activeCountdowns].sort(
        (a, b) =>
          new Date(a.exam_date || a.target_date || 0).getTime() -
          new Date(b.exam_date || b.target_date || 0).getTime()
      ),
    [activeCountdowns]
  );

  // Dynamic board counts
  const boardCounts = useMemo(() => {
    const counts = { all: 0, CAIE: 0, Edexcel: 0, Custom: 0 };
    for (const c of countdowns) {
      if (c.timeLeft.isPast) continue;
      counts.all++;
      const b = (c.exam_board || c.qualification_group || '').toUpperCase();
      if (b.includes('CAIE') || b.includes('CAMBRIDGE')) counts.CAIE++;
      else if (b.includes('EDEXCEL') || b.includes('PEARSON')) counts.Edexcel++;
      else if (c.is_custom) counts.Custom++;
      else counts.Custom++;
    }
    return counts;
  }, [countdowns]);

  const boards = [
    { id: 'all', label: 'All', count: boardCounts.all },
    { id: 'CAIE', label: 'Cambridge', count: boardCounts.CAIE },
    { id: 'Edexcel', label: 'Edexcel', count: boardCounts.Edexcel },
    { id: 'Custom', label: 'Custom', count: boardCounts.Custom },
  ];

  // Official Timetable filtering
  const filteredOfficialExams = availableExams.filter((exam) => {
    const series =
      exam.exam_series ||
      (exam as any).season ||
      (exam as any).series ||
      'Other';
    if (selectedSeriesFilter !== 'all' && series !== selectedSeriesFilter) return false;

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

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const title = (exam.title || (exam as any).subject || '').toLowerCase();
      const code = (syllabusCode || '').toLowerCase();
      const pNum = (paperNumber || '').toLowerCase();
      if (!title.includes(q) && !code.includes(q) && !pNum.includes(q)) return false;
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

  const pendingEnrolledSubjects = enrolledCurriculums
    .flatMap((curr) => curr.subjects)
    .filter((s) => enrolledSubjectIds.has(s.id))
    .filter(
      (s) =>
        !availableExams.some(
          (exam) => exam.subject_id === s.id && Boolean(exam.exam_date || (exam as any).date)
        )
    );

  const allPastExams = useMemo(() => {
    return countdowns.filter((c) => c.timeLeft.isPast);
  }, [countdowns]);

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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3.5">
      {/* ── Compact Header & Tab Switcher (Unified Row) ──────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <span className="h-3.5 w-px bg-border" aria-hidden />
          <h1 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
            Exam Countdowns
          </h1>
          {activeCountdowns.length > 0 && (
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.2 text-[11px] font-bold text-primary font-mono">
              {activeCountdowns.length}
            </span>
          )}
        </div>

        {/* Right: Inline Tabs + Add Button */}
        <div className="flex items-center gap-2">
          {/* Compact tabs */}
          <div className="flex items-center rounded-xl border border-border bg-background-secondary p-0.5 text-xs">
            <button
              type="button"
              onClick={() => writeFilters('mine')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer',
                pageTab === 'mine'
                  ? 'bg-background-card text-foreground shadow-2xs'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <Timer className="h-3.5 w-3.5" />
              <span>My Exams</span>
              <span className="font-mono text-[10px] opacity-70">({activeCountdowns.length})</span>
            </button>
            <button
              type="button"
              onClick={() => writeFilters('browse')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer',
                pageTab === 'browse'
                  ? 'bg-background-card text-foreground shadow-2xs'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Browse</span>
              <span className="font-mono text-[10px] opacity-70">({availableExams.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-primary-hover transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Exam
          </button>
        </div>
      </div>

      {/* ── Compact Filter Toolbar (Single Row with Series Filter) ──── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-background-card px-3 py-2 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code or subject..."
            className="w-full rounded-lg border border-border bg-background-secondary/40 pl-8 pr-7 py-1 text-xs text-foreground placeholder:text-foreground-muted focus:border-primary focus:bg-background-card focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Board Pills */}
        <div className="flex items-center gap-1">
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBoardFilter(b.id)}
              className={cn(
                'rounded-lg px-2.5 py-1 font-semibold transition-all cursor-pointer text-xs',
                selectedBoardFilter === b.id
                  ? 'bg-primary text-white shadow-2xs font-bold'
                  : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
              )}
            >
              {b.label} <span className="opacity-70 font-mono text-[10px]">({b.count})</span>
            </button>
          ))}
        </div>

        {/* Exam Series Dropdown Filter */}
        <select
          value={selectedSeriesFilter}
          onChange={(e) => writeFilters(pageTab, e.target.value)}
          className="rounded-lg border border-border bg-background-secondary/40 px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer max-w-[160px] truncate"
        >
          <option value="all">All Series</option>
          {availableSeries.map((series) => (
            <option key={series} value={series}>
              {series} Series
            </option>
          ))}
        </select>

        {(searchQuery || selectedBoardFilter !== 'all' || selectedSeriesFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedBoardFilter('all');
              writeFilters(pageTab, 'all');
            }}
            className="ml-auto text-[11px] font-bold text-primary hover:underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* ── My Exams Grid (Directly Focus on Cards) ────────────────────── */}
      {pageTab === 'mine' && (
        <div className="space-y-4 pt-1">
          {sortedActive.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background-card p-10 text-center space-y-2">
              <AlertCircle className="mx-auto h-7 w-7 text-foreground-muted" />
              <h3 className="text-sm font-bold text-foreground">
                {countdowns.length === 0 ? 'No exam countdowns yet' : 'No countdowns match your filter'}
              </h3>
              <p className="text-xs text-foreground-muted max-w-xs mx-auto">
                {countdowns.length === 0
                  ? 'Add your first exam paper or browse official timetables.'
                  : 'Try resetting the search or series filter.'}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-hover transition-colors"
                >
                  Add Countdown
                </button>
                <button
                  type="button"
                  onClick={() => writeFilters('browse')}
                  className="rounded-xl border border-border bg-background-secondary px-3.5 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 transition-colors"
                >
                  Browse Timetable
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          )}

          {pendingEnrolledSubjects.length > 0 && (
            <p className="text-xs text-foreground-muted">
              Timetable not yet announced for: {pendingEnrolledSubjects.map((s) => s.title).join(', ')}.
            </p>
          )}

          {/* Past Exams Collapsible */}
          {allPastExams.length > 0 && (
            <div className="border-t border-border/70 pt-3">
              <button
                type="button"
                onClick={() => setPastOpen(!pastOpen)}
                className="flex items-center gap-1.5 text-xs font-bold text-foreground-muted hover:text-foreground cursor-pointer"
              >
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', pastOpen && 'rotate-180')} />
                <span>Past & Concluded Exams ({allPastExams.length})</span>
              </button>

              {pastOpen && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2.5">
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
            </div>
          )}
        </div>
      )}

      {/* ── Browse Official Timetable View ─────────────────────────────── */}
      {pageTab === 'browse' && (
        <div className="space-y-4 pt-1">
          {availableExams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background-card p-8 text-center text-xs text-foreground-muted">
              No timetable data loaded.
            </div>
          ) : Object.keys(groupedOfficialExams).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background-card p-8 text-center text-xs text-foreground-muted">
              No sessions match this filter.
            </div>
          ) : (
            <div className="space-y-6">
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
                  <div key={series} className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-border/70 pb-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">{series} Series</h3>
                        <span className="font-mono text-[10px] text-foreground-muted">({exams.length} papers)</span>
                      </div>
                      <button
                        onClick={() => {
                          exams.forEach((ex) => {
                            if (!isAlreadyTracked(ex.id)) handleQuickPinOfficialExam(ex);
                          });
                        }}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Track all
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {exams.map((exam) => {
                        const tracked = isAlreadyTracked(exam.id);
                        const examDateStr = (exam as any).exam_date || (exam as any).date;
                        const formattedDate = formatExamDateTime(examDateStr);
                        const examMs = examDateStr ? new Date(examDateStr).getTime() - Date.now() : null;
                        const examDays = examMs != null ? Math.max(0, Math.floor(examMs / 86400000)) : null;

                        return (
                          <div
                            key={exam.id}
                            className="flex flex-col justify-between rounded-xl border border-border bg-background-card p-3 transition-all hover:border-primary/40"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="rounded px-1.5 py-0.2 text-[9px] font-bold uppercase border border-primary/20 bg-primary/10 text-primary">
                                  {exam.exam_board || 'Official'}
                                </span>
                                {(exam as any).syllabus_code && (
                                  <span className="font-mono text-[10px] font-semibold text-foreground-muted">
                                    {(exam as any).syllabus_code}
                                  </span>
                                )}
                              </div>

                              <h4 className="line-clamp-2 text-xs font-bold text-foreground leading-snug">
                                {exam.title || (exam as any).subject || 'Exam Paper'}
                              </h4>

                              <p className="flex items-center gap-1 text-[10px] text-foreground-muted">
                                <Calendar className="h-3 w-3 shrink-0" />
                                <span>{formattedDate}</span>
                              </p>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                              {examDays != null && (
                                <span className="font-mono font-bold text-foreground-secondary text-[11px]">
                                  {examDays}d left
                                </span>
                              )}
                              {tracked ? (
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  ✓ Tracked
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleQuickPinOfficialExam(exam)}
                                  className="inline-flex items-center gap-0.5 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                  Track
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
        </div>
      )}

      {/* Add / Edit Modals */}
      {isModalOpen && (
        <AddCountdownModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          availableExams={availableExams}
          catalogCurriculums={catalog}
          initialCurriculumId="all"
          initialSubjectId="all"
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
