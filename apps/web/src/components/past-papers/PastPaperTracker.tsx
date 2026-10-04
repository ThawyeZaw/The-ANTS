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
  Flame,
  CheckCircle2,
  Award,
  Sparkles,
  BarChart3,
  Calculator,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEnrolledSubjects } from '@/actions/past-papers';
import { getGamificationProfile } from '@/actions/gamification';
import { getPaperGridData, type PaperGridData } from '@/actions/curriculum';
import { PaperGrid } from './PaperGrid';
import { useEdexcelSuiteSelectors } from '@/components/exam-data/useEdexcelSuiteSelectors';
import {
  applyMathFmCombineRule,
  boardBadgeFromCurriculum,
  groupEdexcelIalSubjects,
  IAL_MATH_FM_COMBINED_ID,
} from '@/lib/edexcel-ial';
import { IalOptionalUnitsModal } from '@/components/curriculum/IalOptionalUnitsModal';
import { SubjectSwitcher, type SubjectSwitcherOption } from './SubjectSwitcher';

interface PastPaperTrackerProps {
  userId: string;
}

export function PastPaperTracker({ userId }: PastPaperTrackerProps) {
  const searchParams = useSearchParams();
  const subjectFromUrl = searchParams.get('subject') || '';
  const [enrolledSubjects, setEnrolledSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjectFromUrl);
  const [gamification, setGamification] = useState({
    totalXp: 0,
    level: 1,
    rankTitle: 'Novice Scholar',
    currentStreak: 0,
    longestStreak: 0,
  });

  const [loading, setLoading] = useState(true);
  const [gridData, setGridData] = useState<PaperGridData | null>(null);
  const [gridError, setGridError] = useState<string | null>(null);
  const [isOptionalModalOpen, setIsOptionalModalOpen] = useState(false);

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

  // Progress: unique papers (not session cells), prefer server required progress when present
  const stats = useMemo(() => {
    const progress = gridData?.progress;
    let done = 0;
    let skipped = 0;
    let totalScore = 0;
    let scoredCount = 0;
    const uniquePapers = new Set<string>();

    const rows = filteredGridData?.rows ?? gridData?.rows ?? [];
    for (const row of rows) {
      for (const cell of Object.values(row.cells)) {
        if (!cell || cell.isDisabled || cell.paperId.startsWith('unseeded-')) continue;
        if (uniquePapers.has(cell.paperId)) continue;
        uniquePapers.add(cell.paperId);

        if (cell.status === 'done') {
          done++;
          if (cell.percentage !== null && cell.percentage !== undefined) {
            totalScore += cell.percentage;
            scoredCount++;
          }
        } else if (cell.status === 'skipped') {
          skipped++;
        }
      }
    }

    const total =
      progress && progress.requiredTotal > 0 ? progress.requiredTotal : uniquePapers.size;
    if (progress && progress.requiredTotal > 0) {
      done = progress.requiredDone;
    }

    const percentDone = total > 0 ? Math.round((done / total) * 100) : 0;
    const avgScore = scoredCount > 0 ? Math.round((totalScore / scoredCount) * 10) / 10 : null;

    return { total, done, skipped, percentDone, avgScore };
  }, [gridData?.progress, gridData?.rows, filteredGridData?.rows]);

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

      {/* ── Content View: Excel Grid ────────────────────────────────────────── */}
      {loading ? (
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
