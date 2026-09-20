'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Syllabus Grade Calculator (Redesigned)
// Context-aware: Edexcel IAL (UMS) vs CAIE & Edexcel IGCSE (Raw Grade Boundaries)
// Reads from seeded past papers and official grade boundaries.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Calculator,
  BookOpen,
  Layers,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Clock,
  ChevronRight,
  Check,
  Info,
  BarChart3,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  listApprovedCalculatorPresetsForSubjects,
  listCurriculums,
  listSubjects,
} from '@/actions/exam-data';
import { getSubjectCalculatorContext, listSubjectCompositeBoundaries } from '@/actions/curriculum';
import { useAuth } from '@/hooks/useAuth';
import { syllabusHasAwardLevel, syllabusNeedsMathsRoute } from '@/lib/exam-papers/myanmar-papers';
import { cn } from '@/lib/utils';
import {
  getGradeColor,
  getPluginForCurriculumCode,
  getPluginForPaper,
  syllabusHasTiers,
  uniqueVariants,
  caiePaperBase,
  type SubjectTier,
  type GradeBoundary,
  type PaperComponent,
  gradeFromUms,
  umsCapFromBoundaries,
} from '@/lib/grading';
import { groupEdexcelIalSubjects } from '@/lib/edexcel-ial';
import { useEdexcelSuiteSelectors } from './useEdexcelSuiteSelectors';
import { EdexcelSuiteSelectors } from './EdexcelSuiteSelectors';
import { IalUmsCalculator } from './IalUmsCalculator';
import {
  IAL_CASH_INS,
  cashInsForUnit,
  IAL_SUBJECT_GROUPS,
  IAL_MATHS_CASH_INS,
  IAL_FM_CASH_INS,
  IAL_GROUP_UNITS,
  IAL_MATHS_SUITE_UNIT_ORDER,
  IAL_MATHS_ONLY_UNITS,
  IAL_PURE_MATHS_UNITS,
  isIalOctoberSeries,
  mathsSuiteUnitAvailableInSeries,
  type IalCashInCode,
  type MathsSuiteMode,
} from '@/lib/grading/ial-cash-in';
import { SearchableSelect } from './SearchableSelect';

interface PresetBoundary {
  grade: string;
  min_mark: number;
  max_mark?: number;
  ums_min?: number;
  ums_max?: number;
}

interface PaperDef {
  name: string;
  max_mark: number;
  weight: number;
  unit_group?: string;
  paper_number?: string;
  variant?: string | null;
  paper_boundaries?: GradeBoundary[];
}

interface CalcPreset {
  id: string;
  title: string;
  subject_code: string;
  curriculum_id: string;
  subject_id: string;
  series: string;
  year?: number;
  exam_board?: string;
  qualification?: string;
  papers: PaperDef[];
  grade_boundaries: PresetBoundary[];
  is_modular?: boolean;
  paper_number?: string;
  variant?: string | null;
  syllabus_code?: string;
}

// UMS interpolation lives in lib/grading — GradeCalculator uses qualification plugins.

