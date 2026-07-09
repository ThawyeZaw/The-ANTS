'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — NoteSubmitModal
// Confirmation modal for submitting a note to the review queue.
// ──────────────────────────────────────────────────────────────────────────────

import { Send, X, AlertCircle, CheckCircle } from 'lucide-react';

interface NoteSubmitModalProps {
  noteTitle: string;
  blockCount: number;
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export default function NoteSubmitModal({
  noteTitle,
  blockCount,
  onConfirm,
  onClose,
  isSubmitting = false,
}: NoteSubmitModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-background-card border border-border rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
              <Send className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-foreground">Submit for Review</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-600">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Before submitting</p>
              <p className="mt-1 opacity-80">
                Once submitted, you won't be able to edit this note until a main contributor has reviewed it.
                Make sure all content is accurate and complete.
              </p>
            </div>
          </div>

          {/* Note summary */}
          <div className="bg-background-secondary rounded-xl p-4 border border-border space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{noteTitle}</p>
                <p className="text-xs text-foreground-muted">{blockCount} content block{blockCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-foreground-muted">
            Your note will be added to the <strong className="text-foreground">Gatekeeper Review Queue</strong>.
            A main contributor will review and either approve, reject, or request revisions.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-background-secondary">
          <button
            id="submit-modal-cancel"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:text-foreground hover:border-border-hover disabled:opacity-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="submit-modal-confirm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
            ) : (
              <><Send className="h-4 w-4" /> Submit for Review</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
