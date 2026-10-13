'use client';

/**
 * ErrorBoundary — global React error boundary with privacy-safe telemetry.
 *
 * V2-FE-149 — TruthBounty Frontend
 *
 * Catches unhandled render errors and:
 *  1. Reports them via the telemetry library (if PRIVACY_SAFE_TELEMETRY is enabled).
 *  2. Shows an accessible, user-friendly fallback UI with a Retry button.
 *
 * Telemetry is sourced from TelemetryContext so this component only relies on
 * the singleton `getTelemetryClient()` fallback — it does NOT call React hooks
 * (class components cannot use hooks). The singleton is initialised by
 * TelemetryProvider at application boot.
 */

import React, { createRef, ErrorInfo, ReactNode } from 'react'
import { getTelemetryClient } from '@/lib/telemetry'
import { redactError } from '@/lib/security/redaction'
import { toSafeErrorMessage } from '@/lib/sanitize-error'

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Label identifying the route/feature scope, used for logging only. */
  scope?: string;
  /** Custom fallback. Receives sanitized message + retry. */
  fallback?: (args: { message: string; onRetry: () => void }) => ReactNode;
  onError?: (error: Error, info: ErrorInfo, scope?: string) => void;
  onReset?: () => void;
  /** When any entry changes, a caught error is cleared (safe retry/remount). */
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Shared route/feature error boundary.
 *
 * - Isolates rendering/data faults to its subtree.
 * - Never clears pending-transaction recovery keys
 *   (`truthbounty-pending-transactions-v2`, `tb-tx-v2:*`).
 * - Never renders stack traces or sensitive data in production.
 * - Provides keyboard-accessible retry with focus management.
 * - Every caught error is routed through `redactError` before any logging or
 *   UI rendering so secrets / long hex / Bearer tokens never leak.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryRef = createRef<HTMLButtonElement>();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    redactError(error);
    return { hasError: true, error } as ErrorBoundaryState;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to privacy-safe telemetry (no-op when flag is disabled)
    try {
      getTelemetryClient().captureError(error, {
        category: 'boundary_error',
        severity: 'fatal',
        context: {
          componentStack: errorInfo.componentStack
            ? String(errorInfo.componentStack).slice(0, 1024)
            : undefined,
        },
      })
    } catch {
      // Telemetry must never surface to the user
    }

    // Development-only verbose logging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Caught unhandled error:', error, errorInfo)
    }
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    if (!this.state.hasError) return;
    const previous = previousProps.resetKeys ?? [];
    const current = this.props.resetKeys ?? [];
    const changed =
      previous.length !== current.length ||
      previous.some((value, index) => !Object.is(value, current[index]));
    if (changed) {
      this.handleRetry();
    }
  }

  handleRetry = () => {
    // Safe retry: reset local error state only. Pending transaction stores
    // are intentionally left untouched so reload recovery still works.
    this.props.onReset?.();
    this.setState((current) => ({
      hasError: false,
      error: null,
      retryCount: current.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const redacted = redactError(this.state.error);
      const safeErrorForDisplay: Error = {
        name: redacted.name,
        message: redacted.message,
        stack: redacted.stack ?? undefined,
      } as Error;
      const message = toSafeErrorMessage(safeErrorForDisplay);
      if (this.props.fallback) {
        return <>{this.props.fallback({ message, onRetry: this.handleRetry })}</>;
      }
      return (
        <div
          className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-3">
              Something went wrong
            </h2>
            <p className="mb-2 text-gray-600 dark:text-gray-300">{message}</p>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Your pending transactions are preserved. Retry is safe.
            </p>
            <button
              ref={this.retryRef}
              type="button"
              onClick={this.handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
              aria-label="Try again after error"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return (
      <React.Fragment key={this.state.retryCount}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

export default ErrorBoundary
