'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Past Paper Tracker Main View
// Supports: CAIE IGCSE, CAIE A Level, Edexcel IGCSE, Edexcel IAL
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Search,
  Flame,
  CheckCircle2,
  Award,
  Sparkles,
  BarChart3,
  Table,
  LayoutGrid,
  Calculator,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEnrolledSubjects, upsertPastPaperRecord } from '@/actions/past-papers';
import { getGamificationProfile } from '@/actions/gamification';
import { useGamificationFeedback } from '@/components/gamification/GamificationFeedbackProvider';
import { getPaperGridData, type PaperGridData } from '@/actions/curriculum';
import { PaperGrid } from './PaperGrid';
import { PaperCard, type UserPaperRecord } from './PaperCard';
import type { PastPaperData } from './InlineGradeCalc';
import { useEdexcelSuiteSelectors } from '@/components/exam-data/useEdexcelSuiteSelectors';
import {
  applyMathFmCombineRule,
  boardBadgeFromCurriculum,
  groupEdexcelIalSubjects,
  IAL_MATH_FM_COMBINED_ID,
} from '@/lib/edexcel-ial';
import { IalOptionalUnitsModal } from '@/components/curriculum/IalOptionalUnitsModal';
import { SubjectSwitcher, type SubjectSwitcherOption } from './SubjectSwitcher';

function flattenGrid(
  grid: PaperGridData,
  subjectName: string,
  syllabusCode: string
): { papers: PastPaperData[]; records: Record<string, UserPaperRecord> } {
  const papers: PastPaperData[] = [];
  const records: Record<string, UserPaperRecord> = {};
  for (const row of grid.rows) {
    for (const session of grid.sessions) {
      const key = `${session.year}-${session.series}`;
      const cell = row.cells[key];
      if (!cell) continue;
      papers.push({
        id: cell.paperId,
        exam_board: row.examBoard,
        qualification: row.qualification,
        subject: subjectName,
        syllabus_code: syllabusCode,
        year: session.year,
        series: session.series,
        paper_number: row.paperNumber,
        variant: row.variant,
        title: row.title,
        total_marks: row.totalMarks,
        gradeBoundaries: cell.gradeBoundaries.map((b, i) => ({
          id: `${cell.paperId}-${b.grade}-${i}`,
          grade: b.grade,
          min_mark: b.min_mark,
          max_mark: b.max_mark,
          ums_min: b.ums_min,
          ums_max: b.ums_max,
        })),
      });
      if (cell.recordId || cell.status !== 'not_done') {
        records[cell.paperId] = {
          id: cell.recordId ?? cell.paperId,
          past_paper_id: cell.paperId,
          status: cell.status,
          raw_score: cell.rawScore,
          max_score: cell.maxScore,
          percentage: cell.percentage,
          calculated_grade: cell.calculatedGrade,
          calculated_ums: cell.calculatedUms,
        };
      }
    }
  }
  return { papers, records };
}

interface PastPaperTrackerProps {
  userId: string;
}

