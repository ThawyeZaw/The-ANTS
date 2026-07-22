'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — MetadataPanel
// Slide-over panel for note metadata (curriculum, subject, topic, tags, etc.)
// ──────────────────────────────────────────────────────────────────────────────

import { X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockCurriculums, mockSubjects, mockTopics } from '@/lib/mock/database';
import type { NoteEditorState } from '@/types';

interface MetadataPanelProps {
  open: boolean;
  onClose: () => void;
  state: NoteEditorState;
  setField: <K extends keyof NoteEditorState>(key: K, value: NoteEditorState[K]) => void;
  isReadOnly: boolean;
}

export default function MetadataPanel({ open, onClose, state, setField, isReadOnly }: MetadataPanelProps) {
  const filteredSubjects = state.curriculumId
    ? mockSubjects.filter((s) => s.curriculum_id === state.curriculumId)
    : mockSubjects;

  const filteredTopics = state.subjectId
    ? mockTopics.filter((t) => t.subject_id === state.subjectId)
    : [];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[var(--background-card)] border-l border-[var(--border)] shadow-2xl flex flex-col animate-slide-down"
        role="dialog"
        aria-label="Note settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Note Settings</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer focus-ring"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              Summary
            </label>
            <textarea
              value={state.summary}
              onChange={(e) => setField('summary', e.target.value)}
              disabled={isReadOnly}
              rows={2}
              placeholder="Brief description for library cards..."
              className="w-full px-3 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)]/60 transition-all disabled:opacity-60 resize-none"
            />
          </div>

          {/* Curriculum & Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              Curriculum & Subject
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={state.curriculumId ?? ''}
                onChange={(e) => setField('curriculumId', e.target.value || null)}
                disabled={isReadOnly}
                className="px-3 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 cursor-pointer disabled:opacity-60"
              >
                <option value="">No Curriculum</option>
                {mockCurriculums.map((c) => (
                  <option key={c.id} value={c.id}>{c.qualification} — {c.exam_board}</option>
                ))}
              </select>
              <select
                value={state.subjectId ?? ''}
                onChange={(e) => setField('subjectId', e.target.value || null)}
                disabled={isReadOnly || !state.curriculumId}
                className="px-3 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 cursor-pointer disabled:opacity-60"
              >
                <option value="">No Subject</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic & Exam Board */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              Topic & Exam Board
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={state.topicId ?? ''}
                onChange={(e) => setField('topicId', e.target.value || null)}
                disabled={isReadOnly || !state.subjectId}
                className="px-3 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 cursor-pointer disabled:opacity-60"
              >
                <option value="">No Topic</option>
                {filteredTopics.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <select
                value={state.examBoard ?? ''}
                onChange={(e) => setField('examBoard', e.target.value || null)}
                disabled={isReadOnly}
                className="px-3 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 cursor-pointer disabled:opacity-60"
              >
                <option value="">Select Board...</option>
                <option value="CAIE">CAIE (Cambridge)</option>
                <option value="Edexcel">Edexcel</option>
                <option value="AQA">AQA</option>
                <option value="OCR">OCR</option>
                <option value="WJEC">WJEC</option>
                <option value="IB">IB</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Syllabus point */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              Syllabus Reference
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => !isReadOnly && setField('isSyllabusBased', !state.isSyllabusBased)}
                className={cn(
                  'relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0',
                  state.isSyllabusBased ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                )}
                role="switch"
                aria-checked={state.isSyllabusBased}
                aria-label="Toggle syllabus-based"
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    state.isSyllabusBased ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </button>
              <span className="text-sm text-[var(--foreground-secondary)]">Spec-Based</span>
            </div>
            {state.isSyllabusBased && (
              <input
                type="text"
                value={state.syllabusPoint}
                onChange={(e) => setField('syllabusPoint', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 1.5.3 — Newton's Third Law"
                className="w-full px-3 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 transition-all mt-2"
              />
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              <Tag className="h-3.5 w-3.5 text-[var(--foreground-muted)] mt-1 shrink-0" />
              {state.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-secondary)] px-2.5 py-1 rounded-full"
                >
                  #{tag}
                  {!isReadOnly && (
                    <button
                      onClick={() => setField('tags', state.tags.filter((t) => t !== tag))}
                      className="cursor-pointer hover:text-[var(--error)] transition-colors focus-ring rounded-full"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
              {!isReadOnly && (
                <input
                  type="text"
                  placeholder="Add tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const t = (e.currentTarget.value).trim().toLowerCase();
                      if (t && !state.tags.includes(t)) {
                        setField('tags', [...state.tags, t]);
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                  className="text-xs px-2.5 py-1 rounded-full bg-[var(--background-secondary)] border border-dashed border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/60 w-24 transition-all"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors cursor-pointer focus-ring"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
