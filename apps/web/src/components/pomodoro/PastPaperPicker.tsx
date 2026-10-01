'use client';

import { useState } from 'react';
import {
  FileText,
  Clock,
  Check,
  ChevronDown,
  X,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import type { PastPaperSessionConfig } from '@/constants/pomodoro';
import {
  EXAM_SUBJECT_CONFIGS,
  EXAM_QUICK_PRESETS,
  formatDurationHoursMinutes,
} from '@/constants/exam-paper-durations';
import { cn } from '@/lib/utils';

interface PastPaperPickerProps {
  isOpen: boolean;
  currentConfig: PastPaperSessionConfig;
  onClose: () => void;
  onSelect: (config: PastPaperSessionConfig) => void;
  surface?: 'theme' | 'stage';
}

export default function PastPaperPicker({
  isOpen,
  currentConfig,
  onClose,
  onSelect,
  surface = 'theme',
}: PastPaperPickerProps) {
  const [board, setBoard] = useState<'CAIE' | 'Edexcel'>(currentConfig.board || 'CAIE');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(currentConfig.subjectCode || '0580');
  const [selectedPaperNumber, setSelectedPaperNumber] = useState<string>(currentConfig.paperNumber || 'Paper 2');
  const [customMinutes, setCustomMinutes] = useState<number>(currentConfig.durationMinutes || 90);
  const [strictMode, setStrictMode] = useState<boolean>(currentConfig.strictMode ?? false);

  if (!isOpen) return null;

  const filteredSubjects = EXAM_SUBJECT_CONFIGS.filter((s) => s.board === board);
  const activeSubject = filteredSubjects.find((s) => s.code === selectedSubjectCode) || filteredSubjects[0];
  const activePaper = activeSubject?.papers.find((p) => p.paperNumber === selectedPaperNumber) || activeSubject?.papers[0];

  const handleApply = () => {
    if (!activeSubject || !activePaper) return;
    onSelect({
      board,
      curriculumId: activeSubject.curriculumId,
      subjectCode: activeSubject.code,
      subjectName: activeSubject.name,
      paperNumber: activePaper.paperNumber,
      paperName: activePaper.name,
      durationMinutes: customMinutes,
      totalMarks: activePaper.totalMarks,
      strictMode,
    });
    onClose();
  };

  const handleSelectPaper = (paperNumber: string, duration: number) => {
    setSelectedPaperNumber(paperNumber);
    setCustomMinutes(duration);
  };

  const onStage = surface === 'stage';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-7 shadow-2xl transition-all',
          onStage
            ? 'bg-stone-900/95 border-white/15 text-white backdrop-blur-2xl'
            : 'bg-card border-border text-card-foreground backdrop-blur-2xl',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-5 border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Past Paper Mock Exam</h2>
              <p className="text-xs text-foreground-muted">Configure official syllabus paper duration & conditions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-foreground/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Board Selection */}
        <div className="mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2 block">
            Examination Board
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['CAIE', 'Edexcel'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setBoard(b);
                  const firstSub = EXAM_SUBJECT_CONFIGS.find((s) => s.board === b);
                  if (firstSub) {
                    setSelectedSubjectCode(firstSub.code);
                    setSelectedPaperNumber(firstSub.papers[0]?.paperNumber || 'Paper 1');
                    setCustomMinutes(firstSub.papers[0]?.durationMinutes || 90);
                  }
                }}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-2xl py-2.5 px-4 text-xs font-bold transition-all border',
                  board === b
                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'border-border/60 hover:border-cyan-500/50 bg-foreground/5',
                )}
              >
                {b === 'CAIE' ? 'Cambridge (CAIE IGCSE)' : 'Pearson Edexcel IGCSE'}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Dropdown */}
        <div className="mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2 block">
            Subject & Syllabus Code
          </label>
          <div className="relative">
            <select
              value={selectedSubjectCode}
              onChange={(e) => {
                const code = e.target.value;
                setSelectedSubjectCode(code);
                const sub = filteredSubjects.find((s) => s.code === code);
                if (sub && sub.papers[0]) {
                  setSelectedPaperNumber(sub.papers[0].paperNumber);
                  setCustomMinutes(sub.papers[0].durationMinutes);
                }
              }}
              className={cn(
                'w-full appearance-none rounded-2xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                onStage ? 'bg-stone-800 border-white/20 text-white' : 'bg-background border-border',
              )}
            >
              {filteredSubjects.map((sub) => (
                <option key={sub.code} value={sub.code} className="bg-background text-foreground">
                  {sub.code} — {sub.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-4 w-4 text-foreground-muted" />
          </div>
        </div>

        {/* Paper Selector Grid */}
        <div className="mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2 block">
            Select Paper (Official Time Auto-Configured)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeSubject?.papers.map((p) => {
              const isSelected = selectedPaperNumber === p.paperNumber;
              return (
                <button
                  key={p.paperNumber}
                  type="button"
                  onClick={() => handleSelectPaper(p.paperNumber, p.durationMinutes)}
                  className={cn(
                    'flex flex-col text-left p-3 rounded-2xl border transition-all text-xs',
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-sm'
                      : 'border-border/60 hover:border-cyan-500/40 bg-foreground/5',
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-foreground">{p.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                  </div>
                  <div className="flex items-center gap-2 text-foreground-muted text-[11px]">
                    <span className="inline-flex items-center gap-1 font-semibold text-cyan-400">
                      <Clock className="h-3 w-3" />
                      {formatDurationHoursMinutes(p.durationMinutes)}
                    </span>
                    {p.totalMarks && <span>• {p.totalMarks} Marks</span>}
                  </div>
                  {p.description && (
                    <span className="text-[10px] text-foreground-muted/80 mt-1 line-clamp-1">
                      {p.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Presets Pills */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
              Quick Duration Overrides
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {formatDurationHoursMinutes(customMinutes)} ({customMinutes}m)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EXAM_QUICK_PRESETS.map((pill) => (
              <button
                key={pill.durationMinutes}
                type="button"
                onClick={() => setCustomMinutes(pill.durationMinutes)}
                className={cn(
                  'rounded-xl px-2.5 py-1 text-[11px] font-semibold border transition-all',
                  customMinutes === pill.durationMinutes
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                    : 'border-border/50 hover:border-border text-foreground-muted bg-foreground/5',
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exam Conditions & Warnings */}
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 mb-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Strict Exam Hall Mode</span>
                <input
                  type="checkbox"
                  id="strict-mode-toggle"
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                  className="rounded border-border text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-foreground-muted mt-1 leading-relaxed">
                Cambridge & Edexcel alerts will automatically chime at <strong className="text-foreground">15 minutes</strong> and <strong className="text-foreground">5 minutes remaining</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-foreground-muted hover:text-foreground transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs px-6 py-2.5 transition shadow-lg shadow-cyan-500/25 focus-ring"
          >
            <Zap className="h-3.5 w-3.5" />
            Start Exam Timer
          </button>
        </div>
      </div>
    </div>
  );
}
