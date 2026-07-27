import * as Sentry from "@sentry/react";
import type { SentryBreadcrumbData, SentryErrorContext, SentryUserContext, SentrySeverity } from "../types/sentry";
// Sentry logger helper declaration
export function captureException(error: unknown, context?: SentryErrorContext): string {
// Sentry logger helper declaration
  if (context) {
// Sentry logger helper declaration
    return Sentry.withScope((scope) => {
// Sentry logger helper declaration
      if (context.tags) {
// Sentry logger helper declaration
        Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, String(v)));
// Sentry logger helper declaration
      }
// Sentry logger helper declaration
      if (context.extra) {