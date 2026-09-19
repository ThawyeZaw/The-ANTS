'use client';

import Link from 'next/link';
import { Calculator, GraduationCap, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubjectProgressSummary } from '@/actions/curriculum';
import type { AwardLevel, PaperPreferences } from '@/lib/exam-papers/myanmar-papers';

interface SubjectProgressHeaderProps {
  subjectId: string;
  subjectName: string;
  syllabusCode: string;
  curriculumId: string;
  progress?: SubjectProgressSummary;
  awardLevel?: AwardLevel | null;
  paperPreferences?: PaperPreferences | null;
  tier?: string | null;
  onEditRoute?: () => void;
}

export function SubjectProgressHeader({
  subjectId,
  subjectName,
  syllabusCode,
  curriculumId,
  progress,
  awardLevel,
  paperPreferences,
  tier,
  onEditRoute,
}: SubjectProgressHeaderProps) {
  const pct =
    progress && progress.requiredTotal > 0
      ? Math.round((progress.requiredDone / progress.requiredTotal) * 100)
      : 0;

  const routeLabel = paperPreferences?.mathsRoute
    ? paperPreferences.mathsRoute === '42'
      ? 'Mechanics (P42)'
      : 'Statistics (P52)'
    : paperPreferences?.sciencePractical
      ? `Practical P${paperPreferences.sciencePractical}`
      : null;

  const calcHref = `/calculator?curriculum=${curriculumId}&subject=${subjectId}${tier ? `&tier=${tier}` : ''}`;

  return (
    <div className="rounded-2xl border border-border bg-background-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">{syllabusCode}</p>
          <h2 className="text-lg font-bold text-foreground">{subjectName}</h2>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-foreground-muted">
            {awardLevel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background-secondary px-2 py-0.5">
                <GraduationCap className="h-3 w-3" />
                {awardLevel}
              </span>
            )}
            {routeLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background-secondary px-2 py-0.5">
                <Route className="h-3 w-3" />
                {routeLabel}
              </span>
            )}
            {tier && (
              <span className="rounded-full bg-background-secondary px-2 py-0.5 capitalize">{tier}</span>
            )}
          </div>
        </div>
        <Link
          href={calcHref}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Calculator className="h-3.5 w-3.5" />
          Subject calculator
        </Link>
      </div>

      {progress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground-muted">Required papers completed</span>
            <span className="font-mono font-semibold text-foreground">
              {progress.requiredDone}/{progress.requiredTotal}
            </span>
          </div>
          <div className="h-2 rounded-full bg-background-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {progress?.compositeGrade ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-foreground-muted">Latest series grade</span>
          <span className="font-mono text-xl font-bold text-primary">{progress.compositeGrade}</span>
          {progress.latestSeriesLabel && (
            <span className="text-xs text-foreground-muted">({progress.latestSeriesLabel})</span>
          )}
          {!progress.compositeIsOfficial && (
            <span className="text-[10px] rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-400">
              Estimate
            </span>
          )}
        </div>
      ) : progress?.compositeMessage ? (
        <p className={cn('text-xs text-foreground-muted')}>{progress.compositeMessage}</p>
      ) : null}

      {onEditRoute && (
        <button
          type="button"
          onClick={onEditRoute}
          className="text-xs font-medium text-primary hover:underline"
        >
          Change component route
        </button>
      )}
    </div>
  );
}
