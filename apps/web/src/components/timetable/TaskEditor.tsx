'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronUp, Trash2 } from 'lucide-react';
import type { RecurrenceRule, TimetableEvent, TimetableEventFormData } from '@/types/timetable';
import { formatDateLocal } from '@/hooks/useTimetable';
import { TASK_COLOURS, addMinutes } from './task-utils';

type RepeatChoice = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

interface TaskEditorProps {
  event?: TimetableEvent | null;
  defaultDate?: Date;
  defaultStartTime?: string;
  defaultAllDay?: boolean;
  defaultTitle?: string;
  onSave: (data: TimetableEventFormData) => Promise<void>;
  onDelete?: () => Promise<void> | void;
  onClose: () => void;
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

const fieldClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary';

export default function TaskEditor({
  event,
  defaultDate,
  defaultStartTime,
  defaultAllDay,
  defaultTitle = '',
  onSave,
  onDelete,
  onClose,
}: TaskEditorProps) {
  const initial = event
    ? (() => {
        const anchor = event.series_start || event.start_time || event.end_time;
        const meta = (event.metadata ?? {}) as Record<string, unknown>;
        const startTime = event.start_time ? isoToTime(event.start_time) : '09:00';
        return {
          title: event.title,
          date: anchor ? formatDateLocal(new Date(anchor)) : formatDateLocal(defaultDate ?? new Date()),
          allDay: event.all_day,
          start: startTime,
          end: event.end_time ? isoToTime(event.end_time) : '10:00',
          repeat: choiceFrom(event),
          color: event.color_code || TASK_COLOURS[0],
          notes: event.description ?? '',
          place: event.location ?? '',
          reminder: typeof meta.reminder_minutes === 'number' ? meta.reminder_minutes : null,
        };
      })()
    : (() => {
        const startTime = defaultStartTime ?? '09:00';
        return {
          title: defaultTitle,
          date: formatDateLocal(defaultDate ?? new Date()),
          allDay: defaultAllDay ?? !defaultStartTime,
          start: startTime,
          end: addMinutes(startTime, 60),
          repeat: 'none' as RepeatChoice,
          color: TASK_COLOURS[0],
          notes: '',
          place: '',
          reminder: null as number | null,
        };
      })();

  const [title, setTitle] = useState(initial.title);
  const [date, setDate] = useState(initial.date);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [repeat, setRepeat] = useState<RepeatChoice>(initial.repeat);
  const [color, setColor] = useState(initial.color);
  const [notes, setNotes] = useState(initial.notes);
  const [place, setPlace] = useState(initial.place);
  const [reminder, setReminder] = useState<number | null>(initial.reminder);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const fit = () => {
      const top = el.getBoundingClientRect().top;
      const nav = document.querySelector<HTMLElement>('.fixed.bottom-0');
      const navTop = nav?.getBoundingClientRect().top ?? window.innerHeight;
      const limit = navTop > 0 && navTop < window.innerHeight ? navTop : window.innerHeight;
      const available = Math.max(220, limit - top - 12);
      const fields = el.children[1] as HTMLElement | undefined;
      const header = el.children[0] as HTMLElement | undefined;
      const footer = el.children[2] as HTMLElement | undefined;
      if (!fields || !header || !footer) return;
      const natural = header.offsetHeight + fields.scrollHeight + footer.offsetHeight;
      const height = Math.min(natural, available);
      if (Math.abs(parseFloat(el.style.height || '0') - height) < 1) return;
      el.style.maxHeight = `${available}px`;
      el.style.height = `${height}px`;
    };
    fit();
    const scrollers: Array<Window | HTMLElement> = [window];
    let node = el.parentElement;
    while (node) {
      const overflow = getComputedStyle(node).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') scrollers.push(node);
      node = node.parentElement;
    }
    scrollers.forEach((target) => target.addEventListener('scroll', fit, { passive: true }));
    window.addEventListener('resize', fit);
    const observer = new ResizeObserver(() => fit());
    if (el.parentElement) observer.observe(el.parentElement);
    const frame = window.requestAnimationFrame(() => fit());
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      scrollers.forEach((target) => target.removeEventListener('scroll', fit));
      window.removeEventListener('resize', fit);
    };
  }, [allDay, repeat, error, confirmDelete]);

  const timeInvalid = useMemo(() => !allDay && start >= end, [allDay, start, end]);
  const repeating = repeat !== 'none';

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
    <div ref={rootRef} className="flex min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between px-3 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
          {event ? 'Details' : 'New task'}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted hover:bg-foreground/5"
          aria-label="Close details"
        >
          <ChevronUp size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
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
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base font-medium text-foreground outline-none focus:border-primary"
        />

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
            {repeating ? 'Starts' : 'Date'}
          </span>
          <input type="date" value={date} onChange={(input) => setDate(input.target.value)} className={fieldClass} />
        </label>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
          <span className="text-sm font-medium text-foreground">All day</span>
          <button
            type="button"
            role="switch"
            aria-checked={allDay}
            aria-label="All day"
            onClick={() => setAllDay((value) => !value)}
            className="relative h-6 w-11 rounded-full transition-colors"
            style={{ backgroundColor: allDay ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 22%, transparent)' }}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${allDay ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>

        {!allDay && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">Start</span>
              <input type="time" value={start} onChange={(input) => setStart(input.target.value)} className={`${fieldClass} tabular-nums`} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">End</span>
              <input type="time" value={end} onChange={(input) => setEnd(input.target.value)} className={`${fieldClass} tabular-nums`} />
            </label>
          </div>
        )}

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">Repeat</span>
          <select
            value={repeat}
            onChange={(input) => setRepeat(input.target.value as RepeatChoice)}
            className={fieldClass}
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Every day</option>
            <option value="weekdays">Weekdays</option>
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
          </select>
        </label>

        <div>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">Colour</span>
          <div className="flex flex-wrap gap-2">
            {(TASK_COLOURS.includes(color) ? TASK_COLOURS : [color, ...TASK_COLOURS]).map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Colour ${swatch}`}
                aria-pressed={color === swatch}
                onClick={() => setColor(swatch)}
                className="h-7 w-7 rounded-full border-2"
                style={{
                  backgroundColor: swatch,
                  borderColor: color === swatch ? 'var(--foreground)' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">Place</span>
          <input
            value={place}
            onChange={(input) => setPlace(input.target.value)}
            placeholder="Optional"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">Notes</span>
          <textarea
            value={notes}
            onChange={(input) => setNotes(input.target.value)}
            rows={2}
            placeholder="Optional"
            className={`${fieldClass} resize-none`}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">Reminder</span>
          <select
            value={reminder ?? ''}
            onChange={(input) => setReminder(input.target.value ? Number(input.target.value) : null)}
            className={fieldClass}
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
            Checking the box finishes that day only. Edits here apply to every repeat.
          </p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2">
        {onDelete && (
          <button
            type="button"
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              void Promise.resolve(onDelete())
                .then(() => onClose())
                .catch((err: unknown) => {
                  setError(err instanceof Error ? err.message : 'Could not delete this task.');
                  setConfirmDelete(false);
                });
            }}
            className="flex h-9 items-center gap-1.5 rounded-xl px-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
          >
            <Trash2 size={15} />
            {confirmDelete ? 'Confirm delete' : 'Delete'}
          </button>
        )}
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="ml-auto h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
