'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Edexcel IAL Optional Units Selector Modal
// Allows students to choose target award (AS vs A Level) and optional units
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect } from 'react';
import { X, Check, CheckCircle2, Sparkles, Layers, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AwardLevel } from '@/lib/exam-papers/myanmar-papers';
import {
  IAL_CASH_INS,
  IAL_UNIT_LABELS,
  YMA01_APPLIED_PAIRS,
  optionalUnitPresets,
  requiredOptionalCount,
  type IalCashInCode,
} from '@/lib/grading/ial-cash-in';
import { enrollCashInAward } from '@/actions/curriculum';

const MATH_CODES: readonly IalCashInCode[] = ['YMA01', 'XMA01'];
const FURTHER_MATH_CODES: readonly IalCashInCode[] = ['YFM01', 'XFM01'];

interface AvailableUnit {
  id: string;
  code: string;
  title: string;
}

interface IalOptionalUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  subjectTitle: string; // 'Mathematics' or 'Further Mathematics'
  initialAwardCode?: string | null;
  initialSelectedUnits?: string[];
  availableUnits: AvailableUnit[];
  onSuccess: (cashInCode: string, awardLevel: AwardLevel, selectedUnits: string[]) => void;
}

export function IalOptionalUnitsModal({
  isOpen,
  onClose,
  userId,
  subjectTitle,
  initialAwardCode,
  initialSelectedUnits = [],
  availableUnits,
  onSuccess,
}: IalOptionalUnitsModalProps) {
  const isFurtherMath = subjectTitle.toLowerCase().includes('further');
  const availableCodes = isFurtherMath ? FURTHER_MATH_CODES : MATH_CODES;

  const defaultCode = (initialAwardCode && availableCodes.includes(initialAwardCode as IalCashInCode))
    ? (initialAwardCode as IalCashInCode)
    : availableCodes[0];

  const [selectedCode, setSelectedCode] = useState<IalCashInCode>(defaultCode);
  const [selectedOptional, setSelectedOptional] = useState<string[]>(() => {
    const awardDef = IAL_CASH_INS[defaultCode];
    const initialOpts = (initialSelectedUnits || []).filter((u) => awardDef.optional.includes(u));
    if (initialOpts.length === requiredOptionalCount(awardDef)) {
      return initialOpts;
    }
    const defPresets = optionalUnitPresets(awardDef);
    return defPresets.length > 0 ? [...defPresets[0].units] : [];
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const award = IAL_CASH_INS[selectedCode];
  const needOptionalCount = requiredOptionalCount(award);
  const presets = useMemo(() => optionalUnitPresets(award), [award]);

  const initialUnitsKey = (initialSelectedUnits ?? []).join(',');

  // Sync state only when modal opens or initial props change, NOT on internal state changes or re-renders
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const awardToUse = (initialAwardCode && availableCodes.includes(initialAwardCode as IalCashInCode))
      ? (initialAwardCode as IalCashInCode)
      : availableCodes[0];
    setSelectedCode(awardToUse);

    const awardDef = IAL_CASH_INS[awardToUse];
    const initialOpts = (initialSelectedUnits ?? []).filter((u) => awardDef.optional.includes(u));
    if (initialOpts.length === requiredOptionalCount(awardDef)) {
      setSelectedOptional(initialOpts);
    } else {
      const awardPresets = optionalUnitPresets(awardDef);
      if (awardPresets.length > 0) {
        setSelectedOptional([...awardPresets[0].units]);
      } else {
        setSelectedOptional([]);
      }
    }
  }, [isOpen, subjectTitle, initialAwardCode, initialUnitsKey]);

  if (!isOpen) return null;

  const handleAwardChange = (newCode: IalCashInCode) => {
    if (newCode === selectedCode) return;
    setSelectedCode(newCode);
    setError(null);
    const newAward = IAL_CASH_INS[newCode];
    const newPresets = optionalUnitPresets(newAward);
    if (newPresets.length > 0) {
      setSelectedOptional([...newPresets[0].units]);
    } else {
      setSelectedOptional([]);
    }
  };

  const handleToggleOptional = (unitCode: string) => {
    setError(null);

    // 1. If currently selected, DESELECT it
    if (selectedOptional.includes(unitCode)) {
      setSelectedOptional((prev) => prev.filter((u) => u !== unitCode));
      return;
    }

    // 2. For YMA01 (A Level Mathematics - requires 2 approved applied units)
    if (selectedCode === 'YMA01') {
      if (selectedOptional.length >= needOptionalCount) {
        // Both units already chosen. Try intelligently swapping with unit 0 or unit 1 to create an approved pair
        const pairWithFirst = [selectedOptional[0], unitCode];
        const validWithFirst = YMA01_APPLIED_PAIRS.some(
          ([a, b]) => (a === pairWithFirst[0] && b === pairWithFirst[1]) || (a === pairWithFirst[1] && b === pairWithFirst[0])
        );
        const pairWithSecond = [selectedOptional[1], unitCode];
        const validWithSecond = YMA01_APPLIED_PAIRS.some(
          ([a, b]) => (a === pairWithSecond[0] && b === pairWithSecond[1]) || (a === pairWithSecond[1] && b === pairWithSecond[0])
        );

        if (validWithSecond) {
          setSelectedOptional(pairWithSecond);
        } else if (validWithFirst) {
          setSelectedOptional(pairWithFirst);
        } else {
          setError(
            `${IAL_UNIT_LABELS[unitCode] ?? unitCode} cannot be combined with your current selections. Choose an approved route above or deselect a unit first.`
          );
        }
        return;
      } else {
        // 0 or 1 unit currently selected
        const next = [...selectedOptional, unitCode];
        if (next.length === 2) {
          const valid = YMA01_APPLIED_PAIRS.some(
            ([a, b]) => (a === next[0] && b === next[1]) || (a === next[1] && b === next[0])
          );
          if (!valid) {
            setError(
              `Pair [${IAL_UNIT_LABELS[next[0]] ?? next[0]} + ${IAL_UNIT_LABELS[unitCode] ?? unitCode}] is not an approved A Level combination. Approved pairings: M1+S1, M1+M2, S1+S2, M1+D1, S1+D1.`
            );
            return;
          }
        }
        setSelectedOptional(next);
        return;
      }
    }

    // 3. For other awards (e.g. XMA01 with 1 optional unit, or Further Mathematics)
    if (selectedOptional.length < needOptionalCount) {
      setSelectedOptional((prev) => [...prev, unitCode]);
    } else {
      if (needOptionalCount === 1) {
        setSelectedOptional([unitCode]);
      } else {
        setSelectedOptional((prev) => [...prev.slice(1), unitCode]);
      }
    }
  };

  const handleApplyPreset = (units: string[]) => {
    setError(null);
    setSelectedOptional([...units]);
  };

  const isValid = selectedOptional.length === needOptionalCount;
  const allSelectedUnits = [...new Set([...award.compulsory, ...selectedOptional])];

  const handleConfirm = async () => {
    if (!isValid) {
      setError(`Please select ${needOptionalCount} optional unit${needOptionalCount !== 1 ? 's' : ''}.`);
      return;
    }

    setLoading(true);
    setError(null);

    const awardLevel: AwardLevel = selectedCode.startsWith('Y') ? 'A Level' : 'AS';
    try {
      const res = await enrollCashInAward(userId, selectedCode, awardLevel, allSelectedUnits);
      if (!res.success) {
        setError(res.error ?? 'Failed to enroll in modular units.');
        setLoading(false);
        return;
      }

      onSuccess(selectedCode, awardLevel, allSelectedUnits);
      onClose();
    } catch (err: any) {
      console.error('[IalOptionalUnitsModal] Error:', err);
      setError(err?.message ?? 'Network error while enrolling.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-card/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Select {subjectTitle} Units</h2>
              <p className="text-xs text-foreground-muted">
                Pearson Edexcel IAL Modular Qualification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Award Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Target Qualification
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableCodes.map((code) => {
                const isAlevel = code.startsWith('Y');
                const isSelected = selectedCode === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleAwardChange(code)}
                    className={cn(
                      'cursor-pointer flex flex-col text-left p-3 rounded-xl border transition-all',
                      isSelected
                        ? 'border-amber-500/60 bg-amber-500/10 shadow-sm'
                        : 'border-border/60 bg-background-card/50 hover:border-border hover:bg-background-secondary/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        {code}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-amber-500" />}
                    </div>
                    <span className="text-sm font-semibold text-foreground mt-1.5">
                      {isAlevel ? 'International A Level' : 'International AS Level'}
                    </span>
                    <span className="text-[11px] text-foreground-muted mt-0.5">
                      {isAlevel ? '6 Units (Full Qualification)' : '3 Units (AS Stage)'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compulsory Units */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Compulsory Units ({award.compulsory.length})
              </label>
              <span className="text-[11px] text-foreground-muted">Automatically included</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {award.compulsory.map((unitCode) => (
                <div
                  key={unitCode}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-success/30 bg-success/5"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">{IAL_UNIT_LABELS[unitCode] ?? unitCode}</p>
                    <p className="text-[10px] font-mono text-foreground-muted">{unitCode}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Optional Units Section */}
          {needOptionalCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                    Optional / Applied Units
                  </label>
                  <p className="text-[11px] text-foreground-muted">
                    Select {needOptionalCount} unit{needOptionalCount !== 1 ? 's' : ''} to complete your qualification
                  </p>
                </div>
                <span
                  className={cn(
                    'text-xs font-mono font-bold px-2 py-0.5 rounded-full',
                    isValid
                      ? 'bg-success/15 text-success border border-success/30'
                      : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  )}
                >
                  {selectedOptional.length} / {needOptionalCount} selected
                </span>
              </div>

              {/* Route Presets */}
              {presets.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-foreground-muted flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Popular Routes &amp; Presets
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((preset, idx) => {
                      const isActive =
                        preset.units.length === selectedOptional.length &&
                        preset.units.every((u) => selectedOptional.includes(u));
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleApplyPreset(preset.units)}
                          className={cn(
                            'cursor-pointer text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5',
                            isActive
                              ? 'border-amber-500 bg-amber-500/20 text-foreground font-semibold shadow-xs'
                              : 'border-border/60 bg-background-card/50 text-foreground-muted hover:border-border hover:text-foreground'
                          )}
                        >
                          {preset.label}
                          {idx === 0 && selectedCode === 'YMA01' && (
                            <span className="text-[9px] font-bold px-1 rounded bg-amber-500/30 text-amber-700 dark:text-amber-300">
                              Popular
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unit Chips Pool */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {award.optional.map((unitCode) => {
                  const isSelected = selectedOptional.includes(unitCode);
                  return (
                    <button
                      key={unitCode}
                      type="button"
                      onClick={() => handleToggleOptional(unitCode)}
                      className={cn(
                        'cursor-pointer flex items-center justify-between p-2.5 rounded-xl border text-left transition-all',
                        isSelected
                          ? 'border-amber-500/70 bg-amber-500/10 text-foreground'
                          : 'border-border/60 bg-background-card/40 text-foreground-muted hover:border-border hover:text-foreground'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {IAL_UNIT_LABELS[unitCode] ?? unitCode}
                        </p>
                        <p className="text-[10px] font-mono text-foreground-muted">{unitCode}</p>
                      </div>
                      <div
                        className={cn(
                          'h-5 w-5 rounded-md flex items-center justify-center border transition-colors shrink-0',
                          isSelected
                            ? 'border-amber-500 bg-amber-500 text-white dark:text-black font-bold'
                            : 'border-border'
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-error/40 bg-error/10 text-error text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-border bg-background-card/50">
          <div className="text-xs text-foreground-muted hidden sm:block">
            Total:{' '}
            <span className="font-mono font-bold text-foreground">
              {allSelectedUnits.length}
            </span>{' '}
            units for {selectedCode}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-background-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid || loading}
              className={cn(
                'flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all',
                isValid && !loading
                  ? 'cursor-pointer bg-amber-500 hover:bg-amber-600 text-black shadow-md hover:shadow-lg'
                  : 'bg-foreground-muted/20 text-foreground-muted cursor-not-allowed'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm & Enroll'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
