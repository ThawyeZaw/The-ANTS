'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { Calculator, Plus, Send, Trash2, CheckCircle2, Layers } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { submitExamCalculatorPreset } from '@/actions/exam-editor';

interface PaperDraft {
  id: string;
  name: string;
  maxMark: number;
  weight: number;
}

interface BoundaryDraft {
  id: string;
  grade: string;
  minMark: number;
}

const createDefaultPaper = (index: number): PaperDraft => ({
  id: `paper-${Date.now()}-${index}`,
  name: `Paper ${index}`,
  maxMark: 80,
  weight: 50,
});

const createDefaultBoundary = (index: number): BoundaryDraft => ({
  id: `boundary-${Date.now()}-${index}`,
  grade: ['A*', 'A', 'B', 'C', 'D'][index] || 'E',
  minMark: [90, 80, 70, 60, 50][index] || 40,
});

export default function GradeCalculatorEditor() {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('Additional Mathematics (0606)');
  const [subjectCode, setSubjectCode] = useState('0606');
  const [series, setSeries] = useState('May/June 2024 (V2)');
  const [papers, setPapers] = useState<PaperDraft[]>([createDefaultPaper(1), createDefaultPaper(2)]);
  const [boundaries, setBoundaries] = useState<BoundaryDraft[]>([
    createDefaultBoundary(0),
    createDefaultBoundary(1),
    createDefaultBoundary(2),
    createDefaultBoundary(3),
    createDefaultBoundary(4),
  ]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalWeight = useMemo(() => papers.reduce((sum, paper) => sum + (Number(paper.weight) || 0), 0), [papers]);

  const updatePaper = (id: string, key: 'name' | 'maxMark' | 'weight', value: string) => {
    setPapers((prev) => prev.map((paper) => {
      if (paper.id !== id) return paper;
      return {
        ...paper,
        [key]: key === 'name' ? value : Math.max(0, Number(value) || 0),
      };
    }));
  };

  const addPaper = () => {
    setPapers((prev) => [...prev, createDefaultPaper(prev.length + 1)]);
  };

  const removePaper = (id: string) => {
    if (papers.length === 1) return;
    setPapers((prev) => prev.filter((paper) => paper.id !== id));
  };

  const updateBoundary = (id: string, key: 'grade' | 'minMark', value: string) => {
    setBoundaries((prev) => prev.map((row) => {
      if (row.id !== id) return row;
      return {
        ...row,
        [key]: key === 'grade' ? value : Math.max(0, Number(value) || 0),
      };
    }));
  };

  const addBoundary = () => {
    setBoundaries((prev) => [...prev, createDefaultBoundary(prev.length)]);
  };

  const removeBoundary = (id: string) => {
    if (boundaries.length === 1) return;
    setBoundaries((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSubmit = () => {
    if (!user) {
      setError('Sign in to submit a calculator proposal for review.');
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await submitExamCalculatorPreset({
        title: title.trim(),
        subject_code: subjectCode.trim(),
        series: series.trim(),
        papers: papers.map((paper) => ({
          name: paper.name.trim(),
          max_mark: Number(paper.maxMark),
          weight: Number(paper.weight),
        })),
        grade_boundaries: boundaries
          .filter((row) => row.grade.trim())
          .map((row) => ({ grade: row.grade.trim(), min_mark: Number(row.minMark) })),
      }, user.id);

      if (result?.success) {
        setMessage('Calculator proposal submitted to the review queue. A main contributor will approve it soon.');
        return;
      }

      setError(result?.error || 'Unable to submit the calculator proposal.');
    });
  };

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            <Calculator className="h-4 w-4" />
            Grade Calculator Editor
          </div>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Propose calculator presets and grade thresholds</h2>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            New grade calculator data is staged for review before it becomes available to learners.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-[var(--foreground)]">
            Subject title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none ring-0"
              placeholder="e.g. Physics (0625)"
            />
          </label>
          <label className="block text-sm font-medium text-[var(--foreground)]">
            Subject code
            <input
              value={subjectCode}
              onChange={(event) => setSubjectCode(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none ring-0"
              placeholder="e.g. 0625"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-[var(--foreground)]">
          Exam series
          <input
            value={series}
            onChange={(event) => setSeries(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none ring-0"
            placeholder="e.g. May/June 2024 (V2)"
          />
        </label>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Paper components</p>
              <p className="text-xs text-[var(--foreground-secondary)]">Match the marks and weighting used in the calculator.</p>
            </div>
            <button
              type="button"
              onClick={addPaper}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)]"
            >
              <Plus className="h-4 w-4" />
              Add paper
            </button>
          </div>

          <div className="space-y-3">
            {papers.map((paper) => (
              <div key={paper.id} className="grid gap-3 rounded-xl border border-[var(--border)] bg-white/80 p-3 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
                <input
                  value={paper.name}
                  onChange={(event) => updatePaper(paper.id, 'name', event.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  placeholder="Paper name"
                />
                <input
                  type="number"
                  value={paper.maxMark}
                  onChange={(event) => updatePaper(paper.id, 'maxMark', event.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  placeholder="Max mark"
                />
                <input
                  type="number"
                  value={paper.weight}
                  onChange={(event) => updatePaper(paper.id, 'weight', event.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  placeholder="Weight"
                />
                <button
                  type="button"
                  onClick={() => removePaper(paper.id)}
                  className="rounded-lg border border-rose-200 p-2 text-rose-600"
                  aria-label="Remove paper"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[var(--border)] bg-white/70 px-3 py-2 text-sm text-[var(--foreground-secondary)]">
            <span>Total paper weight: {totalWeight}</span>
            <span className="flex items-center gap-2"><Layers className="h-4 w-4" /> Weighting will be reviewed before publication.</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Grade boundaries</p>
              <p className="text-xs text-[var(--foreground-secondary)]">Suggested minimum raw marks for each grade.</p>
            </div>
            <button
              type="button"
              onClick={addBoundary}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)]"
            >
              <Plus className="h-4 w-4" />
              Add grade
            </button>
          </div>

          <div className="space-y-3">
            {boundaries.map((row) => (
              <div key={row.id} className="grid gap-3 rounded-xl border border-[var(--border)] bg-white/80 p-3 md:grid-cols-[0.7fr_1fr_auto]">
                <input
                  value={row.grade}
                  onChange={(event) => updateBoundary(row.id, 'grade', event.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  placeholder="Grade"
                />
                <input
                  type="number"
                  value={row.minMark}
                  onChange={(event) => updateBoundary(row.id, 'minMark', event.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  placeholder="Minimum mark"
                />
                <button
                  type="button"
                  onClick={() => removeBoundary(row.id)}
                  className="rounded-lg border border-rose-200 p-2 text-rose-600"
                  aria-label="Remove grade"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Send className="h-4 w-4" />
            {isPending ? 'Submitting...' : 'Submit for review'}
          </button>
          <span className="text-sm text-[var(--foreground-secondary)]">Contributors can propose edits without changing the live calculator immediately.</span>
        </div>

        {message ? (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            <span>{message}</span>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : null}
      </div>
    </section>
  );
}
