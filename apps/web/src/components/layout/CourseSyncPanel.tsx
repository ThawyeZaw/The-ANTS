'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — CourseSyncPanel
// Dashboard section showing enrolled courses and their synced exams/countdowns.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import {
  GraduationCap,
  Clock,
  BookOpen,
  ArrowRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import { slugify } from '@/lib/utils';
import { useCourseSync } from '@/hooks/useCourseSync';

export default function CourseSyncPanel() {
  const { syncedCourses, hasEnrollments, totalResources } = useCourseSync();

  if (!hasEnrollments) {
    return (
      <div className="dash-panel p-6 h-full">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </span>
            My Courses
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-background-secondary/40 px-6 py-10">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-background-card border border-border mb-3">
            <BookOpen className="h-5 w-5 text-foreground-muted" />
          </span>
          <p className="text-sm font-semibold text-foreground">No courses enrolled yet</p>
          <p className="text-xs text-foreground-muted mt-1.5 max-w-xs leading-relaxed">
            Browse the library and enrol in courses to see your synced resources here.
          </p>
          <Link href="/courses" className="dash-cta mt-5 focus-ring">
            <Plus className="h-3.5 w-3.5" />
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-panel p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <GraduationCap className="h-4 w-4 text-primary" />
            </span>
            My Courses
          </h2>
          <p className="text-xs text-foreground-muted mt-1 pl-10">
            {syncedCourses.length} course{syncedCourses.length !== 1 ? 's' : ''}
            {' · '}
            {totalResources} synced resource{totalResources !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/courses"
          className="dash-action-btn shrink-0 focus-ring"
        >
          <Plus className="h-3.5 w-3.5" />
          Manage
        </Link>
      </div>

      <div className="space-y-3">
        {syncedCourses.map((course) => (
          <div
            key={course.curriculumId}
            className="rounded-xl border border-border overflow-hidden bg-background-card/50 transition-shadow duration-200 hover:shadow-sm"
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-background-secondary/40">
              <GraduationCap className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {course.curriculumTitle}
                </h3>
              </div>
              {course.examBoard && (
                <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium font-mono text-primary">
                  {course.examBoard}
                </span>
              )}
            </div>

            <div className="divide-y divide-border">
              {course.subjects.map((subject) => {
                const resourceTotal = subject.exams.length + subject.countdowns.length;
                const lessonHref = `/lessons/${slugify(course.curriculumTitle)}/${slugify(subject.subjectTitle)}`;

                return (
                  <div
                    key={subject.subjectId}
                    className="dash-course-row flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {subject.subjectTitle}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <Link
                          href={lessonHref}
                          className="inline-flex items-center gap-1 text-[11px] text-foreground-muted hover:text-primary transition-colors"
                        >
                          <BookOpen className="h-3 w-3" />
                          <span>{subject.topicCount} topics</span>
                        </Link>

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

                    <Link href={lessonHref} className="dash-study-link shrink-0 ml-3 focus-ring">
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
