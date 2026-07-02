import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  RotateCcw, 
  CheckCircle, 
  TrendingUp,
  Info,
  ChevronDown
} from 'lucide-react';
import { ExamGradeBoundary } from '@/types';

// ==========================================
// MOCK DATA FACADE (Syllabus & Boundary Rules)
// ==========================================
const SYLLABUS_PRESETS = {
  "0606": {
    code: "0606",
    title: "Additional Mathematics (0606)",
    defaultSeries: "May/June 2024 (V2)",
    papers: [
      { id: "p1", name: "Paper 1", maxMark: 80, weight: 80 },
      { id: "p2", name: "Paper 2", maxMark: 80, weight: 80 }
    ],
    boundaries: {
      "May/June 2024 (V2)": { maxPossible: 160, "A*": 137, "A": 115, "B": 87, "C": 68, "D": 49 }
    }
  },
  "0625": {
    code: "0625",
    title: "Physics (Extended) (0625)",
    defaultSeries: "May/June 2024 (V2)",
    papers: [
      { id: "p2", name: "Paper 2 (Multiple Choice)", maxMark: 40, weight: 40 },
      { id: "p4", name: "Paper 4 (Extended Theory)", maxMark: 80, weight: 100 },
      { id: "p6", name: "Paper 6 (Alternative to Practical)", maxMark: 40, weight: 40 }
    ],
    boundaries: {
      "May/June 2024 (V2)": { maxPossible: 160, "A*": 141, "A": 118, "B": 95, "C": 72, "D": 55 }
    }
  },
  "0620": {
    code: "0620",
    title: "Chemistry (Extended) (0620)",
    defaultSeries: "May/June 2024 (V2)",
    papers: [
      { id: "p2", name: "Paper 2 (Multiple Choice)", maxMark: 40, weight: 40 },
      { id: "p4", name: "Paper 4 (Extended Theory)", maxMark: 80, weight: 100 },
      { id: "p6", name: "Paper 6 (Alternative to Practical)", maxMark: 40, weight: 40 }
    ],
    boundaries: {
      "May/June 2024 (V2)": { maxPossible: 160, "A*": 138, "A": 114, "B": 90, "C": 66, "D": 50 }
    }
  },
  "0478": {
    code: "0478",
    title: "Computer Science (0478)",
    defaultSeries: "May/June 2024 (V2)",
    papers: [
      { id: "p1", name: "Paper 1 (Theory)", maxMark: 75, weight: 75 },
      { id: "p2", name: "Paper 2 (Problem-Solving)", maxMark: 75, weight: 75 }
    ],
    boundaries: {
      "May/June 2024 (V2)": { maxPossible: 150, "A*": 128, "A": 109, "B": 90, "C": 71, "D": 52 }
    }
  }
};

interface GradeCalculatorProps {
  gradeBoundaries?: ExamGradeBoundary[];
}

