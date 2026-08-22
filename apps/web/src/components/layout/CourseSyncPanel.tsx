'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CourseSyncPanel
// Dashboard section showing enrolled courses and their synced resources.
// Automatically fetches notes, flashcards, exams, and countdowns linked to
// the user's enrolled curricula and subjects.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import {
  GraduationCap,
  NotebookPen,
  Layers,
  Clock,
  BookOpen,
  ArrowRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import { cn, slugify } from '@/lib/utils';
import { useCourseSync } from '@/hooks/useCourseSync';

export default function CourseSyncPanel() {
  const { syncedCourses, hasEnrollments, totalResources } = useCourseSync();

  // ── Empty state (no enrollments) ──────────────────────────────────────────

  if (!hasEnrollments) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-500" />
            My Courses
          </h2>
        </div>
        <div className="bg-background-secondary/50 border border-dashed border-border rounded-xl p-6 text-center">
          <BookOpen className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No courses enrolled yet</p>
          <p className="text-xs text-foreground-muted mt-1">
            Browse the library and enrol in courses to see your synced resources here.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  // ── Enrolled courses with synced resources ────────────────────────────────

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-500" />
            My Courses
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            {syncedCourses.length} course{syncedCourses.length !== 1 ? 's' : ''}
            {' · '}
            {totalResources} synced resource{totalResources !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/courses"
          className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Manage Courses
        </Link>
      </div>

      <div className="space-y-4">
        {syncedCourses.map((course) => (
          <div
            key={course.curriculumId}
            className="rounded-xl border border-border bg-background-card/50 overflow-hidden"
          >
            {/* Curriculum header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-background-secondary/30">
              <GraduationCap className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {course.curriculumTitle}
                </h3>
              </div>
              {course.examBoard && (
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {course.examBoard}
                </span>
              )}
            </div>

            {/* Subjects with resource counts */}
            <div className="divide-y divide-border">
              {course.subjects.map((subject) => {
                const resourceTotal =
                  subject.notes.length +
                  subject.flashcards.length +
                  subject.exams.length +
                  subject.countdowns.length;

                return (
                  <div
                    key={subject.subjectId}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {subject.subjectTitle}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {/* Lesson Tracker */}
                        <Link
                          href={`/lessons/${slugify(course.curriculumTitle)}/${slugify(subject.subjectTitle)}`}
                          className="inline-flex items-center gap-1 text-[11px] text-foreground-muted hover:text-primary transition-colors"
                        >
                          <BookOpen className="h-3 w-3" />
                          <span>{subject.topicCount} topics</span>
                        </Link>

                        {/* Resource badges */}
                        {subject.notes.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-500">
                            <NotebookPen className="h-3 w-3" />
                            {subject.notes.length}
                          </span>
                        )}
                        {subject.flashcards.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-violet-500">
                            <Layers className="h-3 w-3" />
                            {subject.flashcards.length}
                          </span>
                        )}
                        {subject.exams.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-500">
                            <Clock className="h-3 w-3" />
                            {subject.exams.length}
                          </span>
                        )}
                        {subject.countdowns.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-sky-500">
                            <Sparkles className="h-3 w-3" />
                            {subject.countdowns.length}
                          </span>
                        )}

                        {resourceTotal === 0 && (
                          <span className="text-[11px] text-foreground-muted">
                            No synced resources yet
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/lessons/${slugify(course.curriculumTitle)}/${slugify(subject.subjectTitle)}`}
                      className="shrink-0 ml-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-2"
                    >
                      Study
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
