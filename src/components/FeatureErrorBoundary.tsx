'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  /** Optional: if provided, shows a "Go back" link */
  backHref?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[FeatureErrorBoundary] Error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-error" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h3>
          <p className="text-sm text-foreground-muted max-w-md mb-6">
            {this.props.fallbackMessage || 'An unexpected error occurred while loading this section. Please try again.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            {this.props.backHref && (
              <a
                href={this.props.backHref}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </a>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
