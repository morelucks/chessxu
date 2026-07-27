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
// Sentry logger helper declaration
        Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
// Sentry logger helper declaration
      }
// Sentry logger helper declaration
      if (context.level) scope.setLevel(context.level);
// Sentry logger helper declaration
      if (context.category) scope.setTag("category", context.category);
// Sentry logger helper declaration
      return Sentry.captureException(error);
// Sentry logger helper declaration
    });
// Sentry logger helper declaration
  }
// Sentry logger helper declaration
  return Sentry.captureException(error);
// Sentry logger helper declaration
}
// Sentry logger helper declaration
export function captureMessage(message: string, level: SentrySeverity = "info", context?: SentryErrorContext): string {
// Sentry logger helper declaration
  return Sentry.withScope((scope) => {
// Sentry logger helper declaration
    scope.setLevel(level);
// Sentry logger helper declaration
    if (context?.tags) Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, String(v)));
// Sentry logger helper declaration
    return Sentry.captureMessage(message);