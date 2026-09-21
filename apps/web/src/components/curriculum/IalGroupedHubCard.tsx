'use client';

import Link from 'next/link';
import {
  BookOpen,
  Calculator,
  Timer,
  ClipboardCheck,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatExamDateTime } from '@/lib/exam-datetime';
import type { HubSubject } from '@/actions/curriculum';
import { sessionOptionsForCurriculum } from '@/lib/grading';
import { TARGET_GRADES_ALEVEL } from '@/components/onboarding/types';
import type { GroupedSubject } from '@/lib/edexcel-ial';
import type { AwardLevel, PaperPreferences } from '@/lib/exam-papers/myanmar-papers';

function ProgressBar({ value, total, color }: { value: number; total: number; color?: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color ?? 'var(--color-primary)' }}
        />
      </div>
      <span className="text-[10px] font-mono text-foreground-muted tabular-nums">
        {value}/{total}
      </span>
    </div>
  );
}

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

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="group relative rounded-2xl border border-border/60 bg-background-card overflow-hidden hover:border-border-hover hover:shadow-md transition-all duration-200">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl" style={{ backgroundColor: color }} />

      <div className="pl-4 pr-4 pt-4 pb-4 ml-1.5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {group.code}
              </span>
              <span className="text-[10px] text-foreground-muted">
                {settingsSubject?.curriculum_name ?? 'Pearson Edexcel IAL'}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                {group.enrolledUnitsCount} unit{group.enrolledUnitsCount === 1 ? '' : 's'}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mt-1 leading-snug">{group.title}</h3>
          </div>
          <GraduationCap className="h-5 w-5 shrink-0" style={{ color }} />
        </div>

        <div className="space-y-1.5">
          {group.topicCount > 0 && (
            <div className="space-y-0.5">
              <span className="text-[10px] text-foreground-muted flex items-center gap-1">
                <ClipboardCheck className="h-3 w-3" /> Topics
              </span>
              <ProgressBar value={group.completedTopics} total={group.topicCount} color={color} />
            </div>
          )}
          {group.paperCount > 0 && (
            <div className="space-y-0.5">
              <span className="text-[10px] text-foreground-muted flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Past Papers
              </span>
              <ProgressBar value={group.completedPapers} total={group.paperCount} color={color} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {group.units.map((unit) => (
            <span
              key={unit.id}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-mono',
                unit.isEnrolled
                  ? 'border-primary/40 bg-primary/10 text-foreground font-semibold'
                  : 'border-border/60 bg-background-secondary/40 text-foreground-muted'
              )}
            >
              {unit.isEnrolled && <Check className="h-2.5 w-2.5 text-primary stroke-[3]" />}
              {unit.code}
            </span>
          ))}
        </div>

        {nextExam && (
          <Link
            href={`/countdown?curriculum=${curriculumId}&subject=${nextExam.id}`}
            className="text-[11px] text-foreground-muted flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Timer className="h-3 w-3 text-primary shrink-0" />
            Next exam {formatExamDateTime(nextExam.date)}
            {nextExam.title ? ` · ${nextExam.title}` : ''}
          </Link>
        )}

        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className="w-full flex items-center justify-between text-[10px] font-semibold text-foreground-muted hover:text-foreground transition-colors py-1"
        >
          <span>Exam settings</span>
          {settingsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {settingsOpen && settingsSubject && (
          <div className="space-y-2 pt-1 border-t border-border/40">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-0.5">
                <span className="text-[10px] font-semibold text-foreground-muted uppercase">Series</span>
                <select
                  value={settingsSubject.target_series ?? ''}
                  onChange={(e) => onUpdate(group, { targetSeries: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background-secondary px-2 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {seriesOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-0.5">
                <span className="text-[10px] font-semibold text-foreground-muted uppercase">Target grade</span>
                <select
                  value={settingsSubject.target_grade ?? ''}
                  onChange={(e) =>
                    onUpdate(group, { targetGrade: e.target.value || null })
                  }
                  className="w-full rounded-lg border border-border bg-background-secondary px-2 py-1.5 text-[11px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select grade</option>
                  {TARGET_GRADES_ALEVEL.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-border/40 grid grid-cols-3 gap-2 mt-1">
          <Link
            href={`/curriculum/${curriculumId}/${group.primarySubjectId}?tab=papers`}
            className="flex items-center justify-center gap-1 rounded-xl bg-primary/10 text-primary border border-primary/20 px-2 py-2 text-[11px] font-bold hover:bg-primary/20 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" /> Papers
          </Link>
          <Link
            href={`/curriculum/${curriculumId}/${group.primarySubjectId}`}
            className="flex items-center justify-center gap-1 rounded-xl bg-background-secondary text-foreground border border-border px-2 py-2 text-[11px] font-bold hover:border-border-hover transition-colors"
          >
            <GraduationCap className="h-3.5 w-3.5 text-primary" /> Topics
          </Link>
          <Link
            href={`/calculator?${calcQs}`}
            className="flex items-center justify-center gap-1 rounded-xl bg-background-secondary text-foreground border border-border px-2 py-2 text-[11px] font-bold hover:border-border-hover transition-colors"
          >
            <Calculator className="h-3.5 w-3.5 text-primary" /> Grade
          </Link>
        </div>

        <button
          onClick={() => onUnenroll(group)}
          className="w-full text-[10px] font-semibold text-error/60 hover:text-error transition-colors py-0.5"
        >
          Remove from study plan
        </button>
      </div>
    </div>
  );
}
