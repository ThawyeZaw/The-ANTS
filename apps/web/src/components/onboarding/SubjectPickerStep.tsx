'use client';

import { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  GraduationCap,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupEdexcelIalSubjects, type GroupedSubject } from '@/lib/edexcel-ial';
import {
  getPluginForCurriculumCode,
  syllabusHasTiers,
  type SubjectTier,
} from '@/lib/grading';
import {
  IAL_CASH_INS,
  IAL_SUBJECT_GROUPS,
  IAL_UNIT_LABELS,
  YMA01_APPLIED_PAIRS,
  optionalUnitPresets,
  requiredOptionalCount,
  resolveIalCatalogUnits,
  type IalCashInAward,
} from '@/lib/grading/ial-cash-in';
import type {
  OnboardingCatalogCurriculum,
  OnboardingCatalogSubject,
  OnboardingSubjectPick,
} from './types';
import { targetGradesForCurriculum } from './types';
import { SelectionCheck } from './SelectionCheck';

interface SubjectPickerStepProps {
  catalogs: OnboardingCatalogCurriculum[];
  selected: Map<string, OnboardingSubjectPick>;
  onChangeSelected: (
    updater: (prev: Map<string, OnboardingSubjectPick>) => Map<string, OnboardingSubjectPick>
  ) => void;
}

function boardLabel(code: string): string {
  if (code === 'CAIE_IGCSE') return 'Cambridge IGCSE';
  if (code === 'CAIE_ALEVEL') return 'Cambridge A Level';
  if (code === 'EDEXCEL_IGCSE') return 'Pearson Edexcel IGCSE';
  if (code === 'EDEXCEL_IAL') return 'Pearson Edexcel IAL';
  return code;
}

function awardForGroupTitle(groupTitle: string): IalCashInAward | null {
  const meta = IAL_SUBJECT_GROUPS.find((g) => g.label === groupTitle);
  if (!meta) return null;
  return IAL_CASH_INS[meta.alevelCode] ?? null;
}

function unitCodeOf(unit: OnboardingCatalogSubject): string {
  return (unit.code || '').toUpperCase();
}

function findCatalogUnit(
  catalogSubjects: OnboardingCatalogSubject[],
  unitCode: string,
  fallbackUnits: OnboardingCatalogSubject[] = []
): OnboardingCatalogSubject | undefined {
  const code = unitCode.toUpperCase();
  return (
    catalogSubjects.find((s) => unitCodeOf(s) === code) ??
    fallbackUnits.find((s) => unitCodeOf(s) === code)
  );
}

function makePick(
  curriculum: OnboardingCatalogCurriculum,
  unit: OnboardingCatalogSubject,
  extras: Partial<OnboardingSubjectPick>
): OnboardingSubjectPick {
  return {
    curriculumId: curriculum.id,
    curriculumCode: curriculum.code,
    curriculumTitle: curriculum.title,
    subjectId: unit.id,
    subjectTitle: unit.title || unit.name,
    subjectCode: unit.code,
    tier: null,
    targetGrade: null,
    ...extras,
  };
}

