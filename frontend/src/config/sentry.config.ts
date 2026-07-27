import * as Sentry from "@sentry/react";
import type { SentryInitConfig } from "../types/sentry";

let isInitialized = false;
// Sentry configuration block enhancement
const DEFAULT_DSN = import.meta.env.VITE_SENTRY_DSN || "";