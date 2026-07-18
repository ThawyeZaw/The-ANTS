'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CourseManagerWizard
// 3-step wizard: Select curriculum → Select subjects → Confirm
// Exam targets have been removed. Tracking is automatic from subject metadata.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, ChevronRight, ChevronLeft, Check,
  GraduationCap, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCourseManager } from '@/hooks/useCourseManager';
import type { CurriculumSummary, SubjectSummary } from '@/hooks/useCourseManager';

// ── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

interface SelectedSubject {
  curriculum_id: string;
  subject_id: string;
  subject: SubjectSummary;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CourseManagerWizard() {
  const { user } = useAuth();
  const router = useRouter();

  const {
    allCurriculums,
    getSubjectsForCurriculum,
    enroll,
    enrollments,
    enrolledCurriculumIds,
  } = useCourseManager();

  const [step, setStep] = useState<Step>(1);
  const [selectedCurriculumIds, setSelectedCurriculumIds] = useState<Set<string>>(new Set(enrolledCurriculumIds));
  const [selectedSubjects, setSelectedSubjects] = useState<Map<string, SelectedSubject>>(new Map());
  const [expandedCurriculum, setExpandedCurriculum] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  // Pre-populate for users with existing enrollments
  useMemo(() => {
    if (enrollments.length > 0 && selectedCurriculumIds.size === 0) {
      setSelectedCurriculumIds(new Set(enrolledCurriculumIds));
    }
  }, [enrollments, enrolledCurriculumIds, selectedCurriculumIds.size]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const selectedCurriculums = useMemo(() =>
    allCurriculums.filter(c => selectedCurriculumIds.has(c.id)),
    [allCurriculums, selectedCurriculumIds]
  );

  const subjectKey = (curriculumId: string, subjectId: string) => `${curriculumId}::${subjectId}`;

  const selectedSubjectCount = useMemo(() => {
    return [...selectedSubjects.values()].filter(
      s => selectedCurriculumIds.has(s.curriculum_id)
    ).length;
  }, [selectedSubjects, selectedCurriculumIds]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleCurriculum = useCallback((id: string) => {
    setSelectedCurriculumIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectedSubjects(prevSubjects => {
          const nextSubjects = new Map(prevSubjects);
          for (const [key, val] of nextSubjects) {
            if (val.curriculum_id === id) nextSubjects.delete(key);
          }
          return nextSubjects;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSubject = useCallback((curriculumId: string, subject: SubjectSummary) => {
    const key = subjectKey(curriculumId, subject.id);
    setSelectedSubjects(prev => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, {
          curriculum_id: curriculumId,
          subject_id: subject.id,
          subject,
        });
      }
      return next;
    });
  }, []);

  const canProceedStep1 = selectedCurriculumIds.size > 0;
  const canProceedStep2 = selectedSubjectCount > 0;

  const goToStep = (nextStep: Step) => setStep(nextStep);

  // ── Confirm & Save ────────────────────────────────────────────────────────

  const handleConfirm = useCallback(async () => {
    if (!user) return;
    setEnrolling(true);

    const subjectsToEnroll = [...selectedSubjects.values()].filter(
      s => selectedCurriculumIds.has(s.curriculum_id)
    );

    const alreadyEnrolledKeys = new Set(
      enrollments.map(e => subjectKey(e.curriculum_id, e.subject_id))
    );

    let successCount = 0;

    for (const subj of subjectsToEnroll) {
      const key = subjectKey(subj.curriculum_id, subj.subject_id);
      if (!alreadyEnrolledKeys.has(key)) {
        const result = await enroll(subj.curriculum_id, subj.subject_id);
        if (result.success) successCount++;
      }
    }

    setEnrolling(false);
    router.push('/lessons');
  }, [user, selectedSubjects, selectedCurriculumIds, enrollments, enroll, router]);

  // ── Step content renderers ────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex rounded-2xl bg-primary/10 p-4 text-primary mb-4">
          <BookOpen className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Select Your Curricula</h2>
        <p className="mt-2 text-sm text-foreground-muted max-w-md mx-auto">
          Choose one or more qualification programs you&apos;re studying.
          You can always add more later.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {allCurriculums.map(curriculum => {
          const isSelected = selectedCurriculumIds.has(curriculum.id);
          return (
            <button
              key={curriculum.id}
              onClick={() => toggleCurriculum(curriculum.id)}
              className={cn(
                'relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-200 cursor-pointer',
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                  : 'border-border bg-background-card hover:border-border-hover hover:bg-background-card/80'
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <GraduationCap className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-foreground-muted')} />
                <h3 className="font-semibold text-foreground">{curriculum.title}</h3>
              </div>
              <p className="text-sm text-foreground-muted leading-relaxed">
                {curriculum.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {curriculum.qualification && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {curriculum.qualification}
                  </span>
                )}
                {curriculum.exam_board && (
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                    {curriculum.exam_board}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-2">
            <BookOpen size={18} />
            Explore the Courses Library
          </h3>
          <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-1 max-w-md">
            Browse verified curriculum templates, filter by exam board, and auto-populate your Lesson Tracker.
          </p>
        </div>
        <button
          onClick={() => router.push('/library/courses')}
          className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          Browse Library
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex rounded-2xl bg-primary/10 p-4 text-primary mb-4">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Select Your Subjects</h2>
        <p className="mt-2 text-sm text-foreground-muted max-w-md mx-auto">
          Choose which subjects you want to track for each curriculum.
        </p>
      </div>

      {selectedCurriculums.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground-muted">No curricula selected. Go back and select at least one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedCurriculums.map(curriculum => {
            const subjects = getSubjectsForCurriculum(curriculum.id);
            const isExpanded = expandedCurriculum === curriculum.id;
            const selectedCount = subjects.filter(s => selectedSubjects.has(subjectKey(curriculum.id, s.id))).length;

            return (
              <div key={curriculum.id} className="rounded-2xl border border-border bg-background-card overflow-hidden">
                <button
                  onClick={() => setExpandedCurriculum(isExpanded ? null : curriculum.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-background-secondary/50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{curriculum.title}</h3>
                    {selectedCount > 0 && (
                      <p className="text-xs text-primary mt-1">{selectedCount} subject{selectedCount !== 1 ? 's' : ''} selected</p>
                    )}
                  </div>
                  <ChevronRight className={cn(
                    'h-5 w-5 text-foreground-muted transition-transform',
                    isExpanded && 'rotate-90'
                  )} />
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-2">
                    {subjects.map(subject => {
                      const isSubjSelected = selectedSubjects.has(subjectKey(curriculum.id, subject.id));
                      return (
                        <button
                          key={subject.id}
                          onClick={() => toggleSubject(curriculum.id, subject)}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all duration-150',
                            isSubjSelected
                              ? 'bg-primary/10 border border-primary/30'
                              : 'hover:bg-background-secondary border border-transparent'
                          )}
                        >
                          <div className={cn(
                            'h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                            isSubjSelected
                              ? 'bg-primary border-primary'
                              : 'border-border'
                          )}>
                            {isSubjSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{subject.title}</p>
                            {subject.description && (
                              <p className="text-xs text-foreground-muted mt-0.5 truncate">{subject.description}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {subjects.length === 0 && (
                      <p className="text-sm text-foreground-muted py-3 text-center">
                        No subjects available for this curriculum yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => {
    const subjectsList = [...selectedSubjects.values()].filter(s => selectedCurriculumIds.has(s.curriculum_id));

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex rounded-2xl bg-emerald-500/10 p-4 text-emerald-500 mb-4">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Review &amp; Confirm</h2>
          <p className="mt-2 text-sm text-foreground-muted max-w-md mx-auto">
            Review your selections before saving. Your course manager will sync with the lesson tracker automatically.
          </p>
        </div>

        {/* Curricula summary */}
        <div className="rounded-2xl border border-border bg-background-card divide-y divide-border">
          {selectedCurriculums.map(curriculum => {
            const curriculumSubjects = subjectsList.filter(s => s.curriculum_id === curriculum.id);
            return (
              <div key={curriculum.id} className="p-5">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {curriculum.title}
                </h3>
                <div className="mt-3 space-y-2">
                  {curriculumSubjects.length === 0 ? (
                    <p className="text-sm text-foreground-muted">No subjects selected.</p>
                  ) : (
                    curriculumSubjects.map(subj => (
                      <div key={subj.subject_id} className="flex items-center rounded-lg bg-background-secondary px-3 py-2.5">
                        <span className="text-sm text-foreground">{subj.subject.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-background-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{selectedCurriculums.length}</p>
            <p className="text-xs text-foreground-muted mt-1">Curricula</p>
          </div>
          <div className="rounded-xl border border-border bg-background-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{selectedSubjectCount}</p>
            <p className="text-xs text-foreground-muted mt-1">Subjects</p>
          </div>
          <div className="rounded-xl border border-border bg-background-card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{subjectsList.length}</p>
            <p className="text-xs text-foreground-muted mt-1">To Enrol</p>
          </div>
        </div>
      </div>
    );
  };

  // ── Auth guard ────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-bold text-foreground">Authentication Required</h2>
        <p className="mt-2 text-sm text-foreground-muted">Please log in to access the Course Manager.</p>
      </div>
    );
  }

  // ── Steps indicator ───────────────────────────────────────────────────────

  const steps = [
    { num: 1, label: 'Curricula' },
    { num: 2, label: 'Subjects' },
    { num: 3, label: 'Confirm' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (s.num < step || s.num === 1) goToStep(s.num as Step);
              }}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                step === s.num
                  ? 'bg-primary text-primary-foreground'
                  : step > s.num
                    ? 'bg-primary/20 text-primary cursor-pointer'
                    : 'bg-border text-foreground-muted'
              )}
            >
              <span className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                step > s.num ? 'bg-primary text-primary-foreground' : ''
              )}>
                {step > s.num ? <Check className="h-3 w-3" /> : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={cn(
                'h-0.5 w-6 rounded',
                step > s.num ? 'bg-primary' : 'bg-border'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* Navigation buttons */}
      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={() => step > 1 && goToStep((step - 1) as Step)}
          disabled={step === 1}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
            step === 1
              ? 'text-foreground-muted cursor-not-allowed'
              : 'border border-border text-foreground hover:bg-background-secondary'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          {step < 3 ? (
            <button
              onClick={() => goToStep((step + 1) as Step)}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
              className={cn(
                'inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200',
                ((step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2))
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-primary-hover'
              )}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={enrolling}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200',
                enrolling ? 'opacity-50 cursor-wait' : 'hover:bg-emerald-700'
              )}
            >
              {enrolling ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirm &amp; Go to Lesson Tracker
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
