'use client';

import React, { useState, useTransition } from 'react';
import {
  Compass,
  Layers,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  FileText
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { submitExamData } from '@/actions/exam-editor';

const BOARD_OPTIONS = [
  {
    key: 'caie',
    label: 'Cambridge CAIE',
    description: 'IGCSE and A Level framework for global learners.'
  },
  {
    key: 'edexcel',
    label: 'Pearson Edexcel',
    description: 'International GCSE and IAL pathways.'
  }
];

const QUALIFICATIONS_MAP: Record<string, string[]> = {
  caie: ['IGCSE', 'A Level', 'AS Level'],
  edexcel: ['IGCSE', 'IAL', 'GCE A Level']
};

export default function ExamDataEditor() {
  const { isMainContributor } = useRole();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [selectedBoard, setSelectedBoard] = useState('caie');
  const [qualificationLevel, setQualificationLevel] = useState('IGCSE');
  const [title, setTitle] = useState('');
  const [examSeries, setExamSeries] = useState('');
  const [examDate, setExamDate] = useState('');
  const [isPending, startTransition] = useTransition();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const curriculumName = selectedBoard === 'caie' ? 'Cambridge CAIE' : 'Pearson Edexcel';

  const canAdvanceToStep2 = selectedBoard.length > 0;
  const canAdvanceToStep3 = qualificationLevel.length > 0;
  const canSubmit = title.trim().length > 0 && examSeries.trim().length > 0 && examDate.length > 0;

  const handleSelectBoard = (boardKey: string) => {
    setSelectedBoard(boardKey);
    setQualificationLevel(QUALIFICATIONS_MAP[boardKey][0]);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    if (!user) return;

    startTransition(async () => {
      const payload = {
        title: title.trim(),
        exam_series: examSeries.trim(),
        exam_date: examDate,
        board: selectedBoard,
        qualification: qualificationLevel
      };

      const result = await submitExamData(payload, user.id);

      if (result?.success) {
        setSubmitSuccess(true);
      }
    });
  };

  return (
    <div className="h-full flex-1 bg-background text-foreground py-8 px-4 md:px-8 font-sans">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8">
        <div className="rounded-[32px] border border-border bg-background-card p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                <Compass className="h-4 w-4" />
                Verified Contributor Workstation
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Exam Syllabus Editor
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground-secondary">
                Build a fully interactive dark-mode scheduler that persists the core `exams` schema fields.
              </p>
            </div>

            {isMainContributor ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-primary transition hover:bg-primary/15"
              >
                <FileText className="h-4 w-4 text-primary" />
                Review Submissions
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-[32px] border border-border bg-background-card p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
          <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
            <div className="space-y-4 rounded-[28px] border border-border bg-background-secondary p-5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.32em] text-foreground-muted">Workflow</p>
                <h2 className="text-2xl font-semibold text-foreground">Step-by-step schedule builder</h2>
                <p className="text-sm leading-6 text-foreground-secondary">
                  Progress smoothly through board selection, qualification assignment and final exam scheduling.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  { step: 1, label: 'Role & Board' },
                  { step: 2, label: 'Component Blueprint' },
                  { step: 3, label: 'Grade Boundaries' }
                ].map(({ step, label }) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setActiveStep(step)}
                    className={`rounded-3xl border px-4 py-4 text-left transition ${activeStep === step ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10' : 'border-border bg-background-secondary text-foreground-secondary hover:border-border-hover hover:bg-background-elevated'}`}
                  >
                    <div className="text-[10px] uppercase tracking-[0.32em] text-foreground-muted">Step {step}</div>
                    <div className="mt-2 font-semibold">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-border bg-background-secondary p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-primary/80">Guided Setup</p>
                  <h3 className="mt-3 text-2xl font-semibold text-foreground">Interactive exam editor</h3>
                </div>
                <div className="rounded-3xl bg-background-secondary px-4 py-2 text-xs uppercase tracking-[0.28em] text-foreground-secondary">
                  {activeStep}/3
                </div>
              </div>

              <div className="space-y-8">
                {activeStep === 1 && (
                  <div className="space-y-5">
                    <p className="text-sm text-foreground-secondary leading-relaxed">
                      Choose the examination board that the current syllabus belongs to. This decision will drive the available qualification levels.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      {BOARD_OPTIONS.map((board) => (
                        <button
                          key={board.key}
                          type="button"
                          onClick={() => handleSelectBoard(board.key)}
                          className={`group rounded-[28px] border p-5 text-left transition ${selectedBoard === board.key ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10' : 'border-border bg-background-secondary text-foreground-secondary hover:border-border-hover hover:bg-background-elevated'}`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-lg font-semibold">{board.label}</h4>
                              <p className="mt-2 text-sm leading-6 text-foreground-secondary">{board.description}</p>
                            </div>
                            {selectedBoard === board.key ? (
                              <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-primary/20 text-primary">
                                <CheckCircle2 className="h-5 w-5" />
                              </div>
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-5">
                    <p className="text-sm text-foreground-secondary leading-relaxed">
                      Select the qualification level that maps directly to the board you chose. Each path updates the exam metadata context.
                    </p>
                    <div className="grid gap-4 md:grid-cols-3">
                      {QUALIFICATIONS_MAP[selectedBoard].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setQualificationLevel(level)}
                          className={`rounded-3xl border px-5 py-4 text-center transition ${qualificationLevel === level ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10' : 'border-border bg-background-secondary text-foreground-secondary hover:border-border-hover hover:bg-background-elevated'}`}
                        >
                          <span className="block text-sm font-semibold">{level}</span>
                        </button>
                      ))}
                    </div>
                    <div className="rounded-[24px] border border-border bg-background-secondary p-5 text-foreground-secondary">
                      <p className="text-sm">
                        Current qualification: <span className="font-semibold text-foreground">{qualificationLevel}</span>
                      </p>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-7">
                    <div className="rounded-[24px] border border-border bg-background-secondary p-5">
                      <div className="mb-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-primary">
                        <Calendar className="h-4 w-4" />
                        Exam metadata
                      </div>
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-3">
                          <label className="block text-[11px] uppercase tracking-[0.28em] text-foreground-muted">Exam Title</label>
                          <input
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Additional Mathematics (0606)"
                            className="w-full rounded-xl border border-border bg-background-secondary px-4 py-3 text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-[11px] uppercase tracking-[0.28em] text-foreground-muted">Exam Series Window</label>
                          <input
                            type="text"
                            value={examSeries}
                            onChange={(event) => setExamSeries(event.target.value)}
                            placeholder="June 2026 Series"
                            className="w-full rounded-xl border border-border bg-background-secondary px-4 py-3 text-foreground placeholder:text-foreground-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-3">
                        <label className="block text-[11px] uppercase tracking-[0.28em] text-foreground-muted">Official Examination Start Date</label>
                        <input
                          type="date"
                          value={examDate}
                          onChange={(event) => setExamDate(event.target.value)}
                          className="w-full rounded-xl border border-border bg-background-secondary px-4 py-3 text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                        />
                        <p className="text-[11px] text-foreground-muted">
                          Stored as the canonical `exam_date` for the global exams table.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-[11px] uppercase tracking-[0.28em] text-foreground-muted">Exam Board Curriculum</label>
                        <div className="rounded-xl border border-border bg-background-secondary px-4 py-4 text-foreground">
                          {curriculumName}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 border-t border-border pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-foreground-secondary">
                    {activeStep === 1 && 'Start by selecting the exam board that controls the workflow.'}
                    {activeStep === 2 && 'Choose the qualification track for the selected board.'}
                    {activeStep === 3 && 'Fill the schedule fields to publish the exam entry.'}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                      disabled={activeStep === 1}
                      className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background-secondary px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-background-elevated disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>

                    {activeStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeStep === 1 && !canAdvanceToStep2) return;
                          if (activeStep === 2 && !canAdvanceToStep3) return;
                          setActiveStep((prev) => Math.min(3, prev + 1));
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary/15 border border-primary px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20"
                      >
                        Next Step
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit || isPending}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPending ? 'Submitting…' : 'Submit Exam'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {submitSuccess ? (
          <div className="rounded-[32px] border border-primary/20 bg-primary/10 p-6 shadow-2xl shadow-primary/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/20 text-primary">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Exam schedule saved successfully.</h3>
                  <p className="mt-1 text-foreground-secondary">
                    The exam record is now structured around `title`, `exam_series`, and `exam_date` for the global exams schema.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setActiveStep(1);
                  setTitle('');
                  setExamSeries('');
                  setExamDate('');
                }}
                className="rounded-2xl border border-border bg-background-secondary px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-background-elevated"
              >
                Create another schedule
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
