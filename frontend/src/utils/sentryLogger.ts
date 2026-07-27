import * as Sentry from "@sentry/react";
import type { SentryBreadcrumbData, SentryErrorContext, SentryUserContext, SentrySeverity } from "../types/sentry";
// Sentry logger helper declaration
export function captureException(error: unknown, context?: SentryErrorContext): string {
// Sentry logger helper declaration
  if (context) {
// Sentry logger helper declaration
    return Sentry.withScope((scope) => {