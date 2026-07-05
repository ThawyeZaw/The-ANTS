'use client';

import React, { useMemo, useState, useTransition } from 'react';
import {
  Plus, Send, Trash2, CheckCircle2, Layers, BookOpen, Check, ChevronDown, ChevronUp,
  GraduationCap, Compass, ArrowLeft, ArrowRight, BarChart3, LayoutGrid,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { submitExamCalculatorPreset } from '@/actions/exam-editor';
import { getAllCurriculums, getPublicSubjects, getApprovedCalculatorPresets } from '@/lib/mock/database';

interface PaperBoundaryDraft { id: string; grade: string; minMark: number; }
interface PaperDraft { id: string; name: string; maxMark: number; weight: number; unitGroup: string; paperBoundaries: PaperBoundaryDraft[]; showBoundaries: boolean; }
interface BoundaryDraft { id: string; grade: string; minMark: number; }

const gid = () => `d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const mkPaper = (name = 'Paper 1', max = 80, w = 100, ug = ''): PaperDraft => ({ id: gid(), name, maxMark: max, weight: w, unitGroup: ug, paperBoundaries: [], showBoundaries: false });
const mkBoundary = (grade: string, min: number): BoundaryDraft => ({ id: gid(), grade, minMark: min });
const mkPaperBoundary = (grade: string, min: number): PaperBoundaryDraft => ({ id: gid(), grade, minMark: min });

export default function GradeCalculatorEditor() {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const curriculums = useMemo(() => getAllCurriculums(), []);
  const allApprovedPresets = useMemo(() => getApprovedCalculatorPresets() as Record<string, unknown>[], []);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [title, setTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [series, setSeries] = useState('');
  const [isModular, setIsModular] = useState(false);
  const [papers, setPapers] = useState<PaperDraft[]>([mkPaper()]);
  const [boundaries, setBoundaries] = useState<BoundaryDraft[]>([
    mkBoundary('A*', 90), mkBoundary('A', 80), mkBoundary('B', 70), mkBoundary('C', 60), mkBoundary('D', 50), mkBoundary('E', 40),
  ]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subjects = useMemo(() => { if (!selectedCurriculum) return []; return getPublicSubjects(selectedCurriculum).map(s => ({ id: s.id, title: s.title })); }, [selectedCurriculum]);
  const selCurrTitle = curriculums.find(c => c.id === selectedCurriculum)?.title || 'None';
  const selSubjTitle = subjects.find(s => s.id === selectedSubject)?.title || 'None';

  const availableSeries = useMemo(() => { const s = new Set<string>(); allApprovedPresets.forEach((p: Record<string, unknown>) => { if (typeof p.series === 'string' && p.series.trim()) s.add(p.series.trim()); }); return Array.from(s).sort(); }, [allApprovedPresets]);

  const canGoStep2 = !!(selectedCurriculum && selectedSubject);
  const canGoStep3 = canGoStep2 && papers.length > 0 && boundaries.length > 0;

  const updatePaper = (id: string, field: keyof PaperDraft, value: string | number | boolean) => {
    setPapers(prev => prev.map(p => p.id !== id ? p : { ...p, [field]: value }));
  };
  const addPaper = () => setPapers(prev => [...prev, mkPaper(`Paper ${prev.length + 1}`)]);
  const removePaper = (id: string) => { if (papers.length > 1) setPapers(prev => prev.filter(p => p.id !== id)); };

  // Per-paper boundaries
  const toggleBoundaries = (id: string) => updatePaper(id, 'showBoundaries', !papers.find(p => p.id === id)?.showBoundaries);
  const addPaperBoundary = (paperId: string) => setPapers(prev => prev.map(p => p.id !== paperId ? p : { ...p, paperBoundaries: [...p.paperBoundaries, mkPaperBoundary('', 0)] }));
  const removePaperBoundary = (paperId: string, boundaryId: string) => setPapers(prev => prev.map(p => p.id !== paperId ? p : { ...p, paperBoundaries: p.paperBoundaries.filter(b => b.id !== boundaryId) }));
  const updatePaperBoundary = (paperId: string, boundaryId: string, field: keyof PaperBoundaryDraft, value: string) => setPapers(prev => prev.map(p => p.id !== paperId ? p : { ...p, paperBoundaries: p.paperBoundaries.map(b => b.id !== boundaryId ? b : { ...b, [field]: field === 'grade' ? value : Math.max(0, Number(value) || 0) }) }));

  const updateBoundary = (id: string, field: 'grade' | 'minMark', value: string) => setBoundaries(prev => prev.map(r => r.id !== id ? r : { ...r, [field]: field === 'grade' ? value : Math.max(0, Number(value) || 0) }));
  const addBoundary = () => setBoundaries(prev => [...prev, mkBoundary('', 0)]);
  const removeBoundary = (id: string) => { if (boundaries.length > 1) setBoundaries(prev => prev.filter(r => r.id !== id)); };

  const handleSubmit = () => {
    if (!user) { setError('Sign in to submit.'); return; }
    setError(null); setMessage(null);
    startTransition(async () => {
      const result = await submitExamCalculatorPreset({
        curriculum_id: selectedCurriculum, subject_id: selectedSubject,
        title: title.trim() || `${selSubjTitle} (${selCurrTitle})`,
        subject_code: subjectCode.trim(), series: series.trim(), is_modular: isModular,
        papers: papers.map(p => ({
          name: p.name.trim(), max_mark: Number(p.maxMark), weight: Number(p.weight), unit_group: p.unitGroup.trim() || undefined,
          paper_boundaries: p.paperBoundaries.filter(b => b.grade.trim()).map(b => ({ grade: b.grade.trim(), min_mark: Number(b.minMark) })).length > 0 ? p.paperBoundaries.filter(b => b.grade.trim()).map(b => ({ grade: b.grade.trim(), min_mark: Number(b.minMark) })) : undefined,
        })),
        grade_boundaries: boundaries.filter(r => r.grade.trim()).map(r => ({ grade: r.grade.trim(), min_mark: Number(r.minMark) })),
      }, user.id);
      if (result?.success) setMessage('Calculator proposal submitted to the review queue.');
      else setError(result?.error || 'Unable to submit.');
    });
  };

  const unitGroups = isModular ? Array.from(new Set(papers.map(p => p.unitGroup).filter(Boolean))).sort() : null;

  return (
    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent)] font-semibold text-xs uppercase tracking-widest"><Compass className="w-4 h-4" /> Contributor Workstation</div>
          <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] mt-1">Grade Calculator Editor</h2>
          <p className="text-[var(--foreground-secondary)] text-xs mt-1">Propose papers and grade boundaries linked to curricula for the student calculator.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-8">
        {[{ n: 1, label: 'Curric. & Subject', enabled: true }, { n: 2, label: 'Papers & Weights', enabled: canGoStep2 }, { n: 3, label: 'Boundaries & Submit', enabled: canGoStep3 }].map(s => (
          <button key={s.n} type="button" onClick={() => s.enabled && setCurrentStep(s.n)} className={`py-3 px-4 rounded-xl border transition-all text-center ${currentStep === s.n ? 'bg-[var(--background-card)] border-[var(--primary)] text-[var(--primary)] shadow-sm' : s.enabled ? 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)] cursor-pointer' : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)] opacity-50 cursor-not-allowed'}`}><div className="text-[10px] font-bold uppercase tracking-widest mb-1">Step 0{s.n}</div><div className="text-xs font-extrabold">{s.label}</div></button>
        ))}
      </div>

      {/* STEP 1 */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-extrabold text-[var(--foreground)] flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" />Select Curriculum &amp; Subject</h3>
          <p className="text-[var(--foreground-secondary)] text-xs -mt-4 mb-4">Link this preset to a curriculum and subject.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]"><BookOpen className="w-3.5 h-3.5 inline mr-1.5 text-primary" />Curriculum</label><select value={selectedCurriculum} onChange={e => { setSelectedCurriculum(e.target.value); setSelectedSubject(''); }} className="w-full bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"><option value="">-- Select --</option>{curriculums.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}</select></div>
            {selectedCurriculum && (<div className="space-y-1.5"><label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]"><Layers className="w-3.5 h-3.5 inline mr-1.5 text-primary" />Subject</label><select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"><option value="">-- Select --</option>{subjects.map(s => (<option key={s.id} value={s.id}>{s.title}</option>))}</select></div>)}
          </div>
          {canGoStep2 && (<div className="rounded-2xl border border-accent/20 bg-accent/5 p-4"><div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)]"><Check className="w-4 h-4" /> Selected</div><p className="text-[var(--foreground-secondary)] text-xs mt-1">{selCurrTitle} &rarr; {selSubjTitle}</p></div>)}
          <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setCurrentStep(2)} disabled={!canGoStep2} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next: Papers <ArrowRight className="w-3.5 h-3.5" /></button></div>
        </div>
      )}

      {/* STEP 2 */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-extrabold text-[var(--foreground)] flex items-center gap-2"><Layers className="w-5 h-5 text-primary" />Paper Components</h3>
          <p className="text-[var(--foreground-secondary)] text-xs -mt-4">Define papers with marks, weights, optional unit grouping, and per-paper boundaries.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Subject Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder={`${selSubjTitle} (auto)`} className="w-full bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" /></div>
            <div className="space-y-1.5"><label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Subject Code</label><input value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="e.g. 0625" className="w-full bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" /></div>
            <div className="space-y-1.5"><label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Exam Series</label><select value={series} onChange={e => setSeries(e.target.value)} className="w-full bg-[var(--background-card)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"><option value="">-- Select --</option>{availableSeries.map(s => (<option key={s} value={s}>{s}</option>))}</select></div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-4"><LayoutGrid className="w-5 h-5 text-primary" /><div className="flex-1"><p className="text-sm font-semibold text-[var(--foreground)]">Modular format</p><p className="text-xs text-[var(--foreground-secondary)]">Enable for IAL/unit-based curricula.</p></div><button type="button" onClick={() => setIsModular(!isModular)} className={`relative h-6 w-11 rounded-full transition-colors ${isModular ? 'bg-primary' : 'bg-[var(--border)]'}`}><span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${isModular ? 'translate-x-5' : ''}`} /></button></div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-card)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[var(--border)] pb-4">
              <div><h4 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Component Blueprint</h4><p className="text-xs text-[var(--foreground-secondary)]">{isModular ? 'Units with group labels.' : 'Papers with weights.'}</p></div>
              <button type="button" onClick={addPaper} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3 text-xs font-semibold text-[var(--foreground)] transition hover:border-primary hover:bg-[var(--background-card)]"><Plus className="w-4 h-4" />Add {isModular ? 'Unit' : 'Paper'}</button>
            </div>
            <div className="space-y-4">
              {papers.map(paper => (
                <div key={paper.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4">
                  <div className="grid gap-3 grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] items-end">
                    <div><label className="text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">{isModular ? 'Unit' : 'Paper'} name</label><input value={paper.name} onChange={e => updatePaper(paper.id, 'name', e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div>
                    <div><label className="text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Max mark</label><input type="number" min={0} value={paper.maxMark} onChange={e => updatePaper(paper.id, 'maxMark', Number(e.target.value))} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div>
                    <div><label className="text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">{isModular ? 'Unit group' : 'Weight %'}</label>{isModular ? (<input value={paper.unitGroup} onChange={e => updatePaper(paper.id, 'unitGroup', e.target.value)} placeholder="AS/A2/Custom" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />) : (<input type="number" min={0} max={100} value={paper.weight} onChange={e => updatePaper(paper.id, 'weight', Number(e.target.value))} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />)}</div>
                    <button type="button" onClick={() => removePaper(paper.id)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-[var(--primary)] hover:bg-primary/15 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  {/* Per-paper boundaries toggle */}
                  <div className="mt-4 pt-3 border-t border-[var(--border)]">
                    <button type="button" onClick={() => toggleBoundaries(paper.id)} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
                      {paper.showBoundaries ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      Per-paper boundaries {paper.paperBoundaries.length > 0 ? `(${paper.paperBoundaries.length})` : '(optional)'}
                    </button>
                    {paper.showBoundaries && (
                      <div className="mt-3 space-y-2 pl-2">
                        <p className="text-[10px] text-[var(--foreground-muted)]">Define per-component grade thresholds. Leave empty to fall back to scaled overall boundaries.</p>
                        {paper.paperBoundaries.map(b => (
                          <div key={b.id} className="flex items-center gap-2">
                            <input value={b.grade} onChange={e => updatePaperBoundary(paper.id, b.id, 'grade', e.target.value)} placeholder="A*" className="w-16 rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary" />
                            <span className="text-[10px] text-[var(--foreground-muted)]">&ge;</span>
                            <input type="number" min={0} value={b.minMark} onChange={e => updatePaperBoundary(paper.id, b.id, 'minMark', e.target.value)} placeholder="0" className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary" />
                            <button type="button" onClick={() => removePaperBoundary(paper.id, b.id)} className="p-1 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addPaperBoundary(paper.id)} className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--foreground-secondary)] hover:text-primary transition-colors"><Plus className="w-3 h-3" />Add grade</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isModular && unitGroups && unitGroups.length > 0 && (<div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-4"><p className="text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)] mb-2">Unit Groups</p><div className="flex flex-wrap gap-2">{unitGroups.map(g => { const c = papers.filter(p => p.unitGroup === g).length; return <div key={g} className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/10 text-xs font-semibold text-[var(--primary)]">{g}: {c} unit{c !== 1 ? 's' : ''}</div>; })}</div></div>)}

          <div className="flex justify-between gap-3 pt-4">
            <button type="button" onClick={() => setCurrentStep(1)} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-3 text-xs font-bold text-[var(--foreground)] transition hover:bg-[var(--background-card)]"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
            <button type="button" onClick={() => setCurrentStep(3)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-lg transition-all">Next: Boundaries <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-lg font-extrabold text-[var(--foreground)] flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />Overall Grade Boundaries &amp; Submit</h3>
          <p className="text-[var(--foreground-secondary)] text-xs -mt-4">{isModular ? 'Total raw mark thresholds.' : 'Minimum weighted mark per grade.'}</p>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-card)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[var(--border)] pb-4">
              <div><h4 className="text-lg font-bold text-[var(--foreground)]">Overall Grade Boundaries</h4><p className="text-xs text-[var(--foreground-secondary)]">Per-paper boundaries are already set on papers (Step 2).</p></div>
              <button type="button" onClick={addBoundary} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3 text-xs font-semibold text-[var(--foreground)] transition hover:border-primary hover:bg-[var(--background-card)]"><Plus className="w-4 h-4" />Add Grade</button>
            </div>
            <div className="space-y-3">{boundaries.map(row => (<div key={row.id} className="grid gap-3 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] items-end rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4"><div><label className="text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Grade</label><input value={row.grade} onChange={e => updateBoundary(row.id, 'grade', e.target.value)} placeholder="A*" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div><div><label className="text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Min Mark</label><input type="number" min={0} value={row.minMark} onChange={e => updateBoundary(row.id, 'minMark', e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" /></div><button onClick={() => removeBoundary(row.id)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-[var(--primary)] hover:bg-primary/15 transition"><Trash2 className="w-4 h-4" /></button></div>))}</div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <button type="button" onClick={() => setCurrentStep(2)} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-3 text-xs font-bold text-[var(--foreground)] transition hover:bg-[var(--background-card)]"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
            <button type="button" onClick={handleSubmit} disabled={isPending} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-lg transition-opacity disabled:opacity-70"><Send className="w-4 h-4" />{isPending ? 'Submitting...' : 'Submit for Review'}</button>
          </div>
          {message && (<div className="flex items-start gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-[var(--accent)]"><CheckCircle2 className="mt-0.5 h-4 w-4" /><span>{message}</span></div>)}
          {error && (<div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-[var(--primary)]">{error}</div>)}
        </div>
      )}
    </div>
  );
}
