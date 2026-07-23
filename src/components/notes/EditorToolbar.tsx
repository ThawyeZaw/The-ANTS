'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — EditorToolbar
// Consolidated toolbar for the Notes Editor with grouped primary/secondary actions.
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import {
  Save, Send, Sparkles, Eye, Edit3, BookOpen,
  CheckCircle, AlertCircle, Clock, Share2, Trash2,
  Settings2, ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteStatus, NoteVisibility } from '@/types';

type ViewMode = 'editor' | 'preview' | 'split';

interface EditorToolbarProps {
  /* Title */
  title: string;
  onTitleChange: (value: string) => void;
  isReadOnly: boolean;
  /* Status */
  status: NoteStatus;
  visibility: NoteVisibility;
  onVisibilityChange: (v: NoteVisibility) => void;
  /* View mode */
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  /* Save */
  saveStatus: 'idle' | 'saved' | 'error';
  onSave: () => void;
  /* AI */
  onOpenAI: () => void;
  /* Metadata */
  onOpenMetadata: () => void;
  /* Share */
  noteId: string | null;
  /* Delete */
  onDelete: () => void;
  /* Submit */
  canSubmit: boolean;
  onSubmit: () => void;
  /* Back */
  backHref?: string;
}

export default function EditorToolbar({
  title,
  onTitleChange,
  isReadOnly,
  status,
  visibility,
  onVisibilityChange,
  viewMode,
  onViewModeChange,
  saveStatus,
  onSave,
  onOpenAI,
  onOpenMetadata,
  noteId,
  onDelete,
  canSubmit,
  onSubmit,
  backHref = '/library',
}: EditorToolbarProps) {
  return (
    <header className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--background-card)] shrink-0">
      {/* ── Back ── */}
      <Link
        href={backHref}
        className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors shrink-0 p-1.5 rounded-lg hover:bg-[var(--background-secondary)] focus-ring"
        aria-label="Back to Library"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Library</span>
      </Link>

      {/* ── Status badge ── */}
      {status !== 'draft' && (
        <span
          className={cn(
            'text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0',
            status === 'pending_review' && 'bg-amber-500/10 text-amber-600',
            status === 'approved' && 'bg-emerald-500/10 text-emerald-600',
            status === 'rejected' && 'bg-red-500/10 text-red-600'
          )}
        >
          {status === 'pending_review' && <Clock className="h-3 w-3" />}
          {status === 'approved' && <CheckCircle className="h-3 w-3" />}
          {status === 'rejected' && <AlertCircle className="h-3 w-3" />}
          {status === 'pending_review'
            ? 'Pending Review'
            : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* ── Group: View mode toggle ── */}
      <div className="hidden md:flex items-center border border-[var(--border)] rounded-xl overflow-hidden shrink-0">
        {([
          { mode: 'editor' as ViewMode, icon: <Edit3 className="h-3.5 w-3.5" />, label: 'Edit' },
          { mode: 'split' as ViewMode, icon: <BookOpen className="h-3.5 w-3.5" />, label: 'Split' },
          { mode: 'preview' as ViewMode, icon: <Eye className="h-3.5 w-3.5" />, label: 'Preview' },
        ] as const).map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-ring rounded-none',
              viewMode === mode
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            )}
            aria-pressed={viewMode === mode}
          >
            {icon}
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Group: Secondary actions ── */}
      <div className="hidden sm:flex items-center gap-1">
        {/* Note Settings */}
        <button
          onClick={onOpenMetadata}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] text-xs font-medium transition-all shrink-0 cursor-pointer focus-ring"
          aria-label="Note settings"
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Settings</span>
        </button>

        {/* AI */}
        {!isReadOnly && (
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium hover:opacity-90 transition-opacity shrink-0 cursor-pointer focus-ring"
            aria-label="AI Generate"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">AI</span>
          </button>
        )}

        {/* Visibility */}
        <select
          value={visibility}
          onChange={(e) => onVisibilityChange(e.target.value as NoteVisibility)}
          disabled={isReadOnly}
          className={cn(
            'px-2 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 focus:outline-none',
            isReadOnly
              ? 'bg-transparent border border-transparent text-[var(--foreground-muted)] opacity-80'
              : 'bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] cursor-pointer'
          )}
          aria-label="Note visibility"
        >
          <option value="private">Private</option>
          <option value="link">Shared Link</option>
          <option value="public">Public</option>
        </select>

        {/* Copy Link */}
        {noteId && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/library/${noteId}`);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] text-xs font-medium transition-all shrink-0 cursor-pointer focus-ring"
            aria-label="Copy share link"
            title="Copy share link"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Delete */}
        {noteId && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer focus-ring border bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500/20"
            aria-label="Delete note"
            title="Delete note"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Group: Primary actions ── */}
      <div className="flex items-center gap-1.5">
        {/* Save */}
        {!isReadOnly && (
          <button
            onClick={onSave}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer focus-ring border',
              saveStatus === 'saved'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                : saveStatus === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-600'
                  : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)]'
            )}
          >
            {saveStatus === 'saved' ? (
              <>
                <CheckCircle className="h-3.5 w-3.5" /> Saved
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle className="h-3.5 w-3.5" /> Error
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </button>
        )}

        {/* Submit */}
        {!isReadOnly && canSubmit && status !== 'pending_review' && (
          <button
            onClick={onSubmit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium hover:opacity-90 transition-all shrink-0 cursor-pointer focus-ring"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Submit</span>
          </button>
        )}
      </div>
    </header>
  );
}
