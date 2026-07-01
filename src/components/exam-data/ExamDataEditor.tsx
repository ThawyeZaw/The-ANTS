'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  AlertTriangle,
  History,
  FileText,
  UserCheck,
  Send,
  HelpCircle,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Sliders,
  CheckCircle2
} from 'lucide-react';

const QUALIFICATIONS_MAP: Record<string, string[]> = {
  caie: ['IGCSE', 'A Level', 'AS Level'],
  edexcel: ['IGCSE', 'International A Level (IAL)', 'GCE A Level'],
  ossd: ['High School Diploma Grade 11', 'High School Diploma Grade 12'],
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
    boundaries: { star: 138, a: 115, b: 92, c: 69, d: 46 },
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
    boundaries: { star: 110, a: 95, b: 80, c: 65, d: 50 },
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
    boundaries: { star: 68, a: 60, b: 52, c: 44, d: 36 },
    status: 'rejected',
    submittedAt: '2026-05-10',
    feedback: 'Missing secondary components mapping for Edexcel syllabus composite modules.'
  }
];

export default function ExamDataEditor() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionsList, setSubmissionsList] = useState(INITIAL_MOCK_SUBMISSIONS);
  const [showSubmissionsLog, setShowSubmissionsLog] = useState(false);
  const [editorSuccess, setEditorSuccess] = useState(false);

  const [board, setBoard] = useState('caie');
  const [qualification, setQualification] = useState('IGCSE');
  const [examTitle, setExamTitle] = useState('');
  const [curriculumName, setCurriculumName] = useState('Cambridge CAIE');
  const [examSeries, setExamSeries] = useState('');
  const [examDate, setExamDate] = useState('');
  
  // Custom Date Picker Calendar States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Helpers to generate custom calendar grid
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfWeekIndex = (month: number, year: number) => new Date(year, month, 1).getDay();

  const handleSelectDate = (day: number) => {
    const formattedMonth = String(calMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    setExamDate(`${calYear}-${formattedMonth}-${formattedDay}`);
    setShowDatePicker(false);
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const formattedSelectedDate = useMemo(() => {
    if (!examDate) return "";
    const [y, m, d] = examDate.split('-');
    return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}, ${y}`;
  }, [examDate]);

  const [papers, setPapers] = useState([
    { id: 'paper-1', name: 'Paper 1 (Theory / Core)', maxMark: 80, weight: 50 },
    { id: 'paper-2', name: 'Paper 2 (Practical / Problem Solving)', maxMark: 80, weight: 50 }
  ]);

  const [boundaries, setBoundaries] = useState({
    star: 135,
    a: 110,
    b: 90,
    c: 70,
    d: 50
  });

  const [simulatedScore, setSimulatedScore] = useState(120);

  // Dynamic automatic weight calculation
  const totalWeight = useMemo(() => {
    return papers.reduce((sum, p) => sum + (parseInt(String(p.weight)) || 0), 0);
  }, [papers]);

  const maxTotalRawMark = useMemo(() => {
    return papers.reduce((sum, p) => sum + (parseInt(String(p.maxMark)) || 0), 0);
  }, [papers]);

  // Sync qualifications when Board selection changes
  useEffect(() => {
    const available = QUALIFICATIONS_MAP[board];
    if (available && !available.includes(qualification)) {
      setQualification(available[0]);
    }
  }, [board]);

  const handleAddPaper = () => {
    const nextId = `paper-${Date.now()}`;
    setPapers([...papers, { id: nextId, name: `Paper Component ${papers.length + 1}`, maxMark: 100, weight: 0 }]);
  };

  const handleRemovePaper = (id: string) => {
    if (papers.length === 1) return; // Must have at least 1 component
    setPapers(papers.filter(p => p.id !== id));
  };

  const handleUpdatePaper = (id: string, key: string, val: string | number) => {
    setPapers(papers.map(p => {
      if (p.id === id) {
        let parsedVal = val;
        if (key === 'maxMark' || key === 'weight') {
          parsedVal = val === '' ? '' : Math.max(0, parseInt(String(val)) || 0);
        }
        return { ...p, [key]: parsedVal };
      }
      return p;
    }));
  };

  const handleBoundariesChange = (key: string, val: string) => {
    const parsedVal = val === '' ? '' : Math.max(0, parseInt(val) || 0);
    setBoundaries(prev => ({ ...prev, [key]: parsedVal }));
  };

  const simulatedOutcome = useMemo(() => {
    if (papers.length === 0) return { weightedTotal: 0, grade: 'U' };
    
    // Simulate proportionate score mapping for the test sandbox
    // Max overall weighted grade boundary calculated directly
    const scoreRatio = simulatedScore / (maxTotalRawMark || 1);
    const weightedTotal = Math.round(scoreRatio * 100);

    let grade = 'U';
    if (weightedTotal >= boundaries.star) grade = 'A*';
    else if (weightedTotal >= boundaries.a) grade = 'A';
    else if (weightedTotal >= boundaries.b) grade = 'B';
    else if (weightedTotal >= boundaries.c) grade = 'C';
    else if (weightedTotal >= boundaries.d) grade = 'D';

    return { weightedTotal, grade };
  }, [simulatedScore, maxTotalRawMark, papers, boundaries]);

  const handleNextStep = () => {
    if (currentStep === 1) {
      const matchedCurriculum = board === 'caie' ? 'Cambridge CAIE' : 
                                board === 'edexcel' ? 'Pearson Edexcel' : 
                                board === 'ossd' ? 'OSSD' : 'IELTS';
      setCurriculumName(matchedCurriculum);
      if (!examTitle) {
        setExamTitle(`${qualification} Subject Template`);
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!examTitle.trim() || !examSeries.trim() || !examDate || papers.length === 0 || totalWeight !== 100) {
        return;
      }
      // Adapt initial boundaries state to new raw limits
      setBoundaries({
        star: Math.round(maxTotalRawMark * 0.85),
        a: Math.round(maxTotalRawMark * 0.72),
        b: Math.round(maxTotalRawMark * 0.60),
        c: Math.round(maxTotalRawMark * 0.48),
        d: Math.round(maxTotalRawMark * 0.35)
      });
      setSimulatedScore(Math.round(maxTotalRawMark * 0.75));
      setCurrentStep(3);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitSubmission = () => {
    const newSubmission = {
      id: `sub-${Date.now()}`,
      board,
      qualification,
      examTitle,
      examSeries,
      examDate,
      papers,
      boundaries,
      status: 'pending_review',
      submittedAt: new Date().toISOString().split('T')[0],
      feedback: null
    };

    setSubmissionsList([newSubmission, ...submissionsList]);
    setEditorSuccess(true);
  };

  const handleStartOver = () => {
    setExamTitle('');
    setExamSeries('');
    setExamDate('');
    setPapers([
      { id: 'paper-1', name: 'Paper 1 (Theory / Core)', maxMark: 80, weight: 50 },
      { id: 'paper-2', name: 'Paper 2 (Practical / Problem Solving)', maxMark: 80, weight: 50 }
    ]);
    setEditorSuccess(false);
    setCurrentStep(1);
  };

  return (
    <div className="h-full flex-1 bg-white text-[#0F172A] py-8 px-4 md:px-8 font-sans">
      <div className="w-full mx-auto">
        
        {/* UPPER CONSOLE BANNER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-slate-300 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#C5A059] font-semibold text-xs uppercase tracking-widest">
              <Compass className="w-4 h-4 animate-spin-slow" />
              <span>Verified Contributor Workstation</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#0F172A] mt-1">Syllabus Exam Data Editor</h1>
            <p className="text-slate-500 text-xs mt-1">Model blueprints, weighting metrics, and grade threshold boundaries for the official database.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setShowSubmissionsLog(!showSubmissionsLog);
                setEditorSuccess(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-indigo-300 bg-[#C5A059]/10/40 hover:bg-[#C5A059]/10/80 border border-[#C5A059]/30/60 rounded-xl transition-all cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              {showSubmissionsLog ? "Back to Editor" : "Review Submissions"}
            </button>
          </div>
        </div>

        {/* LOG VIEW TOGGLE SCREEN */}
        {showSubmissionsLog ? (
          <div className="space-y-6">
            <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C5A059]" />
                Contributor Submission Registry
              </h2>
              <p className="text-slate-500 text-xs mt-1">Review approved templates or trace status logs of your curated blueprints.</p>
              
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Exam Blueprint</th>
                      <th className="py-3 px-4">Exam Board / Level</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Published</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-700">
                    {submissionsList.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#0F172A]">
                          <div>{sub.examTitle}</div>
                          <div className="text-[10px] font-normal text-slate-500 mt-0.5">{sub.examSeries}</div>
                        </td>
                        <td className="py-4 px-4 uppercase font-bold text-[#C5A059]">
                          {sub.board} <span className="text-slate-500 text-[10px] lowercase font-normal">({sub.qualification})</span>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-600">{sub.examDate}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            sub.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              sub.status === 'approved' ? 'bg-emerald-400' :
                              sub.status === 'rejected' ? 'bg-rose-400' :
                              'bg-amber-400'
                            }`} />
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-slate-500">{sub.submittedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : editorSuccess ? (
          <div className="bg-slate-50/30 border border-slate-200 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#0F172A]">Blueprint Submitted Successfully!</h2>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Your examination criteria have been passed into the Gatekeeper approval queue. Our Main Contributors will audit structural weights and publish it to students shortly.
              </p>
            </div>
            <div className="pt-2 flex gap-4 justify-center">
              <button 
                onClick={() => setShowSubmissionsLog(true)}
                className="px-5 py-2.5 bg-slate-50 hover:bg-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Inspect Queue Status
              </button>
              <button 
                onClick={handleStartOver}
                className="px-5 py-2.5 bg-[#0F172A] hover:bg-[#1A1A1A] rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Compile New Template
              </button>
            </div>
          </div>
        ) : (
          /* PRIMARY EDITOR MULTI-STEP WIZARD */
          <div>
            
            {/* Step Progress Tracker Badges */}
            <div className="grid grid-cols-3 gap-2 mb-8">
              {[1, 2, 3].map(step => (
                <div 
                  key={step} 
                  className={`py-3 px-4 rounded-xl border transition-all text-center ${
                    currentStep === step 
                      ? 'bg-slate-50 border-[#C5A059]/40 text-[#C5A059]' 
                      : currentStep > step 
                        ? 'bg-white border-emerald-500/20 text-emerald-400/80 opacity-80' 
                        : 'bg-white/20 border-slate-300 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1">Step 0{step}</div>
                  <div className="text-xs font-extrabold">
                    {step === 1 && "Role & Board"}
                    {step === 2 && "Component Blueprint"}
                    {step === 3 && "Grade Boundaries"}
                  </div>
                </div>
              ))}
            </div>

            {/* WIZARD CARD WRAPPER */}
            <div className="bg-slate-50/40 border border-slate-200 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl">
              
              {/* ======================================================== */}
              {/* STEP 1: BOARD & QUALIFICATION SELECTOR                    */}
              {/* ======================================================== */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#C5A059]" />
                      Configure Educational Scope
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">Select the target international examination system to lock down proper grade conversion algorithms.</p>
                  </div>

                  {/* Boards Custom Grid Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { key: 'caie', name: 'Cambridge CAIE', desc: 'UK Domestic & International IGCSE and A Levels' },
                      { key: 'edexcel', name: 'Pearson Edexcel', desc: 'International GCSE & Modular A Levels (IAL)' },
                      { key: 'ossd', name: 'OSSD Canada', desc: 'Ontario Secondary School Diploma' },
                      { key: 'ielts', name: 'IELTS Academic', desc: 'Global English Proficiency Standard modules' }
                    ].map(target => (
                      <div 
                        key={target.key}
                        onClick={() => setBoard(target.key)}
                        className={`p-5 rounded-2xl border cursor-pointer text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                          board === target.key 
                            ? 'bg-[#C5A059]/10/20 border-[#C5A059]/80 shadow-md shadow-indigo-500/10' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-[#C5A059]/20 flex items-center justify-center text-sm font-bold text-indigo-300">
                            {target.key.toUpperCase()}
                          </div>
                          <h3 className="font-bold text-[#0F172A] mt-4 text-sm">{target.name}</h3>
                          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{target.desc}</p>
                        </div>
                        {board === target.key && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#0F172A] flex items-center justify-center text-[#0F172A]">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Level & Syllabus Sub Category Selector Option */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                      Target Qualification Level
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {QUALIFICATIONS_MAP[board]?.map(level => (
                        <div 
                          key={level}
                          onClick={() => setQualification(level)}
                          className={`py-3 px-4 rounded-xl border text-center cursor-pointer transition-all ${
                            qualification === level 
                              ? 'bg-[#0F172A]/10 border-[#C5A059] text-[#C5A059] font-bold' 
                              : 'bg-white border-slate-300 hover:border-slate-200 text-slate-500'
                          }`}
                        >
                          {level}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guidelines Disclaimer block */}
                  <div className="bg-white border border-slate-300 rounded-2xl p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#C5A059] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">System Integration Shield Active</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Setting this accurately guarantees correct standard mapping configuration rules. Cambridge matches grade scales up to A*, while Pearson uses standard UMS calculations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 2: SUBJECT & PAPERS DYNAMIC COMPOSITION              */}
              {/* ======================================================== */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#C5A059]" />
                      Syllabus Details &amp; Component Blueprint
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">Specify detailed meta logs and add component weights mapping exactly to the 100% total.</p>
                  </div>

                  {/* Standard Metadata Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                        Exam Title
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Additional Mathematics (0606)"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#C5A059] text-[#0F172A] placeholder-slate-600 transition-colors"
                      />
                      <span className="text-[10px] text-slate-500 block">Enter the global syllabus title, not an individual component.</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                        Exam Board Curriculum
                      </label>
                      <input 
                        type="text" 
                        readOnly
                        value={curriculumName}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-500 font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                        Exam Series Window
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. May/June 2027"
                        value={examSeries}
                        onChange={(e) => setExamSeries(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#C5A059] text-[#0F172A] placeholder-slate-600 transition-colors"
                      />
                    </div>

                    {/* CUSTOM INTERACTIVE CALENDAR DATEPICKER INPUT */}
                    <div className="space-y-1.5 relative">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#C5A059]" />
                        Official Examination Start Date
                      </label>
                      
                      <div 
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700 cursor-pointer flex justify-between items-center select-none hover:border-[#C5A059]/60 transition-colors"
                      >
                        <span className={examDate ? "text-[#0F172A] font-medium" : "text-slate-600"}>
                          {examDate ? formattedSelectedDate : "Select examination date..."}
                        </span>
                        <Calendar className="w-4 h-4 text-[#C5A059]" />
                      </div>

                      {/* Floating Calendar Dropdown Container */}
                      {showDatePicker && (
                        <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-fade-in text-slate-700">
                          
                          {/* Calendar Month & Year Headers */}
                          <div className="flex justify-between items-center mb-4">
                            <button 
                              type="button"
                              onClick={handlePrevMonth}
                              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-sm text-[#0F172A] tracking-tight">
                              {MONTHS[calMonth]} {calYear}
                            </span>
                            <button 
                              type="button"
                              onClick={handleNextMonth}
                              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Weekdays Grid Title row */}
                          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
                            {WEEKDAYS.map(wd => (
                              <div key={wd}>{wd}</div>
                            ))}
                          </div>

                          {/* Actual Date Selection Grid block */}
                          <div className="grid grid-cols-7 gap-1">
                            {/* Empty offset days leading to first day of week */}
                            {Array.from({ length: firstDayOfWeekIndex(calMonth, calYear) }).map((_, index) => (
                              <div key={`empty-${index}`} className="aspect-square" />
                            ))}

                            {/* Live Active Selectable Days */}
                            {Array.from({ length: daysInMonth(calMonth, calYear) }).map((_, dIdx) => {
                              const day = dIdx + 1;
                              const currentFormatted = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              const isSelected = examDate === currentFormatted;

                              return (
                                <button
                                  key={`day-${day}`}
                                  type="button"
                                  onClick={() => handleSelectDate(day)}
                                  className={`aspect-square text-xs font-bold rounded-lg flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'bg-[#0F172A] text-[#EFE9DC] shadow-lg shadow-indigo-600/30 font-extrabold' 
                                      : 'hover:bg-slate-800 text-slate-600 hover:text-[#0F172A]'
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <span className="text-[10px] text-[#C5A059] block">Crucial: Feeds directly into student's Exam Countdown dashboard metrics.</span>
                    </div>
                  </div>

                  {/* DYNAMIC PAPER WRITER GROUP */}
                  <div className="border-t border-slate-200/60 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-700">Papers &amp; Weight allocation breakdown</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Every exam framework requires precise component weighing metrics.</p>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={handleAddPaper}
                        className="flex items-center gap-1 bg-[#0F172A] hover:bg-[#1A1A1A] text-[#0F172A] py-1.5 px-3 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Paper
                      </button>
                    </div>

                    {/* Papers dynamic input stack */}
                    <div className="space-y-3">
                      {papers.map((p, index) => (
                        <div 
                          key={p.id} 
                          className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 border border-slate-300 rounded-xl items-center"
                        >
                          <div className="md:col-span-1 text-center">
                            <span className="text-[10px] uppercase font-black text-[#C5A059] bg-[#C5A059]/10/40 border border-indigo-900/60 py-1 px-2.5 rounded-lg">
                              P0{index + 1}
                            </span>
                          </div>
                          
                          <div className="md:col-span-5">
                            <input 
                              type="text"
                              value={p.name}
                              placeholder="e.g. Paper 1 (Multiple Choice)"
                              onChange={(e) => handleUpdatePaper(p.id, 'name', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-[#C5A059] text-[#0F172A]"
                            />
                          </div>

                          <div className="md:col-span-3 flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Max Mark</span>
                            <input 
                              type="text"
                              inputMode="numeric"
                              placeholder="100"
                              value={p.maxMark}
                              onChange={(e) => handleUpdatePaper(p.id, 'maxMark', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-center focus:outline-none focus:border-[#C5A059] text-[#0F172A]"
                            />
                          </div>

                          <div className="md:col-span-2 flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Weight %</span>
                            <input 
                              type="text"
                              inputMode="numeric"
                              placeholder="50"
                              value={p.weight}
                              onChange={(e) => handleUpdatePaper(p.id, 'weight', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-center focus:outline-none focus:border-[#C5A059] text-[#0F172A]"
                            />
                          </div>

                          <div className="md:col-span-1 text-center">
                            <button 
                              type="button"
                              disabled={papers.length === 1}
                              onClick={() => handleRemovePaper(p.id)}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Weight Limit Validation Banner */}
                    <div className="pt-4 border-t border-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full ${totalWeight === 100 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                        <div>
                          <span className="text-xs font-bold">Combined Structural Weight: </span>
                          <strong className={totalWeight === 100 ? "text-emerald-400" : "text-amber-400"}>{totalWeight}%</strong>
                          <span className="text-slate-500 text-[11px] ml-1">({maxTotalRawMark} combined overall Raw points)</span>
                        </div>
                      </div>

                      {totalWeight !== 100 && (
                        <div className="text-[11px] text-amber-400 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-xl">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Weightings must sum up exactly to 100% to advance.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 3: GRADE BOUNDARIES ASSIGNMENT & COMPONENT TESTING  */}
              {/* ======================================================== */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-[#C5A059]" />
                      Set Grade Boundaries (Weighted Marks Out of 100)
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">Determine the required weighted thresholds to assign students grades. (Minimum required scores out of 100)</p>
                  </div>

                  {/* Threshold settings grid inputs */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { key: 'star', label: 'Grade A*', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                      { key: 'a', label: 'Grade A', bg: 'bg-indigo-500/10 border-[#C5A059]/20 text-[#C5A059]' },
                      { key: 'b', label: 'Grade B', bg: 'bg-teal-500/10 border-teal-500/20 text-teal-400' },
                      { key: 'c', label: 'Grade C', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                      { key: 'd', label: 'Grade D', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400' }
                    ].map(grade => (
                      <div key={grade.key} className={`p-4 rounded-2xl border ${grade.bg} text-center space-y-2`}>
                        <label className="block text-[10px] font-black uppercase tracking-widest">{grade.label}</label>
                        <input 
                          type="text"
                          inputMode="numeric"
                          value={boundaries[grade.key as keyof typeof boundaries]}
                          onChange={(e) => handleBoundariesChange(grade.key, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-2 px-1 text-center font-bold text-[#0F172A] text-lg focus:outline-none focus:border-[#C5A059]"
                        />
                        <span className="text-[9px] text-slate-500 block">Weighted % score</span>
                      </div>
                    ))}
                  </div>

                  {/* LIVE BOUNDARY SIMULATOR FOR AUDITING */}
                  <div className="bg-white border border-slate-300 rounded-3xl p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#C5A059]" />
                          Live Blueprint Grading Simulator
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5">Drag to test how student raw scores convert under the defined boundaries.</p>
                      </div>
                      
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 py-1 px-2.5 border border-slate-200 rounded-lg">
                        Validation Sandbox
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                          <span>Simulated Student Score</span>
                          <span className="text-slate-700">{simulatedScore} / {maxTotalRawMark} Raw Marks</span>
                        </div>
                        
                        <input 
                          type="range"
                          min="0"
                          max={maxTotalRawMark || 1}
                          value={simulatedScore}
                          onChange={(e) => setSimulatedScore(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>0 Marks</span>
                          <span>Maximum {maxTotalRawMark} Marks</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Calculated Outcome</span>
                        <div className="text-2xl font-black text-[#0F172A]">{simulatedOutcome.weightedTotal}% <span className="text-slate-500 text-xs font-normal">Weighted</span></div>
                        <div className="inline-flex py-1 px-3 bg-[#0F172A] text-[#EFE9DC] rounded-lg text-xs font-black tracking-wider uppercase mt-1">
                          Grade {simulatedOutcome.grade}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NAV BUTTON CONTROLS FOOTER */}
              <div className="mt-8 pt-6 border-t border-slate-200/60 flex items-center justify-between">
                <button 
                  type="button"
                  onClick={handleBackStep}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 transition-all cursor-pointer ${
                    currentStep === 1 ? 'opacity-0 pointer-events-none' : ''
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <button 
                  type="button"
                  onClick={currentStep === 3 ? handleSubmitSubmission : handleNextStep}
                  disabled={
                    (currentStep === 2 && (totalWeight !== 100 || !examTitle.trim() || !examSeries.trim() || !examDate))
                  }
                  className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-[#1A1A1A] text-[#0F172A] py-2.5 px-5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  {currentStep === 3 ? (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Blueprint
                    </>
                  ) : (
                    <>
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}