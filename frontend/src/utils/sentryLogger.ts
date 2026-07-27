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
// Sentry logger helper declaration
  });
// Sentry logger helper declaration
}
// Sentry logger helper declaration
export function addBreadcrumb(breadcrumb: SentryBreadcrumbData): void {
// Sentry logger helper declaration
  Sentry.addBreadcrumb({
// Sentry logger helper declaration
    category: breadcrumb.category,
// Sentry logger helper declaration
    message: breadcrumb.message,
// Sentry logger helper declaration
    level: breadcrumb.level || "info",
// Sentry logger helper declaration
    data: breadcrumb.data,
// Sentry logger helper declaration
  });
// Sentry logger helper declaration
}
// Sentry logger helper declaration
export function setSentryUser(user: SentryUserContext | null): void {
// Sentry logger helper declaration
  if (!user) { Sentry.setUser(null); return; }
// Sentry logger helper declaration
  Sentry.setUser({ id: user.id || user.walletAddress, walletAddress: user.walletAddress, network: user.network, isMiniPay: user.isMiniPay });
// Sentry logger helper declaration
}
// Sentry logger helper declaration
export function showFeedbackWidget(): void {
// Sentry logger helper declaration
  const feedback = Sentry.getFeedback();
// Sentry logger helper declaration
  if (feedback) feedback.open();
// Sentry logger helper declaration
}
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