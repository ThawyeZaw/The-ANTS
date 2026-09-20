'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Layers, Lock, Plus } from 'lucide-react';
import {
  enrollCashInAward,
  unenrollCashInAward,
  type UserCashInEnrollmentRow,
} from '@/actions/curriculum';
import {
  IAL_CASH_INS,
  IAL_SUBJECT_GROUPS,
  awardLevelFromCashInCode,
  formatIalUnitLabel,
  optionalUnitPresets,
  requiredOptionalCount,
  type IalCashInAward,
  type IalCashInCode,
} from '@/lib/grading/ial-cash-in';
import { cn } from '@/lib/utils';

interface IalCashInEnrollPanelProps {
  userId: string;
  cashInEnrollments: UserCashInEnrollmentRow[];
  onChanged: () => void;
}

function UnitChip({
  code,
  locked = false,
  selected = false,
  onClick,
}: {
  code: string;
  locked?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border',
        locked && 'bg-background-secondary border-border text-foreground-muted',
        !locked && selected && 'bg-primary/15 border-primary/40 text-primary',
        !locked && !selected && onClick && 'bg-background border-border text-foreground-secondary hover:border-primary/30',
        !locked && !selected && !onClick && 'bg-background border-border text-foreground-secondary'
      )}
    >
      {locked && <Lock className="h-3 w-3 shrink-0 opacity-60" />}
      {formatIalUnitLabel(code)}
    </Tag>
  );
}

