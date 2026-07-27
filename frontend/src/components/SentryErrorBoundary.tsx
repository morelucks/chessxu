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