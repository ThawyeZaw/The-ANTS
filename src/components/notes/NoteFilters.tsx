'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — NoteFilters
// Sidebar/header filter panel for the Notes Library.
// ──────────────────────────────────────────────────────────────────────────────

import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteFilters } from '@/types';
import { mockCurriculums, mockSubjects } from '@/lib/mock/database';

interface NoteFiltersProps {
  filters: NoteFilters;
  onFiltersChange: (filters: NoteFilters) => void;
}



export default function NoteFiltersPanel({ filters, onFiltersChange }: NoteFiltersProps) {
  const update = (partial: Partial<NoteFilters>) =>
    onFiltersChange({ ...filters, ...partial });

  const hasActiveFilters =
    filters.search ||
    filters.curriculumId ||
    filters.subjectId ||
    filters.isSyllabusBased !== null ||
    filters.tags.length > 0;

  const filteredSubjects = filters.curriculumId
    ? mockSubjects.filter((s) => s.curriculum_id === filters.curriculumId)
    : mockSubjects;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filters
        </div>
        {hasActiveFilters && (
          <button
            id="clear-note-filters"
            onClick={() => onFiltersChange({
              search: '',
              curriculumId: null,
              subjectId: null,
              isSyllabusBased: null,
              tags: [],
            })}
            className="text-xs text-foreground-muted hover:text-error transition-colors flex items-center gap-1 cursor-pointer"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
        <input
          id="notes-search"
          type="text"
          placeholder="Search notes…"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Curriculum */}
      <div>
        <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2 block">
          Curriculum
        </label>
        <select
          id="notes-filter-curriculum"
          value={filters.curriculumId ?? ''}
          onChange={(e) => update({ curriculumId: e.target.value || null, subjectId: null })}
          className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
        >
          <option value="">All Curricula</option>
          {mockCurriculums.map((c) => (
            <option key={c.id} value={c.id}>
              {c.qualification} — {c.exam_board}
            </option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div>
        <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2 block">
          Subject
        </label>
        <select
          id="notes-filter-subject"
          value={filters.subjectId ?? ''}
          onChange={(e) => update({ subjectId: e.target.value || null })}
          className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
        >
          <option value="">All Subjects</option>
          {filteredSubjects.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>


      {/* Syllabus-based toggle */}
      <div>
        <label className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2 block">
          Note Type
        </label>
        <div className="flex flex-col gap-2">
          {([
            { value: null,  label: 'All Notes' },
            { value: true,  label: 'Spec-Based Only' },
            { value: false, label: 'General Notes Only' },
          ] as const).map(({ value, label }) => (
            <button
              key={String(value)}
              id={`notes-filter-type-${String(value)}`}
              onClick={() => update({ isSyllabusBased: value })}
              className={cn(
                'w-full px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all duration-150 cursor-pointer',
                filters.isSyllabusBased === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background-secondary text-foreground-muted hover:border-border-hover'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
