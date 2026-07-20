'use client';

import React, { useState, useCallback } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { CountdownCard } from './CountdownCard';
import { AddCountdownModal } from './AddCountdownModal';
import { Plus, Timer, BookMarked, BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useLessonContext, type SubjectCountdown } from '@/context/LessonContext';
import { createClient } from '@/lib/supabase/client';

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
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('subject_id', subjectId)
      .gt('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });
    setSessions(data ?? []);
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
    // Update exam_countdowns for the subject
    const supabase = createClient();
    if (!supabase) return;
    const exam = autoCountdowns.find(cd => cd.subjectId === subjectId)?.exam;
    if (!exam) return;

    // Remove old countdown for this subject and create new one
    const { data: oldCd } = await supabase
      .from('exam_countdowns')
      .select('id')
      .eq('user_id', userId)
      .eq('exam_id', exam.id)
      .single();

    if (oldCd) {
      await supabase.from('exam_countdowns').delete().eq('id', oldCd.id);
    }

    const newExamData = await supabase.from('exams').select('*').eq('id', examId).single();
    if (newExamData.data) {
      await supabase.from('exam_countdowns').insert({
        user_id: userId,
        exam_id: examId,
        custom_title: newExamData.data.subject,
        target_date: newExamData.data.date,
        priority_indicator: 'medium',
        qualification_group: newExamData.data.series ?? 'Custom',
      });
      // Refresh the page to reflect changes
      window.location.reload();
    }
  }, [userId, autoCountdowns]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
            <Timer className="h-8 w-8 text-[var(--primary)]" />
            Exam Countdowns
          </h1>
          <p className="text-[var(--foreground-secondary)] mt-2">Manage your upcoming exams and visualize remaining time.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/courses"
            className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/20"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Manage Courses
          </Link>
          <Link
            href="/library/exams"
            className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-600 dark:text-amber-400 transition-all hover:bg-amber-500/20"
          >
            <BookMarked className="h-4 w-4" aria-hidden="true" />
            Browse Exams Library
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-glow)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            aria-label="Add a new custom countdown"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Custom
          </button>
        </div>
      </div>

      {/* ── Section 1: Enrolled Subjects (auto-generated) ─────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-[var(--primary)]" />
          <h2 className="text-xl font-bold text-[var(--foreground)]">Enrolled Subjects</h2>
          <span className="text-xs text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-full px-2 py-0.5">
            {autoWithExam} of {autoCountdowns.length} with exams
          </span>
        </div>

        {countdownsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 min-h-[160px] animate-pulse" />
            ))}
          </div>
        ) : autoCountdowns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-card)]/50 p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[var(--foreground-muted)] mb-3" />
            <p className="text-sm text-[var(--foreground)] font-medium">No enrolled subjects yet</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Enroll in curricula and subjects from the Course Manager to see auto-generated countdowns.
            </p>
            <Link
              href="/courses"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              Go to Course Manager
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {autoCountdowns.map(cd => {
              if (cd.exam) {
                const daysUntil = Math.ceil(
                  (new Date(cd.exam.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <CountdownCard
                    key={cd.subjectId}
                    countdown={{
                      id: cd.exam.id,
                      user_id: userId,
                      exam_id: cd.exam.id,
                      custom_title: subjectNameMap[cd.subjectId] ?? cd.exam.subject,
                      target_date: cd.exam.date,
                      qualification_group: cd.exam.series ?? 'Custom',
                      priority_indicator: 'medium',
                    } as any}
                    onDelete={() => {}}
                  />
                );
              }
              return <PendingTimetableCard key={cd.subjectId} subjectId={cd.subjectId} />;
            })}
          </div>
        )}
      </section>

      {/* ── Section 2: Custom countdowns ──────────────────────────────────── */}
      {sortedGroups.length === 0 && autoCountdowns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-secondary)]/70 py-20 text-center backdrop-blur-md">
          <Timer className="h-16 w-16 text-[var(--foreground-secondary)] mb-4" />
          <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">No Countdowns Yet</h3>
          <p className="text-[var(--foreground-secondary)] max-w-sm mb-6">Keep track of your exam dates by enrolling in courses or adding a custom countdown.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--background-secondary)]/80 px-6 py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--background-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            aria-label="Create your first exam countdown"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Custom Countdown
          </button>
        </div>
      ) : sortedGroups.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-[var(--foreground-muted)]" />
            <h2 className="text-xl font-bold text-[var(--foreground)]">Custom Countdowns</h2>
          </div>
          <div className="space-y-10">
            {sortedGroups.map(group => {
              const countdowns = groupedCountdowns[group];
              if (!countdowns || countdowns.length === 0) return null;

              return (
                <div key={group} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-[var(--foreground)] tracking-wide uppercase">{group}</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {countdowns.map(countdown => (
                      <CountdownCard
                        key={countdown.id}
                        countdown={countdown}
                        onDelete={deleteCountdown}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <AddCountdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableExams={availableExams}
        onCreate={createCountdown}
      />
    </div>
  );
}
