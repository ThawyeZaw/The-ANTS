'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Excel-Style Past Paper Grid
// Rows = paper units/variants | Columns = exam sessions (May 2023, Oct 2023…)
// Cell states: not_done (grey), done-no-score (blue ✓), done-scored (green/amber/red)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useTransition, useRef, useEffect } from 'react';
import { Check, X, Loader2, ChevronDown, BookOpen } from 'lucide-react';
import { upsertPastPaperRecord } from '@/actions/past-papers';
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
  if (cell.status === 'not_done') return 'bg-background-secondary border-border/30 text-foreground-muted';
  if (cell.status === 'skipped') return 'bg-foreground-muted/10 border-foreground-muted/20 text-foreground-muted';
  // Done — no score
  if (cell.rawScore === null) return 'bg-blue-500/15 border-blue-500/30 text-blue-500';
  // Done — scored: derive color from percentage
  const pct = cell.percentage ?? (cell.maxScore ? (cell.rawScore / cell.maxScore) * 100 : 0);
  if (pct >= 70) return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-400';
  if (pct >= 55) return 'bg-amber-400/20 border-amber-400/30 text-amber-700 dark:text-amber-400';
  return 'bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-400';
}

function getCellDisplayValue(cell: PaperGridCell, mode: DisplayMode, isIAL: boolean): string {
  if (cell.status === 'not_done') return '';
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
  const [mode, setMode] = useState<'check' | 'score'>(cell.rawScore !== null ? 'score' : 'check');
  const [scoreInput, setScoreInput] = useState(cell.rawScore !== null ? String(cell.rawScore) : '');
  const [isPending, startTransition] = useTransition();
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

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 w-52 rounded-xl border border-border bg-background-card shadow-xl p-3 space-y-3"
      style={{ minWidth: 200 }}
    >
      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border border-border text-xs font-medium">
        <button
          onClick={() => setMode('check')}
          className={cn('flex-1 py-1.5 transition-colors', mode === 'check' ? 'bg-primary/15 text-primary' : 'text-foreground-muted hover:bg-background-secondary')}
        >
          Mark Done
        </button>
        <button
          onClick={() => setMode('score')}
          className={cn('flex-1 py-1.5 transition-colors', mode === 'score' ? 'bg-primary/15 text-primary' : 'text-foreground-muted hover:bg-background-secondary')}
        >
          Enter Score
        </button>
      </div>

      {mode === 'check' ? (
        <div className="space-y-2">
          <p className="text-[11px] text-foreground-muted">Mark this paper as done without entering a score.</p>
          <div className="flex gap-2">
            <button
              onClick={() => save('done')}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Done
            </button>
            {cell.status !== 'not_done' && (
              <button
                onClick={() => save('not_done')}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border border-border text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Undo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-[11px] text-foreground-muted block">
            Raw Score{totalMarks ? ` (out of ${totalMarks})` : ''}
          </label>
          <input
            type="number"
            min={0}
            max={totalMarks ?? undefined}
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            placeholder="e.g. 65"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
          />
          <button
            onClick={() => {
              const v = parseFloat(scoreInput);
              if (!isNaN(v)) save('done', v);
            }}
            disabled={isPending || !scoreInput}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save Score
          </button>
        </div>
      )}
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
}) {
  const [open, setOpen] = useState(false);

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
  };

  const colorClass = getCellColor(effectiveCell);
  const displayValue = getCellDisplayValue(effectiveCell, displayMode, isIAL);

  return (
    <td className="relative p-0.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative w-full h-8 rounded-md border text-[11px] font-mono font-semibold transition-all duration-150',
          'hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          colorClass
        )}
        title={effectiveCell.status === 'not_done' ? 'Click to record' : `${effectiveCell.rawScore ?? ''}/${totalMarks ?? '?'}`}
      >
        {displayValue}
      </button>
      {open && (
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
    </td>
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
          Myanmar papers
        </span>
        {/* Year range filter */}
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <span className="font-medium">Years:</span>
          <input
            type="number"
            min={minYear}
            max={maxYear}
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value ? Number(e.target.value) : '')}
            placeholder={String(minYear)}
            className="w-20 px-2 py-1 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span>–</span>
          <input
            type="number"
            min={minYear}
            max={maxYear}
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value ? Number(e.target.value) : '')}
            placeholder={String(maxYear)}
            className="w-20 px-2 py-1 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
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
          { color: 'bg-background-secondary border-border/30', label: 'Not done' },
          { color: 'bg-blue-500/15 border-blue-500/30', label: 'Done ✓' },
          { color: 'bg-emerald-500/20 border-emerald-500/30', label: '≥70%' },
          { color: 'bg-amber-400/20 border-amber-400/30', label: '55–69%' },
          { color: 'bg-red-500/20 border-red-500/30', label: '<55%' },
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
            {gridData.rows.map((row, rowIdx) => (
              <tr key={`${row.paperNumber}-${row.variant}`} className="border-b border-border/40 last:border-0 hover:bg-background-secondary/40 transition-colors">
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
                  // Find the actual paperId for this session
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
            ))}
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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filteredSessions.map((s) => {
                const sessionKey = `${s.year}-${s.series}`;
                const cell = row.cells[sessionKey];
                const paperId = cell?.paperId ?? row.paperId;
                return (
                  <div key={sessionKey} className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-foreground-muted text-center">{s.label}</span>
                    <GridCell
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
