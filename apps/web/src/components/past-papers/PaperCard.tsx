'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Past Paper Card Component
// Displays status, marks, calculated grade, and quick actions.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Clock,
  Award,
  CheckCircle2,
  Circle,
  SkipForward,
  Calculator,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PastPaperData } from './InlineGradeCalc';
import { InlineGradeCalc } from './InlineGradeCalc';
import type { ComponentMark } from '@/lib/db';

export interface UserPaperRecord {
  id: string;
  past_paper_id: string;
  status: 'not_done' | 'done' | 'skipped';
  component_marks?: ComponentMark[] | null;
  raw_score?: number | null;
  max_score?: number | null;
  percentage?: number | null;
  calculated_grade?: string | null;
  calculated_ums?: number | null;
  notes?: string | null;
}

interface PaperCardProps {
  paper: PastPaperData;
  record?: UserPaperRecord | null;
  onStatusChange: (
    paperId: string,
    status: 'not_done' | 'done' | 'skipped',
    data?: Partial<UserPaperRecord>
  ) => Promise<void>;
}

export function PaperCard({ paper, record, onStatusChange }: PaperCardProps) {
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const status = record?.status || 'not_done';
  const isIAL = paper.qualification === 'IAL';
  const maxMark = paper.total_marks || 100;

  const handleSetStatus = async (newStatus: 'not_done' | 'done' | 'skipped') => {
    setStatusMenuOpen(false);
    if (newStatus === 'done' && !record?.calculated_grade) {
      // If marking as done and no mark is entered yet, open the grade calculator modal
      setShowCalcModal(true);
      return;
    }
    await onStatusChange(paper.id, newStatus);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Done
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <SkipForward className="w-3.5 h-3.5" />
            Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-background-secondary text-foreground-muted border border-border">
            <Circle className="w-3 h-3" />
            Not Done
          </span>
        );
    }
  };

  const getGradeBadge = (grade: string) => {
    let style = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (['A*', '9', '8'].includes(grade)) {
      style = 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
    } else if (['A', '7'].includes(grade)) {
      style = 'bg-sky-500/15 text-sky-500 border-sky-500/30';
    } else if (['B', '6'].includes(grade)) {
      style = 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30';
    } else if (['C', '5', '4'].includes(grade)) {
      style = 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    }

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-extrabold border shadow-2xs',
          style
        )}
      >
        <Award className="w-3 h-3" />
        Grade {grade}
      </span>
    );
  };

  return (
    <>
      <div
        className={cn(
          'group relative flex flex-col justify-between p-5 sm:p-6 rounded-3xl border transition-all duration-200',
          status === 'done'
            ? 'bg-background-card border-emerald-500/30 hover:border-emerald-500/50 shadow-xs'
            : 'bg-background-card border-border hover:border-primary/40 hover:bg-background-secondary/40 shadow-xs'
        )}
      >
        {/* Top bar: Series & Status menu */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {paper.year} {paper.series}
              </span>
              <span className="text-foreground-muted text-xs">•</span>
              <span className="text-xs font-mono text-foreground-secondary">
                {paper.syllabus_code}
              </span>
            </div>
            <h4 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
              {paper.title || `Paper ${paper.paper_number}`}
              {paper.variant ? ` (v${paper.variant})` : ''}
            </h4>
          </div>

          {/* Status Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen((v) => !v)}
              className="focus:outline-none transition-transform active:scale-95"
            >
              {getStatusBadge()}
            </button>

            {statusMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setStatusMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-30 w-36 rounded-2xl border border-border bg-background-card p-1.5 shadow-xl space-y-1 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => handleSetStatus('not_done')}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-background-secondary flex items-center gap-2 text-foreground-secondary"
                  >
                    <Circle className="w-3 h-3 text-foreground-muted" />
                    Not Done
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStatus('done')}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-emerald-500/10 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Mark Done
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStatus('skipped')}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-amber-500/10 flex items-center gap-2 text-amber-600 dark:text-amber-400"
                  >
                    <SkipForward className="w-3 h-3 text-amber-500" />
                    Skip Paper
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Paper details & Results */}
        <div className="space-y-3 my-2">
          <div className="flex items-center gap-4 text-xs text-foreground-muted">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-foreground-muted" />
              {paper.total_marks ? `${paper.total_marks} marks` : '100 marks'}
            </span>
            <span className="font-mono">
              {paper.exam_board} • {paper.qualification}
            </span>
          </div>

          {/* Achieved score snippet if done */}
          {status === 'done' && record?.calculated_grade && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background-secondary border border-border">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-foreground">
                    {record.raw_score ?? 0} / {record.max_score ?? maxMark}
                  </span>
                  {record.percentage !== undefined && record.percentage !== null && (
                    <span className="text-xs font-mono text-foreground-muted">
                      ({record.percentage}%)
                    </span>
                  )}
                </div>
                {isIAL && record.calculated_ums !== undefined && record.calculated_ums !== null && (
                  <span className="text-[11px] font-mono text-primary block">
                    {record.calculated_ums} UMS
                  </span>
                )}
              </div>
              {getGradeBadge(record.calculated_grade)}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="pt-3 mt-2 border-t border-border flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowCalcModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
          >
            <Calculator className="w-3.5 h-3.5" />
            {record?.calculated_grade ? 'Update Grade' : 'Calculate Grade'}
          </button>

          {status !== 'done' && (
            <button
              type="button"
              onClick={() => setShowCalcModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all"
            >
              <Sparkles className="w-3 h-3" />
              Record Marks
            </button>
          )}
        </div>
      </div>

      {/* Grade Calculator Modal */}
      {showCalcModal && (
        <InlineGradeCalc
          paper={paper}
          initialMarks={record?.component_marks || undefined}
          onClose={() => setShowCalcModal(false)}
          onSave={async (res) => {
            await onStatusChange(paper.id, res.status, {
              component_marks: res.componentMarks,
              raw_score: res.rawScore,
              max_score: res.maxScore,
              percentage: res.percentage,
              calculated_grade: res.calculatedGrade,
              calculated_ums: res.calculatedUms,
              notes: res.notes,
            });
          }}
        />
      )}
    </>
  );
}
