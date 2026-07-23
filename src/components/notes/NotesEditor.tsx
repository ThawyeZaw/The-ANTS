'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — NotesEditor (Redesign v2)
//
// Layout structure:
//   ┌─────────────────────────────────────────────────┐
//   │ EditorToolbar (consolidated header with groups)  │
//   ├─────────────────────────────────────────────────┤
//   │           ┌─ Writing Canvas (centered) ─┐        │
//   │           │                              │        │
//   │           │  Title (inline, doc-style)   │        │
//   │           │                              │        │
//   │           │  BlockEditor                 │        │
//   │           │  (hover-reveal block chrome) │        │
//   │           │                              │        │
//   │           └──────────────────────────────┘        │
//   │                                                   │
//   │  Preview pane: slide-over from right (toggleable)  │
//   │  Metadata: slide-over panel from right             │
//   │  AI: single-panel modal (AIPromptGenerator)        │
//   └─────────────────────────────────────────────────┘
//
// All hook usage, data logic, and prop interfaces are unchanged from v1.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteBlock } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useNoteEditor } from '@/hooks/useNotes';
import EditorToolbar from './EditorToolbar';
import BlockEditor from './BlockEditor';
import BlockPreview from './BlockPreview';
import AIPromptGenerator from './AIPromptGenerator';
import MetadataPanel from './MetadataPanel';
import NoteSubmitModal from './NoteSubmitModal';

type ViewMode = 'editor' | 'preview' | 'split';

export default function NotesEditor() {
  const { user } = useAuth();
  const { isContributor, isMainContributor } = useRole();
  const canSubmit = isContributor || isMainContributor;
  const searchParams = useSearchParams();
  const existingId = searchParams.get('id') ?? undefined;

  const editor = useNoteEditor(existingId);
  const {
    state, setField, addBlock, updateBlock, deleteBlock,
    moveBlock, duplicateBlock, importParsedBlocks, saveDraft, submitForReview,
  } = editor;

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showAI, setShowAI] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const isReadOnly = false;

  const handleSave = useCallback(async () => {
    if (!user) return;
    const result = await saveDraft(user.id);
    setSaveStatus(result.success ? 'saved' : 'error');
    setTimeout(() => setSaveStatus('idle'), 2500);
  }, [user, saveDraft]);

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    setSubmitStatus('submitting');
    await saveDraft(user.id);
    const result = await submitForReview(user.id);
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

  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      editor.remove(user!.id);
      window.location.href = '/my-notes';
    }
  }, [user, editor]);

  const handleSubmitClick = useCallback(() => {
    handleSave();
    setShowSubmitModal(true);
  }, [handleSave]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden bg-[var(--background)]">
      {/* ── Toolbar ── */}
      <EditorToolbar
        title={state.title}
        onTitleChange={(v) => setField('title', v)}
        isReadOnly={isReadOnly}
        status={state.status}
        visibility={state.visibility}
        onVisibilityChange={(v) => setField('visibility', v)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        saveStatus={saveStatus}
        onSave={handleSave}
        onOpenAI={() => setShowAI(true)}
        onOpenMetadata={() => setShowMetadata(true)}
        noteId={state.noteId}
        onDelete={handleDelete}
        canSubmit={canSubmit}
        onSubmit={handleSubmitClick}
      />

      {/* ── Submit status banner ── */}
      {submitStatus === 'done' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Note submitted! It&apos;s now in the review queue. You&apos;ll be notified once a main contributor reviews it.
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Writing canvas (centered column) ── */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div
            className={cn(
              'flex-1 overflow-hidden flex justify-center',
              viewMode === 'split' ? '' : ''
            )}
          >
            <div className="w-full max-w-[760px] flex flex-col overflow-hidden mx-6">
              {/* Inline doc title */}
              <div className="shrink-0 pt-6 pb-2">
                <input
                  type="text"
                  value={state.title}
                  onChange={(e) => setField('title', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Untitled Note"
                  className="w-full text-[1.75rem] font-bold text-[var(--foreground)] bg-transparent border-none outline-none placeholder-[var(--foreground-muted)]/50 focus:outline-none"
                  aria-label="Note title"
                />
                {state.summary && (
                  <p className="mt-1 text-sm text-[var(--foreground-muted)] italic border-l-2 border-[var(--primary)]/30 pl-3">
                    {state.summary}
                  </p>
                )}
              </div>

              {/* Read-only banner */}
              {isReadOnly && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 mb-3 shrink-0">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  This note is locked — it is currently {state.status === 'pending_review' ? 'pending review' : state.status}.
                </div>
              )}

              {/* Block editor */}
              <div className="flex-1 overflow-hidden pb-6">
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

            {/* ── Divider between canvas and preview in split mode ── */}
            {viewMode === 'split' && (
              <div className="w-px bg-[var(--border)] shrink-0" />
            )}
          </div>
        )}

        {/* ── Preview pane (split mode: side-by-side; preview mode: full width) ── */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={cn(
              'flex flex-col overflow-hidden',
              viewMode === 'split' ? 'w-[42%] min-w-[340px]' : 'flex-1'
            )}
          >
            {/* Preview header */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--background-secondary)] shrink-0">
              <Eye className="h-4 w-4 text-[var(--foreground-muted)]" />
              <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">Preview</span>
              {viewMode === 'split' && (
                <span className="text-xs text-[var(--foreground-muted)] ml-auto opacity-60">Live</span>
              )}
            </div>

            {/* Preview content — document-like */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[680px] mx-auto px-6 py-6">
                {state.title && (
                  <h1 className="text-[1.75rem] font-bold text-[var(--foreground)] mb-2 leading-tight">{state.title}</h1>
                )}
                {state.summary && (
                  <p className="text-[var(--foreground-muted)] mb-8 text-sm italic border-l-2 border-[var(--primary)]/30 pl-3">{state.summary}</p>
                )}
                {state.blocks.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <div className="text-5xl opacity-30" aria-hidden="true">&#128214;</div>
                    <p className="text-[var(--foreground-muted)] text-sm">Your note will appear here as you add blocks.</p>
                  </div>
                ) : (
                  state.blocks.map((block) => (
                    <BlockPreview key={block.id} block={block} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide-over panels ── */}

      {/* Metadata Panel */}
      <MetadataPanel
        open={showMetadata}
        onClose={() => setShowMetadata(false)}
        state={state}
        setField={setField}
        isReadOnly={isReadOnly}
      />

      {/* Mobile preview panel (slide-over from right) */}
      {showPreview && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setShowPreview(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[var(--background-card)] border-l border-[var(--border)] shadow-2xl flex flex-col md:hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[var(--foreground-muted)]" />
                <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">Preview</span>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer focus-ring"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {state.title && (
                <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">{state.title}</h1>
              )}
              {state.summary && (
                <p className="text-[var(--foreground-muted)] mb-6 text-sm italic">{state.summary}</p>
              )}
              {state.blocks.length === 0 ? (
                <p className="text-[var(--foreground-muted)] text-sm text-center py-12">Nothing to preview yet</p>
              ) : (
                state.blocks.map((block) => (
                  <BlockPreview key={block.id} block={block} />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Modals ── */}

      {/* AI Generator */}
      {showAI && (
        <AIPromptGenerator
          onImportBlocks={handleImportBlocks}
          onClose={() => setShowAI(false)}
        />
      )}

      {/* Submit Modal */}
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
