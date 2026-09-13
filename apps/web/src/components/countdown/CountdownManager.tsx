'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useCountdown } from '@/hooks/useCountdown';
import { CountdownCard } from './CountdownCard';
import { Plus, Timer, BookMarked, BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useLessonContext, type SubjectCountdown } from '@/context/LessonContext';
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
  const { groupedCountdowns, availableExams, createCountdown, deleteCountdown } = useCountdown(userId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-generated countdowns from LessonContext
  const { countdowns: autoCountdowns, countdownsLoading, enrolledCurriculums } = useLessonContext();

  // Build subject name lookup
  const subjectNameMap: Record<string, string> = {};
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

  const handleQuickPinOfficialExam = async (exam: any) => {
    await createCountdown({
      exam_id: exam.id,
      custom_title: exam.title || exam.subject?.name || 'Official Exam',
      target_date: exam.exam_date ? new Date(exam.exam_date).toISOString() : new Date().toISOString(),
      priority_indicator: 'high',
      qualification_group: exam.exam_board || exam.qualification_type || 'Official',
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
            <Timer className="h-3.5 w-3.5" />
            Live Exam Tracker
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Exam Countdowns
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)] mt-1">
            Track official Cambridge & Edexcel exam sessions, timetable deadlines, and custom targets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/curriculum"
            className="flex items-center gap-2 rounded-xl bg-[var(--background-secondary)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--primary)]/50 transition-all"
          >
            <BookOpen className="h-3.5 w-3.5 text-[var(--primary)]" />
            Curriculum Hub
          </Link>
          <Link
            href="/past-papers"
            className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
          >
            <BookMarked className="h-3.5 w-3.5" />
            Past Papers Grid
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[var(--primary-hover)] shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            aria-label="Add a new custom countdown"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Countdown
          </button>
        </div>
      </div>

      {/* Board Filter Tabs */}
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
            {autoCountdowns.map((cd) => {
              if (cd.exam) {
                const examDate = (cd.exam as any).date || (cd.exam as any).exam_date || new Date().toISOString();
                return (
                  <CountdownCard
                    key={cd.subjectId}
                    countdown={{
                      id: cd.exam.id,
                      user_id: userId,
                      exam_id: cd.exam.id,
                      custom_title: subjectNameMap[cd.subjectId] ?? (cd.exam as any).subject ?? 'Exam',
                      target_date: examDate,
                      qualification_group: (cd.exam as any).series ?? 'Official',
                      exam_board: (cd.exam as any).exam_board ?? undefined,
                      paper_name: (cd.exam as any).paper_number ? `Paper ${ (cd.exam as any).paper_number}` : undefined,
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
                const countdowns = groupedCountdowns[group];
                if (!countdowns || countdowns.length === 0) return null;

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

      {/* ── Section 3: Official Exam Timetable Catalog ──────────────────────── */}
      {availableExams.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-amber-500" />
              <h2 className="text-lg font-bold text-[var(--foreground)]">Official Exam Timetable</h2>
              <span className="text-xs font-medium text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-full px-2.5 py-0.5 border border-[var(--border)]">
                {availableExams.length} sessions
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableExams
              .filter((exam) => {
                if (selectedBoardFilter === 'all') return true;
                if (selectedBoardFilter === 'Custom') return false;
                return (
                  (exam.exam_board && exam.exam_board.toUpperCase().includes(selectedBoardFilter.toUpperCase())) ||
                  (exam.title && exam.title.toUpperCase().includes(selectedBoardFilter.toUpperCase()))
                );
              })
              .map((exam) => {
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
        </section>
      )}

      {isModalOpen && (
        <AddCountdownModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          availableExams={availableExams}
          onCreate={createCountdown}
        />
      )}
    </div>
  );
}
