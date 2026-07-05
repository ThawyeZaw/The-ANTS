'use client';

import React, { useState, useTransition, useMemo } from 'react';
import {
  Plus, Send, Trash2, CheckCircle2, Compass, GraduationCap, BookOpen,
  Clock, ArrowLeft, ArrowRight, Check,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { submitExamCountdownProposal } from '@/actions/exam-editor';
import { getAllCurriculums, getPublicSubjects, getExamsByCurriculum } from '@/lib/mock/database';

interface CountdownDraft {
  id: string;
  title: string;
  examDate: string;
  qualification: string;
  priority: string;
}

const createDraft = (): CountdownDraft => ({
  id: `draft-${Date.now()}`,
  title: '',
  examDate: '',
  qualification: 'IGCSE',
  priority: 'medium',
});

const PRIORITIES = [
  { value: 'high', label: 'High', color: 'bg-primary/10 text-[var(--primary)] border-primary/20' },
  { value: 'medium', label: 'Medium', color: 'bg-accent/10 text-[var(--accent)] border-accent/20' },
  { value: 'low', label: 'Low', color: 'bg-[var(--foreground-muted)]/10 text-[var(--foreground-muted)] border-[var(--border)]' },
];

export default function CountdownEditor() {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const curriculums = useMemo(() => getAllCurriculums(), []);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [items, setItems] = useState<CountdownDraft[]>([createDraft()]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subjects = useMemo(() => {
    if (!selectedCurriculum) return [];
    return getPublicSubjects(selectedCurriculum).map(s => ({ id: s.id, title: s.title }));
  }, [selectedCurriculum]);

  const exams = useMemo(() => {
    if (!selectedCurriculum) return [];
    return getExamsByCurriculum(selectedCurriculum, selectedSubject || null);
  }, [selectedCurriculum, selectedSubject]);

  const selectedCurriculumTitle = useMemo(() => {
    return curriculums.find(c => c.id === selectedCurriculum)?.title || 'None selected';
  }, [selectedCurriculum, curriculums]);

  const selectedSubjectTitle = useMemo(() => {
    return subjects.find(s => s.id === selectedSubject)?.title || '';
  }, [selectedSubject, subjects]);

  const selectedExamData = useMemo(() => {
    return exams.find(e => e.id === selectedExam);
  }, [selectedExam, exams]);

  const canGoToStep2 = selectedCurriculum;
  const canGoToStep3 = selectedCurriculum && selectedSubject && selectedExam;

  const updateItem = (id: string, key: 'title' | 'examDate' | 'qualification' | 'priority', value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [key]: value } : item));
  };
  const addItem = () => setItems(prev => [...prev, createDraft()]);
  const removeItem = (id: string) => { if (items.length > 1) setItems(prev => prev.filter(item => item.id !== id)); };

  const handleSubmit = () => {
    if (!user) { setError('Sign in to submit countdown proposals for review.'); return; }
    setError(null); setMessage(null);

    startTransition(async () => {
      const result = await submitExamCountdownProposal({
        curriculum_id: selectedCurriculum,
        subject_id: selectedSubject,
        exam_id: selectedExam || undefined,
        countdowns: items
          .filter(item => item.title.trim() && item.examDate)
          .map(item => ({
            title: item.title.trim(),
            exam_date: item.examDate,
            qualification_group: item.qualification,
            priority_indicator: item.priority,
          })),
      }, user.id);

      if (result?.success) {
        setMessage('Countdown proposal submitted to the review queue. A main contributor will review it shortly.');
      } else {
        setError(result?.error || 'Unable to submit the countdown proposal.');
      }
    });
  };

  return (
    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent)] font-semibold text-xs uppercase tracking-widest">
            <Compass className="w-4 h-4" />
            <span>Contributor Workstation</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] mt-1">Exam Countdown Editor</h2>
          <p className="text-[var(--foreground-secondary)] text-xs mt-1">Propose exam countdowns linked to curricula and subjects for learner dashboards.</p>
        </div>
      </div>

      {/* Step Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[1, 2, 3].map(step => (
          <button
            key={step}
            type="button"
            onClick={() => {
              if (step === 1) setCurrentStep(1);
              if (step === 2 && canGoToStep2) setCurrentStep(2);
              if (step === 3 && canGoToStep3) setCurrentStep(3);
            }}
            className={`py-3 px-4 rounded-xl border transition-all text-center ${
              currentStep === step ? 'bg-[var(--background-card)] border-[var(--primary)] text-[var(--primary)] shadow-sm'
              : step === 1 || (step === 2 && canGoToStep2) || (step === 3 && canGoToStep3)
                ? 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)] cursor-pointer'
                : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)] opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1">Step 0{step}</div>
            <div className="text-xs font-extrabold">
              {step === 1 && 'Curriculum'}
              {step === 2 && 'Subject & Exam'}
              {step === 3 && 'Countdown Details'}
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-6 animate-fade-in">
        {/* ===== STEP 1: Curriculum ===== */}
        {currentStep === 1 && (
          <div>
            <h3 className="text-xl font-extrabold text-[var(--foreground)] flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-[var(--accent)]" />
              Select Curriculum
            </h3>
            <p className="text-[var(--foreground-secondary)] text-xs mb-6">Choose the curriculum this countdown belongs to.</p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Curriculum</label>
              <select
                value={selectedCurriculum}
                onChange={e => { setSelectedCurriculum(e.target.value); setSelectedSubject(''); setSelectedExam(''); }}
                className="w-full bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-[var(--foreground)] transition-colors"
              >
                <option value="">-- Select a curriculum --</option>
                {curriculums.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.exam_board || c.qualification})</option>
                ))}
              </select>
            </div>

            {selectedCurriculum && (
              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Check className="w-4 h-4" /> Curriculum Selected
                </div>
                <p className="text-[var(--foreground-secondary)] text-xs mt-1">{selectedCurriculumTitle}</p>
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setCurrentStep(2)} disabled={!canGoToStep2}
                className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-xs font-bold text-[var(--primary-foreground)] shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Next: Subject <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 2: Subject & Exam ===== */}
        {currentStep === 2 && (
          <div>
            <h3 className="text-xl font-extrabold text-[var(--foreground)] flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-[var(--accent)]" />
              Select Subject &amp; Existing Exam
            </h3>
            <p className="text-[var(--foreground-secondary)] text-xs mb-6">Link to a subject and optionally an existing exam entry from the database.</p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Subject</label>
                <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedExam(''); }}
                  className="w-full bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-[var(--foreground)] transition-colors">
                  <option value="">-- Select a subject --</option>
                  {subjects.map(s => (<option key={s.id} value={s.id}>{s.title}</option>))}
                </select>
              </div>

              {selectedSubject && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Existing Exam (optional)</label>
                  <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}
                    className="w-full bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-[var(--foreground)] transition-colors">
                    <option value="">-- Create new (no existing exam) --</option>
                    {exams.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.title} &mdash; {ex.exam_series || ex.exam_date}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSubject && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Check className="w-4 h-4" /> Subject Selected
                  </div>
                  <p className="text-[var(--foreground-secondary)] text-xs mt-1">
                    {selectedCurriculumTitle} &rarr; {selectedSubjectTitle}
                    {selectedExamData && <> &rarr; {selectedExamData.title}</>}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between gap-3">
              <button type="button" onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-3 text-xs font-bold text-[var(--foreground)] transition hover:bg-[var(--background-card)]">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="button" onClick={() => setCurrentStep(3)} disabled={!canGoToStep3}
                className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-xs font-bold text-[var(--primary-foreground)] shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Next: Details <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: Countdown Details ===== */}
        {currentStep === 3 && (
          <div>
            <h3 className="text-xl font-extrabold text-[var(--foreground)] flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-[var(--accent)]" />
              Countdown Details
            </h3>
            <p className="text-[var(--foreground-secondary)] text-xs mb-6">Add one or more countdown entries with dates, qualification groups, and priority levels.</p>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-card)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--border)]">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Countdown Entries</p>
                  <p className="text-xs text-[var(--foreground-secondary)]">
                    Linked to: {selectedCurriculumTitle} &rarr; {selectedSubjectTitle}
                    {selectedExamData && <> &rarr; {selectedExamData.title}</>}
                  </p>
                </div>
                <button type="button" onClick={addItem}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--background-card)]">
                  <Plus className="w-4 h-4" /> Add Countdown
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-secondary)]">Countdown Entry</p>
                      <button type="button" onClick={() => removeItem(item.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/15 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Title</label>
                        <input value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)}
                          placeholder={`e.g. ${selectedSubjectTitle || 'Physics'} Finals`}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Exam Date</label>
                        <input type="date" value={item.examDate} onChange={e => updateItem(item.id, 'examDate', e.target.value)}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Qualification Group</label>
                        <select value={item.qualification} onChange={e => updateItem(item.id, 'qualification', e.target.value)}
                          className="w-full bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-2 px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all">
                          <option value="IGCSE">IGCSE</option>
                          <option value="A Level">A Level</option>
                          <option value="AS Level">AS Level</option>
                          <option value="IAL">IAL</option>
                          <option value="IELTS">IELTS</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Priority</label>
                        <div className="flex gap-2 mt-2">
                          {PRIORITIES.map(p => (
                            <button key={p.value} type="button" onClick={() => updateItem(item.id, 'priority', p.value)}
                              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                                item.priority === p.value ? p.color + ' border-current' : 'border-[var(--border)] text-[var(--foreground-secondary)]'
                              }`}>
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-3 text-xs font-bold text-[var(--foreground)] transition hover:bg-[var(--background-card)]">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleSubmit} disabled={isPending}
                  className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-xs font-bold text-[var(--primary-foreground)] shadow-lg transition-opacity disabled:opacity-70">
                  <Send className="w-4 h-4" />
                  {isPending ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </div>

            {message && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-[var(--accent)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-[var(--primary)]">{error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
