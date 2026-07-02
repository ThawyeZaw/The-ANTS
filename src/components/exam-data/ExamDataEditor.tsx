'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { 
  Compass, 
  BookOpen, 
  Layers, 
  Calendar, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  History,
  FileText,
  Send,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { submitExamData } from '@/actions/exam-editor';
import { ExamGradeBoundary } from '@/types';

const QUALIFICATIONS_MAP: Record<string, string[]> = {
  caie: ['IGCSE', 'A Level', 'AS Level'],
  edexcel: ['IGCSE', 'International A Level (IAL)', 'GCE A Level'],
  ielts: ['Academic Module']
};

const INITIAL_MOCK_SUBMISSIONS = [
  {
    id: 'sub-101',
    board: 'caie',
    qualification: 'IGCSE',
    examTitle: 'Additional Mathematics (0606)',
    examSeries: 'May/June 2026',
    examDate: '2026-05-12',
    papers: [
      { id: 'p1', name: 'Paper 11 (Theory)', maxMark: 80, weight: 50 },
      { id: 'p2', name: 'Paper 21 (Problem Solving)', maxMark: 80, weight: 50 }
    ],
    status: 'approved',
    submittedAt: '2026-06-15',
    feedback: 'Excellent breakdown matches CAIE standard guidelines perfectly.'
  },
  {
    id: 'sub-102',
    board: 'caie',
    qualification: 'A Level',
    examTitle: 'Physics (9702) - Core Package',
    examSeries: 'May/June 2026',
    examDate: '2026-05-20',
    papers: [
      { id: 'p1', name: 'Paper 1 (Multiple Choice)', maxMark: 40, weight: 31 },
      { id: 'p2', name: 'Paper 2 (AS Structured)', maxMark: 60, weight: 46 },
      { id: 'p3', name: 'Paper 3 (Practical Alternative)', maxMark: 40, weight: 23 }
    ],
    status: 'pending_review',
    submittedAt: '2026-06-29',
    feedback: null
  },
  {
    id: 'sub-103',
    board: 'edexcel',
    qualification: 'International A Level (IAL)',
    examTitle: 'Pure Mathematics P1',
    examSeries: 'Jan 2026',
    examDate: '2026-01-14',
    papers: [
      { id: 'p1', name: 'Written Examination', maxMark: 75, weight: 100 }
    ],
    status: 'rejected',
    submittedAt: '2026-05-10',
    feedback: 'Missing secondary components mapping for Edexcel syllabus composite modules.'
  }
];

const createDefaultGradeBoundaries = (): ExamGradeBoundary[] => [
  { id: 'boundary-a-star', exam_id: 'default', grade: 'A*', min_mark: 90, max_mark: null, boundary_level: 'overall_subject' },
  { id: 'boundary-a', exam_id: 'default', grade: 'A', min_mark: 80, max_mark: null, boundary_level: 'overall_subject' },
  { id: 'boundary-b', exam_id: 'default', grade: 'B', min_mark: 70, max_mark: null, boundary_level: 'overall_subject' },
  { id: 'boundary-c', exam_id: 'default', grade: 'C', min_mark: 60, max_mark: null, boundary_level: 'overall_subject' },
  { id: 'boundary-d', exam_id: 'default', grade: 'D', min_mark: 50, max_mark: null, boundary_level: 'overall_subject' },
];

interface ExamDataEditorProps {
  gradeBoundaries?: ExamGradeBoundary[];
  onGradeBoundariesChange?: (boundaries: ExamGradeBoundary[]) => void;
}

