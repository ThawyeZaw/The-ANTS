'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — NotesEditor
// Split-screen note editor: left = block editor, right = live preview.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Save, Send, Sparkles, Eye, Edit3, ArrowLeft, BookOpen, Share2,
  CheckCircle, AlertCircle, Clock, Plus, Tag, X, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteBlock } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useNoteEditor } from '@/hooks/useNotes';
import { mockCurriculums, mockSubjects, mockTopics } from '@/lib/mock/database';
import BlockEditor from './BlockEditor';
import BlockPreview from './BlockPreview';
import AIPromptGenerator from './AIPromptGenerator';
import NoteSubmitModal from './NoteSubmitModal';



type ViewMode = 'editor' | 'preview' | 'split';

export default function NotesEditor() {
  const { user } = useAuth();
  const { isContributor, isMainContributor } = useRole();
  const canSubmit = isContributor || isMainContributor;
  const searchParams = useSearchParams();
  const existingId = searchParams.get('id') ?? undefined;

  const editor = useNoteEditor(existingId);
  const { state, setField, addBlock, updateBlock, deleteBlock, moveBlock, duplicateBlock, importParsedBlocks, saveDraft, submitForReview } = editor;

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showAI, setShowAI] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [tagInput, setTagInput] = useState('');

  const filteredSubjects = state.curriculumId
    ? mockSubjects.filter((s) => s.curriculum_id === state.curriculumId)
    : mockSubjects;

  const filteredTopics = state.subjectId
    ? mockTopics.filter((t) => t.subject_id === state.subjectId)
    : [];

  const handleSave = useCallback(() => {
    if (!user) return;
    const result = saveDraft(user.id);
    setSaveStatus(result.success ? 'saved' : 'error');
    setTimeout(() => setSaveStatus('idle'), 2500);
  }, [user, saveDraft]);

  const handleSubmit = useCallback(() => {
    if (!user) return;
    setSubmitStatus('submitting');
    // Auto-save first
    saveDraft(user.id);
    const result = submitForReview(user.id);
    if (result.success) {
      setSubmitStatus('done');
    } else {
      setSubmitStatus('error');
    }
    setShowSubmitModal(false);
  }, [user, saveDraft, submitForReview]);

  const handleImportBlocks = useCallback((blocks: NoteBlock[]) => {
    importParsedBlocks(blocks);
  }, [importParsedBlocks]);

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !state.tags.includes(t)) {
      setField('tags', [...state.tags, t]);
    }
    setTagInput('');
  };

  const isReadOnly = false; // All notes can now be edited by their owner

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
      {/* ── Top toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background-card shrink-0">
        {/* Back */}
        <Link href="/library"
          className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Library</span>
        </Link>

        {/* Title input */}
        <input
          type="text"
          value={state.title}
          onChange={(e) => setField('title', e.target.value)}
          disabled={isReadOnly}
          placeholder="Note title…"
          className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-background-secondary border border-border text-base font-semibold text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary/60 transition-all disabled:opacity-60"
        />

        {/* Status badge */}
        {state.status !== 'draft' && (
          <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0',
            state.status === 'pending_review' && 'bg-amber-500/10 text-amber-600',
            state.status === 'approved' && 'bg-emerald-500/10 text-emerald-600',
            state.status === 'rejected' && 'bg-red-500/10 text-red-600'
          )}>
            {state.status === 'pending_review' && <Clock className="h-3 w-3" />}
            {state.status === 'approved' && <CheckCircle className="h-3 w-3" />}
            {state.status === 'rejected' && <AlertCircle className="h-3 w-3" />}
            {state.status === 'pending_review' ? 'Pending Review' : state.status.charAt(0).toUpperCase() + state.status.slice(1)}
          </span>
        )}

        {/* View mode toggle */}
        <div className="hidden md:flex items-center border border-border rounded-xl overflow-hidden shrink-0">
          {([
            { mode: 'editor' as ViewMode, icon: <Edit3 className="h-3.5 w-3.5" />, label: 'Edit' },
            { mode: 'split' as ViewMode,  icon: <BookOpen className="h-3.5 w-3.5" />, label: 'Split' },
            { mode: 'preview' as ViewMode, icon: <Eye className="h-3.5 w-3.5" />, label: 'Preview' },
          ] as const).map(({ mode, icon, label }) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                viewMode === mode ? 'bg-primary text-white' : 'text-foreground-muted hover:text-foreground'
              )}>
              {icon} <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* AI generator */}
        {!isReadOnly && (
          <button
            id="notes-editor-ai"
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Generate</span>
          </button>
        )}

        {/* Visibility */}
        <select
          value={state.visibility}
          onChange={(e) => setField('visibility', e.target.value as any)}
          disabled={isReadOnly}
          className={cn(
            "px-2 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 focus:outline-none",
            isReadOnly 
              ? "bg-transparent border border-transparent text-foreground-muted opacity-80" 
              : "bg-background-secondary border border-border text-foreground-muted hover:text-foreground hover:border-border-hover cursor-pointer"
          )}
        >
          <option value="private">🔒 Private</option>
          <option value="link">🔗 Shared Link</option>
          <option value="public">📚 Public</option>
        </select>

        {/* Delete */}
        {state.noteId && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
                editor.remove(user!.id);
                window.location.href = '/my-notes';
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}

        {/* Save */}
        {!isReadOnly && (
          <button
            id="notes-editor-save"
            onClick={handleSave}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border',
              saveStatus === 'saved'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                : saveStatus === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-600'
                : 'bg-background-secondary border-border text-foreground-muted hover:text-foreground hover:border-border-hover'
            )}
          >
            {saveStatus === 'saved' ? <><CheckCircle className="h-3.5 w-3.5" /> Saved</> :
             saveStatus === 'error' ? <><AlertCircle className="h-3.5 w-3.5" /> Error</> :
             <><Save className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Save</span></>}
          </button>
        )}

        {/* Copy Link / Share */}
        {state.noteId && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/library/${state.noteId}`);
              alert('Link copied to clipboard!');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-secondary border border-border text-foreground-muted hover:text-foreground hover:border-border-hover text-xs font-medium transition-all shrink-0 cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copy Link</span>
          </button>
        )}

        {/* Submit */}
        {!isReadOnly && canSubmit && state.status !== 'pending_review' && (
          <button
            id="notes-editor-submit"
            onClick={() => {
              handleSave();
              setShowSubmitModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium hover:opacity-90 transition-all shrink-0 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Submit</span>
          </button>
        )}
      </div>

      {/* ── Submit status banner ── */}
      {submitStatus === 'done' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Note submitted! It's now in the review queue. You'll be notified once a main contributor reviews it.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel: Metadata + Block Editor ── */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={cn(
            'flex flex-col overflow-hidden border-r border-border',
            viewMode === 'split' ? 'w-1/2' : 'w-full'
          )}>
            {/* Metadata section */}
            <div className="p-4 border-b border-border bg-background-secondary space-y-3 shrink-0">
              <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Note Metadata</p>

              {/* Summary */}
              <input type="text" value={state.summary}
                onChange={(e) => setField('summary', e.target.value)}
                disabled={isReadOnly}
                placeholder="Short summary (shown on library cards)…"
                className="w-full px-3 py-2 rounded-xl bg-background-card border border-border text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary/60 transition-all disabled:opacity-60"
              />

              {/* Curriculum & Subject */}
              <div className="grid grid-cols-2 gap-2">
                <select value={state.curriculumId ?? ''}
                  onChange={(e) => setField('curriculumId', e.target.value || null)}
                  disabled={isReadOnly}
                  className="px-3 py-2 rounded-xl bg-background-card border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer disabled:opacity-60">
                  <option value="">No Curriculum</option>
                  {mockCurriculums.map((c) => <option key={c.id} value={c.id}>{c.qualification} — {c.exam_board}</option>)}
                </select>
                <select value={state.subjectId ?? ''}
                  onChange={(e) => setField('subjectId', e.target.value || null)}
                  disabled={isReadOnly || !state.curriculumId}
                  className="px-3 py-2 rounded-xl bg-background-card border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer disabled:opacity-60">
                  <option value="">No Subject</option>
                  {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>

              {/* Topic */}
              <div>
                <select value={state.topicId ?? ''}
                  onChange={(e) => setField('topicId', e.target.value || null)}
                  disabled={isReadOnly || !state.subjectId}
                  className="w-full px-3 py-2 rounded-xl bg-background-card border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer disabled:opacity-60">
                  <option value="">No Topic</option>
                  {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>

              {/* Syllabus point */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => !isReadOnly && setField('isSyllabusBased', !state.isSyllabusBased)}
                  className={cn('relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0', state.isSyllabusBased ? 'bg-violet-500' : 'bg-border')}
                >
                  <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', state.isSyllabusBased ? 'translate-x-4' : 'translate-x-0.5')} />
                </button>
                <span className="text-xs text-foreground-muted shrink-0">Spec-Based</span>
                {state.isSyllabusBased && (
                  <input type="text" value={state.syllabusPoint}
                    onChange={(e) => setField('syllabusPoint', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 1.5.3 — Newton's Third Law"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-background-card border border-border text-xs font-mono text-foreground focus:outline-none focus:border-violet-500/60 transition-all"
                  />
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <Tag className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
                {state.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-background-card border border-border text-foreground-muted px-2 py-0.5 rounded-full">
                    #{tag}
                    {!isReadOnly && (
                      <button onClick={() => setField('tags', state.tags.filter((t) => t !== tag))} className="cursor-pointer hover:text-error transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
                {!isReadOnly && (
                  <input type="text" value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Add tag…"
                    className="text-xs px-2 py-0.5 rounded-full bg-background-card border border-dashed border-border text-foreground focus:outline-none focus:border-primary/60 w-24 transition-all"
                  />
                )}
              </div>
            </div>

            {/* Block editor */}
            <div className="flex-1 overflow-hidden p-4">
              {isReadOnly ? (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 mb-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  This note is locked — it is currently {state.status === 'pending_review' ? 'pending review' : state.status}.
                </div>
              ) : null}
              <BlockEditor
                blocks={state.blocks}
                onUpdateBlock={updateBlock}
                onDeleteBlock={deleteBlock}
                onMoveBlock={moveBlock}
                onDuplicateBlock={duplicateBlock}
                onAddBlock={addBlock}
              />
            </div>
          </div>
        )}

        {/* ── Right panel: Live preview ── */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={cn(
            'flex flex-col overflow-hidden',
            viewMode === 'split' ? 'w-1/2' : 'w-full'
          )}>
            <div className="px-4 py-2 border-b border-border bg-background-secondary flex items-center gap-2 shrink-0">
              <Eye className="h-4 w-4 text-foreground-muted" />
              <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Preview</span>
              {viewMode === 'split' && (
                <span className="text-xs text-foreground-muted ml-auto opacity-60">Live</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {state.title && (
                <h1 className="text-2xl font-bold text-foreground mb-4">{state.title}</h1>
              )}
              {state.summary && (
                <p className="text-foreground-muted mb-6 text-sm italic border-l-2 border-primary/30 pl-3">{state.summary}</p>
              )}
              {state.blocks.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="text-5xl">📖</div>
                  <p className="text-foreground-muted text-sm">Your note will appear here as you add blocks.</p>
                </div>
              ) : (
                state.blocks.map((block) => (
                  <BlockPreview key={block.id} block={block} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAI && (
        <AIPromptGenerator
          onImportBlocks={handleImportBlocks}
          onClose={() => setShowAI(false)}
        />
      )}

      {showSubmitModal && (
        <NoteSubmitModal
          noteTitle={state.title || 'Untitled Note'}
          blockCount={state.blocks.length}
          onConfirm={handleSubmit}
          onClose={() => setShowSubmitModal(false)}
          isSubmitting={submitStatus === 'submitting'}
        />
      )}
    </div>
  );
}
