import React, { Component, ReactNode, ErrorInfo } from "react";
import { captureException, showFeedbackWidget } from "../utils/sentryLogger";
// Sentry error boundary render handler
interface Props { children: ReactNode; fallback?: ReactNode; }
// Sentry error boundary render handler
interface State { hasError: boolean; error: Error | null; eventId: string | null; }
// Sentry error boundary render handler
export class SentryErrorBoundary extends Component<Props, State> {
// Sentry error boundary render handler
  public state: State = { hasError: false, error: null, eventId: null };
// Sentry error boundary render handler
  public static getDerivedStateFromError(error: Error): State { return { hasError: true, error, eventId: null }; }
// Sentry error boundary render handler
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
// Sentry error boundary render handler
    const eventId = captureException(error, { category: "react-error-boundary", extra: { componentStack: errorInfo.componentStack } });
// Sentry error boundary render handler
    this.setState({ eventId });
// Sentry error boundary render handler
  }
// Sentry error boundary render handler
  private handleReportFeedback = (): void => { showFeedbackWidget(); };
// Sentry error boundary render handler
  private handleReset = (): void => { this.setState({ hasError: false, error: null, eventId: null }); };
// Sentry error boundary render handler
  public render(): ReactNode {
// Sentry error boundary render handler
    if (this.state.hasError) {
// Sentry error boundary render handler
      if (this.props.fallback) return this.props.fallback;
// Sentry error boundary render handler
      return (
// Sentry error boundary render handler
        <div className="p-6 m-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-100">
// Sentry error boundary render handler
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
// Sentry error boundary render handler
          <p className="text-slate-400 text-sm mb-4">An error occurred and has been captured by Sentry.</p>
// Sentry error boundary render handler
          <div className="flex gap-2">
// Sentry error boundary render handler
            <button onClick={this.handleReset} className="px-4 py-2 bg-indigo-600 rounded text-sm font-medium">Try Again</button>
// Sentry error boundary render handler
            <button onClick={this.handleReportFeedback} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm">Submit Feedback</button>
// Sentry error boundary render handler
          </div>
// Sentry error boundary render handler
        </div>
// Sentry error boundary render handler
      );
// Sentry error boundary render handler
    }
// Sentry error boundary render handler
    return this.props.children;
// Sentry error boundary render handler
  }
// Sentry error boundary render handler
}
// Sentry error boundary render handler
interface Props { children: ReactNode; fallback?: ReactNode; }
// Sentry error boundary render handler
interface State { hasError: boolean; error: Error | null; eventId: string | null; }
// Sentry error boundary render handler
export class SentryErrorBoundary extends Component<Props, State> {
// Sentry error boundary render handler
  public state: State = { hasError: false, error: null, eventId: null };
// Sentry error boundary render handler
  public static getDerivedStateFromError(error: Error): State { return { hasError: true, error, eventId: null }; }
// Sentry error boundary render handler
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
// Sentry error boundary render handler
    const eventId = captureException(error, { category: "react-error-boundary", extra: { componentStack: errorInfo.componentStack } });