'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { Exam } from '@/types';
import type { CatalogCurriculum } from '@/context/LessonContext';
import { groupEdexcelIalSubjects } from '@/lib/edexcel-ial';
import { examRowMatchesMyanmar } from '@/lib/exam-papers/myanmar-papers';
import { myanmarDateTimeIso } from '@/lib/exam-datetime';
import { X } from 'lucide-react';

interface AddCountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableExams: Exam[];
  catalogCurriculums?: CatalogCurriculum[];
  initialCurriculumId?: string;
  initialSubjectId?: string;
  onCreate: (data: {
    exam_id?: string;
    custom_title?: string;
    target_date?: string;
    priority_indicator?: string;
    qualification_group?: string;
    subject_id?: string;
    exam_board?: string;
  }) => void | Promise<void>;
  /** Pre-fill from a library exam (e.g. opened from Exams Library browser) */
  prefilledExam?: Exam | null;
}

function examLabel(exam: Exam) {
  const series = exam.exam_series || (exam as any).season || (exam as any).series;
  return series ? `${exam.title} (${series})` : exam.title;
}

export function AddCountdownModal({
  isOpen,
  onClose,
  availableExams,
  catalogCurriculums = [],
  initialCurriculumId = 'all',
  initialSubjectId = 'all',
  onCreate,
  prefilledExam,
}: AddCountdownModalProps) {
  const [tab, setTab] = useState<'library' | 'custom'>('library');
  
  // Form states
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());
  const [filterCurriculumId, setFilterCurriculumId] = useState(initialCurriculumId);
  const [filterSubjectId, setFilterSubjectId] = useState(initialSubjectId);
  const [customTitle, setCustomTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('09:00');
  const [priority, setPriority] = useState('medium');
  const [group, setGroup] = useState('Custom');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFilterCurriculumId(initialCurriculumId);
    setFilterSubjectId(initialSubjectId);
  }, [initialCurriculumId, initialSubjectId, isOpen]);

  // Pre-fill from library exam when provided
  useEffect(() => {
    if (prefilledExam) {
      setTab('library');
      setSelectedExamIds(new Set([prefilledExam.id]));
      if (prefilledExam.curriculum_id) setFilterCurriculumId(prefilledExam.curriculum_id);
      if (prefilledExam.subject_id) setFilterSubjectId(prefilledExam.subject_id);
      if (prefilledExam.date_type === 'fixed' && prefilledExam.exam_date) {
        setTargetDate(prefilledExam.exam_date.split('T')[0]);
      }
      if (prefilledExam.exam_board) setGroup(prefilledExam.exam_board);
    }
  }, [prefilledExam]);

  const subjectsForFilter = useMemo(() => {
    if (filterCurriculumId === 'all') return catalogCurriculums.flatMap((c) => c.subjects);
    return catalogCurriculums.find((c) => c.id === filterCurriculumId)?.subjects ?? [];
  }, [catalogCurriculums, filterCurriculumId]);

  const groupedSubjects = useMemo(() => groupEdexcelIalSubjects(subjectsForFilter), [subjectsForFilter]);

  const filteredExams = useMemo(() => {
    return availableExams.filter((exam) => {
      const curriculumId = exam.curriculum_id || (exam as any).curriculum?.id;
      const subjectId = exam.subject_id || (exam as any).subject?.id;
      if (filterSubjectId !== 'all' && subjectId !== filterSubjectId) return false;
      if (filterCurriculumId !== 'all' && curriculumId !== filterCurriculumId) return false;
      return examRowMatchesMyanmar({
        paper_number: exam.paper_number ?? (exam as any).paper_code,
        syllabus_code: exam.syllabus_code,
        season: (exam as any).season,
        series: (exam as any).series || exam.exam_series,
        curriculum_code: (exam as any).curriculum_code,
        exam_board: exam.exam_board,
        subject_code: (exam as any).subject_code,
      });
    });
  }, [availableExams, filterCurriculumId, filterSubjectId]);

  const groupedFilteredExams = useMemo(() => {
    const groups: Record<string, Exam[]> = {};
    filteredExams.forEach(exam => {
      const series = (exam.exam_series || (exam as any).season || (exam as any).series || 'Other') as string;
      if (!groups[series]) groups[series] = [];
      groups[series].push(exam);
    });
    return groups;
  }, [filteredExams]);

  if (!isOpen) return null;

  const isPastDate = targetDate && targetTime ? new Date(myanmarDateTimeIso(targetDate, targetTime)).getTime() < Date.now() : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (tab === 'library') {
        if (selectedExamIds.size === 0) return;
        for (const id of Array.from(selectedExamIds)) {
          const exam = availableExams.find((item) => item.id === id);
          if (exam) {
            await onCreate({
              exam_id: id,
              priority_indicator: priority,
              qualification_group: group || exam.exam_board || 'Official',
              subject_id: exam.subject_id ?? undefined,
              exam_board: exam.exam_board ?? undefined,
            });
          }
        }
      } else {
        if (!customTitle.trim() || !targetDate) return;
        await onCreate({
          custom_title: customTitle.trim(),
          target_date: myanmarDateTimeIso(targetDate, targetTime),
          priority_indicator: priority,
          qualification_group: group,
        });
      }

      setSelectedExamIds(new Set());
      setCustomTitle('');
      setTargetDate('');
      setTargetTime('09:00');
      setPriority('medium');
      setGroup('Custom');
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to add countdown. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--foreground)]/10 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Add Exam Countdown</h2>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50 focus-visible:outline-none"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-6 flex rounded-lg bg-[var(--background-secondary)]/70 p-1">
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50 focus-visible:outline-none ${
              tab === 'library' ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            }`}
            onClick={() => setTab('library')}
            aria-label="Select from library exams"
          >
            Library Exam
          </button>
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50 focus-visible:outline-none ${
              tab === 'custom' ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            }`}
            onClick={() => setTab('custom')}
            aria-label="Create a custom countdown"
          >
            Custom Countdown
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'library' ? (
            <div className="space-y-4">
              {catalogCurriculums.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground-secondary)]">Curriculum</label>
                    <select
                      value={filterCurriculumId}
                      onChange={(e) => {
                        const next = e.target.value;
                        const keepSubject = subjectsForFilter.some((s) => s.id === filterSubjectId && (next === 'all' || s.curriculum_id === next));
                        setFilterCurriculumId(next);
                        if (!keepSubject) {
                          setFilterSubjectId('all');
                          setSelectedExamIds(new Set());
                        }
                      }}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    >
                      <option value="all">All curriculums</option>
                      {catalogCurriculums.map((curr) => (
                        <option key={curr.id} value={curr.id}>{curr.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground-secondary)]">Subject</label>
                    <select
                      value={filterSubjectId}
                      onChange={(e) => {
                        setFilterSubjectId(e.target.value);
                        setSelectedExamIds(new Set());
                      }}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    >
                      <option value="all">All subjects</option>
                      {groupedSubjects.map((group) => {
                        if (!group.isVirtual) {
                          return (
                            <option key={group.id} value={group.id}>
                              {group.title}
                            </option>
                          );
                        }
                        return (
                          <optgroup key={group.id} label={`Edexcel IAL ${group.title}`}>
                            {group.units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.title}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto max-h-64 border border-[var(--border)] rounded-lg bg-[var(--background-secondary)] p-1">
                {Object.keys(groupedFilteredExams).length === 0 ? (
                  <p className="p-3 text-sm text-[var(--foreground-muted)] text-center">No exams available for this selection.</p>
                ) : (
                  Object.entries(groupedFilteredExams).map(([series, exams]) => {
                    const allSelected = exams.every(e => selectedExamIds.has(e.id));
                    const toggleSeries = () => {
                      const next = new Set(selectedExamIds);
                      if (allSelected) {
                        exams.forEach(e => next.delete(e.id));
                      } else {
                        exams.forEach(e => next.add(e.id));
                      }
                      setSelectedExamIds(next);
                    };

                    return (
                      <div key={series} className="mb-2 last:mb-0">
                        <div className="flex items-center justify-between bg-[var(--background-card)] px-3 py-2 rounded-md shadow-sm mb-1">
                          <span className="text-xs font-bold text-[var(--foreground)]">{series}</span>
                          <button
                            type="button"
                            onClick={toggleSeries}
                            className="text-[10px] uppercase tracking-wider font-semibold text-[var(--primary)] hover:underline"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="space-y-1 px-1">
                          {exams.map(exam => (
                            <label key={exam.id} className="flex items-start gap-2 p-2 hover:bg-[var(--background-card)] rounded-md cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedExamIds.has(exam.id)}
                                onChange={(e) => {
                                  const next = new Set(selectedExamIds);
                                  if (e.target.checked) next.add(exam.id);
                                  else next.delete(exam.id);
                                  setSelectedExamIds(next);
                                }}
                                className="mt-0.5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] bg-transparent"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm text-[var(--foreground)] leading-tight">{exam.title}</span>
                                {(exam as any).exam_date && (
                                  <span className="text-xs text-[var(--foreground-muted)] mt-0.5">
                                    {new Date((exam as any).exam_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground-secondary)]">Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Physics Mock"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-3 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground-secondary)]">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className={`w-full rounded-lg border bg-[var(--background-secondary)] p-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${isPastDate ? 'border-red-500/50 focus:border-red-500' : 'border-[var(--border)] focus:border-[var(--primary)]'}`}
                    required
                    aria-describedby={isPastDate ? "date-error" : undefined}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground-secondary)]">Time</label>
                  <input
                    type="time"
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    className={`w-full rounded-lg border bg-[var(--background-secondary)] p-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${isPastDate ? 'border-red-500/50 focus:border-red-500' : 'border-[var(--border)] focus:border-[var(--primary)]'}`}
                    required
                  />
                  <p className="mt-1 text-[11px] text-[var(--foreground-muted)]">Myanmar time (MMT). Official papers use 09:00 AM earliest.</p>
                </div>
              </div>
              {isPastDate && (
                <p id="date-error" className="text-sm text-red-400" role="alert">
                  Warning: This date and time is in the past!
                </p>
              )}
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground-secondary)]">Qualification Group</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="IGCSE">IGCSE</option>
              <option value="A LEVEL">A LEVEL</option>
              <option value="OSSD">OSSD</option>
              <option value="IELTS">IELTS</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground-secondary)]">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {submitError && (
            <p className="text-sm text-red-500" role="alert">
              {submitError}
            </p>
          )}

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50 focus-visible:outline-none"
              aria-label="Cancel and close modal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:outline-none disabled:opacity-60"
              aria-label="Submit and add countdown"
            >
              {submitting ? 'Adding…' : 'Add Countdown'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
