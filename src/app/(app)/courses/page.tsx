'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Course Manager Page
// Route: /courses — Multi-step wizard for building academic profiles.
// ──────────────────────────────────────────────────────────────────────────────

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCourseManager } from '@/hooks/useCourseManager';
import BackButton from '@/components/ui/BackButton';
import CourseManagerWizard from '@/components/courses/CourseManagerWizard';
import {
  BookOpen, GraduationCap, Clock, ArrowRight, Pencil,
  Trash2, Target, Plus, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ── Onboarding banner for first-time users ──────────────────────────────────

function OnboardingBanner() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-8 text-center animate-fade-in">
      <div className="inline-flex rounded-2xl bg-primary/10 p-4 text-primary mb-4">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        Build Your Academic Profile
      </h2>
      <p className="text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
        Set up your course manager by selecting your curricula, subjects, and exam targets.
        This will unlock lesson tracking, exam countdowns, and personalised study tools.
      </p>
    </div>
  );
}

// ── Enrolled subjects list ──────────────────────────────────────────────────

function EnrolledSubjects() {
  const { enrollments, unenroll } = useCourseManager();

  if (enrollments.length === 0) return null;

  // Group by curriculum
  const grouped: Record<string, typeof enrollments> = {};
  for (const enr of enrollments) {
    const key = enr.curriculum_id;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(enr);
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

      {Object.entries(grouped).map(([curriculumId, items]) => {
        const curriculum = items[0].curriculum;
        return (
          <div key={curriculumId} className="rounded-2xl border border-border bg-background-card overflow-hidden">
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
            <div className="divide-y divide-border">
              {items.map(enr => (
                <div key={enr.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-foreground-muted" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{enr.subject.title}</p>
                      {enr.exam ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-amber-600">
                            {enr.exam.exam_series} — {new Date(enr.exam.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-foreground-muted mt-0.5">No exam target</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => unenroll(enr.id)}
                      className="rounded-lg p-2 text-foreground-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Remove course"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function CourseManagerPage() {
  const { user, isLoading: authLoading } = useAuth();
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

  const hasEnrollments = enrollments.length > 0;

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <BackButton href="/dashboard" label="Back" />

      {/* Header */}
      <div className="mt-4 mb-8">
        <p className="text-sm font-medium text-primary">Learn</p>
        <h1 className="text-3xl font-bold text-foreground mt-1 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Course Manager
        </h1>
        <p className="text-foreground-muted mt-2 max-w-2xl text-sm leading-relaxed">
          Build your academic profile by selecting curricula, subjects, and exam targets.
        </p>
      </div>

      {/* Onboarding banner */}
      {!hasEnrollments && !showWizard && <OnboardingBanner />}

      {/* Start wizard button */}
      {!showWizard && (
        <div className={cn('mb-8', hasEnrollments ? 'mt-4' : 'mt-6')}>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            {hasEnrollments ? 'Add More Courses' : 'Get Started'}
          </button>
        </div>
      )}

      {/* Wizard */}
      {showWizard && (
        <div className="mb-8">
          {hasEnrollments && (
            <button
              onClick={() => setShowWizard(false)}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              Hide wizard
            </button>
          )}
          <div className="rounded-2xl border border-border bg-background-card p-1">
            <CourseManagerWizard />
          </div>
        </div>
      )}

      {/* Enrolled subjects */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }>
        <EnrolledSubjects />
      </Suspense>
    </div>
  );
}
