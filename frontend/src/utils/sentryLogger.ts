import * as Sentry from "@sentry/react";
import type { SentryBreadcrumbData, SentryErrorContext, SentryUserContext, SentrySeverity } from "../types/sentry";

export function captureException(error: unknown, context?: SentryErrorContext): string {
  if (context) {
    return Sentry.withScope((scope) => {
      if (context.tags) {
        Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, String(v)));
      }
      if (context.extra) {
        Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
      }
      if (context.level) scope.setLevel(context.level);
      if (context.category) scope.setTag("category", context.category);
      return Sentry.captureException(error);
    });
  }
  return Sentry.captureException(error);
}

export function captureMessage(message: string, level: SentrySeverity = "info", context?: SentryErrorContext): string {
  return Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context?.tags) {
      Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, String(v)));
    }
    if (context?.extra) {
      Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
    }
    if (context?.category) scope.setTag("category", context.category);
    return Sentry.captureMessage(message);
  });
}

export function addBreadcrumb(breadcrumb: SentryBreadcrumbData): void {
  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level || "info",
    data: breadcrumb.data,
  });
}

export function setSentryUser(user: SentryUserContext | null): void {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: user.id || user.walletAddress,
    walletAddress: user.walletAddress,
    network: user.network,
    isMiniPay: user.isMiniPay,
  });
}

export function showFeedbackWidget(): void {
  const feedback = Sentry.getFeedback();
  if (feedback) {
    feedback.open();
  }
}