export default function ExamDataEditor({ gradeBoundaries = [], onGradeBoundariesChange }: ExamDataEditorProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionsList, setSubmissionsList] = useState(INITIAL_MOCK_SUBMISSIONS);
  const [showSubmissionsLog, setShowSubmissionsLog] = useState(false);
  const [editorSuccess, setEditorSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [board, setBoard] = useState('caie');
  const [qualification, setQualification] = useState('IGCSE');
  const [examTitle, setExamTitle] = useState('');
  const [curriculumName, setCurriculumName] = useState('Cambridge CAIE');
  const [examSeries, setExamSeries] = useState('');
  const [examDate, setExamDate] = useState('');

  const [papers, setPapers] = useState([
    { id: 'paper-1', name: 'Paper 1 (Theory / Core)', maxMark: 80, weight: 50 },
    { id: 'paper-2', name: 'Paper 2 (Practical / Problem Solving)', maxMark: 80, weight: 50 }
  ]);
  const [boundaryRows, setBoundaryRows] = useState<ExamGradeBoundary[]>(() => (gradeBoundaries.length ? gradeBoundaries : createDefaultGradeBoundaries()));

  useEffect(() => {
    if (gradeBoundaries.length) {
      setBoundaryRows(gradeBoundaries);
    }
  }, [gradeBoundaries]);

  const totalWeight = useMemo(() => papers.reduce((sum, p) => sum + (Number(p.weight) || 0), 0), [papers]);
  const maxTotalRawMark = useMemo(() => papers.reduce((sum, p) => sum + (Number(p.maxMark) || 0), 0), [papers]);

  const totalWeightStatus = totalWeight === 100 ? 'valid' : totalWeight > 100 ? 'over' : 'under';
  const totalWeightTone = totalWeight === 100 ? 'text-[var(--foreground)]' : totalWeight > 100 ? 'text-rose-300' : 'text-amber-300';
  const totalWeightCardClasses = totalWeight === 100 ? 'border-[var(--border)] bg-[var(--background-secondary)]' : totalWeight > 100 ? 'border-rose-500/20 bg-rose-500/10' : 'border-amber-500/20 bg-amber-500/10';
  const totalWeightHint = totalWeight === 100 ? null : totalWeight > 100
    ? 'Total component weight is over 100%. Reduce one or more paper weights to balance the breakdown.'
    : 'Total component weight is below 100%. Increase one or more paper weights to reach a valid 100% total.';

  useEffect(() => {
    const available = QUALIFICATIONS_MAP[board];
    if (available && !available.includes(qualification)) {
      setQualification(available[0]);
    }
  }, [board, qualification]);

  const handleAddPaper = () => {
    const nextId = `paper-${Date.now()}`;
    setPapers([...papers, { id: nextId, name: `Paper Component ${papers.length + 1}`, maxMark: 100, weight: 0 }]);
  };

  const handleRemovePaper = (id: string) => {
    if (papers.length === 1) return;
    setPapers(papers.filter((p) => p.id !== id));
  };

  const handleUpdatePaper = (id: string, key: 'name' | 'maxMark' | 'weight', value: string) => {
    setPapers(papers.map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        [key]: key === 'name' ? value : Math.max(0, Number(value) || 0)
      };
    }));
  };

  const syncBoundaryRows = (nextRows: ExamGradeBoundary[]) => {
    setBoundaryRows(nextRows);
    onGradeBoundariesChange?.(nextRows);
  };

  const handleAddBoundary = () => {
    syncBoundaryRows([
      ...boundaryRows,
      { id: `boundary-${Date.now()}`, exam_id: 'default', grade: '', min_mark: 0, max_mark: null, boundary_level: 'overall_subject' }
    ]);
  };

  const handleRemoveBoundary = (id: string) => {
    if (boundaryRows.length === 1) return;
    syncBoundaryRows(boundaryRows.filter((row) => row.id !== id));
  };

  const handleUpdateBoundary = (id: string, key: 'grade' | 'min_mark', value: string) => {
    syncBoundaryRows(boundaryRows.map((row) => {
      if (row.id !== id) return row;
      return {
        ...row,
        [key]: key === 'grade' ? value : Math.max(0, Number(value) || 0)
      };
    }));
  };

  const isWeightValid = totalWeight === 100;
  const canSubmit = examTitle.trim().length > 0 && examSeries.trim().length > 0 && examDate.length > 0 && isWeightValid && !!user;

  const handleNextStep = () => {
    if (currentStep === 1) {
      const matchedCurriculum = board === 'caie' ? 'Cambridge CAIE' : board === 'edexcel' ? 'Pearson Edexcel' : 'IELTS';
      setCurriculumName(matchedCurriculum);
      if (!examTitle) {
        setExamTitle(`${qualification} Subject Template`);
      }
      setCurrentStep(2);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmitSubmission = () => {
    if (!canSubmit || !user) return;
    setSubmissionError(null);

    startTransition(async () => {
      try {
        const payload = {
          title: examTitle.trim(),
          board,
          qualification,
          curriculum_name: curriculumName,
          exam_series: examSeries.trim(),
          exam_date: examDate,
          papers,
          gradeBoundaries: boundaryRows.filter((row) => row.grade.trim()),
        };

        const result = await submitExamData(payload, user.id);

        if (!result?.success) {
          setSubmissionError(result?.error || 'Unable to submit the blueprint. Please try again.');
          return;
        }

        const newSubmission = {
          id: `sub-${Date.now()}`,
          board,
          qualification,
          examTitle,
          examSeries,
          examDate,
          papers,
          status: 'pending_review',
          submittedAt: new Date().toISOString().split('T')[0],
          feedback: null,
        };

        setSubmissionsList([newSubmission, ...submissionsList]);
        setEditorSuccess(true);
      } catch (error) {
        setSubmissionError('Unable to submit the blueprint. Please try again.');
      }
    });
  };

  const handleStartOver = () => {
    setExamTitle('');
    setExamSeries('');
    setExamDate('');
    setPapers([
      { id: 'paper-1', name: 'Paper 1 (Theory / Core)', maxMark: 80, weight: 50 },
      { id: 'paper-2', name: 'Paper 2 (Practical / Problem Solving)', maxMark: 80, weight: 50 }
    ]);
    syncBoundaryRows(createDefaultGradeBoundaries());
    setEditorSuccess(false);
    setCurrentStep(1);
  };

  return (
    <div className="h-full flex-1 bg-transparent text-[var(--foreground)] py-8 px-4 md:px-8 font-sans">
      <div className="w-full mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-[var(--border)] pb-6">
          <div>
            <div className="flex items-center gap-2 text-[var(--accent)] font-semibold text-xs uppercase tracking-widest">
              <Compass className="w-4 h-4 animate-spin-slow" />
              <span>Verified Contributor Workstation</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] mt-1">Syllabus Exam Data Editor</h1>
            <p className="text-[var(--foreground-secondary)] text-xs mt-1">Model blueprints and weighting metrics for the official database.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowSubmissionsLog(!showSubmissionsLog);
                setEditorSuccess(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-light)]/20 hover:bg-[var(--primary-light)]/40 border border-[var(--primary)]/20 rounded-xl transition-all cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              {showSubmissionsLog ? 'Back to Editor' : 'Review Submissions'}
            </button>
          </div>
        </div>

        {showSubmissionsLog ? (
          <div className="space-y-6">
            <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--accent)]" />
                Contributor Submission Registry
              </h2>
              <p className="text-[var(--foreground-secondary)] text-xs mt-1">Review approved templates or trace status logs of your curated blueprints.</p>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--foreground-secondary)] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Exam Blueprint</th>
                      <th className="py-3 px-4">Exam Board / Level</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Published</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-[var(--foreground-secondary)]">
                    {submissionsList.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[var(--background-secondary)] transition-colors">
                        <td className="py-4 px-4 font-bold text-[var(--foreground)]">
                          <div>{sub.examTitle}</div>
                          <div className="text-[10px] font-normal text-[var(--foreground-secondary)] mt-0.5">{sub.examSeries}</div>
                        </td>
                        <td className="py-4 px-4 uppercase font-bold text-[var(--accent)]">
                          {sub.board} <span className="text-[var(--foreground-secondary)] text-[10px] lowercase font-normal">({sub.qualification})</span>
                        </td>
                        <td className="py-4 px-4 font-medium text-[var(--foreground-secondary)]">{sub.examDate}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                            sub.status === 'rejected' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              sub.status === 'approved' ? 'bg-emerald-300' :
                              sub.status === 'rejected' ? 'bg-rose-300' :
                              'bg-amber-300'
                            }`} />
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-[var(--foreground-secondary)]">{sub.submittedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : editorSuccess ? (
          <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[var(--shadow-glow)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[var(--foreground)]">Blueprint Submitted Successfully!</h2>
              <p className="text-[var(--foreground-secondary)] text-xs mt-2 leading-relaxed">
                Your examination criteria have been passed into the Gatekeeper approval queue. Our Main Contributors will audit structural weights and publish it to students shortly.
              </p>
            </div>
            <div className="pt-2 flex gap-4 justify-center">
              <button 
                onClick={() => setShowSubmissionsLog(true)}
                className="px-5 py-2.5 bg-[var(--background-secondary)] hover:bg-[var(--background-card)] border border-[var(--border)] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Inspect Queue Status
              </button>
              <button 
                onClick={handleStartOver}
                className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] rounded-xl text-xs font-bold shadow-lg shadow-[var(--shadow-glow)] transition-all cursor-pointer"
              >
                Compile New Template
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl">
            <div className="grid grid-cols-2 gap-2 mb-8">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`py-3 px-4 rounded-xl border transition-all text-center ${
                    currentStep === step ? 'bg-[var(--background-card)] border-[var(--primary)] text-[var(--primary)] shadow-sm' : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)]'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1">Step 0{step}</div>
                  <div className="text-xs font-extrabold">
                    {step === 1 && 'Role & Board'}
                    {step === 2 && 'Component Blueprint'}
                  </div>
                </div>
              ))}
            </div>

            {/* Wizard content */}
            <div className="space-y-6 animate-fade-in">
              {currentStep === 1 && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-extrabold text-[var(--foreground)] flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[var(--accent)]" />
                      Configure Educational Scope
                    </h2>
                    <p className="text-[var(--foreground-secondary)] text-xs mt-1">Select the target international examination system to lock down proper grade conversion algorithms.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'caie', name: 'Cambridge CAIE', desc: 'UK Domestic & International IGCSE and A Levels' },
                      { key: 'edexcel', name: 'Pearson Edexcel', desc: 'International GCSE & Modular A Levels (IAL)' },
                      { key: 'ielts', name: 'IELTS Academic', desc: 'Global English Proficiency Standard modules' }
                    ].map((target) => (
                      <button
                        key={target.key}
                        type="button"
                        onClick={() => setBoard(target.key)}
                        className={`p-5 rounded-2xl border cursor-pointer text-left transition-all flex flex-col justify-between ${
                          board === target.key ? 'bg-[var(--background-card)] border-[var(--primary)] shadow-lg shadow-[var(--shadow-glow)]' : 'bg-[var(--background-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <div>
                          <div className="w-8 h-8 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--foreground-secondary)]">
                            {target.key.toUpperCase()}
                          </div>
                          <h3 className="font-bold text-[var(--foreground)] mt-4 text-sm">{target.name}</h3>
                          <p className="text-[var(--foreground-secondary)] text-[11px] mt-2 leading-relaxed">{target.desc}</p>
                        </div>
                        {board === target.key && (
                          <div className="mt-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 mt-6">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Target Qualification Level</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {QUALIFICATIONS_MAP[board]?.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setQualification(level)}
                          className={`py-3 px-4 rounded-xl border text-center transition-all ${
                            qualification === level ? 'bg-[var(--background-card)] border-[var(--primary)] text-[var(--primary)] font-bold' : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--primary)]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[var(--foreground)]">System Integration Shield Active</h4>
                      <p className="text-[var(--foreground-secondary)] text-[11px] mt-1 leading-relaxed">
                        Setting this accurately guarantees correct standard mapping configuration rules. Cambridge matches grade scales up to A*, while Pearson uses standard UMS calculations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-extrabold text-[var(--foreground)] flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[var(--accent)]" />
                      Syllabus Details &amp; Component Blueprint
                    </h2>
                    <p className="text-[var(--foreground-secondary)] text-xs mt-1">Specify detailed meta logs and add component weights mapping exactly to the 100% total.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Exam Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Additional Mathematics (0606)"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)] transition-colors"
                      />
                      <span className="text-[10px] text-[var(--foreground-secondary)] block">Enter the global syllabus title, not an individual component.</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Exam Board Curriculum</label>
                      <input
                        type="text"
                        readOnly
                        value={curriculumName}
                        className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground-secondary)] font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">Exam Series Window</label>
                      <input
                        type="text"
                        placeholder="e.g. May/June 2027"
                        value={examSeries}
                        onChange={(e) => setExamSeries(e.target.value)}
                        className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)] transition-colors"
                      />
                    </div>

                    <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--background-card)] p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[var(--foreground)]">Component Blueprint</h3>
                          <p className="text-[var(--foreground-secondary)] text-xs mt-1">Add paper components, set raw marks, and keep weights equal to 100%.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddPaper}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--background-card)]"
                        >
                          <Plus className="w-4 h-4" />
                          Add Paper
                        </button>
                      </div>

                      <div className="mt-5 space-y-4">
                        {papers.map((paper, index) => (
                          <div key={paper.id} className="grid gap-3 grid-cols-1 md:grid-cols-[minmax(0,1.8fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_auto] items-end rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4">
                            <div className="min-w-0">
                              <label className="block text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Paper name</label>
                              <input
                                type="text"
                                value={paper.name}
                                onChange={(e) => handleUpdatePaper(paper.id, 'name', e.target.value)}
                                className="mt-2 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="block text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Max mark</label>
                              <input
                                type="number"
                                min={0}
                                value={paper.maxMark}
                                onChange={(e) => handleUpdatePaper(paper.id, 'maxMark', e.target.value)}
                                className="mt-2 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="block text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Weight %</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={paper.weight}
                                onChange={(e) => handleUpdatePaper(paper.id, 'weight', e.target.value)}
                                className="mt-2 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePaper(paper.id)}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/15 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className={`rounded-2xl border ${totalWeightCardClasses} p-4`}>
                          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Total component weight</p>
                          <p className={`mt-2 text-sm font-semibold ${totalWeightTone}`}>{totalWeight}%</p>
                          {totalWeightHint ? (
                            <p className={`mt-2 text-xs ${totalWeight === 100 ? 'text-[var(--foreground-secondary)]' : totalWeight > 100 ? 'text-rose-200' : 'text-amber-200'}`}>
                              {totalWeightHint}
                            </p>
                          ) : null}
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4">
                          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Total raw marks</p>
                          <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{maxTotalRawMark}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--background-card)] p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[var(--foreground)]">Overall Subject Boundaries</h3>
                          <p className="text-[var(--foreground-secondary)] text-xs mt-1">Capture grade thresholds once and let the calculator use them instantly.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddBoundary}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[var(--background-card)]"
                        >
                          <Plus className="w-4 h-4" />
                          Add Grade
                        </button>
                      </div>

                      <div className="mt-5 space-y-3">
                        {boundaryRows.map((row) => (
                          <div key={row.id} className="grid gap-3 grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] items-end rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4">
                            <div className="min-w-0">
                              <label className="block text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Grade</label>
                              <input
                                type="text"
                                value={row.grade}
                                onChange={(e) => handleUpdateBoundary(row.id, 'grade', e.target.value)}
                                placeholder="A*"
                                className="mt-2 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="block text-[11px] uppercase tracking-[0.28em] text-[var(--foreground-secondary)]">Minimum weighted mark</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={row.min_mark}
                                onChange={(e) => handleUpdateBoundary(row.id, 'min_mark', e.target.value)}
                                className="mt-2 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveBoundary(row.id)}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/15 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <p className="mt-4 text-[11px] text-[var(--foreground-secondary)] leading-relaxed">
                        Phase 1 stores overall subject-level boundaries and feeds the calculator immediately as soon as you adjust the matrix.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-[var(--foreground-secondary)] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[var(--accent)]" />
                        Official Examination Start Date
                      </label>
                      <input
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] placeholder:text-[var(--foreground-secondary)] transition-colors"
                      />
                      <span className="text-[10px] text-[var(--accent)] block">Crucial: Feeds directly into student's Exam Countdown dashboard metrics.</span>
                    </div>
                  </div>
                </div>
              )}


              {submissionError ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {submissionError}
                </div>
              ) : null}
              <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-sm text-[var(--foreground-secondary)]">
                  <div className="w-3 h-3 rounded-full bg-[var(--accent)] animate-pulse" />
                  <span>
                    {currentStep === 1 && 'Select the exam board to begin the workflow.'}
                    {currentStep === 2 && 'Configure title, series, and exam scheduling details.'}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBackStep}
                    disabled={currentStep === 1}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background-card)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  {currentStep < 2 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:bg-[var(--primary-hover)]"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitSubmission}
                      disabled={!canSubmit || isPending}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                      {isPending ? 'Submitting…' : 'Submit Schedule'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