export function PastPaperTracker({ userId }: PastPaperTrackerProps) {
  const searchParams = useSearchParams();
  const subjectFromUrl = searchParams.get('subject') || '';
  const [enrolledSubjects, setEnrolledSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjectFromUrl);
  const [papers, setPapers] = useState<PastPaperData[]>([]);
  const [records, setRecords] = useState<Record<string, UserPaperRecord>>({});
  const { handleAwardResult } = useGamificationFeedback();
  const [gamification, setGamification] = useState({
    totalXp: 0,
    level: 1,
    rankTitle: 'Novice Scholar',
    currentStreak: 0,
    longestStreak: 0,
  });

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');
  const [gridData, setGridData] = useState<PaperGridData | null>(null);
  const [gridError, setGridError] = useState<string | null>(null);
  const [isOptionalModalOpen, setIsOptionalModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'done' | 'not_done' | 'skipped'>('all');

  // Group enrolled subjects; when both Maths + FM are taken, only show the combined entry
  const { options: switcherGroups, combined: combinedMathFmEntry } = useMemo(() => {
    return applyMathFmCombineRule(groupEdexcelIalSubjects(enrolledSubjects));
  }, [enrolledSubjects]);

  const activeGroup = useMemo(() => {
    if (selectedSubjectId === IAL_MATH_FM_COMBINED_ID && combinedMathFmEntry) {
      return combinedMathFmEntry;
    }
    if (switcherGroups.length === 0) return null;
    if (!selectedSubjectId) return switcherGroups[0];
    return (
      switcherGroups.find(
        (g) => g.id === selectedSubjectId || g.units.some((u) => u.id === selectedSubjectId)
      ) ?? switcherGroups[0]
    );
  }, [switcherGroups, selectedSubjectId, combinedMathFmEntry]);

  const subjectSwitcherOptions: SubjectSwitcherOption[] = useMemo(
    () =>
      switcherGroups.map((grp) => {
        const curriculumCode =
          grp.units[0]?.curriculum?.code ??
          grp.curriculum_id ??
          (grp.id.startsWith('subj-edx-ial') ? 'EDEXCEL_IAL' : undefined);
        return {
          value: grp.primarySubjectId || grp.id,
          label: grp.title,
          code: grp.code || undefined,
          boardBadge: boardBadgeFromCurriculum(curriculumCode),
        };
      }),
    [switcherGroups]
  );

  // Load papers once the enrolled list is ready and the active subject is known.
  // Avoids a double D1 hit: empty enrollments → subject resolved → fetch again.
  const [hubReady, setHubReady] = useState(false);

  // Load enrolled subjects & gamification stats
  const refreshUserData = async () => {
    try {
      const [subjs, stats] = await Promise.all([
        getEnrolledSubjects(userId),
        getGamificationProfile(userId),
      ]);
      setEnrolledSubjects(subjs);
      setGamification({
        totalXp: stats.totalXp,
        level: stats.level,
        rankTitle: stats.rankTitle,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
      });

      const { options: groups, bothTaken: both, combined } = applyMathFmCombineRule(
        groupEdexcelIalSubjects(subjs)
      );
      if (groups.length === 0) return;

      const syncUrl = (id: string) => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        url.searchParams.set('subject', id);
        window.history.replaceState(null, '', url.toString());
      };

      // When both Maths + FM are taken, always force the combined workspace
      if (both && combined) {
        setSelectedSubjectId(IAL_MATH_FM_COMBINED_ID);
        syncUrl(IAL_MATH_FM_COMBINED_ID);
        return;
      }

      const fromUrl = subjectFromUrl
        ? groups.find(
            (g) =>
              g.id === subjectFromUrl ||
              g.primarySubjectId === subjectFromUrl ||
              g.units.some((u) => u.id === subjectFromUrl)
          )
        : null;

      if (fromUrl) {
        setSelectedSubjectId(fromUrl.primarySubjectId);
      } else if (!selectedSubjectId || selectedSubjectId === IAL_MATH_FM_COMBINED_ID) {
        setSelectedSubjectId(groups[0].primarySubjectId);
        syncUrl(groups[0].primarySubjectId);
      } else {
        const matchingGroup = groups.find(
          (g) =>
            g.primarySubjectId === selectedSubjectId ||
            g.id === selectedSubjectId ||
            g.units.some((u) => u.id === selectedSubjectId)
        );
        if (matchingGroup) {
          setSelectedSubjectId(matchingGroup.primarySubjectId);
        } else {
          setSelectedSubjectId(groups[0].primarySubjectId);
          syncUrl(groups[0].primarySubjectId);
        }
      }
    } catch (err) {
      console.error('Failed to load user study data:', err);
    } finally {
      setHubReady(true);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [userId]);

  const subjectIdToLoad = activeGroup?.primarySubjectId ?? selectedSubjectId;
  const activeTier =
    (activeGroup?.units[0]?.tier as 'core' | 'extended' | null | undefined) ??
    (enrolledSubjects.find((s) => s.id === subjectIdToLoad)?.tier as
      | 'core'
      | 'extended'
      | null
      | undefined) ??
    null;

  const reloadPaperGrid = React.useCallback(
    async (showLoader = true) => {
      if (!subjectIdToLoad) return;
      if (showLoader) setLoading(true);
      try {
        const grid = await getPaperGridData(
          userId,
          subjectIdToLoad,
          undefined,
          undefined,
          activeTier
        );
        setGridData(grid);
        setGridError(grid.error ?? null);
      } catch (err) {
        console.error('Failed to load past papers:', err);
        setGridData(null);
        setGridError(err instanceof Error ? err.message : 'Failed to load past papers');
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [subjectIdToLoad, userId, activeTier]
  );

  // Load papers & user records when selected subject changes
  useEffect(() => {
    if (!hubReady || !subjectIdToLoad) {
      if (hubReady) setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setGridError(null);

    void (async () => {
      try {
        const grid = await getPaperGridData(
          userId,
          subjectIdToLoad,
          undefined,
          undefined,
          activeTier
        );
        if (!cancelled) {
          setGridData(grid);
          setGridError(grid.error ?? null);
        }
      } catch (err) {
        console.error('Failed to load past papers:', err);
        if (!cancelled) {
          setGridData(null);
          setGridError(err instanceof Error ? err.message : 'Failed to load past papers');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hubReady, subjectIdToLoad, userId, activeTier]);

  // Background sync for gamification stats when a cell record is updated in PaperGrid
  const handleGridRecordChange = React.useCallback(async () => {
    try {
      const stats = await getGamificationProfile(userId);
      setGamification({
        totalXp: stats.totalXp,
        level: stats.level,
        rankTitle: stats.rankTitle,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
      });
    } catch (err) {
      console.error('Failed to refresh gamification stats:', err);
    }
  }, [userId]);

  // Active subject object
  const currentSubject = enrolledSubjects.find((s) => s.id === selectedSubjectId) ?? activeGroup?.units[0];

  const isSuite = currentSubject?.subject_type === 'modular_maths_suite';
  const suiteSelectors = useEdexcelSuiteSelectors(
    isSuite ? currentSubject?.qualification_data : null
  );

  const isCombinedMathFm = selectedSubjectId === IAL_MATH_FM_COMBINED_ID;

  const filteredGridData = useMemo(() => {
    if (!gridData) return null;

    if (!isSuite || suiteSelectors.activeUnits.size === 0) return gridData;

    return {
      ...gridData,
      rows: gridData.rows.filter((row) => {
        const baseCode = row.paperNumber.split('/')[0];
        return (
          suiteSelectors.activeUnits.has(baseCode) ||
          suiteSelectors.activeUnits.has(row.paperNumber)
        );
      }),
    };
  }, [gridData, isSuite, suiteSelectors.activeUnits]);

  useEffect(() => {
    if (!filteredGridData) {
      setPapers([]);
      setRecords({});
      return;
    }
    const flattened = flattenGrid(
      filteredGridData,
      activeGroup?.title ?? currentSubject?.name ?? '',
      activeGroup?.code ?? currentSubject?.code ?? ''
    );
    setPapers(flattened.papers);
    setRecords(flattened.records);
  }, [filteredGridData, activeGroup?.title, activeGroup?.code, currentSubject?.name, currentSubject?.code]);

  // Handle status & mark changes
  const handleStatusChange = async (
    paperId: string,
    status: 'not_done' | 'done' | 'skipped',
    data?: Partial<UserPaperRecord>
  ) => {
    // Optimistic update
    setRecords((prev) => ({
      ...prev,
      [paperId]: {
        ...(prev[paperId] || { id: paperId, past_paper_id: paperId }),
        status,
        ...data,
      },
    }));

    try {
      const res = await upsertPastPaperRecord({
        userId,
        pastPaperId: paperId,
        status,
        componentMarks: data?.component_marks || undefined,
        rawScore: data?.raw_score || undefined,
        maxScore: data?.max_score || undefined,
        percentage: data?.percentage || undefined,
        calculatedGrade: data?.calculated_grade || undefined,
        calculatedUms: data?.calculated_ums || undefined,
        notes: data?.notes || undefined,
      });
      if (!res.success) {
        throw new Error(res.error || 'Failed to save paper record');
      }
      if (res.gamification) handleAwardResult(res.gamification);

      const stats = await getGamificationProfile(userId);
      setGamification({
        totalXp: stats.totalXp,
        level: stats.level,
        rankTitle: stats.rankTitle,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
      });
    } catch (err) {
      console.error('Failed to update past paper record:', err);
      // Roll back optimistic card update by reloading grid-derived records
      void reloadPaperGrid(false);
    }
  };

  // Extract available filter options
  const years = useMemo(() => {
    const set = new Set<number>();
    papers.forEach((p) => {
      if (p.year) set.add(p.year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [papers]);

  const seriesList = useMemo(() => {
    const set = new Set<string>();
    papers.forEach((p) => {
      if (p.series) set.add(p.series);
    });
    return Array.from(set);
  }, [papers]);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchCode = (p.syllabus_code || '').toLowerCase().includes(q);
        const matchNum = String(p.paper_number).includes(q);
        const matchYear = String(p.year).includes(q);
        if (!matchTitle && !matchCode && !matchNum && !matchYear) return false;
      }

      // Year filter
      if (selectedYear !== 'all' && p.year !== selectedYear) return false;

      // Series filter
      if (selectedSeries !== 'all' && p.series !== selectedSeries) return false;

      // Status filter
      if (selectedStatus !== 'all') {
        const record = records[p.id];
        const currentStatus = record?.status || 'not_done';
        if (currentStatus !== selectedStatus) return false;
      }

      return true;
    });
  }, [papers, searchQuery, selectedYear, selectedSeries, selectedStatus, records]);

  // Progress: unique papers (not session cells), prefer server required progress when present
  const stats = useMemo(() => {
    const uniqueIds = new Set(papers.map((p) => p.id));
    const totalFromPapers = uniqueIds.size;
    const progress = gridData?.progress;
    const total =
      progress && progress.requiredTotal > 0 ? progress.requiredTotal : totalFromPapers;

    let done = 0;
    let skipped = 0;
    let totalScore = 0;
    let scoredCount = 0;
    const seen = new Set<string>();

    papers.forEach((p) => {
      if (seen.has(p.id)) return;
      seen.add(p.id);
      const rec = records[p.id];
      if (rec?.status === 'done') {
        done++;
        if (rec.percentage !== undefined && rec.percentage !== null) {
          totalScore += rec.percentage;
          scoredCount++;
        }
      } else if (rec?.status === 'skipped') {
        skipped++;
      }
    });

    if (progress && progress.requiredTotal > 0) {
      done = progress.requiredDone;
    }

    const percentDone = total > 0 ? Math.round((done / total) * 100) : 0;
    const avgScore = scoredCount > 0 ? Math.round((totalScore / scoredCount) * 10) / 10 : null;

    return { total, done, skipped, percentDone, avgScore };
  }, [papers, records, gridData?.progress]);

  const emptyPapersCopy = gridError
    ? 'Something went wrong loading past papers. Please try again.'
    : 'Past papers for this subject are not available yet. Check the curriculum hub or try another subject.';

  const initialAwardCode = useMemo(() => {
    const isFurther = (activeGroup?.title ?? '').toLowerCase().includes('further');
    const isAs = gridData?.awardLevel === 'AS';
    if (isFurther) return isAs ? 'XFM01' : 'YFM01';
    return isAs ? 'XMA01' : 'YMA01';
  }, [activeGroup?.title, gridData?.awardLevel]);

  if (hubReady && enrolledSubjects.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-background-card space-y-4 max-w-7xl mx-auto">
        <BookOpen className="w-12 h-12 text-primary/40 mx-auto" />
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground">No subjects enrolled</h3>
          <p className="text-xs text-foreground-muted max-w-md mx-auto leading-relaxed">
            Enroll in a syllabus from the curriculum hub to track past papers and grades here.
          </p>
        </div>
        <Link
          href="/curriculum"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
        >
          Browse curriculum
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-16 max-w-7xl mx-auto">
      {/* ── Compact Past Paper Tracker Toolbar & Progress Ribbon ─────────── */}
      <div className="rounded-2xl border border-border bg-background-card p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Row 1: Subject Selector, Codes, Action buttons & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Dropdown, Award Badge & Modal Links */}
          <div className="flex items-center gap-2 flex-wrap">
            <SubjectSwitcher
              value={
                isCombinedMathFm
                  ? IAL_MATH_FM_COMBINED_ID
                  : (activeGroup?.primarySubjectId ?? selectedSubjectId)
              }
              options={subjectSwitcherOptions}
              onChange={(val) => {
                setSelectedSubjectId(val);
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.set('subject', val);
                  window.history.replaceState(null, '', url.toString());
                }
              }}
            />

            {/* Customize Units modal button */}
            {activeGroup?.hasOptionalUnits && (
              <button
                type="button"
                onClick={() => setIsOptionalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-foreground-secondary hover:text-foreground bg-background-secondary hover:bg-background-tertiary border border-border transition-colors cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>Customize Units</span>
              </button>
            )}

            {/* Calculator Quick Link */}
            <Link
              href="/calculator"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-foreground-secondary hover:text-foreground bg-background-secondary hover:bg-background-tertiary border border-border transition-colors shadow-2xs"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xs:inline">Calculator</span>
            </Link>
          </div>

          {/* Right: Streak & XP Badge + View Switcher */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-background-secondary border border-border text-xs font-semibold text-foreground-secondary">
              <span className="flex items-center gap-1 text-amber-500">
                <Flame className="w-3.5 h-3.5" />
                <span className="font-mono font-bold">{gamification.currentStreak}d</span>
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1 text-foreground">
                <Award className="w-3.5 h-3.5 text-primary" />
                <span>Lvl {gamification.level}</span>
                <span className="font-mono text-foreground-muted font-normal text-[11px]">({gamification.totalXp} XP)</span>
              </span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-0.5 bg-background-secondary p-0.5 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-foreground-muted hover:text-foreground'
                )}
              >
                <Table className="h-3.5 w-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  viewMode === 'cards'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-foreground-muted hover:text-foreground'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Progress Bar & High-Density Stats Strip */}
        <div className="pt-2.5 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Progress Counters & Bar */}
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{stats.done} / {stats.total} Papers Completed</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ({stats.percentDone}%)
              </span>
            </div>
            <div className="flex-1 max-w-xs h-1.5 rounded-full bg-background-secondary overflow-hidden border border-border/40">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, stats.percentDone)}%` }}
              />
            </div>
          </div>

          {/* Inline Metrics */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-foreground-muted shrink-0">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-sky-500" />
              <span>Avg:</span>
              <strong className="text-foreground">{stats.avgScore !== null ? `${stats.avgScore}%` : '—'}</strong>
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Skipped:</span>
              <strong className="text-foreground">{stats.skipped}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Content View: Excel Grid vs Cards ─────────────────────────────── */}
      {viewMode === 'grid' ? (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredGridData ? (
          <PaperGrid
            userId={userId}
            data={filteredGridData}
            workspaceSubjectId={
              isCombinedMathFm
                ? IAL_MATH_FM_COMBINED_ID
                : (activeGroup?.primarySubjectId ?? selectedSubjectId)
            }
            onRecordChange={handleGridRecordChange}
          />
        ) : (
          <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-background-card space-y-4">
            <BookOpen className="w-12 h-12 text-primary/40 mx-auto" />
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">
                No Past Papers Found
              </h3>
              <p className="text-xs text-foreground-muted max-w-md mx-auto leading-relaxed">
                {emptyPapersCopy}
              </p>
            </div>
          </div>
        )
      ) : (
        <>
          {/* ── Filter Toolbar ─────────────────────────────────────────────────── */}
          <div className="p-4 sm:p-5 rounded-3xl border border-border bg-background-card space-y-4 shadow-xs">
            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-foreground-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search paper (e.g. Paper 2, 2023, 0580)..."
                  className="w-full rounded-2xl border border-border bg-background-secondary pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-foreground-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {(['all', 'not_done', 'done', 'skipped'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer',
                      selectedStatus === st
                        ? 'bg-primary text-white shadow-2xs font-bold'
                        : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
                    )}
                  >
                    {st === 'all' ? 'All Statuses' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Year & Series Pill Filters */}
            {(years.length > 0 || seriesList.length > 0) && (
              <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border text-xs">
                {/* Year filters */}
                {years.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-foreground-muted font-medium text-[11px] uppercase mr-1">
                      Year:
                    </span>
                    <button
                      onClick={() => setSelectedYear('all')}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-mono text-xs transition-all cursor-pointer',
                        selectedYear === 'all'
                          ? 'bg-foreground text-background font-bold'
                          : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
                      )}
                    >
                      All
                    </button>
                    {years.map((y) => (
                      <button
                        key={y}
                        onClick={() => setSelectedYear(y)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg font-mono text-xs transition-all cursor-pointer',
                          selectedYear === y
                            ? 'bg-foreground text-background font-bold'
                            : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
                        )}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}

                {/* Series filters */}
                {seriesList.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-foreground-muted font-medium text-[11px] uppercase mr-1">
                      Series:
                    </span>
                    <button
                      onClick={() => setSelectedSeries('all')}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer',
                        selectedSeries === 'all'
                          ? 'bg-foreground text-background font-bold'
                          : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
                      )}
                    >
                      All
                    </button>
                    {seriesList.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSeries(s)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer',
                          selectedSeries === s
                            ? 'bg-foreground text-background font-bold'
                            : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Papers Cards Grid ──────────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-3xl border border-border bg-background-card animate-pulse"
                />
              ))}
            </div>
          ) : filteredPapers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPapers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  record={records[paper.id]}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-background-card space-y-4">
              <BookOpen className="w-12 h-12 text-primary/40 mx-auto" />
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">
                  No Past Papers Found
                </h3>
                <p className="text-xs text-foreground-muted max-w-md mx-auto leading-relaxed">
                  {searchQuery || selectedYear !== 'all' || selectedSeries !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your filters or search term to see more papers.'
                    : emptyPapersCopy}
                </p>
              </div>
              {(searchQuery || selectedYear !== 'all' || selectedSeries !== 'all' || selectedStatus !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedYear('all');
                    setSelectedSeries('all');
                    setSelectedStatus('all');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Edexcel IAL Optional Units Selector Modal ───────────────────────── */}
      {activeGroup?.hasOptionalUnits && isOptionalModalOpen && (
        <IalOptionalUnitsModal
          isOpen={isOptionalModalOpen}
          onClose={() => setIsOptionalModalOpen(false)}
          userId={userId}
          subjectTitle={activeGroup.title}
          initialAwardCode={initialAwardCode}
          availableUnits={activeGroup.units.map((u) => ({
            id: u.id,
            code: u.code || '',
            title: u.name || '',
          }))}
          onSuccess={() => {
            setIsOptionalModalOpen(false);
            void reloadPaperGrid(true);
          }}
        />
      )}
    </div>
  );
}
