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

// ── Circular progress arc ─────────────────────────────────────────────────────
function CircleProgress({
  value,
  total,
  color,
  size = 36,
}: {
  value: number;
  total: number;
  color: string;
  size?: number;
}) {
  if (total === 0) return null;
  const pct = Math.min(1, value / total);
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} stroke="var(--color-border)" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={3}
        stroke={color}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  );
}

// ── Flat progress bar ─────────────────────────────────────────────────────────
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

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="group relative rounded-2xl border border-border/60 bg-background-card overflow-hidden hover:border-border-hover hover:shadow-md transition-all duration-200">
      {/* Left accent stripe — 6px wide */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl" style={{ backgroundColor: color }} />

      <div className="pl-4 pr-4 pt-4 pb-4 ml-1.5 space-y-3">

        {/* ── Header ────────────────────────────────────────────────────── */}
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

          {/* Progress arcs */}
          <div className="flex items-center gap-1 shrink-0">
            {subject.topicCount > 0 && (
              <div className="relative flex items-center justify-center" title={`Topics: ${subject.completedTopics}/${subject.topicCount}`}>
                <CircleProgress value={subject.completedTopics} total={subject.topicCount} color={color} />
                <span className="absolute text-[8px] font-bold" style={{ color }}>
                  {Math.round((subject.completedTopics / subject.topicCount) * 100)}%
                </span>
              </div>
            )}
            {subject.paperCount > 0 && (
              <div className="relative flex items-center justify-center" title={`Papers: ${subject.completedPapers}/${subject.paperCount}`}>
                <CircleProgress value={subject.completedPapers} total={subject.paperCount} color={color} />
                <span className="absolute text-[8px] font-bold" style={{ color }}>
                  {Math.round((subject.completedPapers / subject.paperCount) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Progress bars (fallback text when arcs show nothing) ────── */}
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

        {/* ── Next exam ─────────────────────────────────────────────────── */}
        {nextDate && (
          <Link
            href={`/countdown?curriculum=${subject.curriculum_id}&subject=${subject.id}`}
            className="text-[11px] text-foreground-muted flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Timer className="h-3 w-3 text-primary shrink-0" />
            Next exam {nextDate}
            {subject.nextExamTitle ? ` · ${subject.nextExamTitle}` : ''}
          </Link>
        )}

        {/* ── Settings toggle ───────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className="w-full flex items-center justify-between text-[10px] font-semibold text-foreground-muted hover:text-foreground transition-colors py-1"
        >
          <span>Exam settings</span>
          {settingsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* ── Collapsible settings ──────────────────────────────────────── */}
        {settingsOpen && (
          <div className="space-y-2 pt-1 border-t border-border/40">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-0.5">
                <span className="text-[10px] font-semibold text-foreground-muted uppercase">Series</span>
                <select
                  value={subject.target_series ?? ''}
                  onChange={(e) => onUpdate(subject.id, { targetSeries: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background-secondary px-2 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {seriesOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="space-y-0.5">
                <span className="text-[10px] font-semibold text-foreground-muted uppercase">Target grade</span>
                <select
                  value={subject.target_grade ?? ''}
                  onChange={(e) => onUpdate(subject.id, { targetGrade: e.target.value || null })}
                  className="w-full rounded-lg border border-border bg-background-secondary px-2 py-1.5 text-[11px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select grade</option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {showAward && (
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
            )}

            {showMathsRoute && (
              <div className="flex gap-1.5">
                {([
                  { id: '42' as const, label: 'Mechanics P42' },
                  { id: '52' as const, label: 'Statistics P52' },
                ]).map((route) => (
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
            )}

            {showTier && (
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
            )}
          </div>
        )}

        {/* ── Quick action buttons ──────────────────────────────────────── */}
        <div className="pt-3 border-t border-border/40 grid grid-cols-3 gap-2 mt-1">
          <Link
            href={`/past-papers?subject=${subject.id}`}
            className="flex items-center justify-center gap-1 rounded-xl bg-primary/10 text-primary border border-primary/20 px-2 py-2 text-[11px] font-bold hover:bg-primary/20 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" /> Papers
          </Link>
          <Link
            href={`/curriculum/${subject.curriculum_id}/${subject.id}`}
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

        {/* Remove button */}
        <button
          onClick={() => onUnenroll(subject)}
          className="w-full text-[10px] font-semibold text-error/60 hover:text-error transition-colors py-0.5"
        >
          Remove from study plan
        </button>
      </div>
    </div>
  );
}
