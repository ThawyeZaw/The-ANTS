'use client';

import Link from 'next/link';
import {
  BookOpen,
  Calculator,
  Timer,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatExamDateTime } from '@/lib/exam-datetime';
import type { HubSubject } from '@/actions/curriculum';
import { sessionOptionsForCurriculum, syllabusHasTiers } from '@/lib/grading';
import { getPluginForCurriculumCode } from '@/lib/grading';
import { targetGradesForCurriculum } from '@/components/onboarding/types';
import { syllabusHasAwardLevel, syllabusNeedsMathsRoute } from '@/lib/exam-papers/myanmar-papers';
import type { AwardLevel, PaperPreferences } from '@/lib/exam-papers/myanmar-papers';

export function SubjectHubCard({
  subject,
  onUnenroll,
  onUpdate,
}: {
  subject: HubSubject;
  onUnenroll: (s: HubSubject) => void;
  onUpdate: (
    subjectId: string,
    patch: {
      targetSeries?: string;
      tier?: 'core' | 'extended' | null;
      targetGrade?: string | null;
      awardLevel?: AwardLevel | null;
      paperPreferences?: PaperPreferences | null;
    }
  ) => void;
}) {
  const color = subject.color_code ?? '#d97706';
  const plugin = getPluginForCurriculumCode(subject.curriculum_code);
  const seriesOptions = (() => {
    const options = [...sessionOptionsForCurriculum(subject.curriculum_code)];
    if (subject.target_series && !options.includes(subject.target_series)) {
      options.unshift(subject.target_series);
    }
    return options;
  })();
  const gradeOptions = targetGradesForCurriculum(subject.curriculum_code);
  const showTier = plugin.hasTiers && (syllabusHasTiers(subject.code) || subject.code === '4MA1');
  const showAward = syllabusHasAwardLevel(subject.code) || subject.curriculum_code === 'CAIE_ALEVEL';
  const showMathsRoute = syllabusNeedsMathsRoute(subject.code) && (subject.award_level ?? 'A Level') === 'AS';
  const calcQs = new URLSearchParams({
    curriculum: subject.curriculum_id,
    subject: subject.id,
  });
  if (subject.target_series) calcQs.set('series', subject.target_series);
  if (subject.tier) calcQs.set('tier', subject.tier);

  const nextDate = subject.nextExamDate ? formatExamDateTime(subject.nextExamDate) : null;
  const [detailsOpen, setDetailsOpen] = useState(false);

  const totalItems = subject.topicCount + subject.paperCount;
  const completedItems = subject.completedTopics + subject.completedPapers;
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
                {subject.code}
              </span>
              <span className="text-[10px] text-foreground-muted truncate">
                {subject.curriculum_name}
              </span>
              {subject.target_grade && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-foreground/5 text-foreground-muted">
                  Target: {subject.target_grade}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground mt-1 leading-snug truncate" title={subject.name}>
              {subject.name}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-border/60 bg-background-secondary/50 px-2 py-1 text-[11px] font-medium text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors shrink-0"
            aria-label="Toggle exam settings"
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
        {nextDate && (
          <Link
            href={`/countdown?curriculum=${subject.curriculum_id}&subject=${subject.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors w-fit max-w-full"
          >
            <Timer className="h-3 w-3 shrink-0" />
            <span className="truncate">
              Next exam: {nextDate} {subject.nextExamTitle ? `· ${subject.nextExamTitle}` : ''}
            </span>
          </Link>
        )}

        {/* 2 Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <Link
            href={`/curriculum/${subject.curriculum_id}/${subject.id}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-background-secondary text-foreground border border-border px-3 py-2 text-xs font-semibold hover:border-border-hover hover:bg-background-secondary/80 transition-colors"
          >
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>Topics</span>
          </Link>
          <Link
            href={`/past-papers?subject=${subject.id}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-primary border border-primary/25 px-3 py-2 text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Past Papers</span>
          </Link>
        </div>

        {/* Collapsible Details & Settings */}
        {detailsOpen && (
          <div className="space-y-3 pt-2.5 border-t border-border/50 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide">Series</span>
                <select
                  value={subject.target_series ?? ''}
                  onChange={(e) => onUpdate(subject.id, { targetSeries: e.target.value })}
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
                  value={subject.target_grade ?? ''}
                  onChange={(e) => onUpdate(subject.id, { targetGrade: e.target.value || null })}
                  className="w-full rounded-lg border border-border bg-background-secondary px-2 py-1.5 text-[11px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select grade</option>
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>
            </div>

            {showAward && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide">Award Level</span>
                <div className="flex gap-1.5">
                  {(['AS', 'A Level'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => onUpdate(subject.id, { awardLevel: level })}
                      className={cn(
                        'flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors',
                        subject.award_level === level
                          ? 'bg-primary text-white border-primary'
                          : 'border-border text-foreground-muted hover:border-border-hover'
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showMathsRoute && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide">Maths Route</span>
                <div className="flex gap-1.5">
                  {[
                    { id: '42' as const, label: 'Mechanics P42' },
                    { id: '52' as const, label: 'Statistics P52' },
                  ].map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => onUpdate(subject.id, { paperPreferences: { mathsRoute: route.id } })}
                      className={cn(
                        'flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors',
                        subject.paper_preferences?.mathsRoute === route.id
                          ? 'bg-primary text-white border-primary'
                          : 'border-border text-foreground-muted hover:border-border-hover'
                      )}
                    >
                      {route.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showTier && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide">Tier</span>
                <div className="flex gap-1.5">
                  {(['extended', 'core'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onUpdate(subject.id, { tier: t })}
                      className={cn(
                        'flex-1 py-1 rounded-lg text-[10px] font-bold border capitalize transition-colors',
                        subject.tier === t
                          ? 'bg-primary text-white border-primary'
                          : 'border-border text-foreground-muted hover:border-border-hover'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
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
                onClick={() => onUnenroll(subject)}
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
