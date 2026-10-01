'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Excel-Style Past Paper Grid
// Rows = paper units/variants | Columns = exam sessions (May 2023, Oct 2023…)
// Cell states: not_done (grey), done-no-score (blue ✓), done-scored (green/amber/red)
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { Check, X, Loader2, ChevronDown, BookOpen } from 'lucide-react';
import { upsertPastPaperRecord } from '@/actions/past-papers';
import { useGamificationFeedback } from '@/components/gamification/GamificationFeedbackProvider';
import { type PaperGridData, type PaperGridCell, type PaperGridRow, type PaperGridSession } from '@/actions/curriculum';
import { cn } from '@/lib/utils';
import { getPluginForPaper } from '@/lib/grading';

// ── Types ─────────────────────────────────────────────────────────────────────

type DisplayMode = 'score' | 'grade' | 'ums';

interface PaperGridProps {
  userId: string;
  data: PaperGridData;
  onRecordChange?: () => void;
}

// ── Colour helpers ─────────────────────────────────────────────────────────────

function getCellColor(cell: PaperGridCell): string {
  if (cell.status === 'not_done') {
    return 'bg-background-secondary/90 hover:bg-background-secondary border-border/70 hover:border-primary/60 text-foreground-muted/60 hover:text-foreground shadow-2xs hover:shadow-sm';
  }
  if (cell.status === 'skipped') return 'bg-foreground-muted/10 border-foreground-muted/20 text-foreground-muted';
  // Done — no score
  if (cell.rawScore === null) return 'bg-blue-500/20 border-blue-500/40 text-blue-500 hover:bg-blue-500/30';
  // Done — scored: derive color from percentage
  const pct = cell.percentage ?? (cell.maxScore ? (cell.rawScore / cell.maxScore) * 100 : 0);
  if (pct >= 70) return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/30 font-bold';
  if (pct >= 55) return 'bg-amber-400/20 border-amber-400/40 text-amber-600 dark:text-amber-300 hover:bg-amber-400/30 font-bold';
  return 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-300 hover:bg-red-500/30 font-bold';
}

function getCellDisplayValue(cell: PaperGridCell, mode: DisplayMode, isIAL: boolean): string {
  if (cell.status === 'not_done') return '—';
  if (cell.status === 'skipped') return '—';
  if (cell.rawScore === null) return '✓';

  if (mode === 'grade') return cell.calculatedGrade ?? (cell.percentage !== null ? `${Math.round(cell.percentage)}%` : '✓');
  if (mode === 'ums' && isIAL) return cell.calculatedUms !== null ? String(cell.calculatedUms) : '✓';
  // Default: raw score
  if (cell.rawScore !== null && cell.maxScore !== null) return String(cell.rawScore);
  return cell.rawScore !== null ? String(cell.rawScore) : '✓';
}

// ── Cell Popover ──────────────────────────────────────────────────────────────

