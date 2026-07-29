import React, { Component, ReactNode, ErrorInfo } from "react";
import { captureException, showFeedbackWidget } from "../utils/sentryLogger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

export class SentryErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, eventId: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, eventId: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const eventId = captureException(error, {
      category: "react-error-boundary",
      extra: { componentStack: errorInfo.componentStack },
    });
    this.setState({ eventId });
  }

  private handleReportFeedback = (): void => {
    showFeedbackWidget();
  };

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, eventId: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-6 m-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-100">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-slate-400 text-sm mb-4">An error occurred and has been captured by Sentry.</p>
          <div className="flex gap-2">
            <button onClick={this.handleReset} className="px-4 py-2 bg-indigo-600 rounded text-sm font-medium">
              Try Again
            </button>
            <button onClick={this.handleReportFeedback} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm">
              Submit Feedback
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}