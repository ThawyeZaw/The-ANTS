'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import type { RecurrenceRule, TimetableEvent, TimetableEventFormData } from '@/types/timetable';
import { formatDateLocal } from '@/hooks/useTimetable';
import { TASK_COLOURS, addMinutes } from './task-utils';

type RepeatChoice = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

interface TaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TimetableEventFormData) => Promise<void>;
  onDelete?: () => Promise<void> | void;
  event?: TimetableEvent | null;
  defaultDate?: Date;
  defaultStartTime?: string;
  defaultAllDay?: boolean;
}

function isoToTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function dayOf(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

function choiceFrom(event: TimetableEvent | null | undefined): RepeatChoice {
  const rule = event?.recurrence_rule;
  if (!event?.is_recurring || !rule) return 'none';
  if (rule.frequency === 'daily') return 'daily';
  if (rule.frequency === 'monthly') return 'monthly';
  if (rule.frequency === 'weekly') {
    const days = rule.days_of_week ?? [];
    if (days.length === 5 && [1, 2, 3, 4, 5].every((day) => days.includes(day))) return 'weekdays';
    return 'weekly';
  }
  return 'none';
}

function ruleFrom(choice: RepeatChoice, dateStr: string): { is_recurring: boolean; recurrence_rule: RecurrenceRule | null } {
  if (choice === 'none') return { is_recurring: false, recurrence_rule: null };
  if (choice === 'daily') return { is_recurring: true, recurrence_rule: { frequency: 'daily', interval: 1, end_date: null } };
  if (choice === 'weekdays') {
    return { is_recurring: true, recurrence_rule: { frequency: 'weekly', interval: 1, days_of_week: [1, 2, 3, 4, 5], end_date: null } };
  }
  if (choice === 'monthly') return { is_recurring: true, recurrence_rule: { frequency: 'monthly', interval: 1, end_date: null } };
  return {
    is_recurring: true,
    recurrence_rule: { frequency: 'weekly', interval: 1, days_of_week: [dayOf(dateStr)], end_date: null },
  };
}

export default function TaskSheet({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  defaultDate,
  defaultStartTime,
  defaultAllDay,
}: TaskSheetProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [repeat, setRepeat] = useState<RepeatChoice>('none');
  const [color, setColor] = useState(TASK_COLOURS[0]);
  const [notes, setNotes] = useState('');
  const [place, setPlace] = useState('');
  const [reminder, setReminder] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSaving(false);
    setConfirmDelete(false);
    if (event) {
      const anchor = event.series_start || event.start_time || event.end_time;
      const dateStr = anchor ? formatDateLocal(new Date(anchor)) : formatDateLocal(defaultDate ?? new Date());
      const meta = (event.metadata ?? {}) as Record<string, unknown>;
      setTitle(event.title);
      setDate(dateStr);
      setAllDay(event.all_day);
      setStart(event.start_time ? isoToTime(event.start_time) : '09:00');
      setEnd(event.end_time ? isoToTime(event.end_time) : '10:00');
      setRepeat(choiceFrom(event));
      setColor(event.color_code || TASK_COLOURS[0]);
      setNotes(event.description ?? '');
      setPlace(event.location ?? '');
      setReminder(typeof meta.reminder_minutes === 'number' ? meta.reminder_minutes : null);
    } else {
      const startTime = defaultStartTime ?? '09:00';
      setTitle('');
      setDate(formatDateLocal(defaultDate ?? new Date()));
      setAllDay(defaultAllDay ?? !defaultStartTime);
      setStart(startTime);
      setEnd(addMinutes(startTime, 60));
      setRepeat('none');
      setColor(TASK_COLOURS[0]);
      setNotes('');
      setPlace('');
      setReminder(null);
    }
  }, [isOpen, event, defaultDate, defaultStartTime, defaultAllDay]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const timeInvalid = useMemo(() => !allDay && start >= end, [allDay, start, end]);
  const repeating = repeat !== 'none';

  if (!isOpen) return null;

  const save = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Give the task a name.');
      return;
    }
    if (timeInvalid) {
      setError('End time needs to be after the start.');
      return;
    }
    setSaving(true);
    setError(null);
    const recurrence = ruleFrom(repeat, date);
    try {
      await onSave({
        title: trimmed,
        description: notes,
        event_type: event?.event_type ?? 'study',
        subject: event?.subject ?? '',
        location: place,
        time_mode: allDay ? 'all_day' : 'timed',
        date,
        start_time: start,
        end_time: end,
        color_code: color,
        is_todo: true,
        is_recurring: recurrence.is_recurring,
        recurrence_rule: recurrence.recurrence_rule,
        reminder_minutes: reminder,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this task.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="task-sheet-title">
      <button type="button" className="absolute inset-0 bg-foreground/40" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-background-card shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 id="task-sheet-title" className="text-base font-semibold text-foreground">
            {event ? (repeating ? 'Edit habit' : 'Edit task') : 'New task'}
          </h2>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-foreground-muted hover:bg-foreground/5" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 pb-4">
          <input
            autoFocus
            value={title}
            onChange={(input) => setTitle(input.target.value)}
            onKeyDown={(keyEvent) => {
              if (keyEvent.key === 'Enter') {
                keyEvent.preventDefault();
                void save();
              }
            }}
            placeholder="Task name"
            className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-base font-medium text-foreground outline-none focus:border-primary"
          />

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              {repeating ? 'Starts' : 'Date'}
            </span>
            <input
              type="date"
              value={date}
              onChange={(input) => setDate(input.target.value)}
              className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>

          <div className="flex items-center justify-between rounded-2xl border border-border px-3 py-2">
            <span className="text-sm font-medium text-foreground">All day</span>
            <button
              type="button"
              role="switch"
              aria-checked={allDay}
              onClick={() => setAllDay((value) => !value)}
              className="relative h-7 w-12 rounded-full transition-colors"
              style={{ backgroundColor: allDay ? 'var(--primary)' : 'var(--border)' }}
            >
              <span
                className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
                style={{ left: allDay ? '22px' : '2px' }}
              />
            </button>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">Start</span>
                <input type="time" value={start} onChange={(input) => setStart(input.target.value)} className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm tabular-nums text-foreground outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">End</span>
                <input type="time" value={end} onChange={(input) => setEnd(input.target.value)} className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm tabular-nums text-foreground outline-none focus:border-primary" />
              </label>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">Repeat</span>
            <select
              value={repeat}
              onChange={(input) => setRepeat(input.target.value as RepeatChoice)}
              className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Every day — habit</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </select>
          </label>

          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">Colour</span>
            <div className="flex flex-wrap gap-2">
              {(TASK_COLOURS.includes(color) ? TASK_COLOURS : [color, ...TASK_COLOURS]).map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  aria-label={`Colour ${swatch}`}
                  aria-pressed={color === swatch}
                  onClick={() => setColor(swatch)}
                  className="h-8 w-8 rounded-full border-2"
                  style={{
                    backgroundColor: swatch,
                    borderColor: color === swatch ? 'var(--foreground)' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">Place</span>
            <input
              value={place}
              onChange={(input) => setPlace(input.target.value)}
              placeholder="Optional"
              className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">Notes</span>
            <textarea
              value={notes}
              onChange={(input) => setNotes(input.target.value)}
              rows={3}
              placeholder="Optional"
              className="w-full resize-none rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-muted">Reminder</span>
            <select
              value={reminder ?? ''}
              onChange={(input) => setReminder(input.target.value ? Number(input.target.value) : null)}
              className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">None</option>
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
            </select>
          </label>

          {repeating && (
            <p className="text-xs leading-relaxed text-foreground-muted">
              Checking the box finishes that day only. Edits here apply to the whole repeat.
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex items-center gap-2 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                void onDelete();
              }}
              className="flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-medium text-red-500 hover:bg-red-500/10"
            >
              <Trash2 size={16} />
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          )}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="ml-auto h-11 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
