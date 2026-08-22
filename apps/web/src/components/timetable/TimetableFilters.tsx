'use client';

import React from 'react';
import { X, Eye, EyeOff, Calendar } from 'lucide-react';
import type { TimetableFilters as TimetableFiltersType, TimetableEventType } from '@/types/timetable';
import { ALL_EVENT_TYPES, EVENT_TYPE_CONFIG } from '@/constants/timetable';

interface TimetableFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TimetableFiltersType;
  onToggleEventType: (type: TimetableEventType) => void;
  onToggleCompleted: () => void;
  onToggleExternalEvents: () => void;
  onResetFilters: () => void;
}

export default function TimetableFilters({
  isOpen,
  onClose,
  filters,
  onToggleEventType,
  onToggleCompleted,
  onToggleExternalEvents,
  onResetFilters,
}: TimetableFiltersProps) {
  if (!isOpen) return null;

  const activeTypeCount = filters.eventTypes.length;
  const totalTypes = ALL_EVENT_TYPES.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="absolute top-full right-0 mt-2 w-72 rounded-2xl border z-40 overflow-hidden shadow-2xl"
        style={{
          backgroundColor: 'var(--background-card)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
        >
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Filters</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetFilters}
              className="text-xs transition-colors hover:opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              Reset all
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Event Types */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-medium text-foreground-muted">Event Types</p>
              <span className="text-xs text-foreground-muted">{activeTypeCount}/{totalTypes} active</span>
            </div>
            <div className="space-y-1.5">
              {ALL_EVENT_TYPES.map(type => {
                const config = EVENT_TYPE_CONFIG[type];
                const isActive = filters.eventTypes.includes(type);
                return (
                  <button
                    key={type}
                    id={`filter-type-${type}`}
                    onClick={() => onToggleEventType(type)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all hover:border-white/15"
                    style={{
                      backgroundColor: isActive ? config.bgColor : 'color-mix(in srgb, var(--border) 30%, transparent)',
                      borderColor: isActive ? config.color + '60' : 'color-mix(in srgb, var(--border) 70%, transparent)',
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: config.color, opacity: isActive ? 1 : 0.3 }}
                    />
                    <span
                      className="text-xs font-medium flex-1 text-left"
                      style={{ color: isActive ? config.color : 'var(--foreground-muted)' }}
                    >
                      {config.label}
                    </span>
                    {isActive ? (
                      <Eye size={12} style={{ color: config.color }} />
                    ) : (
                      <EyeOff size={12} className="text-foreground-muted" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid color-mix(in srgb, var(--border) 70%, transparent)' }} />

          {/* Toggle Options */}
          <div className="space-y-2">
            {/* Show Completed Todos */}
            <button
              id="filter-show-completed"
              onClick={onToggleCompleted}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:border-white/15"
              style={{
                backgroundColor: filters.showCompleted ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'color-mix(in srgb, var(--border) 30%, transparent)',
                borderColor: filters.showCompleted ? 'color-mix(in srgb, var(--primary) 45%, transparent)' : 'color-mix(in srgb, var(--border) 70%, transparent)',
              }}
            >
              <div
                className="relative w-8 h-4 rounded-full border transition-all shrink-0"
                style={{
                  backgroundColor: filters.showCompleted ? 'var(--primary)' : 'var(--border)',
                  borderColor: filters.showCompleted ? 'var(--primary)' : 'var(--border)',
                }}
              >
                <span
                  className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform"
                  style={{ left: filters.showCompleted ? '18px' : '2px' }}
                />
              </div>
              <span className="text-xs text-foreground flex-1 text-left">Show completed to-dos</span>
            </button>

            {/* Show External Events */}
            <button
              id="filter-show-external"
              onClick={onToggleExternalEvents}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:border-white/15"
              style={{
                backgroundColor: filters.showExternalEvents ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'color-mix(in srgb, var(--border) 30%, transparent)',
                borderColor: filters.showExternalEvents ? 'color-mix(in srgb, var(--primary) 45%, transparent)' : 'color-mix(in srgb, var(--border) 70%, transparent)',
              }}
            >
              <div
                className="relative w-8 h-4 rounded-full border transition-all shrink-0"
                style={{
                  backgroundColor: filters.showExternalEvents ? 'var(--primary)' : 'var(--border)',
                  borderColor: filters.showExternalEvents ? 'var(--primary)' : 'var(--border)',
                }}
              >
                <span
                  className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform"
                  style={{ left: filters.showExternalEvents ? '18px' : '2px' }}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs text-foreground">Show connected events</p>
                <p className="text-[10px] text-foreground-muted">Exams, assignments, club events</p>
              </div>
              <Calendar size={12} className="text-foreground-muted shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
