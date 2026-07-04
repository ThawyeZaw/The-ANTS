'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calculator, BookOpen, Layers, RotateCcw, TrendingUp,
  ArrowLeft, ArrowRight, GraduationCap, Clock, ChevronRight, Check, Info, BarChart3, FileText,
} from 'lucide-react';
import { getApprovedCalculatorPresets, getAllCurriculums, getPublicSubjects } from '@/lib/mock/database';

interface PresetBoundary { grade: string; min_mark: number; }
interface PaperDef { name: string; max_mark: number; weight: number; unit_group?: string; paper_boundaries?: PresetBoundary[]; }
interface CalcPreset { id: string; title: string; subject_code: string; curriculum_id: string; subject_id: string; series: string; papers: PaperDef[]; grade_boundaries: PresetBoundary[]; is_modular?: boolean; }

// ── PUM interpolation helper ──────────────────────────────────────────────────
function computePUM(rawScore: number, boundaries: PresetBoundary[]): { pum: number; grade: string } | null {
  if (!boundaries || boundaries.length === 0) return null;
  const sorted = [...boundaries].sort((a, b) => b.min_mark - a.min_mark);
  const maxB = sorted[0]?.min_mark ?? 100;
  const lastB = sorted[sorted.length - 1]?.min_mark ?? 0;

  for (let i = 0; i < sorted.length; i++) {
    const grade = sorted[i].grade.trim();
    const threshold = sorted[i].min_mark;
    if (rawScore >= threshold) {
      let pum = 0;
      if (i === 0) {
        pum = 90 + ((maxB - threshold) > 0 ? ((rawScore - threshold) / (maxB - threshold)) * 10 : 0);
      } else {
        const above = sorted[i - 1].min_mark;
        pum = 70 + i * 10 + ((above - threshold) > 0 ? ((rawScore - threshold) / (above - threshold)) * 10 : 0);
      }
      return { pum: Math.min(100, Math.max(0, Math.round(pum))), grade };
    }
  }
  return { pum: lastB > 0 ? Math.min(50, Math.round((rawScore / lastB) * 50)) : 0, grade: 'E/U' };
}

