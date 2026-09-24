'use client';

import { Award, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  IAL_CASH_INS,
  bestMathsFmSplit,
  evaluateIalCashIn,
  formatIalUnitLabel,
  getGradeColor,
  ialUnitMaxUms,
  umsUnitGrade,
  type IalCashInCode,
  type MathsSuiteMode,
} from '@/lib/grading';

interface IalUmsCalculatorProps {
  unitCodes: readonly string[];
  ums: Record<string, number | string>;
  onUmsChange: (unitCode: string, value: string) => void;
  isMathsSuite: boolean;
  mathsSuiteMode?: MathsSuiteMode;
  cashInCode: string | null;
}

function parsedUms(ums: Record<string, number | string>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [code, raw] of Object.entries(ums)) {
    if (raw === '' || raw === null || raw === undefined) continue;
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(n)) out[code] = n;
  }
  return out;
}

function AwardCard({
  title,
  code,
  grade,
  totalUms,
  maxUms,
  units,
  notes,
}: {
  title: string;
  code: string;
  grade: string;
  totalUms: number;
  maxUms: number;
  units: readonly string[];
  notes?: string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-background-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">{code}</p>
          <p className="text-sm font-bold text-foreground">{title}</p>
        </div>
        <div
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-extrabold border',
            getGradeColor(grade)
          )}
        >
          {grade}
        </div>
      </div>
      <p className="font-mono text-sm text-primary font-bold">
        {totalUms} / {maxUms} UMS
      </p>
      <p className="text-[11px] text-foreground-muted">
        Units: {units.map((u) => formatIalUnitLabel(u, false)).join(', ')}
      </p>
      {notes && notes.length > 0 && (
        <p className="text-[11px] text-foreground-muted">{notes.join(' ')}</p>
      )}
    </div>
  );
}

