'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Syllabus Grade Calculator (Redesigned)
// Context-aware: Edexcel IAL (UMS) vs CAIE & Edexcel IGCSE (Raw Grade Boundaries)
// Reads from seeded past papers and official grade boundaries.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Calculator,
  BookOpen,
  Layers,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Clock,
  ChevronRight,
  Check,
  Info,
  BarChart3,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  listApprovedCalculatorPresets,
  listCurriculums,
  listSubjects,
} from '@/actions/exam-data';
import { cn } from '@/lib/utils';

interface PresetBoundary {
  grade: string;
  min_mark: number;
  max_mark?: number;
  ums_min?: number;
  ums_max?: number;
}

interface PaperDef {
  name: string;
  max_mark: number;
  weight: number;
  unit_group?: string;
  paper_boundaries?: PresetBoundary[];
}

interface CalcPreset {
  id: string;
  title: string;
  subject_code: string;
  curriculum_id: string;
  subject_id: string;
  series: string;
  year?: number;
  exam_board?: string;
  qualification?: string;
  papers: PaperDef[];
  grade_boundaries: PresetBoundary[];
  is_modular?: boolean;
}

// ── Interpolation helper for UMS (Edexcel IAL) ────────────────────────────────
function computeUMS(rawScore: number, boundaries: PresetBoundary[]): { ums: number; grade: string } {
  if (!boundaries || boundaries.length === 0) {
    return { ums: Math.round(rawScore), grade: '—' };
  }

  const sorted = [...boundaries].sort((a, b) => b.min_mark - a.min_mark);

  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i];
    if (rawScore >= b.min_mark) {
      const umsMin = b.ums_min ?? 40;
      const umsMax = b.ums_max ?? (umsMin + 9);
      const minM = b.min_mark;
      const maxM = b.max_mark ?? minM + 10;
      const span = maxM - minM > 0 ? maxM - minM : 1;
      const ratio = Math.min(1, Math.max(0, (rawScore - minM) / span));
      const ums = Math.round(umsMin + ratio * (umsMax - umsMin));
      return { ums: Math.min(100, Math.max(0, ums)), grade: b.grade };
    }
  }

  return { ums: Math.max(0, Math.round(rawScore * 0.5)), grade: 'U' };
}

