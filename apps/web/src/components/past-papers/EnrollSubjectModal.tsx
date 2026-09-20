'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Enroll Subject Modal
// CAIE / Edexcel IGCSE: per-subject enrollment
// Edexcel IAL: cash-in award enrollment (primary) + optional single-unit mode
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, Plus, Check, GraduationCap } from 'lucide-react';
import { getAllCurriculumsWithSubjects } from '@/actions/past-papers';
import {
  enrollInSubject,
  unenrollFromSubject,
  getUserCashInEnrollments,
  type UserCashInEnrollmentRow,
} from '@/actions/curriculum';
import { IalCashInEnrollPanel } from './IalCashInEnrollPanel';
import { cn } from '@/lib/utils';

interface EnrollSubjectModalProps {
  userId: string;
  enrolledSubjectIds: string[];
  onClose: () => void;
  onEnrolled: () => void;
}

type CurriculumRow = {
  id: string;
  name: string;
  code: string;
  subjects: {
    id: string;
    name: string;
    code: string;
    curriculum_id: string;
    description: string | null;
    color_code: string | null;
  }[];
};

export function EnrollSubjectModal({
  userId,
  enrolledSubjectIds,
  onClose,
  onEnrolled,
}: EnrollSubjectModalProps) {
  const [curriculums, setCurriculums] = useState<CurriculumRow[]>([]);
  const [cashInEnrollments, setCashInEnrollments] = useState<UserCashInEnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>('');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [ialUnitMode, setIalUnitMode] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [data, cashIns] = await Promise.all([
      getAllCurriculumsWithSubjects(),
      getUserCashInEnrollments(userId),
    ]);
    setCurriculums(data as CurriculumRow[]);
    setCashInEnrollments(cashIns);
    setSelectedCurriculumId((prev) => prev || data[0]?.id || '');
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeCurriculum = curriculums.find((c) => c.id === selectedCurriculumId);
  const isEdexcelIal = activeCurriculum?.code === 'EDEXCEL_IAL';

  const handleEnroll = async (subjectId: string) => {
    if (!activeCurriculum) return;
    setEnrollingId(subjectId);
    try {
      const res = await enrollInSubject(userId, activeCurriculum.id, subjectId);
      if (res.success) onEnrolled();
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

  const handleIalChanged = async () => {
    await loadData();
    onEnrolled();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-background-card p-6 sm:p-8 shadow-2xl space-y-6 text-foreground">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
              <GraduationCap className="w-3.5 h-3.5" />
              Curriculum Enrollment
            </div>
            <h3 className="text-xl font-bold text-foreground">Add Subjects to Your Study Plan</h3>
            <p className="text-xs text-foreground-muted">
              {isEdexcelIal
                ? 'Enroll by IAL cash-in award (recommended) or add individual units.'
                : 'Select an exam board and add the subjects you are preparing for.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border scrollbar-none">
          {curriculums.map((curr) => (
            <button
              key={curr.id}
              type="button"
              onClick={() => {
                setSelectedCurriculumId(curr.id);
                setIalUnitMode(false);
              }}
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

        {isEdexcelIal && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIalUnitMode(false)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                !ialUnitMode
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-border text-foreground-muted hover:text-foreground'
              )}
            >
              Cash-in awards
            </button>
            <button
              type="button"
              onClick={() => setIalUnitMode(true)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                ialUnitMode
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-border text-foreground-muted hover:text-foreground'
              )}
            >
              Single units
            </button>
          </div>
        )}

        <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-foreground-muted">
              Loading available subjects...
            </div>
          ) : isEdexcelIal && !ialUnitMode ? (
            <IalCashInEnrollPanel
              userId={userId}
              cashInEnrollments={cashInEnrollments}
              onChanged={handleIalChanged}
            />
          ) : activeCurriculum?.subjects && activeCurriculum.subjects.length > 0 ? (
            activeCurriculum.subjects.map((subj) => {
              const isEnrolled = enrolledSubjectIds.includes(subj.id);
              const isProcessing = enrollingId === subj.id;

              return (
                <div
                  key={subj.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border bg-background-secondary/50 hover:bg-background-secondary transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                        {subj.code}
                      </span>
                      <h4 className="text-sm font-bold text-foreground truncate">{subj.name}</h4>
                    </div>
                    {subj.description && (
                      <p className="text-xs text-foreground-muted line-clamp-1">{subj.description}</p>
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
                      isProcessing ? (
                        'Removing...'
                      ) : (
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
                        Add {isEdexcelIal ? 'unit' : 'subject'}
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
            </div>
          )}
        </div>

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