export function IalUmsCalculator({
  unitCodes,
  ums,
  onUmsChange,
  isMathsSuite,
  mathsSuiteMode = 'all',
  cashInCode,
}: IalUmsCalculatorProps) {
  const numeric = parsedUms(ums);
  const filledCount = Object.keys(numeric).length;

  const mathsSplit = isMathsSuite ? bestMathsFmSplit(numeric, mathsSuiteMode) : null;
  const award = cashInCode ? IAL_CASH_INS[cashInCode as IalCashInCode] : null;
  const cashInReady = Boolean(award && award.compulsory.every((code) => numeric[code] != null));
  const single =
    !isMathsSuite && cashInReady && cashInCode
      ? evaluateIalCashIn({
          unitUms: Object.fromEntries(award!.compulsory.map((code) => [code, numeric[code] ?? 0])),
          cashInCode: cashInCode as IalCashInCode,
          totalRaw: 0,
          maxRaw: 0,
        })
      : null;

  return (
    <div className="space-y-6">
      <p className="text-xs text-foreground-muted">
        {isMathsSuite
          ? 'Enter UMS for every unit you sat. Pearson does not reuse a unit across Mathematics, Pure Mathematics and Further Mathematics — we assign units to give the highest possible grades.'
          : 'IAL grades are awarded from UMS, which is comparable across series. Enter uniform marks only — not raw paper marks. Max UMS depends on the paper (for example Physics 120 / 60).'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {unitCodes.map((code) => {
          const max = ialUnitMaxUms(code);
          const value = ums[code] ?? '';
          const n = numeric[code];
          const grade = n == null ? '—' : umsUnitGrade(n, max);
          const inputId = `ums-input-${code}`;
          return (
            <div
              key={code}
              className="flex flex-col justify-between gap-2.5 rounded-2xl border border-border bg-background-secondary p-3.5 sm:p-4 transition-colors hover:border-border-hover"
            >
              {/* Row 1: Unit Title */}
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={inputId}
                  className="text-xs font-bold text-foreground line-clamp-1 leading-snug cursor-pointer select-none"
                  title={formatIalUnitLabel(code)}
                >
                  {formatIalUnitLabel(code)}
                </label>
              </div>

              {/* Row 2: Marks Info & Input + Grade Badge */}
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <span className="text-[11px] text-foreground-muted font-mono">max {max} UMS</span>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    id={inputId}
                    type="number"
                    min={0}
                    max={max}
                    inputMode="numeric"
                    value={value}
                    placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        onUmsChange(code, '');
                        return;
                      }
                      const parsed = Number(raw);
                      if (!Number.isFinite(parsed)) return;
                      onUmsChange(code, String(Math.min(max, Math.max(0, parsed))));
                    }}
                    className="w-20 rounded-xl border border-border bg-background-card px-2.5 py-1.5 text-right font-mono text-base sm:text-sm font-bold text-foreground outline-none focus:border-primary transition-colors"
                  />
                  <span
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold border transition-colors',
                      n == null
                        ? 'bg-background-secondary text-foreground-muted border-border'
                        : getGradeColor(grade)
                    )}
                    aria-label={n != null ? `Grade ${grade}` : 'No grade calculated'}
                  >
                    {grade}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filledCount === 0 && (
        <p className="text-xs text-foreground-muted">Enter at least one unit UMS to see a cash-in grade.</p>
      )}

      {isMathsSuite && mathsSplit && filledCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
            <Award className="w-4 h-4 text-primary" />
            Highest possible cash-in grades
          </div>
          {!mathsSplit.maths && !mathsSplit.pure && !mathsSplit.further && (
            <p className="text-xs text-foreground-muted">
              Not enough units for an official cash-in yet. Mathematics needs P1–P4 plus an applied pair, or P1–P2 plus
              M1/S1/D1 for IAS. Pure Mathematics needs P1, P2 and FP1 (IAS) or P1–P4, FP1 and FP2 or FP3 (IAL). Further
              Mathematics needs FP1 plus enough unused units.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mathsSplit.maths && (
              <AwardCard
                title={IAL_CASH_INS[mathsSplit.maths.cashInCode].name}
                code={mathsSplit.maths.cashInCode}
                grade={mathsSplit.maths.result.grade}
                totalUms={mathsSplit.maths.result.totalUms ?? 0}
                maxUms={IAL_CASH_INS[mathsSplit.maths.cashInCode].maxUms}
                units={mathsSplit.maths.units}
                notes={mathsSplit.maths.result.aStarNotes}
              />
            )}
            {mathsSplit.pure && (
              <AwardCard
                title={IAL_CASH_INS[mathsSplit.pure.cashInCode].name}
                code={mathsSplit.pure.cashInCode}
                grade={mathsSplit.pure.result.grade}
                totalUms={mathsSplit.pure.result.totalUms ?? 0}
                maxUms={IAL_CASH_INS[mathsSplit.pure.cashInCode].maxUms}
                units={mathsSplit.pure.units}
                notes={mathsSplit.pure.result.aStarNotes}
              />
            )}
            {mathsSplit.further && (
              <AwardCard
                title={IAL_CASH_INS[mathsSplit.further.cashInCode].name}
                code={mathsSplit.further.cashInCode}
                grade={mathsSplit.further.result.grade}
                totalUms={mathsSplit.further.result.totalUms ?? 0}
                maxUms={IAL_CASH_INS[mathsSplit.further.cashInCode].maxUms}
                units={mathsSplit.further.units}
                notes={mathsSplit.further.result.aStarNotes}
              />
            )}
          </div>
          {mathsSplit.unusedUnits.length > 0 && (mathsSplit.maths || mathsSplit.pure || mathsSplit.further) && (
            <p className="text-[11px] text-foreground-muted flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Not used in this cash-in: {mathsSplit.unusedUnits.map((u) => formatIalUnitLabel(u)).join(', ')}.
            </p>
          )}
          {mathsSplit.notes.map((n) => (
            <p key={n} className="text-[11px] text-foreground-muted">
              {n}
            </p>
          ))}
        </div>
      )}

      {!isMathsSuite && award && filledCount > 0 && !cashInReady && (
        <p className="text-xs text-foreground-muted">
          Enter UMS for every {award.code} unit ({award.compulsory.map((u) => formatIalUnitLabel(u, false)).join(', ')})
          to see the cash-in grade.
        </p>
      )}

      {!isMathsSuite && single && award && (
        <AwardCard
          title={award.name}
          code={award.code}
          grade={single.grade}
          totalUms={single.totalUms ?? 0}
          maxUms={award.maxUms}
          units={award.compulsory}
          notes={single.aStarNotes}
        />
      )}
    </div>
  );
}
