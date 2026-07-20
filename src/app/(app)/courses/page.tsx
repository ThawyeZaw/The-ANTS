'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Course Manager Page (Redesigned)
// Route: /courses — 3-section dashboard: Wizard, Enrolled Subjects, Countdown Strip
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  BookOpen, GraduationCap, Trash2, Plus, Clock,
  ChevronDown, Calendar, ArrowRight, ChevronUp,
  Pencil, StickyNote, Layers, Sparkles, Timer,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCourseManager } from '@/hooks/useCourseManager';
import { useLessonContext } from '@/context/LessonContext';
import type { SubjectCountdown } from '@/context/LessonContext';
import CourseManagerWizard from '@/components/courses/CourseManagerWizard';

// ── Inline: Days remaining helper ───────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Session Switcher (inline dropdown per subject card) ─────────────────────

function SessionSwitcher({ subjectId, currentExamId, onSwitch }: {
  subjectId: string;
  currentExamId: string;
  onSwitch: (examId: string) => void;
}) {
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
        className="text-xs text-primary hover:text-primary-hover underline underline-offset-2 transition-colors"
      >
        Switch session
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-30 w-56 rounded-xl border border-border bg-background-card shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <p className="text-xs font-medium text-foreground-muted">Upcoming sessions</p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-foreground-muted p-3 text-center">No upcoming sessions found.</p>
            ) : (
              sessions.map((exam: any) => (
                <button
                  key={exam.id}
                  onClick={() => { onSwitch(exam.id); setOpen(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2.5 text-sm hover:bg-background-secondary transition-colors',
                    exam.id === currentExamId && 'bg-primary/10'
                  )}
                >
                  <span className="font-medium text-foreground">{exam.subject}</span>
                  <span className="block text-xs text-foreground-muted">{exam.series} — {exam.date}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section B: Enrolled Subjects Dashboard ─────────────────────────────────

function EnrolledSubjectsDashboard() {
  const {
    enrolledCurriculums, countdowns, countdownsLoading, progressRecords,
    enrolledSubjectIds,
  } = useLessonContext();
  const { unenroll, updateExamTarget, enrollments } = useCourseManager();

  if (enrolledCurriculums.length === 0) return null;

  // Build progress counts per subject
  const topicCountBySubject: Record<string, { total: number; completed: number }> = {};
  for (const curr of enrolledCurriculums) {
    for (const subj of curr.subjects) {
      const total = subj.topics.length;
      const topicIds = new Set(subj.topics.map(t => t.id));
      const completed = progressRecords.filter(
        r => topicIds.has(r.topic_id) && r.status === 'completed'
      ).length;
      topicCountBySubject[subj.id] = { total, completed };
    }
  }

  // Map countdowns by subjectId for quick lookup
  const countdownBySubject: Record<string, SubjectCountdown> = {};
  for (const cd of countdowns) {
    countdownBySubject[cd.subjectId] = cd;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Your Courses</h2>
        <Link
          href="/lessons"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          Go to Lesson Tracker
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {enrolledCurriculums.map(curriculum => (
        <div key={curriculum.id} className="rounded-2xl border border-border bg-background-card overflow-hidden">
          {/* Curriculum header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background-secondary/50">
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">{curriculum.title}</h3>
              <div className="flex gap-2 mt-0.5">
                {curriculum.qualification && (
                  <span className="text-xs text-primary">{curriculum.qualification}</span>
                )}
                {curriculum.exam_board && (
                  <span className="text-xs text-foreground-muted">{curriculum.exam_board}</span>
                )}
              </div>
            </div>
          </div>

          {/* Subject cards */}
          <div className="divide-y divide-border">
            {curriculum.subjects.map(subject => {
              const progress = topicCountBySubject[subject.id];
              const cd = countdownBySubject[subject.id];
              const enrollment = enrollments.find(e => e.curriculum_id === curriculum.id && e.subject_id === subject.id);

              return (
                <div key={subject.id} className="px-5 py-4 space-y-3">
                  {/* Top row: subject name + actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-foreground-muted" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{subject.title}</p>
                        {subject.description && (
                          <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">{subject.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => enrollment && unenroll(enrollment.id)}
                      className="rounded-lg p-2 text-foreground-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Remove course"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Middle row: progress + countdown */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Progress bar */}
                    {progress && (
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="flex-1 h-2 bg-background-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: progress.total > 0 ? `${Math.round((progress.completed / progress.total) * 100)}%` : '0%' }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground-muted whitespace-nowrap">
                          {progress.completed}/{progress.total} topics
                        </span>
                      </div>
                    )}

                    {/* Countdown badge */}
                    {countdownsLoading ? (
                      <div className="h-5 w-24 bg-background-secondary rounded-full animate-pulse" />
                    ) : cd?.exam ? (
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                          daysUntil(cd.exam.date) <= 30
                            ? 'bg-red-500/10 text-red-500'
                            : daysUntil(cd.exam.date) <= 60
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-primary/10 text-primary'
                        )}>
                          <Timer className="h-3 w-3" />
                          {daysUntil(cd.exam.date)} days
                        </div>
                        <span className="text-xs text-foreground-muted">{cd.exam.series}</span>
                        {enrollment && (
                          <SessionSwitcher
                            subjectId={subject.id}
                            currentExamId={cd.exam.id}
                            onSwitch={(examId) => updateExamTarget(enrollment.id, examId)}
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-foreground-muted bg-background-secondary rounded-full px-2.5 py-1">
                        Timetable pending
                      </span>
                    )}
                  </div>

                  {/* Bottom row: quick actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/lessons?curriculum=${curriculum.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-background-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <BookOpen className="h-3 w-3" />
                      View Lessons
                    </Link>
                    <Link
                      href="/my-notes"
                      className="inline-flex items-center gap-1 rounded-lg bg-background-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <StickyNote className="h-3 w-3" />
                      View Notes
                    </Link>
                    <Link
                      href="/flashcards"
                      className="inline-flex items-center gap-1 rounded-lg bg-background-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Layers className="h-3 w-3" />
                      View Flashcards
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Section C: Exam Countdown Strip ────────────────────────────────────────

function ExamCountdownStrip() {
  const { countdowns, countdownsLoading } = useLessonContext();
  const { enrolledCurriculums } = useLessonContext();

  // Build subject lookup
  const subjectMap: Record<string, { title: string }> = {};
  for (const curr of enrolledCurriculums) {
    for (const subj of curr.subjects) {
      subjectMap[subj.id] = { title: subj.title };
    }
  }

  const upcoming = countdowns
    .filter(cd => cd.exam !== null)
    .sort((a, b) => new Date(a.exam!.date).getTime() - new Date(b.exam!.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Upcoming Exams
        </h2>
        <Link
          href="/countdown"
          className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          View all countdowns →
        </Link>
      </div>

      {countdownsLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="shrink-0 w-44 h-28 rounded-2xl bg-background-card border border-border animate-pulse" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="rounded-2xl border border-border bg-background-card p-6 text-center">
          <p className="text-sm text-foreground-muted">No upcoming exams tracked yet. Enroll in subjects with exam dates to see countdowns here.</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {upcoming.map(cd => {
            const days = daysUntil(cd.exam!.date);
            const subjectName = subjectMap[cd.subjectId]?.title ?? cd.exam!.subject;
            return (
              <div
                key={cd.subjectId}
                className="shrink-0 w-44 rounded-2xl border border-border bg-background-card p-4 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs text-foreground-muted truncate">{subjectName}</p>
                  <p className="text-xs text-foreground-muted/70 mt-0.5">{cd.exam!.series}</p>
                </div>
                <div>
                  <p className={cn(
                    'text-3xl font-bold',
                    days <= 30 ? 'text-red-500' : days <= 60 ? 'text-amber-500' : 'text-primary'
                  )}>
                    {days}
                  </p>
                  <p className="text-xs text-foreground-muted">days left</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function CourseManagerPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { enrolledCurriculums } = useLessonContext();
  const { enrollments } = useCourseManager();
  const [showWizard, setShowWizard] = useState(false);

  // Show wizard automatically for first-time users (no enrollments)
  useEffect(() => {
    if (!authLoading && user && enrollments.length === 0) {
      setShowWizard(true);
    }
  }, [authLoading, user, enrollments.length]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const hasEnrollments = enrolledCurriculums.length > 0;

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Learn</p>
        <h1 className="text-3xl font-bold text-foreground mt-1 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Course Manager
        </h1>
        <p className="text-foreground-muted mt-2 max-w-2xl text-sm leading-relaxed">
          Build your academic profile by selecting curricula and subjects.
          Your courses sync automatically with the Lesson Tracker, Notes, and Flashcards.
        </p>
      </div>

      {/* Section A: Wizard Panel (collapsible) */}
      {!hasEnrollments && !showWizard && (
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-8 text-center animate-fade-in mb-8">
          <div className="inline-flex rounded-2xl bg-primary/10 p-4 text-primary mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Build Your Academic Profile</h2>
          <p className="text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
            Set up your course manager by selecting your curricula and subjects.
            This will unlock lesson tracking, exam countdowns, and personalised study tools.
          </p>
        </div>
      )}

      {!showWizard && (
        <div className={cn('mb-8', hasEnrollments ? 'mt-0' : 'mt-6')}>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            {hasEnrollments ? (
              <>
                <Pencil className="h-4 w-4" />
                Add / Edit Courses
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Get Started
              </>
            )}
          </button>
        </div>
      )}

      {showWizard && (
        <div className="mb-8">
          {hasEnrollments && (
            <button
              onClick={() => setShowWizard(false)}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              Hide wizard
            </button>
          )}
          <div className="rounded-2xl border border-border bg-background-card p-1">
            <CourseManagerWizard onComplete={() => setShowWizard(false)} />
          </div>
        </div>
      )}

      {/* Section B: Enrolled Subjects Dashboard */}
      {hasEnrollments && <div className="mb-10"><EnrolledSubjectsDashboard /></div>}

      {/* Section C: Exam Countdown Strip */}
      {hasEnrollments && <ExamCountdownStrip />}
    </div>
  );
}
