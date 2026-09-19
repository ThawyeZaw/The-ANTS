'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Syllabus Grade Calculator (Redesigned)
// Context-aware: Edexcel IAL (UMS) vs CAIE & Edexcel IGCSE (Raw Grade Boundaries)
// Reads from seeded past papers and official grade boundaries.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { listSubjectCompositeBoundaries } from '@/actions/curriculum';
import { cn } from '@/lib/utils';
import {
  getGradeColor,
  getPluginForCurriculumCode,
  getPluginForPaper,
  syllabusHasTiers,
  uniqueVariants,
  type SubjectTier,
} from '@/lib/grading';
import type { GradeBoundary, PaperComponent } from '@/lib/grading/types';

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
  paper_number?: string;
  variant?: string | null;
  paper_boundaries?: GradeBoundary[];
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
  paper_number?: string;
  variant?: string | null;
  syllabus_code?: string;
}

// UMS interpolation lives in lib/grading — GradeCalculator uses qualification plugins.

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
  const [selectedTier, setSelectedTier] = useState<SubjectTier | ''>(
    (searchParams.get('tier') as SubjectTier) || ''
  );
  const [selectedVariant, setSelectedVariant] = useState(searchParams.get('variant') || '');
  const [selectedExclusiveOptions, setSelectedExclusiveOptions] = useState<Record<string, string>>({});
  const [rawMarks, setRawMarks] = useState<Record<string, number | string>>({});
  const [compositeBoundaries, setCompositeBoundaries] = useState<GradeBoundary[]>([]);

  // Client-side cache to avoid redundant D1 row queries when toggling subjects
  const presetCacheRef = useRef<Map<string, CalcPreset[]>>(new Map());
  const compositeCacheRef = useRef<Map<string, GradeBoundary[]>>(new Map());

  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      try {
        const [cData, sData] = await Promise.all([listCurriculums(), listSubjects()]);
        setCurriculums(cData);
        setSubjects(sData);
      } catch (err) {
        console.error('[GradeCalculator] catalog load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      setPresets([]);
      return;
    }

    if (presetCacheRef.current.has(selectedSubject)) {
      setPresets(presetCacheRef.current.get(selectedSubject)!);
      return;
    }

    let cancelled = false;
    listApprovedCalculatorPresets(selectedSubject)
      .then((pData) => {
        if (!cancelled) {
          const list = pData as CalcPreset[];
          presetCacheRef.current.set(selectedSubject, list);
          setPresets(list);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[GradeCalculator] presets load failed:', err);
          setPresets([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSubject]);

  const selectedCurriculumRow = useMemo(
    () => curriculums.find((c) => c.id === selectedCurriculum),
    [curriculums, selectedCurriculum]
  );
  const selectedSubjectRow = useMemo(
    () => subjects.find((s) => s.id === selectedSubject),
    [subjects, selectedSubject]
  );
  const plugin = useMemo(
    () => getPluginForCurriculumCode(selectedCurriculumRow?.code),
    [selectedCurriculumRow]
  );
  const showTier = plugin.hasTiers && syllabusHasTiers(selectedSubjectRow?.code);

  useEffect(() => {
    if (selectedSubject && !selectedCurriculum) {
      const subj = subjects.find((s) => s.id === selectedSubject);
      if (subj?.curriculum_id) setSelectedCurriculum(subj.curriculum_id);
    }
  }, [selectedSubject, selectedCurriculum, subjects]);

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
  }, [presets, selectedCurriculum, selectedSubject, selectedSeries]);

  const availableVariants = useMemo(
    () => uniqueVariants(matchingPresets.map((p) => ({ variant: p.variant ?? p.papers[0]?.variant }))),
    [matchingPresets]
  );

  useEffect(() => {
    if (!selectedVariant && plugin.defaultVariant && availableVariants.includes(plugin.defaultVariant)) {
      setSelectedVariant(plugin.defaultVariant);
    } else if (!selectedVariant && availableVariants.length === 1) {
      setSelectedVariant(availableVariants[0]);
    }
  }, [availableVariants, plugin.defaultVariant, selectedVariant]);

  useEffect(() => {
    if (showTier && !selectedTier) setSelectedTier('extended');
  }, [showTier, selectedTier]);

  const activePreset = useMemo<CalcPreset | null>(() => {
    if (matchingPresets.length === 0) return null;
    const papers: PaperDef[] = [];
    let isModular = false;
    let title = '';
    let subjectCode = '';
    let qualification = '';
    let examBoard = '';
    let year: number | undefined;

    for (const p of matchingPresets) {
      if (p.is_modular || p.qualification === 'IAL') isModular = true;
      title = p.title || title;
      subjectCode = p.subject_code || p.syllabus_code || subjectCode;
      qualification = p.qualification || qualification;
      examBoard = p.exam_board || examBoard;
      year = p.year ?? year;
      for (const paper of p.papers) {
        papers.push({
          ...paper,
          paper_number: paper.paper_number || p.paper_number,
          variant: paper.variant ?? p.variant,
        });
      }
    }

    const asComponents: PaperComponent[] = papers.map((paper) => ({
      name: paper.name,
      paperNumber: paper.paper_number || paper.name,
      variant: paper.variant,
      maxMark: paper.max_mark,
      title: paper.name,
      boundaries: (paper.paper_boundaries ?? []) as GradeBoundary[],
    }));

    const filtered = plugin.paperSelectionRules(asComponents, {
      tier: showTier ? (selectedTier || 'extended') : null,
      variant: selectedVariant || plugin.defaultVariant,
      syllabusCode: selectedSubjectRow?.code || subjectCode,
    });

    const selectedPapers: PaperDef[] = filtered.map((c) => {
      const orig = papers.find(
        (p) => (p.paper_number || p.name) === c.paperNumber && (p.variant ?? null) === (c.variant ?? null)
      ) ?? papers.find((p) => p.name === c.name);
      if (orig) return orig;
      return {
        name: c.name,
        max_mark: c.maxMark,
        weight: 100,
        paper_number: c.paperNumber,
        variant: c.variant ?? null,
        exclusiveGroup: c.exclusiveGroup,
        paper_boundaries: c.boundaries,
      } as PaperDef & { exclusiveGroup?: string };
    });

    return {
      id: selectedSeries,
      title,
      subject_code: subjectCode,
      curriculum_id: selectedCurriculum,
      subject_id: selectedSubject,
      series: selectedSeries,
      year,
      qualification,
      exam_board: examBoard,
      papers: selectedPapers,
      grade_boundaries: [],
      is_modular: isModular,
      syllabus_code: subjectCode,
    };
  }, [
    matchingPresets,
    selectedSeries,
    selectedCurriculum,
    selectedSubject,
    plugin,
    showTier,
    selectedTier,
    selectedVariant,
    selectedSubjectRow,
  ]);

  const exclusiveGroups = useMemo(() => {
    if (!activePreset) return null;
    const groups = new Map<string, (PaperDef & { exclusiveGroup?: string })[]>();
    for (const p of activePreset.papers as (PaperDef & { exclusiveGroup?: string })[]) {
      if (p.exclusiveGroup) {
        if (!groups.has(p.exclusiveGroup)) groups.set(p.exclusiveGroup, []);
        groups.get(p.exclusiveGroup)!.push(p);
      }
    }
    return groups.size > 0 ? groups : null;
  }, [activePreset]);

  useEffect(() => {
    if (!exclusiveGroups) return;
    const newOpts = { ...selectedExclusiveOptions };
    let changed = false;
    for (const [groupName, papers] of exclusiveGroups.entries()) {
      if (!newOpts[groupName] || !papers.find(p => (p.paper_number || p.name) === newOpts[groupName])) {
        newOpts[groupName] = papers[0].paper_number || papers[0].name;
        changed = true;
      }
    }
    if (changed) setSelectedExclusiveOptions(newOpts);
  }, [exclusiveGroups]);

  const filteredActivePapers = useMemo(() => {
    if (!activePreset) return [];
    return (activePreset.papers as (PaperDef & { exclusiveGroup?: string })[]).filter((p) => {
      if (p.exclusiveGroup) {
        return (p.paper_number || p.name) === selectedExclusiveOptions[p.exclusiveGroup];
      }
      return true;
    });
  }, [activePreset, selectedExclusiveOptions]);

  useEffect(() => {
    if (!selectedSubject || !selectedSeries || !activePreset?.year) {
      setCompositeBoundaries([]);
      return;
    }
    const seriesName = selectedSeries.replace(/\s+\d{4}$/, '');
    const compKey = `${selectedSubject}:${activePreset.year}:${seriesName}:${selectedVariant || ''}:${selectedTier || ''}`;

    if (compositeCacheRef.current.has(compKey)) {
      setCompositeBoundaries(compositeCacheRef.current.get(compKey)!);
      return;
    }

    listSubjectCompositeBoundaries(selectedSubject, activePreset.year, seriesName, {
      variant: selectedVariant || null,
      tier: selectedTier || null,
    }).then((rows) => {
      const mapped = rows.map((r) => ({ grade: r.grade, min_mark: r.min_mark, max_mark: r.max_mark }));
      compositeCacheRef.current.set(compKey, mapped);
      setCompositeBoundaries(mapped);
    });
  }, [selectedSubject, selectedSeries, activePreset?.year, selectedVariant, selectedTier]);

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
  const canGoStep2 = !!(
    selectedCurriculum &&
    selectedSubject &&
    selectedSeries &&
    activePreset &&
    (!showTier || selectedTier)
  );

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
    setSelectedTier('');
    setSelectedVariant('');
    setSelectedExclusiveOptions({});
    setCurrentStep(1);
  };

  const paperPlugin = useMemo(
    () =>
      getPluginForPaper({
        examBoard: activePreset?.exam_board,
        qualification: activePreset?.qualification,
        curriculumCode: selectedCurriculumRow?.code,
      }),
    [activePreset, selectedCurriculumRow]
  );

  const paperResults = useMemo(() => {
    if (!activePreset || filteredActivePapers.length === 0) return [];
    return filteredActivePapers.map((p, i) => {
      const val = rawMarks[i];
      const filled = val !== '' && val !== undefined;
      const raw = filled ? Number(val) : 0;
      const perBoundaries = (p.paper_boundaries && p.paper_boundaries.length > 0
        ? p.paper_boundaries
        : []) as GradeBoundary[];
      const result = filled
        ? paperPlugin.gradeFromRawMark(raw, p.max_mark, perBoundaries)
        : { grade: '—', percentage: 0, ums: undefined as number | undefined };
      return {
        ...p,
        index: i,
        filled,
        raw,
        pct: result.percentage,
        perBoundaries,
        paperGrade: filled ? result.grade : '—',
        paperUms: result.ums,
      };
    });
  }, [activePreset, rawMarks, paperPlugin]);

  const calc = useMemo(() => {
    if (!activePreset) {
      return { totalRaw: 0, maxRaw: 0, totalUms: 0, percentage: 0, grade: '—', anyFilled: false, usedComposite: false };
    }
    const filled = paperResults.filter((pr) => pr.filled);
    const anyFilled = filled.length > 0;
    if (!anyFilled) {
      return { totalRaw: 0, maxRaw: 0, totalUms: 0, percentage: 0, grade: '—', anyFilled: false, usedComposite: false };
    }
    const composite = paperPlugin.compositeGrade(
      filled.map((pr) => ({
        name: pr.name,
        paperNumber: pr.paper_number || pr.name,
        variant: pr.variant,
        maxMark: pr.max_mark,
        boundaries: pr.perBoundaries,
        rawMark: pr.raw,
      })),
      compositeBoundaries
    );
    return {
      totalRaw: Math.round(composite.totalRaw * 10) / 10,
      maxRaw: composite.maxRaw,
      totalUms: composite.totalUms ?? 0,
      percentage: composite.percentage,
      grade: composite.grade,
      anyFilled: true,
      usedComposite: composite.usedCompositeBoundaries,
    };
  }, [activePreset, paperResults, paperPlugin, compositeBoundaries]);

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
            href={selectedSubject ? `/past-papers?subject=${selectedSubject}` : '/past-papers'}
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

          {selectedSubject && showTier && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                Paper Tier
              </label>
              <div className="flex gap-2">
                {(['extended', 'core'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTier(t)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-bold border transition-colors capitalize',
                      selectedTier === t
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background-secondary border-border text-foreground-secondary hover:text-foreground'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-foreground-muted">
                Core uses Papers 1 &amp; 3 (max C). Extended uses Papers 2 &amp; 4 (max A*).
              </p>
            </div>
          )}

          {selectedSubject && availableVariants.length > 1 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                Paper Variant
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full md:w-1/3 bg-background-secondary border border-border rounded-2xl py-3 px-4 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
              >
                {availableVariants.map((v) => (
                  <option key={v} value={v}>
                    Variant {v}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Exclusive Group Selectors (e.g., Paper 52 OR 62) */}
          {exclusiveGroups && canGoStep2 && (
            <div className="space-y-4 pt-2">
              {Array.from(exclusiveGroups.entries()).map(([groupName, groupPapers]) => (
                <div key={groupName} className="space-y-1.5 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary">
                    Select Option ({groupName.replace('_', ' ')})
                  </label>
                  <p className="text-[11px] text-foreground-muted mb-2">
                    These papers are mutually exclusive. Choose the one you took.
                  </p>
                  <select
                    value={selectedExclusiveOptions[groupName] || ''}
                    onChange={(e) => setSelectedExclusiveOptions(prev => ({ ...prev, [groupName]: e.target.value }))}
                    className="w-full bg-background-card border border-primary/30 rounded-xl py-2.5 px-4 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
                  >
                    {groupPapers.map((p) => {
                      const val = p.paper_number || p.name;
                      return (
                        <option key={val} value={val}>
                          Paper {val} {p.name !== val ? `(${p.name})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ))}
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
                  {filteredActivePapers.length} paper(s) •{' '}
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
                    {isIAL
                      ? 'Uniform Mark Scale Result'
                      : calc.usedComposite
                        ? 'Syllabus composite thresholds'
                        : 'Percentage-band estimate (no composite thresholds seeded)'}
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
              href={selectedSubject ? `/past-papers?subject=${selectedSubject}` : '/past-papers'}
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
