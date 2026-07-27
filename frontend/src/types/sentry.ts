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