export default function GradeCalculator() {
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [presets, setPresets] = useState<CalcPreset[]>([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCurriculum, setSelectedCurriculum] = useState(searchParams.get('curriculum') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedSeries, setSelectedSeries] = useState(searchParams.get('series') || '');
  const [rawMarks, setRawMarks] = useState<Record<string, number | string>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [cData, sData, pData] = await Promise.all([
          listCurriculums(),
          listSubjects(),
          listApprovedCalculatorPresets(),
        ]);
        setCurriculums(cData);
        setSubjects(sData);
        setPresets(pData as CalcPreset[]);
      } catch (err) {
        console.error('[GradeCalculator] load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!selectedCurriculum) return subjects;
    return subjects.filter((s) => s.curriculum_id === selectedCurriculum);
  }, [selectedCurriculum, subjects]);

  const matchingPresets = useMemo(() => {
    let list = presets;
    if (selectedCurriculum) list = list.filter((p) => p.curriculum_id === selectedCurriculum);
    if (selectedSubject) list = list.filter((p) => p.subject_id === selectedSubject);
    if (selectedSeries) list = list.filter((p) => p.series === selectedSeries);
    return list;
  }, [selectedCurriculum, selectedSubject, selectedSeries, presets]);

  const activePreset = useMemo<CalcPreset | null>(() => {
    if (matchingPresets.length === 0) return null;
    const papers: PaperDef[] = [];
    const paperKeys = new Set<string>();
    const boundaries: PresetBoundary[] = [];
    const boundaryKeys = new Set<string>();
    let isModular = false;
    let title = '';
    let subjectCode = '';
    let qualification = '';
    let examBoard = '';

    for (const p of matchingPresets) {
      if (p.is_modular || p.qualification === 'IAL') isModular = true;
      title = p.title || title;
      subjectCode = p.subject_code || subjectCode;
      qualification = p.qualification || qualification;
      examBoard = p.exam_board || examBoard;

      for (const paper of p.papers) {
        if (!paperKeys.has(paper.name)) {
          paperKeys.add(paper.name);
          papers.push(paper);
        }
      }
      for (const b of p.grade_boundaries) {
        if (!boundaryKeys.has(b.grade)) {
          boundaryKeys.add(b.grade);
          boundaries.push(b);
        }
      }
    }

    return {
      id: selectedSeries,
      title,
      subject_code: subjectCode,
      curriculum_id: selectedCurriculum,
      subject_id: selectedSubject,
      series: selectedSeries,
      qualification,
      exam_board: examBoard,
      papers,
      grade_boundaries: boundaries,
      is_modular: isModular,
    };
  }, [matchingPresets, selectedSeries, selectedCurriculum, selectedSubject]);

  const availableSeries = useMemo(() => {
    const set = new Set<string>();
    presets
      .filter((p) => (selectedCurriculum ? p.curriculum_id === selectedCurriculum : true))
      .filter((p) => (selectedSubject ? p.subject_id === selectedSubject : true))
      .forEach((p) => {
        if (p.series) set.add(p.series);
      });
    return Array.from(set).sort().reverse();
  }, [selectedCurriculum, selectedSubject, presets]);

  const isIAL = activePreset?.is_modular || activePreset?.qualification === 'IAL';
  const canGoStep2 = !!(selectedCurriculum && selectedSubject && selectedSeries && activePreset);

  const handleMarkChange = (index: number, value: string) => {
    if (!activePreset) return;
    const paper = activePreset.papers[index];
    if (!paper) return;
    if (value === '') {
      setRawMarks((prev) => ({ ...prev, [index]: '' }));
      return;
    }
    const n = parseFloat(value);
    if (!isNaN(n) && n >= 0) {
      setRawMarks((prev) => ({ ...prev, [index]: Math.min(n, paper.max_mark) }));
    }
  };

  const resetAll = () => {
    setRawMarks({});
    setSelectedSeries('');
    setSelectedSubject('');
    setSelectedCurriculum('');
    setCurrentStep(1);
  };

  // ── Calculation logic ───────────────────────────────────────────────────────
  const paperResults = useMemo(() => {
    if (!activePreset) return [];
    return activePreset.papers.map((p, i) => {
      const val = rawMarks[i];
      const filled = val !== '' && val !== undefined;
      const raw = filled ? Number(val) : 0;
      const pct = filled && p.max_mark > 0 ? Math.round((raw / p.max_mark) * 100) : 0;

      const perBoundaries = p.paper_boundaries && p.paper_boundaries.length > 0
        ? p.paper_boundaries
        : activePreset.grade_boundaries;

      let paperGrade = '—';
      let paperUms: number | undefined = undefined;

      if (filled) {
        if (isIAL) {
          const res = computeUMS(raw, perBoundaries);
          paperUms = res.ums;
          paperGrade = res.grade;
        } else {
          // Standard raw mark boundary check
          const sorted = [...perBoundaries].sort((a, b) => b.min_mark - a.min_mark);
          paperGrade = 'U';
          for (const b of sorted) {
            if (raw >= b.min_mark) {
              paperGrade = b.grade;
              break;
            }
          }
        }
      }

      return { ...p, index: i, filled, raw, pct, perBoundaries, paperGrade, paperUms };
    });
  }, [activePreset, rawMarks, isIAL]);

  const calc = useMemo(() => {
    if (!activePreset) {
      return { totalRaw: 0, maxRaw: 0, totalUms: 0, percentage: 0, grade: '—', anyFilled: false };
    }

    let totalRaw = 0;
    let maxRaw = 0;
    let totalUms = 0;
    let anyFilled = false;

    paperResults.forEach((pr) => {
      maxRaw += pr.max_mark;
      if (pr.filled) {
        anyFilled = true;
        totalRaw += pr.raw;
        if (pr.paperUms !== undefined) {
          totalUms += pr.paperUms;
        }
      }
    });

    const percentage = maxRaw > 0 ? Math.round((totalRaw / maxRaw) * 1000) / 10 : 0;
    let overallGrade = '—';

    if (anyFilled) {
      if (isIAL) {
        // IAL overall UMS thresholds
        const avgUms = paperResults.filter((p) => p.filled).length > 0
          ? totalUms / paperResults.filter((p) => p.filled).length
          : 0;
        if (avgUms >= 80) overallGrade = 'A';
        else if (avgUms >= 70) overallGrade = 'B';
        else if (avgUms >= 60) overallGrade = 'C';
        else if (avgUms >= 50) overallGrade = 'D';
        else if (avgUms >= 40) overallGrade = 'E';
        else overallGrade = 'U';
      } else {
        // Raw mark boundaries check
        const boundaries = [...activePreset.grade_boundaries].sort((a, b) => b.min_mark - a.min_mark);
        if (boundaries.length > 0) {
          overallGrade = 'U';
          for (const b of boundaries) {
            if (totalRaw >= b.min_mark) {
              overallGrade = b.grade;
              break;
            }
          }
        } else {
          if (percentage >= 80) overallGrade = 'A*';
          else if (percentage >= 70) overallGrade = 'A';
          else if (percentage >= 60) overallGrade = 'B';
          else if (percentage >= 50) overallGrade = 'C';
          else if (percentage >= 40) overallGrade = 'D';
          else if (percentage >= 30) overallGrade = 'E';
          else overallGrade = 'U';
        }
      }
    }

    return {
      totalRaw: Math.round(totalRaw * 10) / 10,
      maxRaw,
      totalUms,
      percentage,
      grade: overallGrade,
      anyFilled,
    };
  }, [activePreset, paperResults, isIAL]);

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
    <div className="rounded-3xl border border-border bg-background-card p-6 md:p-8 shadow-xs space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            <Calculator className="w-3.5 h-3.5" />
            Syllabus Grade Calculator
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Official Exam Grade Predictor
          </h1>
          <p className="text-xs text-foreground-muted">
            Predict grades using official boundary data for CAIE and Edexcel syllabuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/past-papers"
            className="flex items-center gap-1.5 rounded-2xl border border-border bg-background-secondary px-4 py-2.5 text-xs font-bold text-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Past Paper Tracker
          </Link>
          <button
            onClick={resetAll}
            className="flex items-center gap-2 rounded-2xl border border-border bg-background-secondary px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-background-secondary/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Stepper Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { n: 1, label: 'Select Syllabus & Series', enabled: true },
          { n: 2, label: 'Input Marks & Calculate', enabled: canGoStep2 },
        ].map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => s.enabled && setCurrentStep(s.n)}
            disabled={!s.enabled}
            className={cn(
              'py-3.5 px-4 rounded-2xl border transition-all text-center',
              currentStep === s.n
                ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                : s.enabled
                ? 'bg-background-secondary border-border text-foreground-secondary hover:text-foreground cursor-pointer'
                : 'bg-background-secondary/50 border-border text-foreground-muted opacity-50 cursor-not-allowed'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5">
              Step 0{s.n}
            </div>
            <div className="text-xs font-extrabold">{s.label}</div>
          </button>
        ))}
      </div>

      {/* ═══ STEP 1: Syllabus Selection ═══ */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Choose Curriculum & Exam Session
            </h3>
            <p className="text-xs text-foreground-muted">
              Select the exam board, subject syllabus, and examination series.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Curriculum */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                <BookOpen className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                Exam Board & Curriculum
              </label>
              <select
                value={selectedCurriculum}
                onChange={(e) => {
                  setSelectedCurriculum(e.target.value);
                  setSelectedSubject('');
                  setSelectedSeries('');
                }}
                className="w-full bg-background-secondary border border-border rounded-2xl py-3 px-4 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
              >
                <option value="">-- Select curriculum --</option>
                {curriculums.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                <Layers className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                Subject Syllabus
              </label>
              <select
                value={selectedSubject}
                disabled={!selectedCurriculum}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedSeries('');
                }}
                className="w-full bg-background-secondary border border-border rounded-2xl py-3 px-4 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors disabled:opacity-40"
              >
                <option value="">-- Select subject --</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title || s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Series */}
          {selectedSubject && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                <Clock className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                Exam Series / Year
              </label>
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                className="w-full md:w-1/2 bg-background-secondary border border-border rounded-2xl py-3 px-4 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
              >
                <option value="">-- Select series --</option>
                {availableSeries.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {availableSeries.length === 0 && (
                <p className="text-xs text-foreground-muted mt-1">
                  No seeded past paper data found for this subject yet.
                </p>
              )}
            </div>
          )}

          {/* Ready notification card */}
          {canGoStep2 && activePreset && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-primary">
                  Official Grade Data Loaded
                </p>
                <p className="text-xs text-foreground-muted">
                  {activePreset.title} &mdash; {activePreset.series} •{' '}
                  {activePreset.papers.length} paper(s) •{' '}
                  {isIAL ? 'Edexcel Modular UMS' : 'Raw Mark Boundaries'}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!canGoStep2}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-bold text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-hover transition-all"
            >
              Next: Enter Marks
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Mark Input & Calculation ═══ */}
      {currentStep === 2 && activePreset && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Component Marks & Predicted Grade
              </h3>
              <p className="text-xs text-foreground-muted">
                {isIAL
                  ? 'Edexcel IAL Modular Scale — Calculates UMS per paper and maps to official UMS grade boundaries.'
                  : 'Calculates raw component percentages and maps to official syllabus grade boundaries.'}
              </p>
            </div>
          </div>

          {/* Paper Mark Entry Cards */}
          <div className="space-y-4">
            {paperResults.map((pr) => (
              <div
                key={pr.index}
                className="rounded-3xl border border-border bg-background-secondary/50 p-5 sm:p-6 transition-colors hover:border-primary/30 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                      Component {pr.index + 1}
                    </span>
                    <h4 className="text-base font-bold text-foreground">
                      {pr.name}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-foreground-muted">
                      <span>Max: <strong className="text-foreground font-mono">{pr.max_mark}</strong> marks</span>
                      {pr.filled && (
                        <>
                          <span>•</span>
                          <span>Score: <strong className="text-primary font-mono">{pr.pct}%</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inputs and Grade Badge */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={pr.max_mark}
                        step="0.5"
                        value={rawMarks[pr.index] ?? ''}
                        placeholder="0"
                        onChange={(e) => handleMarkChange(pr.index, e.target.value)}
                        className="w-24 rounded-2xl border border-border bg-background-card py-2.5 px-3 text-center font-mono font-bold text-base text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                      <span className="text-foreground-muted font-mono font-bold">/</span>
                      <div className="w-16 rounded-2xl border border-border bg-background-card py-2.5 text-center font-mono font-bold text-xs text-foreground-muted">
                        {pr.max_mark}
                      </div>
                    </div>

                    {pr.filled && (
                      <div className="pl-4 border-l border-border flex flex-col items-center">
                        <span className="text-[10px] text-foreground-muted uppercase font-bold mb-1">
                          Grade
                        </span>
                        <div
                          className={cn(
                            'px-3 py-1 rounded-xl text-sm font-extrabold border shadow-2xs',
                            getGradeColor(pr.paperGrade)
                          )}
                        >
                          {pr.paperGrade}
                        </div>
                        {isIAL && pr.paperUms !== undefined && (
                          <span className="text-[10px] font-mono text-primary mt-1 font-bold">
                            {pr.paperUms} UMS
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Boundaries pill list */}
                {pr.perBoundaries && pr.perBoundaries.length > 0 && (
                  <div className="pt-3 border-t border-border flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-foreground-muted mr-1">
                      Boundaries:
                    </span>
                    {pr.perBoundaries.map((b) => {
                      const hit = pr.filled && pr.paperGrade === b.grade;
                      return (
                        <span
                          key={b.grade}
                          className={cn(
                            'px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-all',
                            hit
                              ? 'bg-primary text-white border-primary font-bold shadow-2xs'
                              : 'bg-background-card text-foreground-secondary border-border'
                          )}
                        >
                          {b.grade} ≥ {b.min_mark}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Overall Results Card ─────────────────────────────────────────── */}
          <div className="rounded-3xl border border-border bg-background-secondary p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                  Overall Performance
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-background-card p-4 space-y-1">
                    <span className="text-[11px] text-foreground-muted uppercase font-bold block">
                      Total Raw Score
                    </span>
                    <span className="text-xl font-bold font-mono text-foreground">
                      {calc.anyFilled ? `${calc.totalRaw} / ${calc.maxRaw}` : '—'}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-border bg-background-card p-4 space-y-1">
                    <span className="text-[11px] text-foreground-muted uppercase font-bold block">
                      {isIAL ? 'Total UMS Score' : 'Overall Percentage'}
                    </span>
                    <span className="text-xl font-bold font-mono text-primary">
                      {calc.anyFilled
                        ? isIAL
                          ? `${calc.totalUms} UMS`
                          : `${calc.percentage}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Big Grade Badge */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border bg-background-card text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-primary" />
                  Estimated Grade
                </span>
                <div
                  className={cn(
                    'w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-extrabold border shadow-md transition-all',
                    calc.anyFilled
                      ? getGradeColor(calc.grade)
                      : 'bg-background-secondary text-foreground-muted border-border'
                  )}
                >
                  {calc.grade}
                </div>
                {calc.anyFilled && (
                  <span className="text-xs font-semibold text-foreground-muted">
                    {isIAL ? 'Uniform Mark Scale Result' : 'Raw Threshold Result'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background-secondary px-5 py-3 text-xs font-bold text-foreground hover:bg-background-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Setup
            </button>
            <Link
              href="/past-papers"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-primary-hover transition-colors"
            >
              Go to Past Paper Tracker
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