function AwardLevelBlock({
  award,
  enrolled,
  isExpanded,
  isProcessing,
  optional,
  needOptional,
  presets,
  papersPending,
  onToggleExpand,
  onApplyPreset,
  onToggleOptional,
  onEnroll,
  onUnenroll,
}: {
  award: IalCashInAward;
  enrolled: UserCashInEnrollmentRow | undefined;
  isExpanded: boolean;
  isProcessing: boolean;
  optional: string[];
  needOptional: number;
  presets: { label: string; units: string[] }[];
  papersPending?: boolean;
  onToggleExpand: () => void;
  onApplyPreset: (units: string[]) => void;
  onToggleOptional: (unit: string) => void;
  onEnroll: () => void;
  onUnenroll: () => void;
}) {
  const level = awardLevelFromCashInCode(award.code);
  const isEnrolled = Boolean(enrolled);
  const enrolledOptional =
    enrolled?.selected_units.filter((u) => award.optional.includes(u)) ?? optional;

  return (
    <div
      className={cn(
        'rounded-xl border p-3 space-y-3',
        isEnrolled ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-border/70 bg-background/60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-foreground-muted">
              {level}
            </span>
            <span className="text-xs font-mono font-bold text-primary">{award.code}</span>
            {papersPending && (
              <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">
                Papers coming soon
              </span>
            )}
          </div>
          <p className="text-xs text-foreground-muted">{award.unitCount} units total</p>
        </div>

        {isEnrolled ? (
          <button
            type="button"
            disabled={isProcessing}
            onClick={onUnenroll}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-error/10 hover:text-error hover:border-error/30 shrink-0"
          >
            <Check className="w-3 h-3" />
            {isProcessing ? 'Removing…' : 'Enrolled'}
          </button>
        ) : (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => {
              if (needOptional > 0 && !isExpanded) {
                onToggleExpand();
                return;
              }
              onEnroll();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary text-white hover:bg-primary-hover shrink-0"
          >
            <Plus className="w-3 h-3" />
            {isProcessing ? 'Adding…' : needOptional > 0 && !isExpanded ? 'Choose units' : 'Enroll'}
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-foreground-muted">
          Required units (auto-enrolled)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {award.compulsory.map((code) => (
            <UnitChip key={code} code={code} locked />
          ))}
        </div>
      </div>

      {needOptional > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-foreground-muted">
              Optional units (you choose {needOptional})
            </p>
            {!isEnrolled && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="text-[10px] font-semibold text-foreground-muted hover:text-foreground inline-flex items-center gap-0.5"
              >
                {isExpanded ? (
                  <>
                    Hide
                    <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Edit
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>

          {isEnrolled ? (
            <div className="flex flex-wrap gap-1.5">
              {enrolledOptional.map((code) => (
                <UnitChip key={code} code={code} selected />
              ))}
            </div>
          ) : isExpanded ? (
            <div className="space-y-2">
              {presets.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset) => {
                    const active =
                      preset.units.length === optional.length &&
                      preset.units.every((u) => optional.includes(u));
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onApplyPreset(preset.units)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors',
                          active
                            ? 'bg-primary/15 border-primary/40 text-primary'
                            : 'bg-background border-border text-foreground-secondary hover:border-primary/30'
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {presets.length === 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {award.optional.map((code) => (
                    <UnitChip
                      key={code}
                      code={code}
                      selected={optional.includes(code)}
                      onClick={() => onToggleOptional(code)}
                    />
                  ))}
                </div>
              )}
              <p className="text-[10px] text-foreground-muted">
                {optional.length}/{needOptional} optional units selected
              </p>
              <button
                type="button"
                disabled={isProcessing || optional.length !== needOptional}
                onClick={onEnroll}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
              >
                Confirm {award.code}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {(optional.length > 0 ? optional : award.optional.slice(0, needOptional)).map((code) => (
                <UnitChip key={code} code={code} selected={optional.includes(code)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function IalCashInEnrollPanel({
  userId,
  cashInEnrollments,
  onChanged,
}: IalCashInEnrollPanelProps) {
  const [expandedCode, setExpandedCode] = useState<IalCashInCode | null>(null);
  const [selectedOptional, setSelectedOptional] = useState<Record<string, string[]>>({});
  const [processingCode, setProcessingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enrolledMap = useMemo(
    () => new Map(cashInEnrollments.map((row) => [row.cash_in_code, row])),
    [cashInEnrollments]
  );

  const getOptionalSelection = (code: IalCashInCode, award: IalCashInAward) => {
    if (selectedOptional[code]) return selectedOptional[code];
    const enrolled = enrolledMap.get(code);
    if (enrolled) {
      return enrolled.selected_units.filter((u) => award.optional.includes(u));
    }
    const presets = optionalUnitPresets(award);
    if (presets[0]) return presets[0].units;
    return [];
  };

  const toggleOptionalUnit = (code: IalCashInCode, award: IalCashInAward, unit: string) => {
    const need = requiredOptionalCount(award);
    setSelectedOptional((prev) => {
      const current = prev[code] ?? getOptionalSelection(code, award);
      const has = current.includes(unit);
      let next = has ? current.filter((u) => u !== unit) : [...current, unit];
      if (next.length > need) next = [...next.slice(1), unit];
      return { ...prev, [code]: next };
    });
  };

  const handleEnroll = async (award: IalCashInAward) => {
    setError(null);
    setProcessingCode(award.code);
    try {
      const optional = getOptionalSelection(award.code, award);
      const res = await enrollCashInAward(
        userId,
        award.code,
        awardLevelFromCashInCode(award.code),
        optional
      );
      if (res.success) {
        onChanged();
        setExpandedCode(null);
      } else {
        setError(res.error ?? 'Enrollment failed');
      }
    } finally {
      setProcessingCode(null);
    }
  };

  const handleUnenroll = async (code: IalCashInCode) => {
    setError(null);
    setProcessingCode(code);
    try {
      const res = await unenrollCashInAward(userId, code);
      if (res.success) onChanged();
      else setError(res.error ?? 'Could not remove enrollment');
    } finally {
      setProcessingCode(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground-secondary">
        <div className="flex items-center gap-2 font-bold text-primary mb-1">
          <Layers className="h-3.5 w-3.5" />
          Enroll by subject &amp; award level
        </div>
        Pick AS or A Level for each subject. Required units (e.g. Pure 1–4 for YMA01) enroll
        automatically — you only choose optional applied units where needed.
      </div>

      {error && <p className="text-xs font-medium text-error px-1">{error}</p>}

      {IAL_SUBJECT_GROUPS.map((group) => {
        const asAward = IAL_CASH_INS[group.asCode];
        const alAward = IAL_CASH_INS[group.alevelCode];

        return (
          <div
            key={group.key}
            className="rounded-2xl border border-border bg-background-secondary/40 p-4 space-y-3"
          >
            <h4 className="text-sm font-bold text-foreground">{group.label}</h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <AwardLevelBlock
                award={asAward}
                enrolled={enrolledMap.get(group.asCode)}
                isExpanded={expandedCode === group.asCode}
                isProcessing={processingCode === group.asCode}
                optional={getOptionalSelection(group.asCode, asAward)}
                needOptional={requiredOptionalCount(asAward)}
                presets={optionalUnitPresets(asAward)}
                papersPending={group.papersPending}
                onToggleExpand={() =>
                  setExpandedCode(expandedCode === group.asCode ? null : group.asCode)
                }
                onApplyPreset={(units) =>
                  setSelectedOptional((prev) => ({ ...prev, [group.asCode]: units }))
                }
                onToggleOptional={(unit) => toggleOptionalUnit(group.asCode, asAward, unit)}
                onEnroll={() => void handleEnroll(asAward)}
                onUnenroll={() => void handleUnenroll(group.asCode)}
              />

              <AwardLevelBlock
                award={alAward}
                enrolled={enrolledMap.get(group.alevelCode)}
                isExpanded={expandedCode === group.alevelCode}
                isProcessing={processingCode === group.alevelCode}
                optional={getOptionalSelection(group.alevelCode, alAward)}
                needOptional={requiredOptionalCount(alAward)}
                presets={optionalUnitPresets(alAward)}
                papersPending={group.papersPending}
                onToggleExpand={() =>
                  setExpandedCode(expandedCode === group.alevelCode ? null : group.alevelCode)
                }
                onApplyPreset={(units) =>
                  setSelectedOptional((prev) => ({ ...prev, [group.alevelCode]: units }))
                }
                onToggleOptional={(unit) => toggleOptionalUnit(group.alevelCode, alAward, unit)}
                onEnroll={() => void handleEnroll(alAward)}
                onUnenroll={() => void handleUnenroll(group.alevelCode)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
