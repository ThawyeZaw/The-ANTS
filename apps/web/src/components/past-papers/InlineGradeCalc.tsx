'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Inline Grade Calculator for Past Paper Tracker
// Context-aware: Edexcel IAL (UMS) vs CAIE / Edexcel IGCSE (Raw Grade Boundaries)
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import {
  X,
  Calculator,
  CheckCircle2,
  Award,
  Sparkles,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentMark } from '@/lib/db';

export interface BoundaryItem {
  id: string;
  grade: string;
  min_mark: number;
  max_mark?: number | null;
  ums_min?: number | null;
  ums_max?: number | null;
}

export interface PastPaperData {
  id: string;
  exam_board: string;
  qualification: string;
  subject: string;
  syllabus_code: string;
  year: number;
  series: string;
  paper_number: string;
  variant?: string | null;
  title?: string | null;
  total_marks?: number | null;
  gradeBoundaries?: BoundaryItem[];
}

interface InlineGradeCalcProps {
  paper: PastPaperData;
  initialMarks?: ComponentMark[];
  onClose: () => void;
  onSave: (result: {
    status: 'done';
    componentMarks: ComponentMark[];
    rawScore: number;
    maxScore: number;
    percentage: number;
    calculatedGrade: string;
    calculatedUms?: number;
    notes?: string;
  }) => Promise<void>;
}

