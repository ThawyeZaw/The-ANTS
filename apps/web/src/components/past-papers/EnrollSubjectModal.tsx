'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Enroll Subject Modal
// Allows students to add subjects/units across CAIE & Edexcel curricula
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Plus, Check, GraduationCap, Sparkles } from 'lucide-react';
import { getAllCurriculumsWithSubjects } from '@/actions/past-papers';
import { enrollInSubject, unenrollFromSubject } from '@/actions/curriculum';
import { cn } from '@/lib/utils';

interface EnrollSubjectModalProps {
  userId: string;
  enrolledSubjectIds: string[];
  onClose: () => void;
  onEnrolled: () => void;
}

export function EnrollSubjectModal({
  userId,
  enrolledSubjectIds,
  onClose,
  onEnrolled,
}: EnrollSubjectModalProps) {
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>('');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getAllCurriculumsWithSubjects();
      setCurriculums(data);
      if (data.length > 0) {
        setSelectedCurriculumId(data[0].id);
      }
      setLoading(false);
    }
    load();
  }, []);

  const activeCurriculum = curriculums.find((c) => c.id === selectedCurriculumId);

  const handleEnroll = async (subjectId: string) => {
    if (!activeCurriculum) return;
    setEnrollingId(subjectId);
    try {
      const res = await enrollInSubject(userId, activeCurriculum.id, subjectId);
      if (res.success) {
        onEnrolled();
      }
    } catch (err) {
      console.error('Failed to enroll subject:', err);
    } finally {
      setEnrollingId(null);
    }
  };

  const handleUnenroll = async (subjectId: string) => {
    setEnrollingId(subjectId);
    try {
      const res = await unenrollFromSubject(userId, subjectId);
      if (res.success) onEnrolled();
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-background-card p-6 sm:p-8 shadow-2xl space-y-6 text-foreground">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
              <GraduationCap className="w-3.5 h-3.5" />
              Curriculum Enrollment
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Add Subjects to Your Study Plan
            </h3>
            <p className="text-xs text-foreground-muted">
              Select an exam board and add the subjects or units you are preparing for.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Board Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border scrollbar-none">
          {curriculums.map((curr) => (
            <button
              key={curr.id}
              onClick={() => setSelectedCurriculumId(curr.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                selectedCurriculumId === curr.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
              )}
            >
              {curr.name}
            </button>
          ))}
        </div>

        {/* Subjects List */}
        <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-foreground-muted">
              Loading available subjects...
            </div>
          ) : activeCurriculum?.subjects && activeCurriculum.subjects.length > 0 ? (
            activeCurriculum.subjects.map((subj: any) => {
              const isEnrolled = enrolledSubjectIds.includes(subj.id);
              const isProcessing = enrollingId === subj.id;

              return (
                <div
                  key={subj.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border bg-background-secondary/50 hover:bg-background-secondary transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                        {subj.code}
                      </span>
                      <h4 className="text-sm font-bold text-foreground">
                        {subj.name}
                      </h4>
                    </div>
                    {subj.description && (
                      <p className="text-xs text-foreground-muted line-clamp-1">
                        {subj.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => (isEnrolled ? handleUnenroll(subj.id) : handleEnroll(subj.id))}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0',
                      isEnrolled
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-error/10 hover:text-error hover:border-error/30'
                        : 'bg-primary text-white hover:bg-primary-hover shadow-xs'
                    )}
                  >
                    {isEnrolled ? (
                      isProcessing ? 'Removing...' : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Enrolled · Remove
                        </>
                      )
                    ) : isProcessing ? (
                      'Adding...'
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Add Subject
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-foreground-muted space-y-2">
              <BookOpen className="w-8 h-8 text-foreground-muted mx-auto opacity-50" />
              <p>No subjects seeded for this board yet.</p>
              <p className="text-[11px] text-foreground-muted/70">
                Execute the seed SQL from docs/seeds/exam-data-spec.md to populate subjects.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-background-secondary text-foreground text-xs font-bold hover:bg-background-secondary/80 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
