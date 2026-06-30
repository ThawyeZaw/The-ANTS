'use client';

import { useMemo, useState } from 'react';
import Input from '@/components/ui/Input';
import { ArrowRight, Calculator, CheckCircle2, Clock3, Layers } from 'lucide-react';

const SUBJECTS = [
  { id: 'additional-maths', label: 'Additional Mathematics (0606)', emoji: '🔢' },
  { id: 'ict', label: 'ICT (0417)', emoji: '🖥️' },
  { id: 'computer-science', label: 'Computer Science (0478)', emoji: '💻' },
  { id: 'english', label: 'First Language English (0500)', emoji: '📝' },
  { id: 'maths-ext', label: 'Mathematics (Extended) (0580)', emoji: '📐' },
  { id: 'biology', label: 'Biology (Extended) (0610)', emoji: '🌿' },
  { id: 'chemistry', label: 'Chemistry (Extended) (0620)', emoji: '🧪' },
  { id: 'physics', label: 'Physics (Extended) (0625)', emoji: '⚗️' },
];

const SERIES = ['May/June 2024 (V2)', 'November/December 2024', 'May/June 2025'];
const GRADE_BOUNDARIES = [
  { grade: 'A*', threshold: 137 },
  { grade: 'A', threshold: 115 },
  { grade: 'B', threshold: 87 },
  { grade: 'C or Fail', threshold: 0 },
];

