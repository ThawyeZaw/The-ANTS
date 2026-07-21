'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CreateDeckModal Component
// Owner: ZLH
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { X, Globe, Lock, Layers } from 'lucide-react';
import { createDeck } from '@/lib/mock/database';
import { mockCurriculums, mockSubjects } from '@/lib/mock/database';
import { QUALIFICATION_REGISTRY, LIVE_QUALIFICATIONS } from '@/constants/qualifications';
import type { Deck } from '@/types';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

const SUGGESTED_CATEGORIES = [
  'Physics', 'Chemistry', 'Biology', 'Mathematics', 'History',
  'Geography', 'English', 'Literature', 'Economics', 'IELTS',
  'Computer Science', 'Psychology', 'Art', 'Custom',
];

interface CreateDeckModalProps {
  userId: string;
  onClose: () => void;
  onCreated: (deck: Deck) => void;
}

export default function CreateDeckModal({ userId, onClose, onCreated }: CreateDeckModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [curriculumId, setCurriculumId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examBoard, setExamBoard] = useState('');
  const [syllabusCode, setSyllabusCode] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public' | 'link'>('private');
  const [error, setError] = useState('');

  const containerRef = useFocusTrap(true);

  const availableSubjects = curriculumId
    ? mockSubjects.filter(s => s.curriculum_id === curriculumId)
    : [];

  const finalCategory = category === 'Custom' ? customCategory : category;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Deck name is required.');
      return;
    }
    const deck = createDeck({
      owner_id: userId,
      name: name.trim(),
      description: description.trim() || undefined,
      category: finalCategory.trim() || undefined,
      curriculum_id: curriculumId || undefined,
      subject_id: subjectId || undefined,
      exam_board: examBoard || undefined,
      syllabus_code: syllabusCode || undefined,
      visibility: visibility,
      is_public: visibility === 'public',
      library_status: null,
    });
    onCreated(deck);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={containerRef}
        className="animate-fade-in-up w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-[var(--shadow-lg)]"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)]">
              <Layers size={20} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">New Flashcard Deck</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Organise your cards into a deck</p>
            </div>
          </div>
          <button
            id="create-deck-modal-close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Deck name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
              Deck Name <span className="text-red-400">*</span>
            </label>
            <input
              id="deck-name-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. IGCSE Physics Formulas"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
              Description <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
            </label>
            <textarea
              id="deck-description-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What will students learn from this deck?"
              rows={2}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
              Category <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SUGGESTED_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  id={`category-btn-${cat}`}
                  onClick={() => setCategory(category === cat ? '' : cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                    category === cat
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {category === 'Custom' && (
              <input
                id="custom-category-input"
                type="text"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              />
            )}
          </div>

          {/* Curriculum & Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
                Curriculum <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
              </label>
              <select
                id="curriculum-select"
                value={curriculumId}
                onChange={e => { setCurriculumId(e.target.value); setSubjectId(''); }}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              >
                <option value="">None</option>
                {mockCurriculums.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
                Subject <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
              </label>
              <select
                id="subject-select"
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                disabled={!curriculumId || availableSubjects.length === 0}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all disabled:opacity-50"
              >
                <option value="">None</option>
                {availableSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Board & Syllabus Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
                Exam Board <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
              </label>
              <select
                id="exam-board-select"
                value={examBoard}
                onChange={e => setExamBoard(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              >
                <option value="">None</option>
                {LIVE_QUALIFICATIONS.map(q => (
                  <option key={q.key} value={q.boardCode}>{q.boardCode} ({q.shortLabel})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
                Syllabus Code <span className="text-[var(--foreground-muted)] font-normal">(optional)</span>
              </label>
              <input
                id="syllabus-code-input"
                type="text"
                value={syllabusCode}
                onChange={e => setSyllabusCode(e.target.value)}
                placeholder="e.g. 0620"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="rounded-xl border border-[var(--border)] p-4">
            <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">Visibility</p>
            <div className="flex gap-2">
              <button
                type="button"
                id="visibility-private"
                onClick={() => setVisibility('private')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-sm font-medium transition-all ${
                  visibility === 'private'
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--primary)]'
                }`}
              >
                <Lock size={14} />
                Private
              </button>
              <button
                type="button"
                id="visibility-link"
                onClick={() => setVisibility('link')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-sm font-medium transition-all ${
                  visibility === 'link'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:border-blue-500'
                }`}
              >
                <Globe size={14} />
                Link
              </button>
              <button
                type="button"
                id="visibility-public"
                onClick={() => setVisibility('public')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-sm font-medium transition-all ${
                  visibility === 'public'
                    ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--accent)]'
                }`}
              >
                <Globe size={14} />
                Public
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-500 border border-red-100">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              id="create-deck-cancel"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="create-deck-submit"
              className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors shadow-[var(--shadow-md)]"
            >
              Create Deck
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
