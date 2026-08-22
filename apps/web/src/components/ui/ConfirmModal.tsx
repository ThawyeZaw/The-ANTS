'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Confirm Modal
// Branded confirmation dialog used instead of window.confirm().
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ConfirmModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Modal title */
  title: string;
  /** Modal message/description */
  message: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Whether the confirm action is destructive (shows danger styling) */
  destructive?: boolean;
  /** Called when user clicks confirm */
  onConfirm: () => void;
  /** Called when user clicks cancel or closes modal */
  onCancel: () => void;
  /** Whether the confirm action is loading */
  loading?: boolean;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap & escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  // Prevent background scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-2xl animate-fade-in"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 cursor-pointer rounded-lg p-1.5 text-[var(--foreground-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
            destructive
              ? 'bg-[var(--error)]/10 text-[var(--error)]'
              : 'bg-[var(--primary)]/10 text-[var(--primary)]'
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>

        {/* Title */}
        <h2
          id="confirm-modal-title"
          className="text-center text-lg font-bold text-[var(--foreground)]"
        >
          {title}
        </h2>

        {/* Message */}
        <p className="mt-2 text-center text-sm text-[var(--foreground-secondary)]">
          {message}
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
          <Button variant="secondary" onClick={onCancel} fullWidth>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={loading}
            fullWidth
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