function CellPopover({
  paperId,
  sessionKey,
  cell,
  totalMarks,
  userId,
  qualification,
  examBoard,
  onSave,
  onClose,
}: {
  paperId: string;
  sessionKey: string;
  cell: PaperGridCell;
  totalMarks: number | null;
  userId: string;
  qualification: string;
  examBoard: string;
  onSave: (updated: Partial<PaperGridCell>) => void;
  onClose: () => void;
}) {
  const [scoreInput, setScoreInput] = useState(cell.rawScore !== null ? String(cell.rawScore) : '');
  const [isPending, startTransition] = useTransition();
  const { handleAwardResult } = useGamificationFeedback();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const save = (status: 'not_done' | 'done' | 'skipped', rawScore?: number) => {
    const pct = rawScore !== undefined && totalMarks ? Math.round((rawScore / totalMarks) * 1000) / 10 : undefined;
    let calculatedGrade: string | undefined;
    let calculatedUms: number | undefined;
    if (rawScore !== undefined && totalMarks) {
      const plugin = getPluginForPaper({ examBoard, qualification });
      const result = plugin.gradeFromRawMark(rawScore, totalMarks, cell.gradeBoundaries ?? []);
      calculatedGrade = result.grade;
      calculatedUms = result.ums;
    }

    // 1. Instant optimistic update & close popover immediately
    onSave({
      status,
      rawScore: rawScore ?? null,
      maxScore: totalMarks,
      percentage: pct ?? null,
      calculatedGrade: calculatedGrade ?? null,
      calculatedUms: calculatedUms ?? null,
    });
    onClose();

    // 2. Persist in background
    startTransition(async () => {
      try {
        const res = await upsertPastPaperRecord({
          userId,
          pastPaperId: paperId,
          status,
          rawScore,
          maxScore: totalMarks ?? undefined,
          percentage: pct,
          calculatedGrade,
          calculatedUms,
        });
        if (res.gamification) handleAwardResult(res.gamification);
        if (res.calculatedGrade || res.calculatedUms) {
          onSave({
            calculatedGrade: res.calculatedGrade ?? calculatedGrade ?? null,
            calculatedUms: res.calculatedUms ?? calculatedUms ?? null,
          });
        }
      } catch (err) {
        console.error('[PaperGrid] Failed to persist paper record in background:', err);
      }
    });
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(scoreInput);
    if (!isNaN(v)) {
      save('done', v);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1.5 w-60 rounded-2xl border border-border bg-background-card shadow-2xl p-3.5 space-y-3 animate-fade-in"
      style={{ minWidth: 220 }}
    >
      {/* 1-Click Status Action */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
          Paper Status
        </span>
        <div className="flex gap-2">
          {cell.status !== 'done' ? (
            <button
              type="button"
              onClick={() => save('done')}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              Mark Done
            </button>
          ) : (
            <button
              type="button"
              onClick={() => save('not_done')}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Mark Not Done
            </button>
          )}
          <button
            type="button"
            onClick={() => save('skipped')}
            disabled={isPending}
            className="px-2.5 py-2 text-xs font-medium rounded-xl border border-border text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer disabled:opacity-50"
            title="Skip paper"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex py-0.5 items-center">
        <div className="flex-grow border-t border-border/60"></div>
        <span className="flex-shrink mx-2 text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
          or record score
        </span>
        <div className="flex-grow border-t border-border/60"></div>
      </div>

      {/* Score Form */}
      <form onSubmit={handleScoreSubmit} className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-foreground-muted">
          <span>Raw Mark</span>
          {totalMarks && <span className="font-mono">out of {totalMarks}</span>}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={totalMarks ?? undefined}
            step="0.5"
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            placeholder={totalMarks ? `0–${totalMarks}` : 'e.g. 65'}
            className="flex-1 px-3 py-1.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
            autoFocus
          />
          <button
            type="submit"
            disabled={isPending || !scoreInput}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Save
          </button>
        </div>
        {cell.calculatedGrade && (
          <div className="text-[11px] text-center font-mono text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
            Current: Grade {cell.calculatedGrade}
            {cell.calculatedUms !== null && ` · ${cell.calculatedUms} UMS`}
          </div>
        )}
      </form>
    </div>
  );
}

// ── Grid Cell ─────────────────────────────────────────────────────────────────

function GridCell({
  cell,
  paperId,
  sessionKey,
  totalMarks,
  displayMode,
  isIAL,
  userId,
  qualification,
  examBoard,
  onUpdate,
  as = 'td',
}: {
  cell: PaperGridCell | undefined;
  paperId: string;
  sessionKey: string;
  totalMarks: number | null;
  displayMode: DisplayMode;
  isIAL: boolean;
  userId: string;
  qualification: string;
  examBoard: string;
  onUpdate: (sessionKey: string, updated: Partial<PaperGridCell>) => void;
  as?: 'td' | 'div';
}) {
  const [open, setOpen] = useState(false);
  const [quickPending, startQuick] = useTransition();
  const { handleAwardResult } = useGamificationFeedback();

  const effectiveCell: PaperGridCell = cell ?? {
    paperId,
    recordId: null,
    status: 'not_done',
    rawScore: null,
    maxScore: null,
    percentage: null,
    calculatedGrade: null,
    calculatedUms: null,
    gradeBoundaries: [],
    isDisabled: true,
    disabledReason: 'Paper not seeded in database',
  };

  const colorClass = effectiveCell.isDisabled 
    ? 'bg-background/40 border-border/15 text-transparent opacity-20 cursor-not-allowed select-none'
    : getCellColor(effectiveCell);
  
  const displayValue = effectiveCell.isDisabled ? '' : getCellDisplayValue(effectiveCell, displayMode, isIAL);

  // Quick-mark: toggle done/not_done with ONE CLICK without opening popover
  const quickMark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (effectiveCell.isDisabled) return;
    const newStatus = effectiveCell.status === 'done' ? 'not_done' : 'done';
    // Optimistic instant update
    onUpdate(sessionKey, { status: newStatus });
    startQuick(async () => {
      try {
        const res = await upsertPastPaperRecord({
          userId,
          pastPaperId: effectiveCell.paperId || paperId,
          status: newStatus,
        });
        if (res.gamification) handleAwardResult(res.gamification);
      } catch (err) {
        console.error('[PaperGrid] Quick-mark failed:', err);
        // Revert on error
        onUpdate(sessionKey, { status: effectiveCell.status });
      }
    });
  };

  const isDone = effectiveCell.status === 'done';
  const isSkipped = effectiveCell.status === 'skipped';
  const Wrapper = as;
  const wrapperClass = as === 'td' ? 'relative p-0.5 group/cell' : 'relative group/cell';

  return (
    <Wrapper className={wrapperClass}>
      <div
        className={cn(
          'relative w-full h-8 sm:h-9 rounded-lg border flex items-center justify-between px-1.5 transition-all duration-150',
          !effectiveCell.isDisabled && 'hover:scale-[1.02] hover:shadow-xs focus-within:ring-2 focus-within:ring-primary/40',
          colorClass
        )}
      >
        {/* Left: 1-Click Mark Done Toggle Button */}
        {!effectiveCell.isDisabled ? (
          <button
            type="button"
            onClick={quickMark}
            disabled={quickPending}
            title={isDone ? 'One-click: Mark not done' : 'One-click: Mark paper done'}
            className={cn(
              'h-6 w-6 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90',
              isDone
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 hover:bg-red-500/20 hover:text-red-500'
                : 'text-foreground-muted/40 hover:text-emerald-500 hover:bg-emerald-500/15'
            )}
          >
            {quickPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            ) : isDone ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center opacity-60 hover:opacity-100 hover:border-emerald-500" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        {/* Right: Score / Grade Display or Popover Trigger */}
        {!effectiveCell.isDisabled && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            title={
              effectiveCell.rawScore !== null
                ? `Score: ${effectiveCell.rawScore}/${totalMarks ?? '?'} — click to edit`
                : 'Click to enter score & calculate grade'
            }
            className="flex-1 text-right pl-1 pr-0.5 text-[11px] font-mono font-bold truncate hover:text-primary transition-colors cursor-pointer select-none"
          >
            {effectiveCell.rawScore !== null ? (
              <span>{displayValue}</span>
            ) : isDone ? (
              <span className="text-[10px] text-foreground-muted/70 hover:text-primary font-sans font-medium">
                +score
              </span>
            ) : isSkipped ? (
              <span className="text-[10px] text-foreground-muted font-sans font-medium">
                skip
              </span>
            ) : (
              <span className="text-foreground-muted/30 hover:text-foreground-muted text-[10px] font-mono">
                —
              </span>
            )}
          </button>
        )}
      </div>

      {open && !effectiveCell.isDisabled && (
        <CellPopover
          paperId={effectiveCell.paperId || paperId}
          sessionKey={sessionKey}
          cell={effectiveCell}
          totalMarks={totalMarks}
          userId={userId}
          qualification={qualification}
          examBoard={examBoard}
          onSave={(updated) => onUpdate(sessionKey, updated)}
          onClose={() => setOpen(false)}
        />
      )}
    </Wrapper>
  );
}

// ── Main PaperGrid ─────────────────────────────────────────────────────────────

export function PaperGrid({ userId, data, onRecordChange }: PaperGridProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('score');
  const [gridData, setGridData] = useState<PaperGridData>(data);
  const [yearFrom, setYearFrom] = useState<number | ''>('');
  const [yearTo, setYearTo] = useState<number | ''>('');

  useEffect(() => {
    setGridData(data);
  }, [data]);

  // Compute available year range
  const allYears = [...new Set(data.rows.flatMap((r) => Object.keys(r.cells).map((k) => parseInt(k.split('-')[0]))))].sort();
  const minYear = allYears[0] ?? new Date().getFullYear() - 5;
  const maxYear = allYears[allYears.length - 1] ?? new Date().getFullYear();

  // Filter sessions by year range
  const filteredSessions = gridData.sessions.filter((s) => {
    if (yearFrom !== '' && s.year < Number(yearFrom)) return false;
    if (yearTo !== '' && s.year > Number(yearTo)) return false;
    return true;
  });

  const handleCellUpdate = (rowIdx: number, sessionKey: string, updated: Partial<PaperGridCell>) => {
    setGridData((prev) => {
      const newRows = [...prev.rows];
      const row = { ...newRows[rowIdx], cells: { ...newRows[rowIdx].cells } };
      row.cells[sessionKey] = { ...row.cells[sessionKey], ...updated } as PaperGridCell;
      newRows[rowIdx] = row;
      return { ...prev, rows: newRows };
    });
    onRecordChange?.();
  };

  if (gridData.sessions.length === 0 && gridData.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-foreground-muted gap-3">
        <BookOpen className="h-10 w-10 opacity-30" />
        <p className="text-sm">No Myanmar-relevant past papers for this subject yet.</p>
        <p className="text-xs opacity-60">Seed data can be added via SQL — see <code className="font-mono">docs/seeds/exam-data-spec.md</code>.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
          All variants
        </span>
        <span className="text-[10px] text-foreground-muted">MM = Myanmar default</span>
        {/* Year range filter with Quick Presets */}
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <span className="font-medium">Years:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setYearFrom('');
                setYearTo('');
              }}
              className={cn(
                'px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                yearFrom === '' && yearTo === ''
                  ? 'bg-foreground text-background font-bold'
                  : 'bg-background-secondary text-foreground-muted hover:text-foreground'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setYearFrom(maxYear - 2);
                setYearTo(maxYear);
              }}
              className={cn(
                'px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                yearFrom === maxYear - 2 && yearTo === maxYear
                  ? 'bg-foreground text-background font-bold'
                  : 'bg-background-secondary text-foreground-muted hover:text-foreground'
              )}
            >
              Last 3 Yrs
            </button>
            <button
              type="button"
              onClick={() => {
                setYearFrom(maxYear - 4);
                setYearTo(maxYear);
              }}
              className={cn(
                'px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                yearFrom === maxYear - 4 && yearTo === maxYear
                  ? 'bg-foreground text-background font-bold'
                  : 'bg-background-secondary text-foreground-muted hover:text-foreground'
              )}
            >
              Last 5 Yrs
            </button>
          </div>
          <input
            type="number"
            min={minYear}
            max={maxYear}
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value ? Number(e.target.value) : '')}
            placeholder={String(minYear)}
            className="w-16 px-2 py-1 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span>–</span>
          <input
            type="number"
            min={minYear}
            max={maxYear}
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value ? Number(e.target.value) : '')}
            placeholder={String(maxYear)}
            className="w-16 px-2 py-1 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Display mode toggle */}
        <div className="flex items-center ml-auto gap-1 rounded-lg border border-border overflow-hidden text-[11px] font-semibold">
          {(['score', 'grade', ...(gridData.isIAL ? ['ums' as DisplayMode] : [])] as DisplayMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setDisplayMode(m)}
              className={cn(
                'px-2.5 py-1.5 uppercase tracking-wide transition-colors',
                displayMode === m ? 'bg-primary/15 text-primary' : 'text-foreground-muted hover:bg-background-secondary'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-medium text-foreground-muted">
        {[
          { color: 'bg-background-secondary/90 border-border/70', label: 'Not done' },
          { color: 'bg-blue-500/20 border-blue-500/40', label: 'Done ✓' },
          { color: 'bg-emerald-500/20 border-emerald-500/40', label: '≥70%' },
          { color: 'bg-amber-400/20 border-amber-400/40', label: '55–69%' },
          { color: 'bg-red-500/20 border-red-500/40', label: '<55%' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={cn('w-4 h-4 rounded border', color)} />
            {label}
          </span>
        ))}
      </div>

      {/* Scrollable grid (Desktop) */}
      <div className="overflow-x-auto rounded-xl border border-border bg-background-card hidden sm:block">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-background-secondary border-b border-border">
              {/* Frozen header cell for paper column */}
              <th className="sticky left-0 z-10 bg-background-secondary px-3 py-2.5 text-left font-semibold text-foreground-muted whitespace-nowrap min-w-[180px]">
                Paper
              </th>
              {/* Session column headers */}
              {filteredSessions.map((s) => (
                <th
                  key={`${s.year}-${s.series}`}
                  className="px-1 py-2.5 text-center font-mono text-[10px] font-semibold text-foreground-muted whitespace-nowrap min-w-[72px]"
                >
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const PURE_CORE = new Set(['WMA11', 'WMA12', 'WMA13', 'WMA14']);
              const FURTHER_PURE = new Set(['WFM01', 'WFM02', 'WFM03']);
              const APPLIED = new Set(['WME01', 'WME02', 'WME03', 'WST01', 'WST02', 'WST03', 'WDM11']);
              const isCombined = gridData.rows.length > 6 && gridData.rows.some((r) => FURTHER_PURE.has(r.paperNumber));
              const getGroup = (code: string) =>
                PURE_CORE.has(code) ? 'pure' : FURTHER_PURE.has(code) ? 'further' : APPLIED.has(code) ? 'applied' : 'other';
              const GROUP_LABELS: Record<string, string> = {
                pure: '📐 Pure Core (P1–P4)',
                applied: '📊 Applied (M · S · D)',
                further: '∞ Further Pure (FP1–FP3)',
                other: 'Other',
              };
              let lastGroup = '';
              return gridData.rows.map((row, rowIdx) => {
                const group = isCombined ? getGroup(row.paperNumber) : '';
                const showGroupHeader = isCombined && group !== lastGroup;
                if (showGroupHeader) lastGroup = group;
                return (
                <React.Fragment key={`${row.paperNumber}-${row.variant ?? ''}`}>
                  {showGroupHeader && (
                    <tr key={`group-header-${group}`} className="bg-background-secondary/70">
                      <td
                        colSpan={filteredSessions.length + 1}
                        className="sticky left-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted border-b border-border/50"
                      >
                        {GROUP_LABELS[group]}
                      </td>
                    </tr>
                  )}
                  <tr
                    key={`${row.paperNumber}-${row.variant}`}
                    className={cn(
                      'border-b border-border/40 last:border-0 hover:bg-background-secondary/40 transition-colors',
                      row.isRequired && 'bg-primary/[0.03]',
                      !row.isMyanmarDefault && !row.isRequired && 'opacity-80'
                    )}
                  >
                    {/* Frozen paper label */}
                    <td className="sticky left-0 z-10 bg-background-card px-3 py-1.5 whitespace-nowrap border-r border-border/30">
                  <div className="space-y-0.5">
                    <div className="font-mono font-bold text-foreground text-[12px] leading-tight">
                      {row.displayLabel}
                      {row.isMyanmarDefault && (
                        <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                          MM
                        </span>
                      )}
                    </div>
                    {row.title && (
                      <div className="text-[10px] text-foreground-secondary line-clamp-2 max-w-[180px]">
                        {row.title}
                      </div>
                    )}
                    {row.totalMarks && (
                      <div className="text-[10px] font-mono text-foreground-muted">{row.totalMarks} marks</div>
                    )}
                  </div>
                </td>

                {/* Session cells */}
                    {filteredSessions.map((s) => {
                      const sessionKey = `${s.year}-${s.series}`;
                      const cell = row.cells[sessionKey];
                      const paperId = cell?.paperId ?? row.paperId;
                      return (
                        <GridCell
                          key={sessionKey}
                          cell={cell}
                          paperId={paperId}
                          sessionKey={sessionKey}
                          totalMarks={row.totalMarks}
                          displayMode={displayMode}
                          isIAL={gridData.isIAL}
                          userId={userId}
                          qualification={row.qualification}
                          examBoard={row.examBoard}
                          onUpdate={(sk, updated) => handleCellUpdate(rowIdx, sk, updated)}
                        />
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            });
          })()}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {gridData.rows.map((row, rowIdx) => (
          <div key={`${row.paperNumber}-${row.variant}`} className="rounded-xl border border-border bg-background-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="font-mono font-bold text-foreground text-sm">
                {row.displayLabel}
                {row.isMyanmarDefault ? (
                  <span className="ml-1.5 text-[9px] font-semibold uppercase text-primary">MM</span>
                ) : null}
              </div>
              {row.totalMarks && (
                <div className="text-xs font-mono text-foreground-muted">{row.totalMarks} marks</div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredSessions.map((s) => {
                const sessionKey = `${s.year}-${s.series}`;
                const cell = row.cells[sessionKey];
                const paperId = cell?.paperId ?? row.paperId;
                return (
                  <div key={sessionKey} className="flex flex-col gap-1.5 p-2 rounded-xl bg-background-secondary/40 border border-border/50">
                    <span className="text-[11px] font-mono font-semibold text-foreground-muted text-center">{s.label}</span>
                    <GridCell
                      as="div"
                      cell={cell}
                      paperId={paperId}
                      sessionKey={sessionKey}
                      totalMarks={row.totalMarks}
                      displayMode={displayMode}
                      isIAL={gridData.isIAL}
                      userId={userId}
                      qualification={row.qualification}
                      examBoard={row.examBoard}
                      onUpdate={(sk, updated) => handleCellUpdate(rowIdx, sk, updated)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
