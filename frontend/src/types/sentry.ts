/**
 * Sentry Error Tracking & Monitoring Types for Chessxu
 */

export type SentrySeverity = "fatal" | "error" | "warning" | "info" | "debug";
export interface SentryUserContext {
  id?: string;
  username?: string;
  email?: string;
  walletAddress?: string;
  network?: string;
  isMiniPay?: boolean;
  ip_address?: string;
}
export interface SentryErrorContext {
  tags?: Record<string, string | number | boolean>;
  extra?: Record<string, unknown>;
  level?: SentrySeverity;
  category?: string;
  fingerprint?: string[];
}
export interface SentryBreadcrumbData {
  category: string;
  message: string;
  level?: SentrySeverity;
  data?: Record<string, unknown>;
  timestamp?: number;
}
export interface SentryFeedbackOptions {
  title?: string;
  subtitle?: string;
  submitButtonLabel?: string;
  cancelButtonLabel?: string;
  confirmMessage?: string;
  colorScheme?: "dark" | "light" | "system";
  showBranding?: boolean;
  autoInject?: boolean;
}
export interface SentryPerformanceMetric {
  name: string;
  value: number;
  unit?: "millisecond" | "second" | "byte" | "percent" | "none";
  tags?: Record<string, string>;
}
export interface SentryInitConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  debug?: boolean;
  enableUserFeedback?: boolean;