export default function GradeCalculator() {
  const curriculums = useMemo(() => getAllCurriculums(), []);
  const allPresets = useMemo(() => getApprovedCalculatorPresets() as CalcPreset[], []);

  const searchParams = useSearchParams();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCurriculum, setSelectedCurriculum] = useState(searchParams.get('curriculum') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedSeries, setSelectedSeries] = useState(searchParams.get('series') || '');
  const [rawMarks, setRawMarks] = useState<Record<string, number | string>>({});

  const subjects = useMemo(() => {
    if (!selectedCurriculum) return [];
    return getPublicSubjects(selectedCurriculum).map(s => ({ id: s.id, title: s.title }));
  }, [selectedCurriculum]);

  const matchingPresets = useMemo(() => {
    let list = allPresets;
    if (selectedCurriculum) list = list.filter(p => p.curriculum_id === selectedCurriculum);
    if (selectedSubject) list = list.filter(p => p.subject_id === selectedSubject);
    if (selectedSeries) list = list.filter(p => p.series === selectedSeries);
    return list;
  }, [selectedCurriculum, selectedSubject, selectedSeries, allPresets]);

  const activePreset = useMemo<CalcPreset | null>(() => {
    if (matchingPresets.length === 0) return null;
    const papers: PaperDef[] = [];
    const paperKeys = new Set<string>();
    const boundaries: PresetBoundary[] = [];
    const boundaryKeys = new Set<string>();
    let isModular = false, title = '', subjectCode = '';
    for (const p of matchingPresets) {
      if (p.is_modular) isModular = true;
      title = p.title || title;
      subjectCode = p.subject_code || subjectCode;
      for (const paper of p.papers) {
        if (!paperKeys.has(paper.name)) { paperKeys.add(paper.name); papers.push(paper); }
      }
      for (const b of p.grade_boundaries) {
        if (!boundaryKeys.has(b.grade)) { boundaryKeys.add(b.grade); boundaries.push(b); }
      }
    }
    return { id: selectedSeries, title, subject_code: subjectCode, curriculum_id: selectedCurriculum, subject_id: selectedSubject, series: selectedSeries, papers, grade_boundaries: boundaries, is_modular: isModular };
  }, [matchingPresets, selectedSeries, selectedCurriculum, selectedSubject]);

  const availableSeries = useMemo(() => {
    const set = new Set<string>();
    allPresets.filter(p => selectedCurriculum ? p.curriculum_id === selectedCurriculum : true).filter(p => selectedSubject ? p.subject_id === selectedSubject : true).forEach(p => { if (p.series) set.add(p.series); });
    return Array.from(set).sort();
  }, [selectedCurriculum, selectedSubject, allPresets]);

  const unitGroups = useMemo(() => {
    if (!activePreset?.is_modular) return null;
    const groups = new Set<string>();
    activePreset.papers.forEach(p => { if (p.unit_group) groups.add(p.unit_group); });
    return Array.from(groups).sort();
  }, [activePreset]);

  const curriculumName = curriculums.find(c => c.id === selectedCurriculum)?.title || '';

  const canGoStep2 = !!(selectedCurriculum && selectedSubject && selectedSeries && activePreset);
  const anyMarkEntered = activePreset && Object.values(rawMarks).some(v => v !== '' && v !== undefined);

  const handleMarkChange = (index: number, value: string) => {
    if (!activePreset) return;
    const paper = activePreset.papers[index];
    if (!paper) return;
    if (value === '') { setRawMarks(prev => ({ ...prev, [index]: '' })); return; }
    const n = parseInt(value, 10);
    if (!isNaN(n) && n >= 0) setRawMarks(prev => ({ ...prev, [index]: Math.min(n, paper.max_mark) }));
  };

  const resetAll = () => { setRawMarks({}); setSelectedSeries(''); setSelectedSubject(''); setSelectedCurriculum(''); setCurrentStep(1); };

  // ── Per-paper results ────────────────────────────────────────────────────────
  const paperResults = useMemo(() => {
    if (!activePreset) return [];
    return activePreset.papers.map((p, i) => {
      const val = rawMarks[i];
      const filled = val !== '' && val !== undefined;
      const raw = filled ? Number(val) : 0;
      const pct = filled ? Math.round((raw / p.max_mark) * 100) : 0;
      let perBoundaries: PresetBoundary[] | undefined;
      if (p.paper_boundaries && p.paper_boundaries.length > 0) {
        perBoundaries = p.paper_boundaries;
      } else if (activePreset.grade_boundaries.length > 0) {
        // Scale overall boundaries proportionally to this paper's max mark
        const totalMax = activePreset.papers.reduce((s, pp) => s + pp.max_mark, 0);
        const scale = totalMax > 0 ? p.max_mark / totalMax : 1;
        perBoundaries = activePreset.grade_boundaries.map(b => ({ grade: b.grade, min_mark: Math.round(b.min_mark * scale) }));
      }
      const paperPUM = filled && perBoundaries ? computePUM(raw, perBoundaries) : null;
      return { ...p, index: i, filled, raw, pct, perBoundaries, paperPUM };
    });
  }, [activePreset, rawMarks]);

  const groupResults = useMemo(() => {
    if (!activePreset?.is_modular || !unitGroups) return null;
    const gr: { group: string; totalRaw: number; totalMax: number; pct: number; fills: number; total: number }[] = [];
    const map = new Map<string, typeof gr[0]>();
    for (const pr of paperResults) {
      if (!pr.unit_group) continue;
      if (!map.has(pr.unit_group)) map.set(pr.unit_group, { group: pr.unit_group, totalRaw: 0, totalMax: 0, pct: 0, fills: 0, total: 0 });
      const g = map.get(pr.unit_group)!;
      g.totalMax += pr.max_mark; g.total += 1;
      if (pr.filled) { g.totalRaw += pr.raw; g.fills += 1; }
    }
    for (const g of map.values()) g.pct = g.totalMax > 0 ? Math.round((g.totalRaw / g.totalMax) * 100) : 0;
    return Array.from(map.values());
  }, [paperResults, activePreset, unitGroups]);

  // ── Overall calculation ──────────────────────────────────────────────────────
  const calc = useMemo(() => {
    if (!activePreset) return { totalRaw: 0, maxRaw: 0, weighted: 0, maxWeight: 0, pum: 0, grade: '—', anyFilled: false };
    let totalRaw = 0, maxRaw = 0, weighted = 0, maxWeight = 0, anyFilled = false;
    activePreset.papers.forEach((p, i) => {
      maxRaw += p.max_mark; maxWeight += p.weight;
      const val = rawMarks[i];
      if (val === '' || val === undefined) return;
      anyFilled = true;
      const score = Number(val);
      totalRaw += score;
      weighted += (score / p.max_mark) * p.weight;
    });
    let pum = 0, grade = '—';
    if (anyFilled) {
      const rawOrWeighted = activePreset.is_modular ? totalRaw : weighted;
      const result = computePUM(rawOrWeighted, activePreset.grade_boundaries);
      if (result) { pum = result.pum; grade = result.grade; }
      else { pum = Math.round(rawOrWeighted); grade = '—'; }
    }
    return { totalRaw: Math.round(totalRaw * 100) / 100, maxRaw, weighted: Math.round(weighted * 100) / 100, maxWeight, pum, grade, anyFilled };
  }, [activePreset, rawMarks]);

  const filledCount = paperResults.filter(p => p.filled).length;
  const totalPapers = activePreset?.papers.length ?? 0;

  return (
    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)]">Syllabus Grade Calculator</h1>
          <p className="text-[var(--foreground-secondary)] text-xs mt-1">Predict grades using real boundary data. Enter any paper combination.</p>
        </div>
        <button onClick={resetAll} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--background-secondary)]"><RotateCcw className="w-4 h-4" /> Reset</button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-8">
        {[ { n: 1, label: 'Setup', enabled: true }, { n: 2, label: 'Marks & Results', enabled: canGoStep2 } ].map(s => (
          <button key={s.n} type="button" onClick={() => s.enabled && setCurrentStep(s.n)} className={`py-3 px-4 rounded-xl border transition-all text-center ${currentStep === s.n ? 'bg-[var(--background-card)] border-[var(--primary)] text-[var(--primary)] shadow-sm' : s.enabled ? 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)] cursor-pointer' : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)] opacity-50 cursor-not-allowed'}`}><div className="text-[10px] font-bold uppercase tracking-widest mb-1">Step 0{s.n}</div><div className="text-xs font-extrabold">{s.label}</div></button>
        ))}
      </div>

      {/* ═══ STEP 1: Setup ═══ */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-extrabold text-[var(--foreground)] flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" />Select your exam</h3>
          <p className="text-[var(--foreground-secondary)] text-xs -mt-4 mb-4">Choose curriculum, subject, and series to load paper components and boundaries.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]"><BookOpen className="w-3.5 h-3.5 inline mr-1.5 text-primary" />Curriculum</label>
              <select value={selectedCurriculum} onChange={e => { setSelectedCurriculum(e.target.value); setSelectedSubject(''); setSelectedSeries(''); }} className="w-full bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"><option value="">-- Select curriculum --</option>{curriculums.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}</select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]"><Layers className="w-3.5 h-3.5 inline mr-1.5 text-primary" />Subject</label>
              <select value={selectedSubject} disabled={!selectedCurriculum} onChange={e => { setSelectedSubject(e.target.value); setSelectedSeries(''); }} className="w-full bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-40"><option value="">-- Select subject --</option>{subjects.map(s => (<option key={s.id} value={s.id}>{s.title}</option>))}</select>
            </div>
          </div>
          {selectedSubject && (<div className="space-y-1.5"><label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]"><Clock className="w-3.5 h-3.5 inline mr-1.5 text-primary" />Exam Series</label><select value={selectedSeries} onChange={e => setSelectedSeries(e.target.value)} className="w-full md:w-1/2 bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"><option value="">-- Select series --</option>{availableSeries.map(s => (<option key={s} value={s}>{s}</option>))}</select>{availableSeries.length === 0 && <p className="text-xs text-[var(--foreground-muted)] mt-1">No approved data yet.</p>}</div>)}
          {canGoStep2 && activePreset && (<div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3"><Check className="w-5 h-5 text-[var(--accent)] shrink-0" /><div><p className="text-xs font-semibold text-[var(--accent)]">Data loaded</p><p className="text-xs text-[var(--foreground-secondary)]">{activePreset.title} ({activePreset.subject_code}) &mdash; {activePreset.series}{curriculumName && <>&middot; {curriculumName}</>} &middot; {activePreset.papers.length} paper{activePreset.papers.length !== 1 ? 's' : ''}{activePreset.is_modular && ' (modular)'}</p></div></div>)}
          <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setCurrentStep(2)} disabled={!canGoStep2} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next: Enter Marks <ArrowRight className="w-3.5 h-3.5" /></button></div>
        </div>
      )}

      {/* ═══ STEP 2: Marks & Results ═══ */}
      {currentStep === 2 && activePreset && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-[var(--foreground)] flex items-center gap-2"><Calculator className="w-5 h-5 text-primary" />Marks & Results</h3>
          </div>
          <p className="text-[var(--foreground-secondary)] text-xs -mt-4">Enter marks for any papers to see your predicted grades. No requirement to fill all.{activePreset.is_modular && <><br /><span className="text-primary">Modular</span> &mdash; grouped by AS/A2.</>}</p>
          <div className="flex items-center gap-3"><div className="flex-1 h-2 bg-[var(--background-card)] rounded-full overflow-hidden border border-[var(--border)]"><div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${totalPapers > 0 ? (filledCount / totalPapers) * 100 : 0}%` }} /></div><span className="text-xs font-semibold text-[var(--foreground-secondary)]">{filledCount}/{totalPapers} papers</span></div>

          {activePreset.is_modular && unitGroups ? (
            <div className="space-y-4">{unitGroups.map(group => {
              const gp = paperResults.filter(p => p.unit_group === group);
              const gr = groupResults?.find(g => g.group === group);
              return (<div key={group} className="space-y-2"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)]"><BarChart3 className="w-3.5 h-3.5 text-primary" />{group} Units{gr && <span className="font-normal tracking-normal normal-case text-[var(--foreground-secondary)]">&mdash; {gr.fills}/{gr.total} entered</span>}</div>{gp.map(pr => (<div key={pr.index} className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 transition-colors hover:border-primary/30"><div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"><div className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Unit {pr.index + 1}</span><h4 className="text-sm font-bold text-[var(--foreground)]">{pr.name}</h4><div className="flex items-center gap-3 text-xs text-[var(--foreground-secondary)]"><span>Max: <strong className="text-[var(--foreground)]">{pr.max_mark}</strong></span>{pr.filled && <><span>&middot;</span><span>Score: <strong className="text-[var(--foreground)]">{pr.pct}%</strong></span></>}</div></div><div className="flex items-center gap-4"><div className="flex items-center gap-2"><input type="text" inputMode="numeric" pattern="[0-9]*" value={rawMarks[pr.index] ?? ''} placeholder="0" onChange={e => handleMarkChange(pr.index, e.target.value)} className="w-24 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] py-2.5 px-4 text-center font-bold text-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /><span className="text-[var(--foreground-secondary)] font-medium">/</span><div className="w-16 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] py-2.5 text-center font-semibold text-sm text-[var(--foreground-secondary)]">{pr.max_mark}</div></div>{pr.paperPUM && (<div className="pl-4 border-l border-[var(--border)] flex flex-col items-center"><span className="text-[10px] text-[var(--foreground-muted)] uppercase mb-1">Grade</span><div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-lg font-black shadow-sm shadow-primary/20">{pr.paperPUM.grade}</div></div>)}</div></div>{pr.perBoundaries && pr.perBoundaries.length > 0 && (<div className="mt-4 pt-3 border-t border-[var(--border)]"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] block mb-2">{pr.paper_boundaries ? 'Component boundaries' : 'Scaled overall boundaries'}</span><div className="flex flex-wrap gap-1.5">{pr.perBoundaries.map(b => { const hit = pr.paperPUM?.grade === b.grade; return (<div key={b.grade} className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${hit ? 'border-primary/30 bg-primary/10 text-primary' : 'border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground-secondary)]'}`}>{b.grade} ≥ {b.min_mark}</div>); })}</div></div>)}</div>))}{gr && (<div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-3 flex items-center justify-end gap-4 text-sm mt-2"><span className="text-[var(--foreground-muted)] font-medium uppercase tracking-wider text-[10px]">{group} Subtotal:</span><span className="font-bold text-[var(--foreground)]">{gr.totalRaw} / {gr.totalMax}</span><span className="font-black text-primary">{gr.pct}%</span></div>)}</div>);
            })}</div>
          ) : (
            <div className="space-y-4">{paperResults.map(pr => (<div key={pr.index} className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 transition-colors hover:border-primary/30"><div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"><div className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Paper {pr.index + 1}</span><h4 className="text-sm font-bold text-[var(--foreground)]">{pr.name}</h4><div className="flex items-center gap-3 text-xs text-[var(--foreground-secondary)]"><span>Max: <strong className="text-[var(--foreground)]">{pr.max_mark}</strong></span><span>&middot;</span><span>Weight: <strong className="text-primary">{pr.weight}%</strong></span>{pr.filled && <><span>&middot;</span><span>Score: <strong className="text-[var(--foreground)]">{pr.pct}%</strong></span></>}</div></div><div className="flex items-center gap-4"><div className="flex items-center gap-2"><input type="text" inputMode="numeric" pattern="[0-9]*" value={rawMarks[pr.index] ?? ''} placeholder="0" onChange={e => handleMarkChange(pr.index, e.target.value)} className="w-24 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] py-2.5 px-4 text-center font-bold text-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /><span className="text-[var(--foreground-secondary)] font-medium">/</span><div className="w-16 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] py-2.5 text-center font-semibold text-sm text-[var(--foreground-secondary)]">{pr.max_mark}</div></div>{pr.paperPUM && (<div className="pl-4 border-l border-[var(--border)] flex flex-col items-center"><span className="text-[10px] text-[var(--foreground-muted)] uppercase mb-1">Grade</span><div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-lg font-black shadow-sm shadow-primary/20">{pr.paperPUM.grade}</div></div>)}</div></div>{pr.perBoundaries && pr.perBoundaries.length > 0 && (<div className="mt-4 pt-3 border-t border-[var(--border)]"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] block mb-2">{pr.paper_boundaries ? 'Component boundaries' : 'Scaled overall boundaries'}</span><div className="flex flex-wrap gap-1.5">{pr.perBoundaries.map(b => { const hit = pr.paperPUM?.grade === b.grade; return (<div key={b.grade} className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${hit ? 'border-primary/30 bg-primary/10 text-primary' : 'border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground-secondary)]'}`}>{b.grade} ≥ {b.min_mark}</div>); })}</div></div>)}</div>))}</div>
          )}

          {/* Overall Results Display */}
          <div className="bg-[var(--background-card)] rounded-3xl p-6 shadow-[var(--shadow-glow)] relative overflow-hidden border border-[var(--border)] mt-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-4">
                <div><span className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">Overall Calculation</span></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-3">
                    <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest block mb-1">Raw Total</span>
                    <span className="text-lg font-bold text-[var(--foreground)]">{calc.anyFilled ? `${calc.totalRaw} / ${calc.maxRaw}` : '—'}</span>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-3">
                    <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest block mb-1">{activePreset.is_modular ? 'Overall Mark' : 'Weighted Mark'}</span>
                    <span className="text-lg font-bold text-[var(--foreground)]">{calc.anyFilled ? (activePreset.is_modular ? `${calc.totalRaw}` : `${calc.weighted} / ${calc.maxWeight}`) : '—'}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0 md:pl-6">
                <span className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-2">{activePreset.is_modular ? 'Estimated Overall %' : 'Estimated PUM Score'}</span>
                <div className="text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{calc.anyFilled ? `${calc.pum}%` : '—'}</div>
                <span className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mt-4 mb-2">Estimated Grade</span>
                <div className={`w-16 h-16 ${calc.anyFilled ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border)]'} rounded-2xl flex items-center justify-center text-2xl font-black`}>
                  {calc.grade}
                </div>
              </div>
            </div>
          </div>

          {calc.anyFilled && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-secondary)] mb-3">Overall Grade Boundaries</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--foreground-muted)]">
                      <th className="text-left py-2 font-semibold">Grade</th>
                      <th className="text-right py-2 font-semibold">Min {activePreset.is_modular ? 'Raw' : 'Weighted'} Mark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePreset.grade_boundaries.map(b => { 
                      const isAch = calc.anyFilled && calc.grade === b.grade; 
                      return (
                        <tr key={b.grade} className={`border-b border-[var(--border)] ${isAch ? 'bg-primary/10' : ''}`}>
                          <td className={`py-2 font-bold ${isAch ? 'text-primary' : 'text-[var(--foreground)]'}`}>{b.grade} {isAch && <ChevronRight className="w-3 h-3 inline text-primary" />}</td>
                          <td className={`py-2 text-right tabular-nums ${isAch ? 'text-primary font-bold' : 'text-[var(--foreground-secondary)]'}`}>{b.min_mark}</td>
                        </tr>
                      ); 
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5 space-y-3"><h5 className="font-bold text-[var(--foreground)] flex items-center gap-2 text-sm"><Info className="w-4 h-4 text-primary" />How it's calculated</h5><ol className="text-xs text-[var(--foreground-secondary)] space-y-2 pl-4 list-decimal marker:font-bold">{activePreset.is_modular ? (<><li>Each unit scored individually with per-unit boundaries where defined.</li><li>AS/A2 groups computed from entered units.</li><li><strong>Overall</strong> = total raw mark vs modular boundaries.</li></>) : (<><li>Raw marks summed across entered papers.</li><li><strong>Weighted Mark</strong> = Σ (Raw ÷ Max) × Weight.</li><li><strong>PUM</strong> interpolated between thresholds.</li></>)}</ol><div className="pt-2 border-t border-[var(--border)] text-[11px] text-[var(--foreground-secondary)] italic">Data from approved submissions &middot; <strong>{activePreset.series}</strong></div></div>

          <div className="flex justify-start gap-3 pt-4"><button type="button" onClick={() => setCurrentStep(1)} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-3 text-xs font-bold text-[var(--foreground)] transition hover:bg-[var(--background-card)]"><ArrowLeft className="w-3.5 h-3.5" /> Back to Setup</button></div>
        </div>
      )}
    </div>
  );
}