function TargetGradeField({
  value,
  onChange,
  curriculumCode,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  curriculumCode: string;
  compact?: boolean;
}) {
  const grades = targetGradesForCurriculum(curriculumCode);
  const normalized = value.trim();
  const selectValue = grades.includes(normalized) ? normalized : '';

  return (
    <label
      className={cn(
        'flex shrink-0 flex-col gap-0.5',
        compact ? 'w-[5.5rem] sm:w-24' : 'w-28 sm:w-32'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
        Target
      </span>
      <select
        value={selectValue}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'cursor-pointer rounded-lg border-2 border-primary/40 bg-background px-2 py-1.5 font-mono text-xs font-bold text-foreground shadow-sm',
          'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
          !selectValue && 'text-foreground-muted'
        )}
        aria-label="Target grade"
      >
        <option value="">—</option>
        {grades.map((grade) => (
          <option key={grade} value={grade}>
            {grade}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SubjectPickerStep({
  catalogs,
  selected,
  onChangeSelected,
}: SubjectPickerStepProps) {
  const [activeCurriculumId, setActiveCurriculumId] = useState(
    catalogs[0]?.id ?? ''
  );
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const active = catalogs.find((c) => c.id === activeCurriculumId) ?? catalogs[0];

  const catalogSubjects = active?.subjects ?? [];

  const grouped = useMemo(() => {
    if (!active) return [];
    const subjects = active.subjects.map((s) => ({
      ...s,
      title: s.title || s.name,
    }));
    return groupEdexcelIalSubjects(subjects);
  }, [active]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grouped;
    return grouped
      .map((g) => {
        if (!g.isVirtual) {
          const title = g.title.toLowerCase();
          const code = (g.code || '').toLowerCase();
          if (title.includes(q) || code.includes(q)) return g;
          return null;
        }
        if (g.title.toLowerCase().includes(q)) return g;
        const units = g.units.filter((u) => {
          const t = (u.title || u.name || '').toLowerCase();
          const c = (u.code || '').toLowerCase();
          return t.includes(q) || c.includes(q);
        });
        if (units.length === 0) return null;
        return { ...g, units };
      })
      .filter(Boolean) as typeof grouped;
  }, [grouped, search]);

  const selectedCount = selected.size;

  const groupGrade = (groupTitle: string) => {
    for (const pick of selected.values()) {
      if (pick.groupTitle === groupTitle && pick.targetGrade) return pick.targetGrade;
    }
    return '';
  };

  const isGroupSelected = (group: GroupedSubject<OnboardingCatalogSubject>) =>
    group.units.some((u) => selected.has(u.id));

  const toggleLinear = (
    subject: OnboardingCatalogSubject,
    showTier: boolean
  ) => {
    if (!active) return;
    onChangeSelected((prev) => {
      const next = new Map(prev);
      if (next.has(subject.id)) {
        next.delete(subject.id);
      } else {
        next.set(
          subject.id,
          makePick(active, subject, {
            tier: showTier ? 'extended' : null,
            targetGrade: null,
          })
        );
      }
      return next;
    });
  };

  const updateLinear = (
    subjectId: string,
    patch: Partial<Pick<OnboardingSubjectPick, 'tier' | 'targetGrade'>>
  ) => {
    onChangeSelected((prev) => {
      const existing = prev.get(subjectId);
      if (!existing) return prev;
      const next = new Map(prev);
      next.set(subjectId, { ...existing, ...patch });
      return next;
    });
  };

  const setGroupTargetGrade = (groupTitle: string, grade: string | null) => {
    onChangeSelected((prev) => {
      const next = new Map(prev);
      for (const [id, pick] of next) {
        if (pick.groupTitle === groupTitle) {
          next.set(id, { ...pick, targetGrade: grade });
        }
      }
      return next;
    });
  };

  const enrollIalGroup = (
    group: GroupedSubject<OnboardingCatalogSubject>,
    optionalCodes: string[] = []
  ) => {
    if (!active) return;
    const award = awardForGroupTitle(group.title);
    const compulsory = new Set(
      (award?.compulsory ?? []).map((c) => c.toUpperCase())
    );
    const optionalSet = new Set(optionalCodes.map((c) => c.toUpperCase()));
    const grade = groupGrade(group.title) || null;

    onChangeSelected((prev) => {
      const next = new Map(prev);
      for (const [id, pick] of [...next]) {
        if (pick.groupTitle === group.title) next.delete(id);
      }

      const unitsToEnroll: Array<{
        unit: OnboardingCatalogSubject;
        isOptional: boolean;
      }> = [];

      if (award) {
        for (const code of award.compulsory) {
          const unit = findCatalogUnit(catalogSubjects, code, group.units);
          if (unit) unitsToEnroll.push({ unit, isOptional: false });
        }
        for (const code of optionalCodes) {
          const unit = findCatalogUnit(catalogSubjects, code, group.units);
          if (unit) unitsToEnroll.push({ unit, isOptional: true });
        }
      } else {
        for (const unit of group.units) {
          unitsToEnroll.push({ unit, isOptional: false });
        }
      }

      for (const { unit, isOptional } of unitsToEnroll) {
        const code = unitCodeOf(unit);
        if (award && !compulsory.has(code) && !optionalSet.has(code)) continue;

        next.set(
          unit.id,
          makePick(active, unit, {
            groupTitle: group.title,
            targetGrade: grade,
            isOptionalUnit: isOptional,
          })
        );
      }

      return next;
    });
  };

  const clearIalGroup = (groupTitle: string) => {
    onChangeSelected((prev) => {
      const next = new Map(prev);
      for (const [id, pick] of [...next]) {
        if (pick.groupTitle === groupTitle) next.delete(id);
      }
      return next;
    });
  };

  const toggleIalSubject = (group: GroupedSubject<OnboardingCatalogSubject>) => {
    if (isGroupSelected(group)) {
      clearIalGroup(group.title);
      return;
    }
    const award = awardForGroupTitle(group.title);
    // Default: compulsory only (user adds optional next). For maths A Level need a pair later.
    const presets = award ? optionalUnitPresets(award) : [];
    const defaultOptional =
      award && requiredOptionalCount(award) > 0 && presets[0]
        ? presets[0].units
        : [];
    enrollIalGroup(group, defaultOptional);
    setExpandedGroups((prev) => new Set(prev).add(group.id));
  };

  const setOptionalSelection = (
    group: GroupedSubject<OnboardingCatalogSubject>,
    optionalCodes: string[]
  ) => {
    enrollIalGroup(group, optionalCodes);
  };

  const toggleOptionalUnit = (
    group: GroupedSubject<OnboardingCatalogSubject>,
    unit: OnboardingCatalogSubject
  ) => {
    const award = awardForGroupTitle(group.title);
    const code = unitCodeOf(unit);
    const currentOptional = [...selected.values()]
      .filter((p) => p.groupTitle === group.title && p.isOptionalUnit)
      .map((p) => p.subjectCode.toUpperCase());

    const has = currentOptional.includes(code);
    let nextOptional: string[];
    if (has) {
      nextOptional = currentOptional.filter((c) => c !== code);
    } else if (award?.code === 'YMA01') {
      // Applied pairs only — toggle handled via presets
      return;
    } else {
      const need = award ? requiredOptionalCount(award) : Infinity;
      nextOptional = [...currentOptional, code];
      if (need < Infinity && nextOptional.length > need) {
        nextOptional = nextOptional.slice(-need);
      }
    }
    setOptionalSelection(group, nextOptional);
  };

  if (catalogs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background-card p-8 text-center">
        <p className="text-sm text-foreground-muted">No exam boards available yet.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-5">
      <div className="text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpen className="h-7 w-7" strokeWidth={2} aria-hidden />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Choose your subjects</h1>
        <p className="text-sm text-foreground-muted">
          Cambridge and Edexcel only. IAL subjects auto-include required units — you only
          pick optional ones. Further Mathematics includes M1, S1 and D1 from the maths
          suite (Pure P1–P4 excluded). Target grades sit beside each subject.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {catalogs.map((curr) => {
          const count = [...selected.values()].filter(
            (s) => s.curriculumId === curr.id
          ).length;
          const isActive = curr.id === active?.id;
          return (
            <button
              key={curr.id}
              type="button"
              onClick={() => {
                setActiveCurriculumId(curr.id);
                setSearch('');
              }}
              className={cn(
                'shrink-0 rounded-xl border px-3.5 py-2 text-left transition-all',
                isActive
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-background-card hover:border-primary/40'
              )}
            >
              <p
                className={cn(
                  'text-xs font-semibold',
                  isActive ? 'text-primary' : 'text-foreground'
                )}
              >
                {boardLabel(curr.code)}
              </p>
              {count > 0 && (
                <p className="mt-0.5 text-[10px] font-medium text-foreground-muted">
                  {count} selected
                </p>
              )}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="overflow-hidden rounded-2xl border border-border bg-background-card">
          <div className="flex items-center gap-3 border-b border-border bg-background-secondary/40 px-4 py-3">
            <GraduationCap className="h-4 w-4 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{active.title}</p>
              <p className="font-mono text-xs text-foreground-muted">{active.code}</p>
            </div>
            {selectedCount > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-white">
                {selectedCount} total
              </span>
            )}
          </div>

          <div className="space-y-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                placeholder={`Search ${boardLabel(active.code)} subjects…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background-secondary py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="max-h-[min(28rem,55vh)] space-y-2 overflow-y-auto pr-1">
              {filtered.map((group) => {
                // ── Linear subject (IGCSE / A Level / Edexcel IGCSE) ──
                if (!group.isVirtual) {
                  const subject = group.units[0];
                  if (!subject) return null;
                  const pick = selected.get(subject.id);
                  const isSelected = Boolean(pick);
                  const plugin = getPluginForCurriculumCode(active.code);
                  const showTier =
                    plugin.hasTiers &&
                    (syllabusHasTiers(subject.code) || subject.code === '4MA1');

                  return (
                    <div
                      key={subject.id}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 transition-all',
                        isSelected
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-transparent hover:bg-background-secondary'
                      )}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => toggleLinear(subject, showTier)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left text-sm"
                        >
                          <SelectionCheck checked={isSelected} />
                          <span className="min-w-0">
                            <span
                              className={cn(
                                'block truncate font-medium',
                                isSelected ? 'text-primary' : 'text-foreground'
                              )}
                            >
                              {subject.title || subject.name}
                            </span>
                            {subject.code && (
                              <span className="font-mono text-[10px] text-foreground-muted">
                                {subject.code}
                              </span>
                            )}
                          </span>
                        </button>

                        {isSelected && showTier && (
                          <div className="flex shrink-0 gap-1">
                            {(['extended', 'core'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() =>
                                  updateLinear(subject.id, { tier: t as SubjectTier })
                                }
                                className={cn(
                                  'rounded-md border px-2 py-1 text-[10px] font-bold capitalize',
                                  pick?.tier === t
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-border text-foreground-muted'
                                )}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}

                        {isSelected && (
                          <TargetGradeField
                            curriculumCode={active.code}
                            value={pick?.targetGrade ?? ''}
                            onChange={(v) =>
                              updateLinear(subject.id, {
                                targetGrade: v || null,
                              })
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                }

                // ── Virtual IAL subject group ──
                const award = awardForGroupTitle(group.title);
                const compulsory = new Set(
                  (award?.compulsory ?? []).map((c) => c.toUpperCase())
                );
                const optionalCodes = new Set(
                  (award?.optional ?? []).map((c) => c.toUpperCase())
                );
                const selectedInGroup = isGroupSelected(group);
                const isExpanded =
                  expandedGroups.has(group.id) || search.length > 0 || selectedInGroup;
                const enrolledCount = group.units.filter((u) => selected.has(u.id)).length;
                const grade = groupGrade(group.title);
                const presets = award ? optionalUnitPresets(award) : [];
                const needOptional = award ? requiredOptionalCount(award) : 0;
                const currentOptional = [...selected.values()]
                  .filter((p) => p.groupTitle === group.title && p.isOptionalUnit)
                  .map((p) => p.subjectCode.toUpperCase());

                const requiredUnits = group.units.filter((u) => {
                  const code = unitCodeOf(u);
                  if (award) return compulsory.has(code);
                  return !group.hasOptionalUnits;
                });
                const optionalUnits = award
                  ? resolveIalCatalogUnits(catalogSubjects, award.optional)
                  : group.units.filter((u) => optionalCodes.has(unitCodeOf(u)));

                return (
                  <div
                    key={group.id}
                    className={cn(
                      'overflow-hidden rounded-xl border transition-all',
                      selectedInGroup
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    <div className="flex items-center gap-2.5 bg-background-secondary/40 px-3 py-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => toggleIalSubject(group)}
                        className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        aria-label={`Select ${group.title}`}
                        aria-pressed={selectedInGroup}
                      >
                        <SelectionCheck checked={selectedInGroup} size="lg" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGroups((prev) => {
                            const next = new Set(prev);
                            if (next.has(group.id)) next.delete(group.id);
                            else next.add(group.id);
                            return next;
                          })
                        }
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-foreground-muted" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {group.title}
                          </p>
                          <p className="font-mono text-[10px] text-foreground-muted">
                            {group.code}
                            {award ? ` · ${award.name}` : ''}
                          </p>
                        </div>
                      </button>

                      {enrolledCount > 0 && (
                        <span className="hidden rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary sm:inline">
                          {enrolledCount} unit{enrolledCount === 1 ? '' : 's'}
                        </span>
                      )}

                      {selectedInGroup && (
                        <TargetGradeField
                          curriculumCode={active.code}
                          value={grade}
                          onChange={(v) =>
                            setGroupTargetGrade(group.title, v || null)
                          }
                        />
                      )}
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 border-t border-border p-3">
                        {(requiredUnits.length > 0 || !group.hasOptionalUnits) && (
                          <div>
                            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                              <Lock className="h-3 w-3" />
                              Required units
                              {selectedInGroup ? ' (auto-enrolled)' : ''}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(requiredUnits.length > 0
                                ? requiredUnits
                                : group.units
                              ).map((unit) => (
                                <span
                                  key={unit.id}
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10px]',
                                    selectedInGroup
                                      ? 'border-primary/30 bg-primary/10 text-primary'
                                      : 'border-border text-foreground-muted'
                                  )}
                                >
                                  {selectedInGroup && <Check className="h-2.5 w-2.5" />}
                                  {unit.code || unit.title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedInGroup && needOptional > 0 && award?.code === 'YMA01' && (
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                              Choose applied pair
                            </p>
                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                              {YMA01_APPLIED_PAIRS.map(([a, b]) => {
                                const activePair =
                                  currentOptional.includes(a) &&
                                  currentOptional.includes(b) &&
                                  currentOptional.length === 2;
                                return (
                                  <button
                                    key={`${a}-${b}`}
                                    type="button"
                                    onClick={() => setOptionalSelection(group, [a, b])}
                                    className={cn(
                                      'rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all',
                                      activePair
                                        ? 'border-primary bg-primary/15 text-primary'
                                        : 'border-border text-foreground hover:border-primary/40'
                                    )}
                                  >
                                    {(IAL_UNIT_LABELS[a] ?? a)} + {(IAL_UNIT_LABELS[b] ?? b)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {selectedInGroup &&
                          needOptional > 0 &&
                          award?.code !== 'YMA01' &&
                          optionalUnits.length > 0 && (
                            <div>
                              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                                Optional units
                                {needOptional < Infinity
                                  ? ` (pick ${needOptional})`
                                  : ''}
                                {group.title === 'Further Mathematics'
                                  ? ' · M1, S1, D1 included'
                                  : ''}
                              </p>
                              {presets.length > 1 && presets[0].units.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1.5">
                                  {presets.slice(0, 4).map((preset) => {
                                    const activePreset =
                                      preset.units.length === currentOptional.length &&
                                      preset.units.every((u) =>
                                        currentOptional.includes(u.toUpperCase())
                                      );
                                    return (
                                      <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() =>
                                          setOptionalSelection(group, preset.units)
                                        }
                                        className={cn(
                                          'rounded-md border px-2 py-1 text-[10px] font-semibold',
                                          activePreset
                                            ? 'border-primary bg-primary text-white'
                                            : 'border-border text-foreground-muted hover:border-primary/40'
                                        )}
                                      >
                                        {preset.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                              <div className="space-y-0.5">
                                {optionalUnits.map((unit) => {
                                  const code = unitCodeOf(unit);
                                  const isOn = currentOptional.includes(code);
                                  return (
                                    <button
                                      key={unit.id}
                                      type="button"
                                      onClick={() => toggleOptionalUnit(group, unit)}
                                      className={cn(
                                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all',
                                        isOn
                                          ? 'bg-primary/10 font-medium text-primary'
                                          : 'text-foreground hover:bg-background-secondary'
                                      )}
                                    >
                                      <SelectionCheck checked={isOn} />
                                      <span className="min-w-0 flex-1">
                                        <span className="block">
                                          {unit.title || unit.name}
                                        </span>
                                        <span className="font-mono text-[10px] text-foreground-muted">
                                          {unit.code}
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                        {!selectedInGroup && (
                          <p className="text-xs text-foreground-muted">
                            Select this subject to auto-enroll required units
                            {needOptional > 0 ? ' and choose optional ones' : ''}.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-foreground-muted">
                  No subjects match your search
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
