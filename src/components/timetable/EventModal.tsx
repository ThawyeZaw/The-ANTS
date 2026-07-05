'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, RotateCcw, AlertCircle, Search } from 'lucide-react';
import type { TimetableEvent, TimetableEventFormData, TimetableEventType, RecurrenceRule } from '@/types/timetable';
import { EVENT_TYPE_CONFIG, ALL_EVENT_TYPES, COLOUR_PRESETS } from '@/constants/timetable';
import { formatDateLocal } from '@/hooks/useTimetable';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TimetableEventFormData) => Promise<void>;
  onDelete?: () => void;
  /** If editing an existing event, pass it here */
  event?: TimetableEvent | null;
  /** Pre-fill date if creating from an empty slot click */
  defaultDate?: Date;
  /** Pre-fill start time if creating from a grid slot */
  defaultStartTime?: string;
  /** Number of existing events on the selected day (for soft cap warning) */
  dayEventCount?: number;
}

const DEFAULT_FORM: TimetableEventFormData = {
  title: '',
  description: '',
  event_type: 'study',
  subject: '',
  location: '',
  time_mode: 'timed',
  start_time: '09:00',
  end_time: '10:00',
  date: formatDateLocal(new Date()),
  color_code: '#6366f1',
  is_todo: false,
  is_recurring: false,
  recurrence_rule: null,
};

function isoToLocalTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function isoToLocalDate(iso: string): string {
  const d = new Date(iso);
  return formatDateLocal(d);
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  study: 'Study Session',
  class: 'Class',
  school: 'School',
  gym: 'Gym / Sport',
  exam: 'Exam',
  break: 'Break',
  deadline: 'Deadline',
  club_event: 'Club Event',
};

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  defaultDate,
  defaultStartTime,
  dayEventCount,
}: EventModalProps) {
  const [form, setForm] = useState<TimetableEventFormData>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event type autocomplete state
  const [typeSearch, setTypeSearch] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeInputRef = useRef<HTMLInputElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Filtered type suggestions
  const filteredTypes = useMemo(() => {
    const query = typeSearch.toLowerCase().trim();
    if (!query) return ALL_EVENT_TYPES;
    return ALL_EVENT_TYPES.filter(t =>
      EVENT_TYPE_LABELS[t].toLowerCase().includes(query) || t.includes(query)
    );
  }, [typeSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(e.target as Node) &&
        typeInputRef.current &&
        !typeInputRef.current.contains(e.target as Node)
      ) {
        setShowTypeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialise form from event or defaults
  useEffect(() => {
    if (!isOpen) return;
    if (event) {
      let timeMode: TimetableEventFormData['time_mode'] = 'timed';
      if (event.all_day) timeMode = 'all_day';
      else if (!event.start_time && event.end_time) timeMode = 'deadline';

      const dateStr = event.start_time
        ? isoToLocalDate(event.start_time)
        : event.end_time
          ? isoToLocalDate(event.end_time)
          : formatDateLocal(new Date());

      setForm({
        title: event.title,
        description: event.description ?? '',
        event_type: event.event_type,
        subject: event.subject ?? '',
        location: event.location ?? '',
        time_mode: timeMode,
        start_time: event.start_time ? isoToLocalTime(event.start_time) : '09:00',
        end_time: event.end_time ? isoToLocalTime(event.end_time) : '10:00',
        date: dateStr,
        color_code: event.color_code,
        is_todo: event.is_todo,
        is_recurring: event.is_recurring,
        recurrence_rule: event.recurrence_rule,
      });
      setTypeSearch(EVENT_TYPE_LABELS[event.event_type] ?? event.event_type);
      setShowRecurrence(event.is_recurring);
      setShowAdvanced(false);
    } else {
      const date = defaultDate ? formatDateLocal(defaultDate) : formatDateLocal(new Date());
      const startT = defaultStartTime ?? '09:00';
      const [h, m] = startT.split(':').map(Number);
      const endH = Math.min(h + 1, 23);
      const endT = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      setForm({ ...DEFAULT_FORM, date, start_time: startT, end_time: endT });
      setTypeSearch('Study Session');
      setShowRecurrence(false);
      setShowAdvanced(false);
    }
    setError(null);
  }, [isOpen, event, defaultDate, defaultStartTime]);

  const update = (key: keyof TimetableEventFormData, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleTypeSelect = (type: TimetableEventType) => {
    const config = EVENT_TYPE_CONFIG[type];
    setForm(prev => ({ ...prev, event_type: type, color_code: config.color }));
    setTypeSearch(EVENT_TYPE_LABELS[type]);
    setShowTypeDropdown(false);
  };

  // Allow custom event type (not one of the 8 predefined)
  const handleTypeInputChange = (value: string) => {
    setTypeSearch(value);
    setShowTypeDropdown(true);

    // Check if value matches a predefined type exactly (by label)
    const matchedType = (Object.entries(EVENT_TYPE_LABELS) as [string, string][]).find(
      ([, label]) => label.toLowerCase() === value.toLowerCase().trim()
    );
    if (matchedType) {
      const type = matchedType[0] as TimetableEventType;
      const config = EVENT_TYPE_CONFIG[type];
      setForm(prev => ({ ...prev, event_type: type, color_code: config.color }));
    } else {
      // Custom type: use the raw value as the event type, keep default color
      setForm(prev => ({ ...prev, event_type: 'study' as TimetableEventType }));
    }
  };

  const handleRecurrenceChange = (freq: string) => {
    if (freq === 'none') {
      update('is_recurring', false);
      update('recurrence_rule', null);
    } else {
      update('is_recurring', true);
      const rule: RecurrenceRule = {
        frequency: freq as RecurrenceRule['frequency'],
        interval: 1,
        days_of_week: freq === 'weekly' ? [new Date().getDay()] : undefined,
        end_date: null,
      };
      update('recurrence_rule', rule);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Event title is required.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const config = EVENT_TYPE_CONFIG[form.event_type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border"
        style={{
          backgroundColor: 'var(--background-card)',
          borderColor: 'var(--border)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Day event count cap warning */}
          {!event && dayEventCount !== undefined && dayEventCount >= 20 && (
            <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-2">
              <AlertCircle size={14} />
              <span>
                This day already has {dayEventCount} events. Consider spreading your schedule across other days.
              </span>
            </div>
          )}

          {/* ── Always-visible fields ── */}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">Title *</label>
            <input
              id="event-title"
              type="text"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Event title"
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm placeholder-foreground-muted border outline-none focus:ring-2 transition-all"
              style={{
                color: 'var(--foreground)',
                backgroundColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                borderColor: 'var(--border)',
              }}
              onFocus={e => { e.target.style.borderColor = config.color; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
            />
          </div>

          {/* Event Type — Searchable Autocomplete */}
          <div className="relative">
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">Event Type</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--foreground-muted)' }} />
              <input
                ref={typeInputRef}
                id="event-type-search"
                type="text"
                value={typeSearch}
                onChange={e => handleTypeInputChange(e.target.value)}
                onFocus={() => setShowTypeDropdown(true)}
                placeholder="Search or type event type..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border outline-none transition-all"
                style={{
                  color: 'var(--foreground)',
                  backgroundColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                  borderColor: 'var(--border)',
                }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = config.color; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                autoComplete="off"
              />
            </div>

            {/* Dropdown suggestions */}
            {showTypeDropdown && (
              <div
                ref={typeDropdownRef}
                className="absolute z-50 left-0 right-0 mt-1 rounded-xl border overflow-hidden shadow-xl"
                style={{
                  backgroundColor: 'var(--background-card)',
                  borderColor: 'var(--border)',
                  maxHeight: 200,
                }}
              >
                <div className="overflow-y-auto max-h-[200px] py-1">
                  {filteredTypes.length > 0 ? (
                    filteredTypes.map(type => {
                      const c = EVENT_TYPE_CONFIG[type];
                      const isActive = form.event_type === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onMouseDown={e => { e.preventDefault(); handleTypeSelect(type); }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                          style={{
                            backgroundColor: isActive ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'transparent',
                            color: isActive ? c.color : 'var(--foreground)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--border) 40%, transparent)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'transparent'; }}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="flex-1 text-left">{c.label}</span>
                          {isActive && (
                            <span className="text-[10px] font-medium" style={{ color: c.color }}>Selected</span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-sm text-foreground-muted">
                      Type &ldquo;{typeSearch}&rdquo; as custom event type
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Time Mode + Date/Time */}
          <div>
            <div className="flex gap-2 mb-3">
              {(['timed', 'all_day', 'deadline'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => update('time_mode', mode)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex-1"
                  style={{
                    backgroundColor: form.time_mode === mode ? 'color-mix(in srgb, var(--primary) 30%, transparent)' : 'color-mix(in srgb, var(--border) 40%, transparent)',
                    borderColor: form.time_mode === mode ? 'var(--primary)' : 'color-mix(in srgb, var(--border) 70%, transparent)',
                    color: form.time_mode === mode ? 'var(--primary)' : 'var(--foreground-muted)',
                  }}
                >
                  {mode === 'timed' ? 'Timed' : mode === 'all_day' ? 'All Day' : 'Deadline'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={form.time_mode === 'timed' ? 'col-span-1' : 'col-span-3'}>
                <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                  {form.time_mode === 'deadline' ? 'Due Date' : 'Date'}
                </label>
                <input
                  id="event-date"
                  type="date"
                  value={form.date}
                  onChange={e => update('date', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all"
                  style={{
                    color: 'var(--foreground)',
                    backgroundColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                    borderColor: 'var(--border)',
                    colorScheme: 'dark',
                  }}
                />
              </div>
              {form.time_mode === 'timed' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-1.5">Start</label>
                    <input
                      id="event-start-time"
                      type="time"
                      value={form.start_time}
                      onChange={e => update('start_time', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                      style={{
                        color: 'var(--foreground)',
                        backgroundColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                        borderColor: 'var(--border)',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-1.5">End</label>
                    <input
                      id="event-end-time"
                      type="time"
                      value={form.end_time}
                      onChange={e => update('end_time', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                      style={{
                        color: 'var(--foreground)',
                        backgroundColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                        borderColor: 'var(--border)',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>
                </>
              )}
              {form.time_mode === 'deadline' && (
                <div>
                  <label className="block text-xs font-medium text-foreground-muted mb-1.5">Due Time</label>
                  <input
                    id="event-due-time"
                    type="time"
                    value={form.end_time}
                    onChange={e => update('end_time', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                    style={{
                      color: 'var(--foreground)',
                      backgroundColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                      borderColor: 'var(--border)',
                      colorScheme: 'dark',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* To-Do Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Mark as To-Do</p>
              <p className="text-xs text-foreground-muted mt-0.5">Shows a completion checkbox on the event</p>
            </div>
            <button
              type="button"
              onClick={() => update('is_todo', !form.is_todo)}
              id="event-todo-toggle"
              className="relative w-11 h-6 rounded-full border transition-all shrink-0"
              style={{
                backgroundColor: form.is_todo ? config.color : 'var(--border)',
                borderColor: form.is_todo ? config.color : 'var(--border)',
              }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                style={{ left: form.is_todo ? '22px' : '2px' }}
              />
            </button>
          </div>

          {/* Recurrence */}
          <div className="border-t pt-4" style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}>
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium w-full py-1 transition-colors"
              style={{ color: showRecurrence ? 'var(--foreground)' : 'var(--foreground-muted)' }}
              onClick={() => setShowRecurrence(s => !s)}
            >
              <RotateCcw size={14} />
              Recurrence
              {showRecurrence ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
            </button>
            {showRecurrence && (
              <div
                className="mt-3 p-4 rounded-xl space-y-3 border"
                style={{ backgroundColor: 'color-mix(in srgb, var(--border) 40%, transparent)', borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
              >
                <div>
                  <label className="block text-xs font-medium text-foreground-muted mb-1.5">Repeat</label>
                  <select
                    id="event-recurrence-freq"
                    value={form.recurrence_rule?.frequency ?? 'none'}
                    onChange={e => handleRecurrenceChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                    style={{ color: 'var(--foreground)', backgroundColor: 'color-mix(in srgb, var(--border) 70%, transparent)', borderColor: 'var(--border)' }}
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom (every N days)</option>
                  </select>
                </div>
                {form.recurrence_rule && (
                  <>
                    {form.recurrence_rule.frequency === 'custom' && (
                      <div>
                        <label className="block text-xs font-medium text-foreground-muted mb-1.5">Every (days)</label>
                        <input
                          type="number" min={1} max={365}
                          value={form.recurrence_rule.interval}
                          onChange={e => update('recurrence_rule', { ...form.recurrence_rule!, interval: Number(e.target.value) })}
                          className="w-24 px-3 py-2 rounded-lg text-sm border outline-none"
                          style={{ color: 'var(--foreground)', backgroundColor: 'color-mix(in srgb, var(--border) 70%, transparent)', borderColor: 'var(--border)' }}
                        />
                        <span className="text-xs text-foreground-muted ml-2">day(s)</span>
                      </div>
                    )}
                    {form.recurrence_rule.frequency === 'weekly' && (
                      <div>
                        <label className="block text-xs font-medium text-foreground-muted mb-1.5">On days</label>
                        <div className="flex gap-1">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => {
                            const isActive = form.recurrence_rule?.days_of_week?.includes(idx);
                            return (
                              <button key={day} type="button"
                                onClick={() => {
                                  const days = form.recurrence_rule?.days_of_week ?? [];
                                  const newDays = isActive ? days.filter(d => d !== idx) : [...days, idx];
                                  update('recurrence_rule', { ...form.recurrence_rule!, days_of_week: newDays });
                                }}
                                className="w-8 h-8 rounded-full text-xs font-medium border transition-all"
                                style={{ backgroundColor: isActive ? config.bgColor : 'color-mix(in srgb, var(--border) 40%, transparent)', borderColor: isActive ? config.color : 'color-mix(in srgb, var(--border) 70%, transparent)', color: isActive ? config.color : 'var(--foreground-muted)' }}
                              >{day}</button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-foreground-muted mb-1.5">Ends</label>
                      <div className="flex gap-2 items-center">
                        <input type="date" value={form.recurrence_rule.end_date ?? ''}
                          onChange={e => update('recurrence_rule', { ...form.recurrence_rule!, end_date: e.target.value || null })}
                          className="px-3 py-2 rounded-lg text-sm border outline-none"
                          style={{ color: 'var(--foreground)', backgroundColor: 'color-mix(in srgb, var(--border) 70%, transparent)', borderColor: 'var(--border)', colorScheme: 'dark' }}
                        />
                        <span className="text-xs text-foreground-muted">or never if blank</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── More Options Toggle ── */}
          <div className="border-t pt-4" style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}>
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium w-full py-1 transition-colors"
              style={{ color: showAdvanced ? 'var(--foreground)' : 'var(--foreground-muted)' }}
              onClick={() => setShowAdvanced(s => !s)}
            >
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              More options
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 pl-1 border-l-2" style={{ borderColor: 'var(--border)' }}>
                {/* Subject & Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-1.5">Subject</label>
                    <input
                      id="event-subject"
                      type="text"
                      value={form.subject}
                      onChange={e => update('subject', e.target.value)}
                      placeholder="e.g. Physics"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground placeholder-foreground-muted border outline-none"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--border) 50%, transparent)', borderColor: 'var(--border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground-muted mb-1.5">Location</label>
                    <input
                      id="event-location"
                      type="text"
                      value={form.location}
                      onChange={e => update('location', e.target.value)}
                      placeholder="e.g. Room 204"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground placeholder-foreground-muted border outline-none"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--border) 50%, transparent)', borderColor: 'var(--border)' }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-foreground-muted mb-1.5">Description</label>
                  <textarea
                    id="event-description"
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    placeholder="Optional notes..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-foreground placeholder-foreground-muted border outline-none resize-none"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--border) 50%, transparent)', borderColor: 'var(--border)' }}
                  />
                </div>

                {/* Colour */}
                <div>
                  <label className="block text-xs font-medium text-foreground-muted mb-1.5">Colour</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOUR_PRESETS.map(colour => (
                      <button
                        key={colour}
                        type="button"
                        onClick={() => update('color_code', colour)}
                        className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: colour,
                          borderColor: form.color_code === colour ? 'white' : 'transparent',
                        }}
                        title={colour}
                      />
                    ))}
                    <input
                      type="color"
                      value={form.color_code}
                      onChange={e => update('color_code', e.target.value)}
                      className="w-6 h-6 rounded-full cursor-pointer border-0 outline-none bg-transparent"
                      title="Custom colour"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2">
            {event && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                id="event-delete-btn"
                className="px-4 py-2.5 rounded-xl text-sm font-medium border text-red-400 border-red-500/20 hover:bg-red-500/10 transition-all"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border text-foreground-muted hover:text-foreground transition-all"
              style={{ borderColor: 'var(--border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="event-save-btn"
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
                boxShadow: `0 4px 15px ${config.color}40`,
              }}
            >
              {isSaving ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
