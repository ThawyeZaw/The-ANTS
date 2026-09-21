'use client';

import { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Send,
  User,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  DEFAULT_EXAM_SESSION,
  EXAM_SESSION_OPTIONS,
  sessionOptionsForCurriculum,
} from '@/lib/grading';
import type { OnboardingSubjectPick } from './types';

interface ExamSessionStepProps {
  selected: OnboardingSubjectPick[];
  globalSeries: string;
  onGlobalSeriesChange: (series: string) => void;
  /** Apply series override to one or more subject unit ids */
  onSubjectSeriesChange: (subjectIds: string[], series: string | null) => void;
  preferredName: string;
  username: string;
  onFinish: (skipEnrollment: boolean) => void;
  isSaving: boolean;
}

interface OverrideRow {
  key: string;
  label: string;
  curriculumCode: string;
  subjectIds: string[];
  targetSeries: string | null;
  unitCount: number;
}

export function ExamSessionStep({
  selected,
  globalSeries,
  onGlobalSeriesChange,
  onSubjectSeriesChange,
  preferredName,
  username,
  onFinish,
  isSaving,
}: ExamSessionStepProps) {
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [remindLater, setRemindLater] = useState(false);

  const sessionChoices =
    selected.length === 0
      ? EXAM_SESSION_OPTIONS
      : Array.from(
          new Set(
            selected.flatMap((s) => [
              ...sessionOptionsForCurriculum(s.curriculumCode),
            ])
          )
        );

  const overrideRows = useMemo(() => {
    const map = new Map<string, OverrideRow>();
    for (const pick of selected) {
      const key = pick.groupTitle
        ? `ial:${pick.curriculumId}:${pick.groupTitle}`
        : `sub:${pick.subjectId}`;
      const existing = map.get(key);
      if (existing) {
        existing.subjectIds.push(pick.subjectId);
        existing.unitCount += 1;
        if (pick.targetSeries) existing.targetSeries = pick.targetSeries;
      } else {
        map.set(key, {
          key,
          label: pick.groupTitle || pick.subjectTitle,
          curriculumCode: pick.curriculumCode,
          subjectIds: [pick.subjectId],
          targetSeries: pick.targetSeries ?? null,
          unitCount: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [selected]);

  const summarySubjects = useMemo(() => {
    return overrideRows.map((row) => {
      const series = row.targetSeries || globalSeries || DEFAULT_EXAM_SESSION;
      return `${row.label} (${series})`;
    });
  }, [overrideRows, globalSeries]);

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Calendar className="h-7 w-7" strokeWidth={2} aria-hidden />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Exam targets</h1>
        <p className="text-sm text-foreground-muted">
          Pick your default exam session. Countdown timers sync papers for that
          sitting. Override per subject if needed.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-background-card p-5">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Default exam session
          </span>
          <select
            value={globalSeries}
            onChange={(e) => onGlobalSeriesChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            id="onboarding-global-series"
          >
            {(sessionChoices.length > 0 ? sessionChoices : EXAM_SESSION_OPTIONS).map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </select>
        </label>

        {overrideRows.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setOverridesOpen(!overridesOpen)}
              className="flex w-full items-center gap-2 bg-background-secondary/50 px-3.5 py-3 text-left text-sm font-semibold text-foreground"
            >
              {overridesOpen ? (
                <ChevronDown className="h-4 w-4 text-foreground-muted" />
              ) : (
                <ChevronRight className="h-4 w-4 text-foreground-muted" />
              )}
              Per-subject overrides
              <span className="ml-auto text-[11px] font-medium text-foreground-muted">
                Optional
              </span>
            </button>

            {overridesOpen && (
              <div className="max-h-56 space-y-2 overflow-y-auto border-t border-border p-3">
                {overrideRows.map((row) => {
                  const options = sessionOptionsForCurriculum(row.curriculumCode);
                  return (
                    <div
                      key={row.key}
                      className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-background-secondary/30 p-2.5 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {row.label}
                        </p>
                        <p className="font-mono text-[10px] text-foreground-muted">
                          {row.unitCount > 1
                            ? `${row.unitCount} units`
                            : row.curriculumCode}
                        </p>
                      </div>
                      <select
                        value={row.targetSeries ?? ''}
                        onChange={(e) =>
                          onSubjectSeriesChange(
                            row.subjectIds,
                            e.target.value || null
                          )
                        }
                        className="rounded-lg border border-border bg-background-card px-2 py-1.5 text-[11px] font-medium text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="">Use default ({globalSeries})</option>
                        {options.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2.5 rounded-2xl border border-border bg-background-secondary/40 p-5">
        <p className="text-sm font-semibold text-foreground">Setup summary</p>
        {preferredName && (
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            <User className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Preferred name:{' '}
              <strong className="text-foreground">{preferredName}</strong>
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            Default session:{' '}
            <strong className="text-foreground">{globalSeries}</strong>
          </span>
        </div>
        {overrideRows.length > 0 ? (
          <div className="flex items-start gap-2 text-sm text-foreground-secondary">
            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Subjects:{' '}
              <strong className="text-foreground">
                {overrideRows.length} selected
              </strong>
              <span className="mt-1 block text-xs text-foreground-muted">
                {summarySubjects.slice(0, 6).join(' · ')}
                {summarySubjects.length > 6
                  ? ` · +${summarySubjects.length - 6} more`
                  : ''}
              </span>
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm text-foreground-muted">
            <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              No subjects yet — you can enroll anytime from the Curriculum hub.
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-background-card p-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Telegram exam reminders</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Get notified before your exam countdowns hit zero. You can connect later
            from Settings.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background-secondary/50 p-4 text-left">
          <p className="mb-2 text-sm font-medium text-foreground">How to connect</p>
          <ol className="space-y-2 text-sm text-foreground-secondary">
            <li>1. Open Telegram and search for @TheANTS_bot</li>
            <li>
              2. Start a chat and send:{' '}
              <code className="rounded bg-background px-2 py-0.5 font-mono text-xs">
                /start {username || 'your_username'}
              </code>
            </li>
            <li>3. Wait for the confirmation message</li>
          </ol>
        </div>

        <label className="flex cursor-pointer items-center justify-center gap-2">
          <input
            type="checkbox"
            checked={remindLater}
            onChange={(e) => setRemindLater(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
          />
          <span className="text-sm text-foreground-secondary">Remind me later</span>
        </label>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            variant="secondary"
            onClick={() => onFinish(selected.length === 0)}
            disabled={isSaving}
            id="onboarding-telegram-skip"
          >
            Skip & finish
          </Button>
          <Button
            onClick={() => onFinish(false)}
            isLoading={isSaving}
            id="onboarding-telegram-done"
          >
            {isSaving ? 'Saving…' : 'Finish setup'}
          </Button>
        </div>
      </div>
    </div>
  );
}
