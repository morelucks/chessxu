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