export default function ExamDataCalculatorPage() {
  const [subjectId, setSubjectId] = useState(SUBJECTS[0].id);
  const [series, setSeries] = useState(SERIES[0]);
  const [paper1Raw, setPaper1Raw] = useState('');
  const [paper2Raw, setPaper2Raw] = useState('');
  const [paper1Max, setPaper1Max] = useState('80');
  const [paper2Max, setPaper2Max] = useState('80');

  const totalRaw = useMemo(() => {
    const raw1 = Number(paper1Raw || 0);
    const raw2 = Number(paper2Raw || 0);
    return Math.max(0, raw1 + raw2);
  }, [paper1Raw, paper2Raw]);

  const totalMax = useMemo(() => {
    const max1 = Number(paper1Max || 0);
    const max2 = Number(paper2Max || 0);
    return Math.max(0, max1 + max2);
  }, [paper1Max, paper2Max]);

  const weightedMark = useMemo(() => {
    if (totalMax === 0) return 0;
    return Math.min(160, Math.round((totalRaw / totalMax) * 160));
  }, [totalRaw, totalMax]);

  const percentage = useMemo(() => {
    if (totalMax === 0) return 0;
    return Number(((totalRaw / totalMax) * 100).toFixed(1));
  }, [totalRaw, totalMax]);

  const predictedGrade = useMemo(() => {
    return GRADE_BOUNDARIES.find((boundary) => weightedMark >= boundary.threshold)?.grade ?? 'C or Fail';
  }, [weightedMark]);

  const selectedSubject = SUBJECTS.find((item) => item.id === subjectId) ?? SUBJECTS[0];

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-border bg-background-card p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
                <span>⚙️</span>
                AUTOMATED CONVERSION ENGINE
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Syllabus Evaluation System
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-foreground-secondary">
                  Grade boundaries from your spreadsheet · CIE IGCSE May/June 2024 (V2)
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-background-secondary p-6 text-sm leading-6 text-foreground-secondary">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Calculator className="h-5 w-5" />
                Quick grade prediction
              </div>
              <p className="mt-3">Use the exam data section to enter raw marks and view exact weighted mark calculations for your selected syllabus and series.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <section className="space-y-6 rounded-[2rem] border border-border bg-background-card p-8 shadow-sm">
            <div className="grid gap-6">
              <div className="rounded-[1.75rem] border border-border bg-background-secondary p-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                  <div className="space-y-4">
                    <p className="text-sm uppercase tracking-[0.3em] text-foreground-muted">Subject Selected</p>
                    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-background-card p-4">
                      <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
                        <span className="rounded-2xl bg-primary/10 px-3 py-2 text-primary">{selectedSubject.emoji}</span>
                        <span>{selectedSubject.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECTS.map((subject) => (
                          <button
                            key={subject.id}
                            type="button"
                            onClick={() => setSubjectId(subject.id)}
                            className={`rounded-2xl border px-4 py-2 text-sm transition-all ${
                              subject.id === subjectId
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border bg-background-secondary text-foreground-muted hover:border-border-hover hover:bg-background-card'
                            }`}
                          >
                            {subject.emoji} {subject.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-foreground-muted">Series Track</p>
                        <p className="mt-2 text-sm text-foreground">{series}</p>
                      </div>
                      <select
                        value={series}
                        onChange={(event) => setSeries(event.target.value)}
                        className="rounded-xl border border-border bg-background-card px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        {SERIES.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-4 rounded-[1.5rem] border border-border bg-background-card p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">Paper 1</p>
                          <p className="text-xs text-foreground-muted">Max Raw Mark: 80</p>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={paper1Raw}
                              onChange={(event) => setPaper1Raw(event.target.value)}
                              placeholder="0"
                              min={0}
                              max={Number(paper1Max) || 0}
                              className="w-full"
                            />
                            <span className="text-sm text-foreground-muted">/</span>
                            <Input
                              type="number"
                              value={paper1Max}
                              onChange={(event) => setPaper1Max(event.target.value)}
                              placeholder="80"
                              min={0}
                              className="w-24"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">Paper 2</p>
                          <p className="text-xs text-foreground-muted">Max Raw Mark: 80</p>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={paper2Raw}
                              onChange={(event) => setPaper2Raw(event.target.value)}
                              placeholder="0"
                              min={0}
                              max={Number(paper2Max) || 0}
                              className="w-full"
                            />
                            <span className="text-sm text-foreground-muted">/</span>
                            <Input
                              type="number"
                              value={paper2Max}
                              onChange={(event) => setPaper2Max(event.target.value)}
                              placeholder="80"
                              min={0}
                              className="w-24"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-background-secondary p-6">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-foreground-muted">Grade Boundary Reference</p>
                    <p className="mt-2 text-sm text-foreground-secondary">Weighted Mark / 160</p>
                  </div>
                  <Layers className="h-5 w-5 text-foreground-muted" />
                </div>
                <div className="mt-6 grid gap-3">
                  {GRADE_BOUNDARIES.map((boundary) => (
                    <div key={boundary.grade} className="flex items-center justify-between rounded-3xl border border-border bg-background-card px-4 py-3 text-sm text-foreground">
                      <span className="font-semibold">{boundary.grade}</span>
                      <span className="text-foreground-muted">≥ {boundary.threshold}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-border bg-background-card p-8 shadow-sm">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.3em] text-foreground-muted">📋 Calculated PUM Result</p>
                  <h2 className="text-2xl font-semibold text-foreground">Calculated PUM Result</h2>
                </div>
                <div className="rounded-3xl bg-background-secondary p-3 text-foreground-muted">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border bg-background-secondary p-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between gap-3 rounded-3xl bg-background-card px-4 py-4 text-sm text-foreground">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-foreground-muted">Total Raw Mark</p>
                      <p className="mt-2 text-lg font-semibold">{totalMax > 0 ? `${totalRaw} / ${totalMax}` : '— / —'}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-foreground-muted" />
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-3xl bg-background-card px-4 py-4 text-sm text-foreground">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-foreground-muted">Weighted Mark</p>
                      <p className="mt-2 text-lg font-semibold">{totalMax > 0 ? `${weightedMark} / 160` : '— / —'}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-foreground-muted" />
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-3xl bg-background-card px-4 py-4 text-sm text-foreground">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-foreground-muted">Percentage Uniform Mark</p>
                      <p className="mt-2 text-lg font-semibold">{totalMax > 0 ? `${percentage}%` : '—'}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-foreground-muted" />
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border bg-background-secondary p-6 text-sm leading-7 text-foreground-secondary">
                <p className="font-semibold text-foreground">How it's calculated</p>
                <ol className="mt-4 space-y-3 list-decimal list-inside">
                  <li>Raw marks are summed across all papers.</li>
                  <li>Weighted Mark = (Sum of raw marks ÷ Sum of max marks) × 160.</li>
                  <li>PUM is the resulting score translated to a 100-point scale from weighted mark.</li>
                </ol>
                <p className="mt-4">The boundary thresholds are used to estimate the final grade for your selected subject and series.</p>
                <div className="mt-4 rounded-3xl bg-background-card p-4 text-sm text-foreground">
                  <p className="text-foreground-muted">Predicted grade based on boundary thresholds:</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{predictedGrade}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
