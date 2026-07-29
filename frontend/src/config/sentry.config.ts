import * as Sentry from "@sentry/react";
import type { SentryInitConfig } from "../types/sentry";

let isInitialized = false;

const DEFAULT_DSN = import.meta.env.VITE_SENTRY_DSN || "";
const DEFAULT_ENV = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || "development";
const DEFAULT_TRACES_RATE = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || "1.0");
const DEFAULT_REPLAYS_SESSION_RATE = parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || "0.1");
const DEFAULT_REPLAYS_ON_ERROR_RATE = parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || "1.0");

export function initSentry(overrideConfig?: Partial<SentryInitConfig>): boolean {
  if (isInitialized) {
    console.warn("[Sentry] SDK is already initialized.");
    return true;
  }

  const dsn = overrideConfig?.dsn || DEFAULT_DSN;
  const environment = overrideConfig?.environment || DEFAULT_ENV;
  const tracesSampleRate = overrideConfig?.tracesSampleRate ?? DEFAULT_TRACES_RATE;
  const replaysSessionSampleRate = overrideConfig?.replaysSessionSampleRate ?? DEFAULT_REPLAYS_SESSION_RATE;
  const replaysOnErrorSampleRate = overrideConfig?.replaysOnErrorSampleRate ?? DEFAULT_REPLAYS_ON_ERROR_RATE;

  if (!dsn) {
    console.warn("[Sentry] No Sentry DSN provided. Running in dev fallback mode.");
    return false;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      tracesSampleRate,
      replaysSessionSampleRate,
      replaysOnErrorSampleRate,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.feedbackIntegration({ colorScheme: "dark" }),
        Sentry.replayIntegration({ maskAllText: false }),
      ],
      beforeSend(event) {
        if (environment === "development" && event.message?.includes("ResizeObserver")) return null;
        return event;
      },
    });
    isInitialized = true;
    console.log(`[Sentry] Initialized in ${environment} mode.`);
    return true;
  } catch (error) {
    console.error("[Sentry] Initialization error:", error);
    return false;
  }
}

export function isSentryInitialized(): boolean {
  return isInitialized;
}