export default function GradeCalculator() {
  const { user } = useAuth();
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [presets, setPresets] = useState<CalcPreset[]>([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCurriculum, setSelectedCurriculum] = useState(searchParams.get('curriculum') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedSeries, setSelectedSeries] = useState(searchParams.get('series') || '');
  const [selectedTier, setSelectedTier] = useState<SubjectTier | ''>(
    (searchParams.get('tier') as SubjectTier) || ''
  );
  const [selectedVariant, setSelectedVariant] = useState(searchParams.get('variant') || '');
  const [paperVariants, setPaperVariants] = useState<Record<string, string>>({});
  const [selectedExclusiveOptions, setSelectedExclusiveOptions] = useState<Record<string, string>>({});
  const [selectedCashInLocal, setSelectedCashInLocal] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [rawMarks, setRawMarks] = useState<Record<string, number | string>>({});
  const [compositeBoundaries, setCompositeBoundaries] = useState<GradeBoundary[]>([]);
  const [enrollmentAward, setEnrollmentAward] = useState<'AS' | 'A Level' | ''>('');
  const [mathsRoute, setMathsRoute] = useState<'42' | '52'>('42');
  const [boundariesUnavailable, setBoundariesUnavailable] = useState(false);
  const [ialInputMode, setIalInputMode] = useState<'raw' | 'ums'>('raw');

  // Client-side cache to avoid redundant D1 row queries when toggling subjects
  const presetCacheRef = useRef<Map<string, CalcPreset[]>>(new Map());
  const compositeCacheRef = useRef<Map<string, GradeBoundary[]>>(new Map());

  const selectedCurriculumRow = useMemo(
    () => curriculums.find((c) => c.id === selectedCurriculum),
    [curriculums, selectedCurriculum]
  );

  const isEdexcelIal =
    selectedCurriculumRow?.code === 'EDEXCEL_IAL' || selectedCurriculum === 'curr-edexcel-ial';

  const groupedIalSubjects = useMemo(() => {
    if (!isEdexcelIal) return [];
    const rawIal = subjects.filter((s) => s.curriculum_id === selectedCurriculum);
    return groupEdexcelIalSubjects(rawIal);
  }, [isEdexcelIal, subjects, selectedCurriculum]);

  const activeIalGroup = useMemo(() => {
    if (!isEdexcelIal || groupedIalSubjects.length === 0) return null;
    return (
      groupedIalSubjects.find(
        (g) => g.id === selectedSubject || g.units.some((u) => u.id === selectedSubject)
      ) ?? null
    );
  }, [isEdexcelIal, groupedIalSubjects, selectedSubject]);

  const selectedSubjectRow = useMemo(
    () => subjects.find((s) => s.id === selectedSubject) ?? activeIalGroup?.units[0],
    [subjects, selectedSubject, activeIalGroup]
  );

  const presetSubjectIds = useMemo(() => {
    if (activeIalGroup?.units.length) return activeIalGroup.units.map((u) => u.id);
    return selectedSubject ? [selectedSubject] : [];
  }, [activeIalGroup, selectedSubject]);

  const isMathsFmSuite =
    selectedSubject === 'subj-edx-ial-math-fm-group' ||
    selectedSubject === 'subj-edx-ial-pure-group' ||
    activeIalGroup?.title === 'Mathematics' ||
    activeIalGroup?.title === 'Further Mathematics';

  const ialCalcMode: MathsSuiteMode | null =
    selectedSubject === 'subj-edx-ial-pure-group'
      ? 'pure'
      : selectedSubject === 'subj-edx-ial-math-fm-group'
        ? 'all'
        : activeIalGroup?.title === 'Mathematics'
          ? 'maths'
          : activeIalGroup?.title === 'Further Mathematics'
            ? 'further'
            : null;

  const isSuite =
    selectedSubjectRow?.subject_type === 'modular_maths_suite' ||
    isMathsFmSuite ||
    Boolean(activeIalGroup?.hasOptionalUnits);

  const ialUnitCodes = useMemo(() => {
    if (ialCalcMode === 'all') return [...IAL_MATHS_SUITE_UNIT_ORDER];
    if (ialCalcMode === 'maths') return [...IAL_MATHS_ONLY_UNITS];
    if (ialCalcMode === 'pure') return [...IAL_PURE_MATHS_UNITS];
    if (ialCalcMode === 'further') return [...IAL_GROUP_UNITS['Further Mathematics']];
    const title = activeIalGroup?.title;
    if (title && IAL_GROUP_UNITS[title]) return [...IAL_GROUP_UNITS[title]];
    return [];
  }, [ialCalcMode, activeIalGroup]);

  const mathsSuiteData = useMemo(
    () => subjects.find((s) => s.id === 'subj-edx-ial-maths-suite')?.qualification_data,
    [subjects]
  );

  const suiteSpecForGroup = useMemo(() => {
    const raw =
      selectedSubjectRow?.qualification_data ||
      activeIalGroup?.qualification_data ||
      mathsSuiteData;
    if (!raw || !isSuite) return null;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : { ...raw };
      if (activeIalGroup?.title === 'Mathematics') {
        parsed.qualifications = (parsed.qualifications || []).filter((q: { cashInCode: string }) =>
          IAL_MATHS_CASH_INS.has(q.cashInCode as IalCashInCode)
        );
      } else if (activeIalGroup?.title === 'Further Mathematics') {
        parsed.qualifications = (parsed.qualifications || []).filter((q: { cashInCode: string }) =>
          IAL_FM_CASH_INS.has(q.cashInCode as IalCashInCode)
        );
      }
      return parsed;
    } catch {
      return raw;
    }
  }, [isSuite, selectedSubjectRow, activeIalGroup, mathsSuiteData]);

  const suiteSelectors = useEdexcelSuiteSelectors(suiteSpecForGroup, selectedCashInLocal);

  const selectedCashIn = isSuite ? suiteSelectors.selectedCashIn : selectedCashInLocal;
  const setSelectedCashIn = isSuite ? suiteSelectors.setSelectedCashIn : setSelectedCashInLocal;

  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      try {
        const [cData, sData] = await Promise.all([listCurriculums(), listSubjects()]);
        setCurriculums(cData);
        setSubjects(sData);
      } catch (err) {
        console.error('[GradeCalculator] catalog load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (presetSubjectIds.length === 0) {
      setPresets([]);
      return;
    }

    const cacheKey = presetSubjectIds.slice().sort().join(',');
    if (presetCacheRef.current.has(cacheKey)) {
      setPresets(presetCacheRef.current.get(cacheKey)!);
      return;
    }

    let cancelled = false;
    listApprovedCalculatorPresetsForSubjects(presetSubjectIds)
      .then((pData) => {
        if (!cancelled) {
          const list = pData as CalcPreset[];
          presetCacheRef.current.set(cacheKey, list);
          setPresets(list);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[GradeCalculator] presets load failed:', err);
          setPresets([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [presetSubjectIds]);

  useEffect(() => {
    if (!selectedSubject || !user?.id) return;
    let cancelled = false;
    getSubjectCalculatorContext(user.id, selectedSubject).then((ctx) => {
      if (cancelled || !ctx) return;
      if (ctx.tier && !selectedTier) setSelectedTier(ctx.tier);
      if (ctx.awardLevel) setEnrollmentAward(ctx.awardLevel);
      if (ctx.paperPreferences?.mathsRoute) setMathsRoute(ctx.paperPreferences.mathsRoute);
      if (ctx.paperPreferences?.variantPreference) setSelectedVariant(ctx.paperPreferences.variantPreference);
      if (!selectedSeries && ctx.targetSeries) setSelectedSeries(ctx.targetSeries);
      setBoundariesUnavailable(!ctx.hasOfficialBoundaries);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSubject, user?.id]);

  const cashInUnitCodes = useMemo(() => {
    if (!selectedCashIn) return null;
    const award = IAL_CASH_INS[selectedCashIn as IalCashInCode];
    if (award) return new Set([...award.compulsory, ...award.optional]);
    const q = suiteSelectors.activeQualification;
    if (!q) return null;
    return new Set([...(q.mandatoryUnits || []), ...(q.electiveRules?.allowedUnitPool || [])]);
  }, [selectedCashIn, suiteSelectors.activeQualification]);

  const cashInPresets = useMemo(() => {
    if (!cashInUnitCodes) return [];
    return presets.filter(
      (p) =>
        cashInUnitCodes.has(p.syllabus_code || '') ||
        cashInUnitCodes.has(p.subject_code || '') ||
        cashInUnitCodes.has(p.paper_number || '')
    );
  }, [presets, cashInUnitCodes]);

  const plugin = useMemo(
    () => getPluginForCurriculumCode(selectedCurriculumRow?.code),
    [selectedCurriculumRow]
  );
  const showTier = plugin.hasTiers && syllabusHasTiers(selectedSubjectRow?.code);

  useEffect(() => {
    if (selectedSubject && !selectedCurriculum) {
      const subj = subjects.find((s) => s.id === selectedSubject);
      if (subj?.curriculum_id) setSelectedCurriculum(subj.curriculum_id);
    }
  }, [selectedSubject, selectedCurriculum, subjects]);

  const filteredSubjects = useMemo(() => {
    if (!selectedCurriculum) return subjects;
    return subjects.filter((s) => s.curriculum_id === selectedCurriculum);
  }, [selectedCurriculum, subjects]);

  const curriculumOptions = useMemo(
    () =>
      curriculums.map((c) => ({
        value: c.id as string,
        label: (c.title || c.name) as string,
        hint: (c.code || c.exam_board || '') as string,
      })),
    [curriculums]
  );

  const subjectOptions = useMemo(() => {
    if (isEdexcelIal) {
      const rest = groupedIalSubjects.filter(
        (g) => g.title !== 'Mathematics' && g.title !== 'Further Mathematics'
      );
      return [
        { value: 'subj-edx-ial-math-group', label: 'Mathematics', hint: 'XMA01 / YMA01', group: 'Mathematics suite' },
        { value: 'subj-edx-ial-pure-group', label: 'Pure Mathematics', hint: 'XPM01 / YPM01', group: 'Mathematics suite' },
        {
          value: 'subj-edx-ial-math-fm-group',
          label: 'Mathematics & Further Mathematics',
          hint: '12 different units',
          group: 'Mathematics suite',
        },
        { value: 'subj-edx-ial-fmath-group', label: 'Further Mathematics', hint: 'XFM01 / YFM01', group: 'Mathematics suite' },
        ...rest.map((g) => ({
          value: g.id,
          label: g.title,
          hint: g.code,
          group: 'Other IAL',
        })),
      ];
    }
    return filteredSubjects.map((s) => ({
      value: s.id as string,
      label: (s.title || s.name) as string,
      hint: (s.code || '') as string,
    }));
  }, [isEdexcelIal, groupedIalSubjects, filteredSubjects]);

  const matchingPresets = useMemo(() => {
    let list = selectedCashIn ? cashInPresets : presets;
    if (selectedCurriculum && !selectedCashIn) {
      list = list.filter((p) => p.curriculum_id === selectedCurriculum);
    }
    if (!selectedCashIn) {
      if (selectedUnitId) {
        list = list.filter((p) => p.subject_id === selectedUnitId);
      } else if (selectedSubject && !activeIalGroup) {
        list = list.filter((p) => p.subject_id === selectedSubject);
      }
    }
    if (selectedSeries) list = list.filter((p) => p.series === selectedSeries);
    return list;
  }, [presets, cashInPresets, selectedCashIn, selectedCurriculum, selectedSubject, selectedSeries, selectedUnitId, activeIalGroup]);

  const availableVariants = useMemo(
    () => uniqueVariants(matchingPresets.map((p) => ({ variant: p.variant ?? p.papers[0]?.variant }))),
    [matchingPresets]
  );

  useEffect(() => {
    if (!selectedVariant && plugin.defaultVariant && availableVariants.includes(plugin.defaultVariant)) {
      setSelectedVariant(plugin.defaultVariant);
    } else if (!selectedVariant && availableVariants.length === 1) {
      setSelectedVariant(availableVariants[0]);
    }
  }, [availableVariants, plugin.defaultVariant, selectedVariant]);

  useEffect(() => {
    if (showTier && !selectedTier) setSelectedTier('extended');
  }, [showTier, selectedTier]);

  const activePreset = useMemo<CalcPreset | null>(() => {
    if (matchingPresets.length === 0) return null;
    const papers: PaperDef[] = [];
    let isModular = false;
    let title = '';
    let subjectCode = '';
    let qualification = '';
    let examBoard = '';
    let year: number | undefined;

    for (const p of matchingPresets) {
      if (p.is_modular || p.qualification === 'IAL') isModular = true;
      title = p.title || title;
      subjectCode = p.subject_code || p.syllabus_code || subjectCode;
      qualification = p.qualification || qualification;
      examBoard = p.exam_board || examBoard;
      year = p.year ?? year;
      for (const paper of p.papers) {
        const next = {
          ...paper,
          paper_number: paper.paper_number || p.paper_number,
          variant: paper.variant ?? p.variant,
        };
        const key = `${next.paper_number ?? next.name}|${next.variant ?? ''}`;
        const existingIdx = papers.findIndex(
          (row) => `${row.paper_number ?? row.name}|${row.variant ?? ''}` === key
        );
        if (existingIdx >= 0) {
          const existingBounds = papers[existingIdx].paper_boundaries?.length ?? 0;
          const nextBounds = next.paper_boundaries?.length ?? 0;
          if (nextBounds > existingBounds) papers[existingIdx] = next;
        } else {
          papers.push(next);
        }
      }
    }

    const asComponents: PaperComponent[] = papers.map((paper) => ({
      name: paper.name,
      paperNumber: paper.paper_number || paper.name,
      variant: paper.variant,
      maxMark: paper.max_mark,
      title: paper.name,
      boundaries: (paper.paper_boundaries ?? []) as GradeBoundary[],
    }));

    const filtered = plugin.paperSelectionRules(asComponents, {
      tier: showTier ? (selectedTier || 'extended') : null,
      variant: selectedVariant || plugin.defaultVariant,
      syllabusCode: selectedSubjectRow?.code || subjectCode,
      cashInCode: selectedCashIn || null,
      awardLevel: enrollmentAward || null,
      mathsRoute,
      series: selectedSeries || null,
    });

    const selectedPapers: PaperDef[] = filtered.map((c) => {
      const orig = papers.find(
        (p) => (p.paper_number || p.name) === c.paperNumber && (p.variant ?? null) === (c.variant ?? null)
      ) ?? papers.find((p) => p.name === c.name);
      if (orig) return orig;
      return {
        name: c.name,
        max_mark: c.maxMark,
        weight: 100,
        paper_number: c.paperNumber,
        variant: c.variant ?? null,
        exclusiveGroup: c.exclusiveGroup,
        paper_boundaries: c.boundaries,
      } as PaperDef & { exclusiveGroup?: string };
    });

    return {
      id: selectedSeries,
      title,
      subject_code: subjectCode,
      curriculum_id: selectedCurriculum,
      subject_id: selectedSubject,
      series: selectedSeries,
      year,
      qualification,
      exam_board: examBoard,
      papers: selectedPapers,
      grade_boundaries: [],
      is_modular: isModular,
      syllabus_code: subjectCode,
    };
  }, [
    matchingPresets,
    selectedSeries,
    selectedCurriculum,
    selectedSubject,
    plugin,
    showTier,
    selectedTier,
    selectedVariant,
    selectedSubjectRow,
    selectedCashIn,
    enrollmentAward,
    mathsRoute,
    selectedSeries,
  ]);

  const exclusiveGroups = useMemo(() => {
    if (!activePreset) return null;
    const groups = new Map<string, (PaperDef & { exclusiveGroup?: string })[]>();
    for (const p of activePreset.papers as (PaperDef & { exclusiveGroup?: string })[]) {
      if (p.exclusiveGroup) {
        if (!groups.has(p.exclusiveGroup)) groups.set(p.exclusiveGroup, []);
        groups.get(p.exclusiveGroup)!.push(p);
      }
    }
    return groups.size > 0 ? groups : null;
  }, [activePreset]);

  useEffect(() => {
    if (!exclusiveGroups) return;
    const newOpts = { ...selectedExclusiveOptions };
    let changed = false;
    for (const [groupName, papers] of exclusiveGroups.entries()) {
      if (!newOpts[groupName] || !papers.find(p => (p.paper_number || p.name) === newOpts[groupName])) {
        newOpts[groupName] = papers[0].paper_number || papers[0].name;
        changed = true;
      }
    }
    if (changed) setSelectedExclusiveOptions(newOpts);
  }, [exclusiveGroups]);

  const filteredActivePapers = useMemo(() => {
    if (!activePreset) return [];
    let papers = activePreset.papers as (PaperDef & { exclusiveGroup?: string })[];

    // If it's a suite, filter down to the active units (mandatory + selected electives)
    if (isSuite && suiteSelectors.activeUnits.size > 0) {
      papers = papers.filter((p) => {
        const unitCode = (p.paper_number || p.name).split('/')[0];
        if (!suiteSelectors.activeUnits.has(unitCode) && !suiteSelectors.activeUnits.has(p.paper_number || p.name)) {
          return false;
        }
        return mathsSuiteUnitAvailableInSeries(unitCode, selectedSeries);
      });
    }

    return papers.filter((p) => {
      if (p.exclusiveGroup) {
        return (p.paper_number || p.name) === selectedExclusiveOptions[p.exclusiveGroup];
      }
      return true;
    });
  }, [activePreset, selectedExclusiveOptions, isSuite, suiteSelectors.activeUnits, selectedSeries]);

  useEffect(() => {
    if (!selectedSubject || !selectedSeries || !activePreset?.year) {
      setCompositeBoundaries([]);
      return;
    }
    const seriesName = selectedSeries.replace(/\s+\d{4}$/, '');
    const compKey = `${selectedSubject}:${activePreset.year}:${seriesName}:${selectedVariant || ''}:${selectedTier || ''}`;

    if (compositeCacheRef.current.has(compKey)) {
      setCompositeBoundaries(compositeCacheRef.current.get(compKey)!);
      return;
    }

    listSubjectCompositeBoundaries(selectedSubject, activePreset.year, seriesName, {
      variant: selectedVariant || null,
      tier: selectedTier || null,
    }).then((rows) => {
      const mapped = rows.map((r) => ({ grade: r.grade, min_mark: r.min_mark, max_mark: r.max_mark }));
      compositeCacheRef.current.set(compKey, mapped);
      setCompositeBoundaries(mapped);
    });
  }, [selectedSubject, selectedSeries, activePreset?.year, selectedVariant, selectedTier]);

  const isIAL = activePreset?.is_modular || activePreset?.qualification === 'IAL' || selectedCurriculumRow?.code === 'EDEXCEL_IAL';

  const isFmSubject =
    activeIalGroup?.title === 'Further Mathematics' ||
    Boolean(selectedCashIn && IAL_FM_CASH_INS.has(selectedCashIn as IalCashInCode));

  const availableSeries = useMemo(() => {
    const source = selectedCashIn ? cashInPresets : presets;
    const set = new Set<string>();
    source
      .filter((p) => (selectedCurriculum && !selectedCashIn ? p.curriculum_id === selectedCurriculum : true))
      .filter((p) => {
        if (selectedCashIn) return true;
        if (selectedUnitId) return p.subject_id === selectedUnitId;
        if (selectedSubject && !activeIalGroup) return p.subject_id === selectedSubject;
        return true;
      })
      .filter((p) => (p.papers ?? []).some((paper) => (paper.paper_boundaries?.length ?? 0) > 0))
      .forEach((p) => {
        if (p.series) set.add(p.series);
      });
    let list = Array.from(set).sort().reverse();
    if (isFmSubject) {
      list = list.filter((s) => !isIalOctoberSeries(s));
    }
    return list;
  }, [selectedCurriculum, selectedSubject, presets, cashInPresets, selectedCashIn, selectedUnitId, activeIalGroup, isFmSubject]);

  const availableCashIns = useMemo(() => {
    const october = isIalOctoberSeries(selectedSeries);
    let awards: { code: string; name: string; maxUms: number; compulsory: readonly string[]; optional: readonly string[] }[] = [];

    if (isSuite && suiteSelectors.availableCashIns?.length > 0) {
      awards = suiteSelectors.availableCashIns.map((q) => ({
        code: q.cashInCode,
        name: q.qualificationTitle,
        maxUms: (q.totalUnitsRequired || 0) * 100,
        compulsory: q.mandatoryUnits,
        optional: q.electiveRules?.allowedUnitPool || [],
      }));
    } else if (activeIalGroup) {
      const gMeta = IAL_SUBJECT_GROUPS.find(
        (g) => g.label.toLowerCase() === activeIalGroup.title.toLowerCase()
      );
      if (gMeta) {
        if (gMeta.alevelCode && IAL_CASH_INS[gMeta.alevelCode]) {
          const a = IAL_CASH_INS[gMeta.alevelCode];
          awards.push({ code: a.code, name: a.name, maxUms: a.maxUms, compulsory: a.compulsory, optional: a.optional });
        }
        if (gMeta.asCode && IAL_CASH_INS[gMeta.asCode]) {
          const a = IAL_CASH_INS[gMeta.asCode];
          awards.push({ code: a.code, name: a.name, maxUms: a.maxUms, compulsory: a.compulsory, optional: a.optional });
        }
      }
    } else {
      awards = (selectedSubjectRow?.code ? cashInsForUnit(selectedSubjectRow.code) : Object.values(IAL_CASH_INS)).map((a) => ({
        code: a.code,
        name: a.name,
        maxUms: a.maxUms,
        compulsory: a.compulsory,
        optional: a.optional,
      }));
    }

    if (activeIalGroup?.title === 'Mathematics') {
      awards = awards.filter((a) => IAL_MATHS_CASH_INS.has(a.code as IalCashInCode));
    } else if (activeIalGroup?.title === 'Further Mathematics') {
      awards = awards.filter((a) => IAL_FM_CASH_INS.has(a.code as IalCashInCode));
    }

    if (october) {
      awards = awards.filter((a) => !IAL_FM_CASH_INS.has(a.code as IalCashInCode));
    }

    return awards;
  }, [selectedSubjectRow, isSuite, suiteSelectors.availableCashIns, activeIalGroup, selectedSeries]);

  const octoberFilteredQualification = useMemo(() => {
    const q = suiteSelectors.activeQualification;
    if (!q) return null;
    if (!isIalOctoberSeries(selectedSeries) || !q.electiveRules) return q;
    const rules = q.electiveRules;
    return {
      ...q,
      electiveRules: {
        ...rules,
        allowedUnitPool: (rules.allowedUnitPool || []).filter((u: string) =>
          mathsSuiteUnitAvailableInSeries(u, selectedSeries)
        ),
        validCombinationSets: (rules.validCombinationSets || []).filter((pair: string[]) =>
          pair.every((u) => mathsSuiteUnitAvailableInSeries(u, selectedSeries))
        ),
        atLeastOneOf: (rules.atLeastOneOf || []).filter((u: string) =>
          mathsSuiteUnitAvailableInSeries(u, selectedSeries)
        ),
      },
    };
  }, [suiteSelectors.activeQualification, selectedSeries]);

  useEffect(() => {
    if (selectedCurriculumRow?.code !== 'EDEXCEL_IAL') {
      setSelectedCashIn('');
      return;
    }
    if (selectedCashIn && !availableCashIns.some((a) => a.code === selectedCashIn)) {
      setSelectedCashIn(availableCashIns[0]?.code ?? '');
      return;
    }
    if (!selectedCashIn && availableCashIns[0]) {
      setSelectedCashIn(availableCashIns[0].code);
    }
  }, [selectedCurriculumRow?.code, availableCashIns, selectedCashIn]);

  useEffect(() => {
    if (isFmSubject && isIalOctoberSeries(selectedSeries)) {
      setSelectedSeries('');
    }
  }, [isFmSubject, selectedSeries]);

  useEffect(() => {
    suiteSelectors.setSelectedPairIndex(0);
  }, [selectedSeries]);

  const canGoStep2 = isEdexcelIal
    ? !!(selectedCurriculum && selectedSubject && ialUnitCodes.length > 0)
    : !!(
        selectedCurriculum &&
        selectedSubject &&
        selectedSeries &&
        activePreset &&
        (!showTier || selectedTier)
      );

  const isCambridge =
    selectedCurriculumRow?.code === 'CAIE_IGCSE' || selectedCurriculumRow?.code === 'CAIE_ALEVEL';

  // Group papers by base number (e.g. Paper 1, Paper 2) so only 1 card is displayed per paper
  const papersByBase = useMemo(() => {
    const map = new Map<
      string,
      {
        baseKey: string;
        displayName: string;
        variants: Record<string, PaperDef>;
        variantList: string[];
      }
    >();

    const basePapers = (filteredActivePapers ?? []) as (PaperDef & { exclusiveGroup?: string })[];

    for (const p of basePapers) {
      const baseKey = isCambridge
        ? caiePaperBase(p.paper_number || p.name)
        : (p.paper_number || p.name);
      const v = p.variant || '2';

      if (!map.has(baseKey)) {
        const cleanName = p.name
          .replace(/\s+Variant\s+\d+/i, '')
          .replace(/\s*\(v\d+\)/i, '')
          .replace(/\s+v\d+$/i, '');

        map.set(baseKey, {
          baseKey,
          displayName: cleanName,
          variants: {},
          variantList: [],
        });
      }

      const entry = map.get(baseKey)!;
      entry.variants[v] = p;
      if (!entry.variantList.includes(v)) {
        entry.variantList.push(v);
      }
    }

    // Also scan matchingPresets for any other variants of this baseKey for Cambridge
    if (isCambridge) {
      for (const preset of matchingPresets) {
        for (const p of preset.papers) {
          const baseKey = caiePaperBase(p.paper_number || p.name);
          const v = p.variant;
          if (v && map.has(baseKey)) {
            const entry = map.get(baseKey)!;
            if (!entry.variants[v]) {
              entry.variants[v] = {
                ...p,
                paper_number: p.paper_number || preset.paper_number,
                variant: v,
              };
            }
            if (!entry.variantList.includes(v)) {
              entry.variantList.push(v);
            }
          }
        }
      }
    }

    for (const entry of map.values()) {
      entry.variantList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    return map;
  }, [filteredActivePapers, matchingPresets, isCambridge]);

  // Strict integer input handler (increments/decrements by 1)
  const handleMarkChange = (key: string | number, value: string, maxAllowed: number) => {
    if (!activePreset) return;
    if (value === '') {
      setRawMarks((prev) => ({ ...prev, [key]: '' }));
      return;
    }
    const n = Math.round(parseFloat(value));
    if (!isNaN(n) && n >= 0) {
      setRawMarks((prev) => ({ ...prev, [key]: Math.min(n, Math.max(0, maxAllowed)) }));
    }
  };

  const resetAll = () => {
    setRawMarks({});
    setPaperVariants({});
    setSelectedSeries('');
    setSelectedSubject('');
    setSelectedCurriculum('');
    setSelectedTier('');
    setSelectedVariant('');
    setSelectedExclusiveOptions({});
    setSelectedCashInLocal('');
    setSelectedUnitId('');
    setCurrentStep(1);
  };

  const paperPlugin = useMemo(
    () =>
      getPluginForPaper({
        examBoard: activePreset?.exam_board,
        qualification: activePreset?.qualification,
        curriculumCode: selectedCurriculumRow?.code,
      }),
    [activePreset, selectedCurriculumRow]
  );

  const paperResults = useMemo(() => {
    if (!activePreset || papersByBase.size === 0) return [];

    return Array.from(papersByBase.values()).map((entry, i) => {
      const activeVar =
        paperVariants[entry.baseKey] ||
        selectedVariant ||
        plugin.defaultVariant ||
        entry.variantList[0];
      const paperDef = entry.variants[activeVar] || Object.values(entry.variants)[0];
      const val = rawMarks[entry.baseKey] ?? rawMarks[i];
      const filled = val !== '' && val !== undefined;
      const perBoundaries = (paperDef?.paper_boundaries && paperDef.paper_boundaries.length > 0
        ? paperDef.paper_boundaries
        : []) as GradeBoundary[];

      const maxMark = paperDef?.max_mark || 100;
      const umsCap = umsCapFromBoundaries(perBoundaries);
      const maxInput = isIAL && ialInputMode === 'ums' ? umsCap || 100 : maxMark;
      const raw = filled ? Math.min(Number(val), maxInput) : 0;
      const result = filled
        ? isIAL && ialInputMode === 'ums'
          ? gradeFromUms(raw, perBoundaries)
          : perBoundaries.length > 0
            ? paperPlugin.gradeFromRawMark(raw, maxMark, perBoundaries)
            : { grade: '—', percentage: 0, ums: undefined as number | undefined }
        : { grade: '—', percentage: 0, ums: undefined as number | undefined };

      return {
        ...paperDef,
        baseKey: entry.baseKey,
        displayName: entry.displayName,
        activeVariant: activeVar,
        availableVariants: entry.variantList,
        index: i,
        filled,
        raw,
        max_mark: maxMark,
        pct: result.percentage,
        perBoundaries,
        paperGrade: filled ? result.grade : '—',
        paperUms: result.ums,
        umsCap,
        maxInput,
        hasOfficialBoundaries: perBoundaries.length > 0,
      };
    });
  }, [
    activePreset,
    papersByBase,
    paperVariants,
    selectedVariant,
    plugin.defaultVariant,
    rawMarks,
    paperPlugin,
    isIAL,
    ialInputMode,
  ]);

  const calc = useMemo(() => {
    if (!activePreset) {
      return { totalRaw: 0, maxRaw: 0, totalUms: 0, percentage: 0, grade: '—', anyFilled: false, usedComposite: false, aStarNotes: [] as string[], boundariesMessage: undefined as string | undefined };
    }
    const filled = paperResults.filter((pr) => pr.filled);
    const anyFilled = filled.length > 0;
    if (!anyFilled) {
      return { totalRaw: 0, maxRaw: 0, totalUms: 0, percentage: 0, grade: '—', anyFilled: false, usedComposite: false, aStarNotes: [] as string[], boundariesMessage: undefined as string | undefined };
    }
    if (boundariesUnavailable && compositeBoundaries.length === 0) {
      const totalRaw = filled.reduce((s, pr) => s + pr.raw, 0);
      const maxRaw = filled.reduce((s, pr) => s + pr.max_mark, 0);
      return {
        totalRaw: Math.round(totalRaw * 10) / 10,
        maxRaw,
        totalUms: 0,
        percentage: maxRaw ? Math.round((totalRaw / maxRaw) * 1000) / 10 : 0,
        grade: '—',
        anyFilled: true,
        usedComposite: false,
        aStarNotes: [] as string[],
        boundariesMessage: 'Official subject boundaries not yet seeded for this syllabus.',
      };
    }
    if (isSuite && selectedCashIn && !suiteSelectors.combinationStatus.complete) {
      const totalRaw = filled.reduce((s, pr) => s + pr.raw, 0);
      const maxRaw = filled.reduce((s, pr) => s + pr.max_mark, 0);
      const totalUms = filled.reduce((s, pr) => s + (pr.paperUms ?? 0), 0);
      return {
        totalRaw: Math.round(totalRaw * 10) / 10,
        maxRaw,
        totalUms,
        percentage: maxRaw ? Math.round((totalRaw / maxRaw) * 1000) / 10 : 0,
        grade: '—',
        anyFilled: true,
        usedComposite: false,
        aStarNotes: [] as string[],
        boundariesMessage: suiteSelectors.combinationStatus.message ?? 'Select a valid Pearson cash-in combination for an overall grade.',
      };
    }
    const composite = paperPlugin.compositeGrade(
      filled.map((pr) => ({
        name: pr.name,
        paperNumber: pr.paper_number || pr.name,
        variant: pr.variant,
        maxMark: pr.max_mark,
        boundaries: pr.perBoundaries,
        rawMark: isIAL && ialInputMode === 'ums' ? 0 : pr.raw,
        umsInput: isIAL && ialInputMode === 'ums' ? pr.raw : undefined,
      })),
      compositeBoundaries,
      selectedCashIn || null
    );
    return {
      totalRaw: Math.round(composite.totalRaw * 10) / 10,
      maxRaw: composite.maxRaw,
      totalUms: composite.totalUms ?? 0,
      percentage: composite.percentage,
      grade: composite.grade,
      anyFilled: true,
      usedComposite: composite.usedCompositeBoundaries,
      aStarEligible: composite.aStarEligible,
      aStarNotes: composite.aStarNotes ?? [],
      boundariesMessage: undefined as string | undefined,
    };
  }, [activePreset, paperResults, paperPlugin, compositeBoundaries, selectedCashIn, boundariesUnavailable, isIAL, ialInputMode, isSuite, suiteSelectors.combinationStatus]);

  return (
    <div className="rounded-3xl border border-border bg-background-card p-6 md:p-8 shadow-xs space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            <Calculator className="w-3.5 h-3.5" />
            Syllabus Grade Calculator
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Official Exam Grade Predictor
          </h1>
          <p className="text-xs text-foreground-muted">
            Predict grades using official boundary data for CAIE and Edexcel syllabuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={selectedSubject ? `/past-papers?subject=${selectedSubject}` : '/past-papers'}
            className="flex items-center gap-1.5 rounded-2xl border border-border bg-background-secondary px-4 py-2.5 text-xs font-bold text-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Past Paper Tracker
          </Link>
          <button
            onClick={resetAll}
            className="flex items-center gap-2 rounded-2xl border border-border bg-background-secondary px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-background-secondary/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Stepper Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { n: 1, label: isEdexcelIal ? 'Select Syllabus' : 'Select Syllabus & Series', enabled: true },
          { n: 2, label: isEdexcelIal ? 'Enter UMS & Calculate' : 'Input Marks & Calculate', enabled: canGoStep2 },
        ].map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => s.enabled && setCurrentStep(s.n)}
            disabled={!s.enabled}
            className={cn(
              'py-3.5 px-4 rounded-2xl border transition-all text-center',
              currentStep === s.n
                ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                : s.enabled
                ? 'bg-background-secondary border-border text-foreground-secondary hover:text-foreground cursor-pointer'
                : 'bg-background-secondary/50 border-border text-foreground-muted opacity-50 cursor-not-allowed'
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5">
              Step 0{s.n}
            </div>
            <div className="text-xs font-extrabold">{s.label}</div>
          </button>
        ))}
      </div>

      {/* ═══ STEP 1: Syllabus Selection ═══ */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Choose subject & your component route
            </h3>
            <p className="text-xs text-foreground-muted">
              {isEdexcelIal
                ? 'Pick your IAL subject, then enter uniform marks. Grades are awarded from UMS and do not depend on exam series.'
                : 'Subject-first: pick syllabus, award level, and route — then select the exam series.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                <BookOpen className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                Exam Board & Curriculum
              </label>
              <SearchableSelect
                value={selectedCurriculum}
                placeholder="Select curriculum"
                options={curriculumOptions}
                onChange={(id) => {
                  setSelectedCurriculum(id);
                  setSelectedSubject('');
                  setSelectedSeries('');
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                <Layers className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                Subject Syllabus
              </label>
              <SearchableSelect
                value={selectedSubject}
                placeholder="Search or select subject"
                disabled={!selectedCurriculum}
                options={subjectOptions}
                onChange={(id) => {
                  setSelectedSubject(id);
                  setSelectedSeries('');
                  setSelectedCashInLocal('');
                  setSelectedUnitId('');
                }}
              />
            </div>
          </div>

          {selectedSubjectRow?.code && syllabusHasAwardLevel(selectedSubjectRow.code) && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                Award level
              </label>
              <div className="flex gap-2">
                {(['AS', 'A Level'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEnrollmentAward(level)}
                    className={cn(
                      'rounded-xl border px-4 py-2 text-xs font-bold transition-colors',
                      enrollmentAward === level
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background-secondary text-foreground-muted'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedSubjectRow?.code && syllabusNeedsMathsRoute(selectedSubjectRow.code) && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                Applied mathematics route
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMathsRoute('42')}
                  className={cn(
                    'rounded-xl border px-4 py-2 text-xs font-bold transition-colors',
                    mathsRoute === '42'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background-secondary text-foreground-muted'
                  )}
                >
                  Mechanics (P42)
                </button>
                <button
                  type="button"
                  onClick={() => setMathsRoute('52')}
                  className={cn(
                    'rounded-xl border px-4 py-2 text-xs font-bold transition-colors',
                    mathsRoute === '52'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background-secondary text-foreground-muted'
                  )}
                >
                  Statistics (P52)
                </button>
              </div>
            </div>
          )}

          {isEdexcelIal && selectedSubject && isMathsFmSuite && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
              <p className="text-xs font-bold text-primary">
                {ialCalcMode === 'pure'
                  ? 'Pure Mathematics (XPM01 / YPM01)'
                  : ialCalcMode === 'maths'
                    ? 'Mathematics only (XMA01 / YMA01)'
                    : ialCalcMode === 'further'
                      ? 'Further Mathematics (XFM01 / YFM01)'
                      : 'Mathematics + Further Mathematics (12 units)'}
              </p>
              <p className="text-[11px] text-foreground-muted">
                {ialCalcMode === 'pure'
                  ? 'IAS Pure Mathematics is P1, P2 and FP1. IAL Pure Mathematics is P1–P4, FP1 and FP2 or FP3 (600 UMS). A* needs ≥480 overall and ≥270 on the IA2 units.'
                  : ialCalcMode === 'maths'
                    ? 'Enter the Mathematics units you sat. IAS is P1, P2 plus M1, S1 or D1. IAL is P1–P4 plus one official applied pair.'
                    : ialCalcMode === 'further'
                      ? 'Enter Further Mathematics units. IAS needs FP1 plus two other units. IAL needs FP1, FP2 or FP3, six units and at least three IA2 units.'
                      : 'Enter UMS for every unit you sat (up to all 14). Pearson does not cash the same unit into two qualifications. We pick the official combination with the highest possible grades, including Pure Mathematics when that is better.'}
              </p>
            </div>
          )}

          {isEdexcelIal && selectedSubject && !isMathsFmSuite && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                IAL cash-in award
              </label>
              <SearchableSelect
                value={selectedCashIn}
                placeholder="Select cash-in"
                className="md:w-1/2"
                options={availableCashIns.map((award) => ({
                  value: award.code,
                  label: award.name,
                  hint: `${award.code} · max ${award.maxUms} UMS`,
                }))}
                onChange={(code) => setSelectedCashIn(code)}
              />
              {selectedCashIn && IAL_CASH_INS[selectedCashIn as IalCashInCode]?.aStarNotes && (
                <p className="text-[11px] text-foreground-muted">
                  {IAL_CASH_INS[selectedCashIn as IalCashInCode].aStarNotes}
                </p>
              )}
            </div>
          )}

          {/* Series — not used for Edexcel IAL (UMS grades are series-independent) */}
          {selectedSubject && !isEdexcelIal && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                <Clock className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                Exam Series / Year
              </label>
              <SearchableSelect
                value={selectedSeries}
                placeholder="Select exam series"
                className="md:w-1/2"
                options={availableSeries.map((s) => ({ value: s, label: s }))}
                onChange={setSelectedSeries}
              />
              {availableSeries.length === 0 && (
                <p className="text-xs text-foreground-muted mt-1">
                  No official grade-boundary papers are in the database for this subject yet.
                </p>
              )}
            </div>
          )}

          {selectedSubject && showTier && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                Paper Tier
              </label>
              <div className="flex gap-2">
                {(['extended', 'core'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTier(t)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-bold border transition-colors capitalize',
                      selectedTier === t
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background-secondary border-border text-foreground-secondary hover:text-foreground'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-foreground-muted">
                Core uses Papers 1 &amp; 3 (max C). Extended uses Papers 2 &amp; 4 (max A*).
              </p>
            </div>
          )}

          {selectedSubject && availableVariants.length > 1 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                Paper Variant
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full md:w-1/3 bg-background-secondary border border-border rounded-2xl py-3 px-4 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
              >
                {availableVariants.map((v) => (
                  <option key={v} value={v}>
                    Variant {v}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Exclusive Group Selectors (e.g., Paper 52 OR 62) */}
          {exclusiveGroups && canGoStep2 && !isEdexcelIal && (
            <div className="space-y-4 pt-2">
              {Array.from(exclusiveGroups.entries()).map(([groupName, groupPapers]) => (
                <div key={groupName} className="space-y-1.5 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary">
                    Select Option ({groupName.replace('_', ' ')})
                  </label>
                  <p className="text-[11px] text-foreground-muted mb-2">
                    These papers are mutually exclusive. Choose the one you took.
                  </p>
                  <select
                    value={selectedExclusiveOptions[groupName] || ''}
                    onChange={(e) => setSelectedExclusiveOptions(prev => ({ ...prev, [groupName]: e.target.value }))}
                    className="w-full bg-background-card border border-primary/30 rounded-xl py-2.5 px-4 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors"
                  >
                    {groupPapers.map((p) => {
                      const val = p.paper_number || p.name;
                      return (
                        <option key={val} value={val}>
                          Paper {val} {p.name !== val ? `(${p.name})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Ready notification card */}
          {canGoStep2 && (isEdexcelIal || activePreset) && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-primary">
                  {isEdexcelIal ? 'Ready to enter UMS' : 'Official Grade Data Loaded'}
                </p>
                <p className="text-xs text-foreground-muted">
                  {isEdexcelIal
                    ? isMathsFmSuite
                    ? ialCalcMode === 'all'
                      ? 'Enter unit UMS for Mathematics and Further Mathematics. Cash-in grades are assigned automatically.'
                      : 'Cash-in grades are assigned automatically from the units you enter.'
                      : `${selectedCashIn || 'IAL'} · uniform mark scale (series-independent)`
                    : `${activePreset?.title} — ${activePreset?.series} • ${filteredActivePapers.length} paper(s) • Raw Mark Boundaries`}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!canGoStep2}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-bold text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-hover transition-all"
            >
              Next: {isEdexcelIal ? 'Enter UMS' : 'Enter Marks'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Mark Input & Calculation ═══ */}
      {currentStep === 2 && (isEdexcelIal ? selectedSubject : activePreset) && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                {isEdexcelIal ? 'Unit UMS & cash-in grade' : 'Component Marks & Predicted Grade'}
              </h3>
              <p className="text-xs text-foreground-muted">
                {isEdexcelIal
                  ? 'IAL grades use the uniform mark scale only. Exam series and raw paper marks are not required.'
                  : 'Official syllabus grade boundaries only. Marks cannot exceed the paper maximum.'}
              </p>
            </div>
          </div>

          {isEdexcelIal ? (
            <IalUmsCalculator
              unitCodes={ialUnitCodes}
              ums={rawMarks}
              onUmsChange={(code, value) =>
                setRawMarks((prev) => ({ ...prev, [code]: value }))
              }
              isMathsSuite={Boolean(ialCalcMode)}
              mathsSuiteMode={ialCalcMode ?? 'all'}
              cashInCode={ialCalcMode ? null : selectedCashIn || null}
            />
          ) : (
            <>
          {isSuite && (
            <EdexcelSuiteSelectors
              activeQualification={octoberFilteredQualification ?? suiteSelectors.activeQualification}
              selectedElectives={suiteSelectors.selectedElectives}
              handleElectiveToggle={suiteSelectors.handleElectiveToggle}
              selectedPairIndex={suiteSelectors.selectedPairIndex}
              setSelectedPairIndex={suiteSelectors.setSelectedPairIndex}
              combinationStatus={suiteSelectors.combinationStatus}
            />
          )}

          {/* Cambridge Global Variant Switcher */}
          {isCambridge && availableVariants.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-background-secondary/60 border border-border">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Exam Administration Variant
                </span>
                <p className="text-[11px] text-foreground-muted">
                  Defaulting to Variant {plugin.defaultVariant || '2'} (standard for Myanmar). Switch here or per paper.
                </p>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-background-card rounded-xl border border-border">
                {availableVariants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(v);
                      setPaperVariants({});
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all',
                      (selectedVariant || plugin.defaultVariant || '2') === v
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                    )}
                  >
                    Variant {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paperResults.map((pr) => (
              <label
                key={pr.baseKey}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background-secondary px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="block text-xs font-bold text-foreground truncate">
                      {pr.displayName || pr.name}
                    </span>
                    {pr.availableVariants.length > 1 && (
                      <span className="inline-flex items-center gap-0.5 bg-background-card border border-border rounded-md p-0.5">
                        {pr.availableVariants.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setPaperVariants((prev) => ({ ...prev, [pr.baseKey]: v }));
                            }}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold font-mono',
                              pr.activeVariant === v
                                ? 'bg-primary text-white'
                                : 'text-foreground-muted hover:text-foreground'
                            )}
                          >
                            v{v}
                          </button>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-foreground-muted font-mono">
                    max {pr.maxInput} {isIAL && ialInputMode === 'ums' ? 'UMS' : 'marks'}
                    {pr.filled ? ` · ${pr.pct}%` : ''}
                  </span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={pr.maxInput}
                    step="1"
                    value={rawMarks[pr.baseKey] ?? rawMarks[pr.index] ?? ''}
                    placeholder="0"
                    onChange={(e) => handleMarkChange(pr.baseKey, e.target.value, pr.maxInput)}
                    className="w-20 rounded-xl border border-border bg-background-card px-2 py-2 text-right font-mono text-sm font-bold outline-none focus:border-primary"
                  />
                  <span
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-extrabold border',
                      pr.filled
                        ? getGradeColor(pr.paperGrade)
                        : 'bg-background-secondary text-foreground-muted border-border'
                    )}
                  >
                    {pr.filled ? pr.paperGrade : '—'}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-background-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">Predicted grade</p>
              <p className="font-mono text-sm text-primary font-bold mt-1">
                {calc.anyFilled
                  ? isIAL
                    ? `${calc.totalUms} UMS · ${calc.totalRaw} / ${calc.maxRaw} raw`
                    : `${calc.totalRaw} / ${calc.maxRaw} · ${calc.percentage}%`
                  : 'Enter marks to see a grade'}
              </p>
              {calc.anyFilled && calc.aStarNotes && calc.aStarNotes.length > 0 && (
                <p className="text-[11px] text-foreground-muted mt-1">{calc.aStarNotes.join(' ')}</p>
              )}
              {'boundariesMessage' in calc && calc.boundariesMessage && (
                <p className="text-[11px] text-foreground-muted mt-1">{calc.boundariesMessage as string}</p>
              )}
            </div>
            <div
              className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-extrabold border shrink-0',
                calc.anyFilled ? getGradeColor(calc.grade) : 'bg-background-secondary text-foreground-muted border-border'
              )}
            >
              {calc.grade}
            </div>
          </div>

            </>
          )}

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background-secondary px-5 py-3 text-xs font-bold text-foreground hover:bg-background-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Setup
            </button>
            <Link
              href={selectedSubject ? `/past-papers?subject=${selectedSubject}` : '/past-papers'}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-primary-hover transition-colors"
            >
              Go to Past Paper Tracker
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
