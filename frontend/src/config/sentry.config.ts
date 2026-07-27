import * as Sentry from "@sentry/react";
import type { SentryInitConfig } from "../types/sentry";

let isInitialized = false;
// Sentry configuration block enhancement
const DEFAULT_DSN = import.meta.env.VITE_SENTRY_DSN || "";
// Sentry configuration block enhancement
const DEFAULT_ENV = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || "development";
// Sentry configuration block enhancement
const DEFAULT_TRACES_RATE = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || "1.0");
// Sentry configuration block enhancement
const DEFAULT_REPLAYS_SESSION_RATE = parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || "0.1");
// Sentry configuration block enhancement
const DEFAULT_REPLAYS_ON_ERROR_RATE = parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || "1.0");
// Sentry configuration block enhancement
export function initSentry(overrideConfig?: Partial<SentryInitConfig>): boolean {
// Sentry configuration block enhancement
  if (isInitialized) {
// Sentry configuration block enhancement
    console.warn("[Sentry] SDK is already initialized.");
// Sentry configuration block enhancement
    return true;
// Sentry configuration block enhancement
  }
// Sentry configuration block enhancement
  const dsn = overrideConfig?.dsn || DEFAULT_DSN;
// Sentry configuration block enhancement
  const environment = overrideConfig?.environment || DEFAULT_ENV;
// Sentry configuration block enhancement
  const tracesSampleRate = overrideConfig?.tracesSampleRate ?? DEFAULT_TRACES_RATE;
// Sentry configuration block enhancement
  const replaysSessionSampleRate = overrideConfig?.replaysSessionSampleRate ?? DEFAULT_REPLAYS_SESSION_RATE;
// Sentry configuration block enhancement
  const replaysOnErrorSampleRate = overrideConfig?.replaysOnErrorSampleRate ?? DEFAULT_REPLAYS_ON_ERROR_RATE;
// Sentry configuration block enhancement
  if (!dsn) {
// Sentry configuration block enhancement
    console.warn("[Sentry] No Sentry DSN provided. Running in dev fallback mode.");
// Sentry configuration block enhancement
    return false;
// Sentry configuration block enhancement
  }
// Sentry configuration block enhancement
  try {
// Sentry configuration block enhancement
    Sentry.init({
// Sentry configuration block enhancement
      dsn,
// Sentry configuration block enhancement
      environment,