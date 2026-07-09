'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — LessonTracker
// Main Lesson Tracker page component. Curriculum tabs → subject accordion →
// per-topic confidence + status cards.
// Belongs to: src/components/Lessons/  (BMK & ABC)
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { useLessons, type TopicStatus } from '@/hooks/useLessons';
import { cn } from '@/lib/utils';
import TopicCard from './TopicCard';
import RelatedContent from '@/components/ui/RelatedContent';

// ── Role-aware subtitle ───────────────────────────────────────────────────────

function usePageSubtitle() {
  const { isTeacher, isContributor, isMainContributor } = useRole();
  if (isTeacher) return 'Track your personal topic confidence across your enrolled curricula.';
  if (isContributor || isMainContributor)
    return 'Review your own topic mastery — and inform the curriculum content you create.';
  return 'Track your confidence on every topic and mark your study progress as you go.';
}

// ── Subject progress bar ──────────────────────────────────────────────────────

function SubjectProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-foreground-muted shrink-0">
        {completed}/{total}
      </span>
    </div>
  );
}

// ── Subject accordion row ─────────────────────────────────────────────────────

function SubjectAccordion({
  subject,
  completedCount,
  progressRecords,
  onConfidenceChange,
  onStatusChange,
}: {
  subject: ReturnType<typeof useLessons>['subjects'][number];
  completedCount: number;
  progressRecords: ReturnType<typeof useLessons>['progressRecords'];
  onConfidenceChange: (topicId: string, level: number) => void;
  onStatusChange: (topicId: string, status: TopicStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const total = subject.topics.length;

  return (
    <div className="rounded-xl border border-border bg-background-card overflow-hidden">
      {/* Header */}
      <button
        id={`subject-accordion-${subject.id}`}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-background-secondary/50 transition-colors duration-150 cursor-pointer focus-ring"
      >
        <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
          <Layers className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{subject.title}</p>
          {subject.description && (
            <p className="text-xs text-foreground-muted truncate mt-0.5">{subject.description}</p>
          )}
          <div className="mt-2 max-w-xs">
            <SubjectProgressBar completed={completedCount} total={total} />
          </div>
        </div>
        <div className="shrink-0 text-foreground-muted">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Topics */}
      {isOpen && (
        <div className="border-t border-border p-4 grid gap-3 sm:grid-cols-2 animate-slide-down">
          {subject.topics.length === 0 ? (
            <p className="text-sm text-foreground-muted col-span-2 py-4 text-center">
              No topics found for this subject.
            </p>
          ) : (
            subject.topics.map((topic) => {
              const progress = progressRecords.find((r) => r.topic_id === topic.id);
              return (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  progress={progress}
                  onConfidenceChange={onConfidenceChange}
                  onStatusChange={onStatusChange}
                />
              );
            })
          )}

          {/* Related Content for this subject */}
          {subject.topics.length > 0 && (
            <div className="col-span-1 sm:col-span-2 pt-4 border-t border-border mt-2">
              <RelatedContent
                curriculumId={subject.curriculum_id}
                subjectId={subject.id}
                maxItems={2}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LessonTracker() {
  const subtitle = usePageSubtitle();
  const {
    enrolledCurriculums,
    activeCurriculumId,
    activeCurriculum,
    subjects,
    progressRecords,
    getCurriculumTopicCount,
    getCurriculumCompletedCount,
    getSubjectCompletedCount,
    setSelectedCurriculumId,
    updateConfidence,
    updateStatus,
  } = useLessons();

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (enrolledCurriculums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-6 animate-fade-in">
        <div className="rounded-2xl border border-border bg-background-card p-10 text-center max-w-md w-full shadow-sm">
          <div className="inline-flex rounded-2xl bg-primary/10 p-4 text-primary mb-5">
            <BookOpen className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">No curricula enrolled</h2>
          <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
            Head over to Course Manager to enrol in a curriculum. Your topic progress will appear
            here once you&apos;re enrolled.
          </p>
          <Link
            href="/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors duration-150"
          >
            <Sparkles className="h-4 w-4" />
            Go to Course Manager
          </Link>
        </div>
      </div>
    );
  }

  // ── Overall stats for the active curriculum ──────────────────────────────────

  const totalTopics = activeCurriculum ? getCurriculumTopicCount(activeCurriculum) : 0;
  const completedTopics = activeCurriculum ? getCurriculumCompletedCount(activeCurriculum) : 0;
  const overallPct = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Learn</p>
          <h1 className="text-3xl font-bold text-foreground mt-1 flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            Lesson Tracker
          </h1>
          <p className="text-foreground-muted mt-2 max-w-2xl text-sm leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Overall progress pill */}
        {activeCurriculum && (
          <div className="shrink-0 flex items-center gap-3 rounded-xl border border-border bg-background-card px-5 py-3 shadow-sm">
            <div className="relative h-12 w-12 shrink-0">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeDasharray={`${overallPct} ${100 - overallPct}`}
                  strokeDashoffset="25"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                {overallPct}%
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">
                {completedTopics}/{totalTopics} topics
              </p>
              <p className="text-xs text-foreground-muted mt-0.5">completed</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Curriculum tab bar ───────────────────────────────────────────────── */}
      {enrolledCurriculums.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Curriculum tabs">
          {enrolledCurriculums.map((curriculum) => {
            const cTotal = getCurriculumTopicCount(curriculum);
            const cCompleted = getCurriculumCompletedCount(curriculum);
            const cPct = cTotal === 0 ? 0 : Math.round((cCompleted / cTotal) * 100);
            const isActive = curriculum.id === activeCurriculumId;

            return (
              <button
                key={curriculum.id}
                id={`curriculum-tab-${curriculum.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCurriculumId(curriculum.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer focus-ring',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-background-card text-foreground-secondary hover:border-border-hover hover:text-foreground'
                )}
              >
                <span>{curriculum.title}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-border text-foreground-muted'
                  )}
                >
                  {cPct}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Curriculum meta ──────────────────────────────────────────────────── */}
      {activeCurriculum && (
        <div className="rounded-xl border border-border bg-linear-to-br from-primary/5 to-accent/5 px-5 py-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">{activeCurriculum.title}</h2>
            {activeCurriculum.description && (
              <p className="text-sm text-foreground-muted mt-0.5 truncate">
                {activeCurriculum.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {activeCurriculum.qualification && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {activeCurriculum.qualification}
              </span>
            )}
            {activeCurriculum.exam_board && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                {activeCurriculum.exam_board}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Subject accordion list ───────────────────────────────────────────── */}
      {subjects.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-8 text-center">
          <Layers className="mx-auto h-8 w-8 text-foreground-muted" />
          <p className="mt-3 font-semibold text-foreground">No subjects yet</p>
          <p className="text-sm text-foreground-muted">
            This curriculum has no subjects defined yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => (
            <SubjectAccordion
              key={subject.id}
              subject={subject}
              completedCount={getSubjectCompletedCount(subject)}
              progressRecords={progressRecords}
              onConfidenceChange={updateConfidence}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