export default function GradeCalculator({ gradeBoundaries = [] }: GradeCalculatorProps) {
  const [selectedCode, setSelectedCode] = useState("0606");
  const [selectedSeries, setSelectedSeries] = useState("May/June 2024 (V2)");
  
  // Keep track of raw marks inputs
  // Key format: `${selectedCode}_${paperId}`
  const [rawMarks, setRawMarks] = useState<Record<string, number | string>>({
    "0606_p1": 40,
    "0606_p2": ""
  });

  const activeSyllabus = useMemo(() => {
    return SYLLABUS_PRESETS[selectedCode as keyof typeof SYLLABUS_PRESETS] || SYLLABUS_PRESETS["0606"];
  }, [selectedCode]);

  const activeBoundaries = useMemo(() => {
    if (gradeBoundaries.length > 0) {
      const boundaryMap = gradeBoundaries.reduce<Record<string, number>>((acc, boundary) => {
        if (boundary.grade?.trim()) {
          acc[boundary.grade.trim()] = Number(boundary.min_mark) || 0;
        }
        return acc;
      }, {});

      const maxPossible = Math.max(...Object.values(boundaryMap), 100);
      return { maxPossible, ...boundaryMap } as Record<string, number> & { maxPossible: number };
    }

    const defaultBounds = { maxPossible: 160, "A*": 137, "A": 115, "B": 87, "C": 68 };
    return (activeSyllabus.boundaries as any)[selectedSeries] || defaultBounds;
  }, [activeSyllabus, selectedSeries, gradeBoundaries]);

  // Handle Input Changes with safe numeric sanitization
  const handleMarkChange = (paperId: string, value: string) => {
    const key = `${selectedCode}_${paperId}`;
    if (value === "") {
      setRawMarks(prev => ({ ...prev, [key]: "" }));
      return;
    }
    
    const parsed = parseInt(value, 10);
    const maxMark = activeSyllabus.papers.find(p => p.id === paperId)?.maxMark || 100;
    
    if (!isNaN(parsed) && parsed >= 0) {
      // Clamp to maximum allowed score
      const clamped = Math.min(parsed, maxMark);
      setRawMarks(prev => ({ ...prev, [key]: clamped }));
    }
  };

  // Reset current selection
  const resetFields = () => {
    const updated = { ...rawMarks };
    activeSyllabus.papers.forEach((p: any) => {
      updated[`${selectedCode}_${p.id}`] = "";
    });
    setRawMarks(updated);
  };

  // ==========================================
  // CALCULATOR ENGINE (PUM INTERPOLATION)
  // ==========================================
  const calculationResults = useMemo(() => {
    let totalRawMark = 0;
    let totalMaxPossibleRaw = 0;
    let totalWeightedMark = 0;
    let totalMaxWeight = 0;
    let fullyEntered = true;

    activeSyllabus.papers.forEach((paper: any) => {
      const val = rawMarks[`${selectedCode}_${paper.id}`];
      const max = paper.maxMark;
      
      if (val === "" || val === undefined) {
        fullyEntered = false;
      } else {
        const rawScore = Number(val);
        totalRawMark += rawScore;
        
        // Cambridge dynamic component weighting factor formula:
        // Weighted Mark = (Raw Mark / Max Raw Mark) * Weight Factor
        const paperWeightContribution = (rawScore / max) * paper.weight;
        totalWeightedMark += paperWeightContribution;
      }
      totalMaxPossibleRaw += max;
      totalMaxWeight += paper.weight;
    });

    // Rounded values for presentation
    const roundedRawTotal = totalRawMark;
    const roundedWeightedMark = Math.round(totalWeightedMark * 100) / 100;

    // Linear Interpolation for Percentage Uniform Mark (PUM)
    // PUM translates weighted marks into standard boundaries:
    // A* is mapped to 90-100%, A to 80-89%, B to 70-79%, C to 60-69% etc.
    let pum = 0;
    let estimatedGrade = "—";

    if (fullyEntered) {
      const wm = totalWeightedMark;
      const b = activeBoundaries;

      const star = b["A*"];
      const a = b["A"];
      const b_grade = b["B"];
      const c = b["C"];
      const d = b["D"] || 40;
      const maxPossible = b.maxPossible;

      if (wm >= star) {
        // Map linearly from star to maxPossible => 90% to 100%
        const range = maxPossible - star;
        const fraction = range > 0 ? (wm - star) / range : 0;
        pum = 90 + (fraction * 10);
        estimatedGrade = "A*";
      } else if (wm >= a) {
        // Map linearly from a to star => 80% to 89%
        const range = star - a;
        const fraction = range > 0 ? (wm - a) / range : 0;
        pum = 80 + (fraction * 10);
        estimatedGrade = "A";
      } else if (wm >= b_grade) {
        // Map linearly from b_grade to a => 70% to 79%
        const range = a - b_grade;
        const fraction = range > 0 ? (wm - b_grade) / range : 0;
        pum = 70 + (fraction * 10);
        estimatedGrade = "B";
      } else if (wm >= c) {
        // Map linearly from c to b_grade => 60% to 69%
        const range = b_grade - c;
        const fraction = range > 0 ? (wm - c) / range : 0;
        pum = 60 + (fraction * 10);
        estimatedGrade = "C";
      } else if (wm >= d) {
        // Map linearly from d to c => 50% to 59%
        const range = c - d;
        const fraction = range > 0 ? (wm - d) / range : 0;
        pum = 50 + (fraction * 10);
        estimatedGrade = "D";
      } else {
        // Below D (E or U)
        const fraction = d > 0 ? wm / d : 0;
        pum = fraction * 50;
        estimatedGrade = "E/U";
      }
      pum = Math.min(100, Math.max(0, Math.round(pum)));
    }

    return {
      totalRawMark: roundedRawTotal,
      totalMaxPossibleRaw,
      weightedMark: roundedWeightedMark,
      maxPossibleWeight: totalMaxWeight,
      pum,
      estimatedGrade,
      fullyEntered
    };
  }, [activeSyllabus, rawMarks, selectedCode, activeBoundaries]);

  return (
    <div className="h-full flex-1 bg-transparent py-10 px-4 md:px-8 font-sans text-slate-800">
      
      {/* Upper Navigation Header */}
      <div className="w-full mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#C5A059] font-semibold text-sm tracking-wide uppercase">
            <Calculator className="w-5 h-5" />
            <span>Academic Infrastructure</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Syllabus Grade Calculator</h1>
          <p className="text-slate-500 text-sm mt-1">
            Predict uniform marks using authentic exam board weight components and thresholds.
          </p>
        </div>
        <button 
          onClick={resetFields}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm transition-all active:scale-95 self-start md:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Fields
        </button>
      </div>

      <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: CONTROL & INPUT AREA                        */}
        {/* ======================================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top Selection Row Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Subject Selector */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                Subject Selected
              </label>
              <div className="relative">
                <select 
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  className="w-full appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold py-3 px-4 pr-10 border border-slate-200 rounded-xl cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#C5A059]"
                >
                  {Object.values(SYLLABUS_PRESETS).map(sub => (
                    <option key={sub.code} value={sub.code}>
                      {sub.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Series Tracker Dropdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                Series Track
              </label>
              <div className="relative">
                <select
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.target.value)}
                  className="w-full appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold py-3 px-4 pr-10 border border-slate-200 rounded-xl cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#C5A059]"
                >
                  <option value="May/June 2024 (V2)">May/June 2024 (V2)</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Component Stack Panel */}
          <div className="space-y-4">
            {activeSyllabus.papers.map((paper: any, index: number) => {
              const currentVal = rawMarks[`${selectedCode}_${paper.id}`] ?? "";
              return (
                <div 
                  key={paper.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Component {index + 1}</span>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      📝 {paper.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Max Raw Mark: <strong className="text-slate-700 font-semibold">{paper.maxMark}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>Combined Weighting: <strong className="text-[#C5A059] font-semibold">{paper.weight}%</strong></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={currentVal}
                        placeholder="e.g. 0"
                        onChange={(e) => handleMarkChange(paper.id, e.target.value)}
                        className="w-24 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-center font-bold text-slate-800 text-lg hover:bg-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#C5A059] transition-all"
                      />
                      <span className="text-slate-500 font-medium">/</span>
                      <div className="w-16 bg-slate-100 text-slate-500 py-2.5 rounded-xl text-center font-semibold text-sm border border-slate-200">
                        {paper.maxMark}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Boundaries Reference Deck */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Grade Boundary Reference (Weighted Mark / {activeBoundaries.maxPossible})
            </h4>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-sm font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                A* ≥ {activeBoundaries["A*"]}
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-sm font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                A ≥ {activeBoundaries["A"]}
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                B ≥ {activeBoundaries["B"]}
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-sm font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                C or Fail ≥ 0
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: HIGH-CONTRAST RESULTS PANEL               */}
        {/* ======================================================== */}
        <div className="space-y-6">
          
          {/* Main Calculation Card (Dark Vibe) */}
          <div className="bg-[#0F172A] text-[#EFE9DC] rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/20 rounded-lg text-[#C5A059]">
                  <Calculator className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calculated PUM Result</span>
              </div>
              {calculationResults.fullyEntered && (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              )}
            </div>

            <div className="space-y-6">
              
              {/* Total Raw Mark Display */}
              <div className="bg-slate-800/60 border border-slate-300/50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Raw Mark</span>
                  <div className="text-xl font-bold tracking-tight">
                    {calculationResults.fullyEntered ? (
                      <span>{calculationResults.totalRawMark} <span className="text-slate-500 text-sm">/ {calculationResults.totalMaxPossibleRaw}</span></span>
                    ) : (
                      <span className="text-slate-500">— / —</span>
                    )}
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-slate-500" />
              </div>

              {/* Weighted Mark */}
              <div className="bg-slate-800/60 border border-slate-300/50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Weighted Mark</span>
                  <div className="text-xl font-bold tracking-tight">
                    {calculationResults.fullyEntered ? (
                      <span>{calculationResults.weightedMark} <span className="text-slate-500 text-sm">/ {calculationResults.maxPossibleWeight}</span></span>
                    ) : (
                      <span className="text-slate-500">— / —</span>
                    )}
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-slate-500" />
              </div>

              {/* Percentage Uniform Mark Indicator */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Percentage Uniform Mark</span>
                  <div className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                    {calculationResults.fullyEntered ? `${calculationResults.pum}%` : "—"}
                  </div>
                </div>

                {/* Simulated Grade Badge Badge */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Grade</span>
                  <div className="w-14 h-14 bg-indigo-500 text-[#0F172A] rounded-xl flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-500/20">
                    {calculationResults.estimatedGrade}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Interactive Explainer Deck */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h5 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-[#C5A059]" />
              How it's calculated
            </h5>
            
            <ol className="text-xs text-slate-500 space-y-3 pl-4 list-decimal marker:font-bold marker:text-slate-500">
              <li>Raw marks are summed across all papers.</li>
              <li>
                <strong>Weighted Mark</strong> = (Sum of raw marks ÷ Sum of max marks) × Weighting.
              </li>
              <li>
                PUM is interpolated between grade boundaries (A*, A, B). Below B = 60% or less.
              </li>
            </ol>
            
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 italic">
              Formula matches your spreadsheet exactly.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}