export function InlineGradeCalc({
  paper,
  initialMarks,
  onClose,
  onSave,
}: InlineGradeCalcProps) {
  const isIAL = paper.qualification === 'IAL';
  const defaultMaxMark = paper.total_marks || 100;

  const [rawScoreInput, setRawScoreInput] = useState<string>(() => {
    if (initialMarks && initialMarks.length > 0) {
      return String(initialMarks[0].raw_mark);
    }
    return '';
  });

  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const rawScore = parseFloat(rawScoreInput) || 0;
  const percentage = defaultMaxMark > 0 ? (rawScore / defaultMaxMark) * 100 : 0;

  // Grade calculation
  const calculationResult = useMemo(() => {
    const boundaries = [...(paper.gradeBoundaries || [])].sort(
      (a, b) => b.min_mark - a.min_mark
    );

    if (boundaries.length === 0) {
      // Fallback standard percentages if boundaries not yet seeded
      let fallbackGrade = 'U';
      if (percentage >= 80) fallbackGrade = 'A*';
      else if (percentage >= 70) fallbackGrade = 'A';
      else if (percentage >= 60) fallbackGrade = 'B';
      else if (percentage >= 50) fallbackGrade = 'C';
      else if (percentage >= 40) fallbackGrade = 'D';
      else if (percentage >= 30) fallbackGrade = 'E';

      return {
        grade: fallbackGrade,
        ums: isIAL ? Math.min(100, Math.round(percentage)) : undefined,
        boundaryMatched: null,
      };
    }

    // Match against official boundaries
    let matchedGrade = 'U';
    let matchedBoundary: BoundaryItem | null = null;

    for (const b of boundaries) {
      if (rawScore >= b.min_mark) {
        matchedGrade = b.grade;
        matchedBoundary = b;
        break;
      }
    }

    // UMS interpolation for Edexcel IAL
    let calculatedUms: number | undefined = undefined;
    if (isIAL) {
      if (matchedBoundary && matchedBoundary.ums_min !== null && matchedBoundary.ums_min !== undefined) {
        const umsMin = matchedBoundary.ums_min;
        const umsMax = matchedBoundary.ums_max ?? (umsMin + 9);
        const minM = matchedBoundary.min_mark;
        const maxM = matchedBoundary.max_mark ?? minM + 10;
        const span = maxM - minM > 0 ? maxM - minM : 1;
        const ratio = Math.min(1, Math.max(0, (rawScore - minM) / span));
        calculatedUms = Math.round(umsMin + ratio * (umsMax - umsMin));
      } else {
        calculatedUms = Math.min(100, Math.round(percentage));
      }
    }

    return {
      grade: matchedGrade,
      ums: calculatedUms,
      boundaryMatched: matchedBoundary,
    };
  }, [rawScore, defaultMaxMark, paper.gradeBoundaries, isIAL, percentage]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const compMarks: ComponentMark[] = [
        {
          component: paper.title || `Paper ${paper.paper_number}`,
          raw_mark: rawScore,
          max_mark: defaultMaxMark,
        },
      ];

      await onSave({
        status: 'done',
        componentMarks: compMarks,
        rawScore,
        maxScore: defaultMaxMark,
        percentage: Math.round(percentage * 10) / 10,
        calculatedGrade: calculationResult.grade,
        calculatedUms: calculationResult.ums,
        notes,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save paper marks:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A*':
      case '9':
      case '8':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'A':
      case '7':
        return 'text-sky-500 bg-sky-500/10 border-sky-500/30';
      case 'B':
      case '6':
        return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30';
      case 'C':
      case '5':
      case '4':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-background-card p-6 sm:p-8 shadow-2xl space-y-6 text-foreground">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
              <Calculator className="w-3 h-3" />
              {paper.exam_board} • {paper.qualification}
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {paper.subject} ({paper.syllabus_code})
            </h3>
            <p className="text-xs text-foreground-muted">
              {paper.year} {paper.series} • Paper {paper.paper_number}
              {paper.variant ? ` (Variant ${paper.variant})` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Raw Mark Achieved
              </label>
              <span className="text-xs text-foreground-muted font-mono">
                Out of {defaultMaxMark} marks
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={defaultMaxMark}
                step="0.5"
                value={rawScoreInput}
                onChange={(e) => setRawScoreInput(e.target.value)}
                placeholder={`0 - ${defaultMaxMark}`}
                className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-lg font-mono font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
              />
              <span className="absolute right-4 top-3.5 text-sm font-semibold text-foreground-muted font-mono">
                / {defaultMaxMark}
              </span>
            </div>
          </div>

          {/* Quick Result Preview Card */}
          <div className="rounded-2xl border border-border/80 bg-background-secondary/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-primary" />
                Performance Summary
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                {Math.round(percentage * 10) / 10}%
              </span>
            </div>

            {/* Percentage Bar */}
            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
            </div>

            {/* Grade & UMS Reveal */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-foreground-muted block">
                  Calculated Grade
                </span>
                <div
                  className={cn(
                    'mt-1 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl font-bold text-lg border shadow-xs',
                    getGradeColor(calculationResult.grade)
                  )}
                >
                  <Award className="w-4 h-4" />
                  {calculationResult.grade}
                </div>
              </div>

              {isIAL && calculationResult.ums !== undefined && (
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-foreground-muted block">
                    Uniform Mark (UMS)
                  </span>
                  <span className="text-lg font-bold font-mono text-foreground mt-1 inline-block">
                    {calculationResult.ums}{' '}
                    <span className="text-xs text-foreground-muted font-normal">/ 100 UMS</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Grade Boundaries Reference Table (Collapsible / Mini) */}
          {paper.gradeBoundaries && paper.gradeBoundaries.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
                Official Boundaries ({paper.series} {paper.year})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {paper.gradeBoundaries.map((b) => (
                  <span
                    key={b.id || b.grade}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-mono border transition-all',
                      calculationResult.grade === b.grade
                        ? 'bg-primary text-white border-primary font-bold shadow-xs'
                        : 'bg-background-secondary text-foreground-secondary border-border'
                    )}
                  >
                    {b.grade}: {b.min_mark}
                    {isIAL && b.ums_min ? ` (${b.ums_min}U)` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes (optional) */}
          <div>
            <label className="text-xs font-semibold text-foreground-muted mb-1 block">
              Notes or Mistakes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lost marks on vector geometry"
              className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            +35 XP on Save
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !rawScoreInput}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover disabled:opacity-50 transition-all shadow-xs"
            >
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save as Done
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
