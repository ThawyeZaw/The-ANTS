'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — SubjectLessonView
// Dedicated lesson page for a single subject under a curriculum.
// Shows topic list with expandable content, progress tracking, and navigation.
// Belongs to: src/components/Lessons/  (subject lesson view)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  BookOpen, ClipboardCheck, Clock, Target, Sparkles,
  Star, ExternalLink, Layers, List, ArrowLeft,
  CheckCircle2, Circle, Clock4, AlertTriangle,
} from 'lucide-react';
import { useLessonContext, type TopicItem, type TopicStatus } from '@/context/LessonContext';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubjectLessonViewProps {
  curriculumId: string;
  subjectId: string;
}

interface ExtendedTopic extends TopicItem {
  syllabus_code?: string | null;
  learning_objectives?: string | null;
}

// ── Confidence constants ──────────────────────────────────────────────────────

const CONFIDENCE_LABELS = ['', 'Guessing', 'Shaky', 'Getting there', 'Confident', 'Mastered'];
const CONFIDENCE_COLORS = ['', 'text-error', 'text-warning', 'text-warning', 'text-accent', 'text-success'];

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: TopicStatus;
  label: string;
  icon: React.ReactNode;
  classes: string;
  activeClasses: string;
}[] = [
  {
    value: 'not_started',
    label: 'Not Started',
    icon: <Circle className="h-3.5 w-3.5" />,
    classes: 'border-border text-foreground-muted hover:border-border-hover hover:text-foreground',
    activeClasses: 'border-foreground-muted bg-foreground-muted/10 text-foreground',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: <Clock4 className="h-3.5 w-3.5" />,
    classes: 'border-info/40 text-info/70 hover:border-info hover:text-info',
    activeClasses: 'border-info bg-info/10 text-info',
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    classes: 'border-success/40 text-success/70 hover:border-success hover:text-success',
    activeClasses: 'border-success bg-success/10 text-success',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SubjectLessonView({ curriculumId, subjectId }: SubjectLessonViewProps) {
  const {
    enrolledCurriculums,
    progressRecords,
    updateProgress,
  } = useLessonContext();

  // Find the curriculum and subject
  const curriculum = useMemo(
    () => enrolledCurriculums.find(c => c.id === curriculumId),
    [enrolledCurriculums, curriculumId]
  );

  const subject = useMemo(
    () => curriculum?.subjects.find(s => s.id === subjectId) ?? null,
    [curriculum, subjectId]
  );

  const topics = useMemo<ExtendedTopic[]>(
    () => (subject?.topics ?? []) as ExtendedTopic[],
    [subject]
  );

  // State
  const [selectedTopicIdx, setSelectedTopicIdx] = useState<number>(0);
  const [tocOpen, setTocOpen] = useState(true);
  const [topicContentExpanded, setTopicContentExpanded] = useState(true);
  const [hoverLevel, setHoverLevel] = useState<number | null>(null);

  // ── Guard: not enrolled in this curriculum ──────────────────────────────────

  if (!curriculum) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 animate-fade-in">
        <div className="rounded-2xl border border-border bg-background-card p-10 text-center max-w-md w-full shadow-sm">
          <div className="inline-flex rounded-2xl bg-warning/10 p-4 text-warning mb-5">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Curriculum not enrolled</h2>
          <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
            You haven&apos;t enrolled in this curriculum yet. Head to Course Manager to get started.
          </p>
          <Link
            href="/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors duration-150"
          >
            <BookOpen className="h-4 w-4" />
            Go to Course Manager
          </Link>
        </div>
      </div>
    );
  }

  // ── Guard: subject not found ────────────────────────────────────────────────

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 animate-fade-in">
        <div className="rounded-2xl border border-border bg-background-card p-10 text-center max-w-md w-full shadow-sm">
          <div className="inline-flex rounded-2xl bg-warning/10 p-4 text-warning mb-5">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Subject not found</h2>
          <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
            This subject doesn&apos;t exist or you haven&apos;t enrolled in it.
          </p>
          <Link
            href="/lessons"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors duration-150"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lesson Tracker
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const selectedTopic = topics[selectedTopicIdx] ?? null;
  const completedCount = useMemo(
    () => subject?.topics.filter(
      (t: TopicItem) => progressRecords.find((r) => r.topic_id === t.id)?.status === 'completed'
    ).length ?? 0,
    [subject, progressRecords]
  );
  const totalCount = topics.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const topicProgress = selectedTopic
    ? progressRecords.find(r => r.topic_id === selectedTopic.id)
    : undefined;

  const currentConfidence = topicProgress?.confidence_level ?? 0;
  const currentStatus: TopicStatus = topicProgress?.status ?? 'not_started';
  const displayLevel = hoverLevel ?? currentConfidence;

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goToPrev = useCallback(() => {
    setSelectedTopicIdx(i => (i > 0 ? i - 1 : topics.length - 1));
    setTopicContentExpanded(true);
  }, [topics.length]);

  const goToNext = useCallback(() => {
    setSelectedTopicIdx(i => (i < topics.length - 1 ? i + 1 : 0));
    setTopicContentExpanded(true);
  }, [topics.length]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleConfidenceChange = useCallback(
    (level: number) => {
      if (!selectedTopic) return;
      updateProgress(selectedTopic.id, { confidence_level: level });
    },
    [selectedTopic, updateProgress]
  );

  const handleStatusChange = useCallback(
    (status: TopicStatus) => {
      if (!selectedTopic) return;
      updateProgress(selectedTopic.id, { status });
    },
    [selectedTopic, updateProgress]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Subject header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-primary">Learn</p>
            <span className="text-foreground-muted">/</span>
            <p className="text-sm font-medium text-foreground-muted">{curriculum?.title ?? 'Curriculum'}</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1 flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary shrink-0" />
            {subject.title}
          </h1>
          {subject.description && (
            <p className="text-foreground-muted mt-2 max-w-3xl text-sm leading-relaxed">
              {subject.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {curriculum?.exam_board && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                {curriculum.exam_board}
              </span>
            )}
            {curriculum?.qualification && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {curriculum.qualification}
              </span>
            )}
            <span className="text-xs text-foreground-muted">
              {totalCount} topic{totalCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Progress ring */}
        <div className="shrink-0 flex items-center gap-3 rounded-xl border border-border bg-background-card px-5 py-3 shadow-sm">
          <div className="relative h-14 w-14 shrink-0">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border)" strokeWidth="2.5" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="var(--primary)"
                strokeWidth="2.5"
                strokeDasharray={`${progressPct} 100`}
                strokeDashoffset="25"
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
              {progressPct}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {completedCount}/{totalCount} topics
            </p>
            <p className="text-xs text-foreground-muted mt-0.5">completed</p>
          </div>
        </div>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-background-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
            Overall Progress
          </span>
          <span className="text-xs font-bold text-primary">{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ── Table of Contents (sidebar) ───────────────────────────────────── */}
        <aside className="space-y-3">
          <button
            onClick={() => setTocOpen(o => !o)}
            className="w-full flex items-center justify-between rounded-xl border border-border bg-background-card px-4 py-3 text-sm font-semibold text-foreground hover:border-border-hover transition-colors duration-150 cursor-pointer focus-ring lg:cursor-default lg:pointer-events-none"
          >
            <span className="flex items-center gap-2">
              <List className="h-4 w-4 text-primary" />
              Table of Contents
            </span>
            <span className="lg:hidden">
              {tocOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>

          <nav
            className={cn(
              'rounded-xl border border-border bg-background-card overflow-hidden transition-all duration-300',
              tocOpen ? 'max-h-[80vh]' : 'max-h-0 lg:max-h-[80vh]'
            )}
            aria-label="Topic navigation"
          >
            <ul className="divide-y divide-border p-1">
              {topics.map((topic, idx) => {
                const tp = progressRecords.find(r => r.topic_id === topic.id);
                const isComplete = tp?.status === 'completed';
                const isActive = idx === selectedTopicIdx;

                return (
                  <li key={topic.id}>
                    <button
                      onClick={() => { setSelectedTopicIdx(idx); setTopicContentExpanded(true); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-150 text-sm cursor-pointer focus-ring',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'hover:bg-background-secondary/50 text-foreground-secondary'
                      )}
                    >
                      <span
                        className={cn(
                          'shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                          isComplete
                            ? 'bg-success/20 text-success'
                            : 'bg-border text-foreground-muted'
                        )}
                      >
                        {isComplete ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
                      </span>
                      <span className="truncate flex-1">{topic.title}</span>
                      {tp && (
                        <span className="shrink-0 text-[10px] text-foreground-muted">
                          Lv.{tp.confidence_level}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Quick stats */}
          <div className="rounded-xl border border-border bg-background-card p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-foreground-muted">Not Started</span>
              <span className="font-semibold text-foreground">
                {topics.filter(t => {
                  const p = progressRecords.find(r => r.topic_id === t.id);
                  return !p || p.status === 'not_started';
                }).length}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-foreground-muted">In Progress</span>
              <span className="font-semibold text-info">
                {topics.filter(t => progressRecords.find(r => r.topic_id === t.id && r.status === 'in_progress')).length}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-foreground-muted">Completed</span>
              <span className="font-semibold text-success">{completedCount}</span>
            </div>
          </div>
        </aside>

        {/* ── Topic content (main area) ─────────────────────────────────────── */}
        <main className="space-y-6">
          {selectedTopic ? (
            <>
              {/* Topic detail card */}
              <div className="rounded-xl border border-border bg-background-card overflow-hidden">
                {/* Expandable header */}
                <button
                  onClick={() => setTopicContentExpanded(e => !e)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-background-secondary/30 transition-colors duration-150 cursor-pointer focus-ring"
                >
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                      Topic {selectedTopicIdx + 1} of {totalCount}
                    </p>
                    <h2 className="text-xl font-bold text-foreground">{selectedTopic.title}</h2>
                    {selectedTopic.syllabus_code && (
                      <span className="inline-block mt-1.5 rounded-md bg-border px-2 py-0.5 text-[10px] font-mono text-foreground-muted">
                        {selectedTopic.syllabus_code}
                      </span>
                    )}
                  </div>
                  <span className="text-foreground-muted">
                    {topicContentExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </button>

                {topicContentExpanded && (
                  <div className="px-5 pb-5 space-y-5 border-t border-border pt-5">
                    {/* Description */}
                    {selectedTopic.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Overview</h3>
                        <p className="text-sm text-foreground-muted leading-relaxed">
                          {selectedTopic.description}
                        </p>
                      </div>
                    )}

                    {/* Learning objectives */}
                    {selectedTopic.learning_objectives && (
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          Learning Objectives
                        </h3>
                        <div className="rounded-lg border border-border bg-background-secondary/30 p-4">
                          <p className="text-sm text-foreground-muted leading-relaxed">
                            {selectedTopic.learning_objectives}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Confidence rating */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Star className="h-4 w-4 text-warning" />
                        Your Confidence
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className="flex items-center gap-1"
                          role="group"
                          aria-label="Confidence rating"
                          onMouseLeave={() => setHoverLevel(null)}
                        >
                          {[1, 2, 3, 4, 5].map((level) => (
                            <button
                              key={level}
                              type="button"
                              aria-label={`Set confidence to ${CONFIDENCE_LABELS[level]}`}
                              className={cn(
                                'transition-all duration-150 cursor-pointer focus-ring rounded p-0.5',
                                displayLevel >= level ? 'text-warning scale-110' : 'text-foreground-muted/40 hover:text-warning/60'
                              )}
                              onMouseEnter={() => setHoverLevel(level)}
                              onClick={() => handleConfidenceChange(level)}
                            >
                              <Star
                                className="h-6 w-6"
                                fill={displayLevel >= level ? 'currentColor' : 'none'}
                              />
                            </button>
                          ))}
                        </div>
                        {displayLevel > 0 && (
                          <span className={cn('text-sm font-semibold', CONFIDENCE_COLORS[displayLevel])}>
                            {CONFIDENCE_LABELS[displayLevel]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status toggle */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                        Study Status
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            aria-pressed={currentStatus === opt.value}
                            onClick={() => handleStatusChange(opt.value)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer focus-ring',
                              currentStatus === opt.value ? opt.activeClasses : opt.classes
                            )}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Navigation controls ──────────────────────────────────────── */}
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={goToPrev}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary hover:shadow-sm transition-all duration-200 cursor-pointer focus-ring"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="text-xs text-foreground-muted font-medium tabular-nums">
                  {selectedTopicIdx + 1} / {totalCount}
                </span>

                <button
                  onClick={goToNext}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary hover:shadow-sm transition-all duration-200 cursor-pointer focus-ring"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Topic list horizontal quick nav */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {topics.map((topic, idx) => {
                  const tp = progressRecords.find(r => r.topic_id === topic.id);
                  const isComplete = tp?.status === 'completed';
                  const isActive = idx === selectedTopicIdx;

                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicIdx(idx)}
                      title={topic.title}
                      className={cn(
                        'w-2.5 h-2.5 rounded-full transition-all duration-200 cursor-pointer focus-ring',
                        isActive
                          ? 'bg-primary scale-125'
                          : isComplete
                            ? 'bg-success/60'
                            : 'bg-border hover:bg-foreground-muted/40'
                      )}
                      aria-label={`Go to topic ${idx + 1}: ${topic.title}`}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            /* Empty topics state */
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 rounded-xl border border-border bg-background-card p-10 text-center">
              <div className="inline-flex rounded-2xl bg-primary/10 p-4 text-primary">
                <BookOpen className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground">No topics available</h2>
              <p className="text-sm text-foreground-muted leading-relaxed max-w-sm">
                This subject doesn&apos;t have any topics yet. Check back later or contact your curriculum administrator.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
