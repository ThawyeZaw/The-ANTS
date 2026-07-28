'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
}

export default class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-border bg-background-card p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {this.props.sectionName || 'This section'} failed to load
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                Try refreshing the page or check back later.
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
