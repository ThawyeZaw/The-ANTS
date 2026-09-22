'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { myanmarDateTimeIso, myanmarDateTimeParts } from '@/lib/exam-datetime';
import type { CountdownWithTime } from '@/hooks/useCountdown';

interface EditCountdownModalProps {
  countdown: CountdownWithTime;
  onClose: () => void;
  onSave: (data: {
    title: string;
    examDate: string;
    paperName: string | null;
    targetGrade: string | null;
  }) => Promise<void>;
  onRestoreOfficial?: () => Promise<void>;
}

export function EditCountdownModal({
  countdown,
  onClose,
  onSave,
  onRestoreOfficial,
}: EditCountdownModalProps) {
  const initial = myanmarDateTimeParts(countdown.exam_date || countdown.target_date);
  const [title, setTitle] = useState(
    countdown.custom_title || countdown.title || countdown.paper_name || ''
  );
  const [targetDate, setTargetDate] = useState(initial.date);
  const [targetTime, setTargetTime] = useState(initial.time);
  const [paperName, setPaperName] = useState(countdown.paper_name || '');
  const [targetGrade, setTargetGrade] = useState(countdown.target_grade || '');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isPastDate =
    targetDate && targetTime
      ? new Date(myanmarDateTimeIso(targetDate, targetTime)).getTime() < Date.now()
      : false;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !targetDate) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        examDate: myanmarDateTimeIso(targetDate, targetTime || '09:00'),
        paperName: paperName.trim() || null,
        targetGrade: targetGrade.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save this countdown.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!onRestoreOfficial) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onRestoreOfficial();
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Could not restore the official time.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Edit countdown</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-foreground-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-xs text-foreground-muted">
          Changes stay on your account. The official timetable is left as it is.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground-secondary">Title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background-secondary p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>

          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="block flex-1">
              <span className="mb-1 block text-sm font-medium text-foreground-secondary">Date</span>
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background-secondary p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-sm font-medium text-foreground-secondary">
                Time (MMT)
              </span>
              <input
                type="time"
                value={targetTime}
                onChange={(event) => setTargetTime(event.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background-secondary p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
          </div>

          {isPastDate && (
            <p className="text-sm text-red-500" role="alert">
              This date and time is in the past.
            </p>
          )}

          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="block flex-1">
              <span className="mb-1 block text-sm font-medium text-foreground-secondary">
                Paper label
              </span>
              <input
                type="text"
                value={paperName}
                onChange={(event) => setPaperName(event.target.value)}
                placeholder="Paper 01"
                className="w-full rounded-lg border border-border bg-background-secondary p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-sm font-medium text-foreground-secondary">
                Target grade
              </span>
              <input
                type="text"
                value={targetGrade}
                onChange={(event) => setTargetGrade(event.target.value)}
                placeholder="A*"
                className="w-full rounded-lg border border-border bg-background-secondary p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
          </div>

          {submitError && (
            <p className="text-sm text-red-500" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            {countdown.exam_id && onRestoreOfficial ? (
              <button
                type="button"
                onClick={handleRestore}
                disabled={submitting}
                className="text-xs font-semibold text-foreground-muted hover:text-foreground disabled:opacity-60"
              >
                Use official time
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-background-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
