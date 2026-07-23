'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — WorkspaceToast
// Lightweight notification system for workspace errors and status updates.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, action?: Toast['action']) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  clearToasts: () => {},
});

export function useWorkspaceToast() {
  return useContext(ToastContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function WorkspaceToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', action?: Toast['action']) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      setToasts(prev => [...prev.slice(-2), { id, message, type, action }]);
      setTimeout(() => removeToast(id), 5000);
    },
    [removeToast]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, clearToasts }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-slide-in-right',
              toast.type === 'success' && 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
              toast.type === 'error' && 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
              toast.type === 'warning' && 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
              toast.type === 'info' && 'bg-[var(--background-card)] border-[var(--border)] text-[var(--foreground)]',
            )}
          >
            <span className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="h-4 w-4" />}
              {toast.type === 'error' && <AlertTriangle className="h-4 w-4" />}
              {toast.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
              {toast.type === 'info' && <Info className="h-4 w-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">{toast.message}</p>
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    removeToast(toast.id);
                  }}
                  className="mt-1 text-xs font-semibold underline hover:no-underline cursor-pointer"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
