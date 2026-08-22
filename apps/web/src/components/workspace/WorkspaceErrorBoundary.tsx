'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — WorkspaceErrorBoundary
// Catches render errors in the workspace and shows a user-friendly recovery UI.
// ──────────────────────────────────────────────────────────────────────────────

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class WorkspaceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-red-500/30 bg-red-500/5 p-12 text-center min-h-[300px]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertTriangle size={28} />
          </div>
          <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">
            Something went wrong
          </h3>
          <p className="mb-2 max-w-md text-sm text-[var(--foreground-secondary)]">
            An unexpected error occurred while loading this section. This may be temporary.
          </p>
          {this.state.error && (
            <p className="mb-4 max-w-md rounded-lg bg-[var(--background-secondary)] px-3 py-2 text-xs font-mono text-red-500 break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
