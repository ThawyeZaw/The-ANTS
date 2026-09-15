'use client';

import Link from 'next/link';
import {
  BookOpen,
  Calculator,
  Timer,
  ClipboardCheck,
  StickyNote,
  Layers,
  HelpCircle,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HubSubject } from '@/actions/curriculum';
import { EXAM_SESSION_OPTIONS, syllabusHasTiers } from '@/lib/grading';
import { getPluginForCurriculumCode } from '@/lib/grading';

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

export function SubjectHubCard({
  subject,
  onUnenroll,
  onUpdate,
}: {
  subject: HubSubject;
  onUnenroll: (s: HubSubject) => void;
  onUpdate: (subjectId: string, patch: { targetSeries?: string; tier?: 'core' | 'extended' | null; targetGrade?: string | null }) => void;
}) {
  const color = subject.color_code ?? '#6366f1';
  const plugin = getPluginForCurriculumCode(subject.curriculum_code);
  const showTier = plugin.hasTiers && syllabusHasTiers(subject.code);
  const calcQs = new URLSearchParams({
    curriculum: subject.curriculum_id,
    subject: subject.id,
  });
  if (subject.target_series) calcQs.set('series', subject.target_series);
  if (subject.tier) calcQs.set('tier', subject.tier);

  const nextDate = subject.nextExamDate
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(subject.nextExamDate)
      )
    : null;

  return (
    <div className="group relative rounded-2xl border border-border/60 bg-background-card overflow-hidden hover:border-border-hover hover:shadow-md transition-all">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: color }} />
      <div className="pl-4 pr-4 pt-4 pb-4 ml-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {subject.code}
              </span>
              <span className="text-[10px] text-foreground-muted">{subject.curriculum_name}</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mt-1 leading-snug">{subject.name}</h3>
          </div>
          <button
            onClick={() => onUnenroll(subject)}
            className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg border border-error/30 text-error hover:bg-error/10"
          >
            Remove
          </button>
        </div>

        <div className="space-y-1.5">
          {subject.topicCount > 0 && (
            <div className="space-y-0.5">
              <span className="text-[10px] text-foreground-muted flex items-center gap-1">
                <ClipboardCheck className="h-3 w-3" /> Topics
              </span>
              <ProgressBar value={subject.completedTopics} total={subject.topicCount} color={color} />
            </div>
          )}
          {subject.paperCount > 0 && (
            <div className="space-y-0.5">
              <span className="text-[10px] text-foreground-muted flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Past Papers
              </span>
              <ProgressBar value={subject.completedPapers} total={subject.paperCount} color={color} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-0.5">
            <span className="text-[10px] font-semibold text-foreground-muted uppercase">Series</span>
            <select
              value={subject.target_series ?? ''}
              onChange={(e) => onUpdate(subject.id, { targetSeries: e.target.value })}
              className="w-full rounded-lg border border-border bg-background-secondary px-2 py-1.5 text-[11px] font-medium"
            >
              {EXAM_SESSION_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-0.5">
            <span className="text-[10px] font-semibold text-foreground-muted uppercase">Target grade</span>
            <input
              defaultValue={subject.target_grade ?? ''}
              placeholder="A*"
              onBlur={(e) => onUpdate(subject.id, { targetGrade: e.target.value || null })}
              className="w-full rounded-lg border border-border bg-background-secondary px-2 py-1.5 text-[11px] font-mono font-bold"
            />
          </label>
        </div>

        {showTier && (
          <div className="flex gap-1.5">
            {(['extended', 'core'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onUpdate(subject.id, { tier: t })}
                className={cn(
                  'flex-1 py-1 rounded-lg text-[10px] font-bold border capitalize',
                  subject.tier === t
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-foreground-muted'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {nextDate && (
          <p className="text-[11px] text-foreground-muted flex items-center gap-1.5">
            <Timer className="h-3 w-3 text-primary" />
            Next exam {nextDate}
            {subject.nextExamTitle ? ` · ${subject.nextExamTitle}` : ''}
          </p>
        )}

        <div className="pt-3 border-t border-border/40 grid grid-cols-2 gap-2 mt-2">
          <Link
            href={`/past-papers?subject=${subject.id}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-2 text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            <BookOpen className="h-4 w-4" /> Past Papers
          </Link>
          <Link
            href={`/curriculum/${subject.curriculum_id}/${subject.id}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-background-secondary text-foreground border border-border px-3 py-2 text-xs font-bold hover:border-border-hover hover:bg-background-secondary/80 transition-colors"
          >
            <GraduationCap className="h-4 w-4 text-primary" /> Progress
          </Link>
        </div>
      </div>
    </div>
  );
}
