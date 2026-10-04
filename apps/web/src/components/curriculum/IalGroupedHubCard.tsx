'use client';

import Link from 'next/link';
import {
  BookOpen,
  Calculator,
  Timer,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Check,
  Trash2,
  Layers,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatExamDateTime } from '@/lib/exam-datetime';
import type { HubSubject } from '@/actions/curriculum';
import { sessionOptionsForCurriculum } from '@/lib/grading';
import { TARGET_GRADES_ALEVEL } from '@/components/onboarding/types';
import type { GroupedSubject } from '@/lib/edexcel-ial';
import type { AwardLevel, PaperPreferences } from '@/lib/exam-papers/myanmar-papers';

export function IalGroupedHubCard({
  group,
  onUnenroll,
  onUpdate,
}: {
  group: GroupedSubject<HubSubject>;
  onUnenroll: (group: GroupedSubject<HubSubject>) => void;
  onUpdate: (
    group: GroupedSubject<HubSubject>,
    patch: {
      targetSeries?: string;
      targetGrade?: string | null;
      awardLevel?: AwardLevel | null;
      paperPreferences?: PaperPreferences | null;
    }
  ) => void;
}) {
  const color = group.color_code ?? '#d97706';
  const curriculumId = group.curriculum_id ?? 'curr-edexcel-ial';
  const enrolledUnits = group.units.filter((u) => u.isEnrolled);
  const settingsSubject = enrolledUnits[0] ?? group.units[0];
  const seriesOptions = sessionOptionsForCurriculum(settingsSubject?.curriculum_code ?? 'EDEXCEL_IAL');

  const nextExam = enrolledUnits
    .map((u) => (u.nextExamDate ? { date: u.nextExamDate, title: u.nextExamTitle, id: u.id } : null))
    .filter(Boolean)
    .sort((a, b) => a!.date.getTime() - b!.date.getTime())[0];

  const calcQs = new URLSearchParams({
    curriculum: curriculumId,
    subject: group.primarySubjectId,
  });
  if (settingsSubject?.target_series) calcQs.set('series', settingsSubject.target_series);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const totalItems = group.topicCount + group.paperCount;
  const completedItems = group.completedTopics + group.completedPapers;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="group relative rounded-2xl border border-border/70 bg-background-card overflow-hidden hover:border-border-hover hover:shadow-md transition-all duration-200">
      {/* Accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl" style={{ backgroundColor: color }} />

      <div className="pl-4 pr-4 pt-4 pb-4 ml-1.5 space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {group.code}
              </span>
              <span className="text-[10px] text-foreground-muted truncate">
                {settingsSubject?.curriculum_name ?? 'Pearson Edexcel IAL'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono">
                {group.enrolledUnitsCount} / {group.units.length} units active
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mt-1 leading-snug truncate" title={group.title}>
              {group.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-border/60 bg-background-secondary/50 px-2 py-1 text-[11px] font-medium text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors shrink-0"
            aria-label="Toggle unit details and settings"
          >
            <span>Options</span>
            {detailsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Single Unified Progress Bar */}
        {totalItems > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-foreground-muted">
              <span>Overall Progress</span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {completedItems}/{totalItems} ({progressPct}%)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        ) : null}

        {/* Next Exam Pill */}
        {nextExam && (
          <Link
            href={`/countdown?curriculum=${curriculumId}&subject=${nextExam.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors w-fit max-w-full"
          >
            <Timer className="h-3 w-3 shrink-0" />
            <span className="truncate">
              Next exam: {formatExamDateTime(nextExam.date)} {nextExam.title ? `· ${nextExam.title}` : ''}
            </span>
          </Link>
        )}

        {/* 2 Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <Link
            href={`/curriculum/${curriculumId}/${group.primarySubjectId}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-background-secondary text-foreground border border-border px-3 py-2 text-xs font-semibold hover:border-border-hover hover:bg-background-secondary/80 transition-colors"
          >
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>Topics</span>
          </Link>
          <Link
            href={`/past-papers?subject=${group.primarySubjectId}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-primary border border-primary/25 px-3 py-2 text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Past Papers</span>
          </Link>
        </div>

        {/* Collapsible Details & Settings */}
        {detailsOpen && (
          <div className="space-y-3 pt-2.5 border-t border-border/50 text-xs">
            {/* Units breakdown */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide flex items-center gap-1">
                <Layers className="h-3 w-3" /> Enrolled Units
              </span>
              <div className="flex flex-wrap gap-1.5">
                {group.units.map((unit) => (
                  <span
                    key={unit.id}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-mono',
                      unit.isEnrolled
                        ? 'border-primary/40 bg-primary/10 text-foreground font-semibold'
                        : 'border-border/60 bg-background-secondary/40 text-foreground-muted opacity-60'
                    )}
                  >
                    {unit.isEnrolled && <Check className="h-2.5 w-2.5 text-primary stroke-[3]" />}
                    {unit.code}
                  </span>
                ))}
              </div>
            </div>

            {settingsSubject && (
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide">Series</span>
                  <select
                    value={settingsSubject.target_series ?? ''}
                    onChange={(e) => onUpdate(group, { targetSeries: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background-secondary px-2 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {seriesOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide">Target Grade</span>
                  <select
                    value={settingsSubject.target_grade ?? ''}
                    onChange={(e) => onUpdate(group, { targetGrade: e.target.value || null })}
                    className="w-full rounded-lg border border-border bg-background-secondary px-2 py-1.5 text-[11px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select grade</option>
                    {TARGET_GRADES_ALEVEL.map((grade) => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <Link
                href={`/calculator?${calcQs}`}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground-muted hover:text-primary transition-colors"
              >
                <Calculator className="h-3 w-3" />
                <span>Grade Boundaries</span>
              </Link>

              <button
                type="button"
                onClick={() => onUnenroll(group)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500/80 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                <span>Remove Subject</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
