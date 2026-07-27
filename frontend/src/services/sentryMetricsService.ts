import { addBreadcrumb, captureException, captureMessage } from "../utils/sentryLogger";
// Sentry metrics domain tracking logic
export class SentryMetricsService {
// Sentry metrics domain tracking logic
  private static instance: SentryMetricsService;
// Sentry metrics domain tracking logic
  public static getInstance(): SentryMetricsService {
// Sentry metrics domain tracking logic
    if (!SentryMetricsService.instance) { SentryMetricsService.instance = new SentryMetricsService(); }
// Sentry metrics domain tracking logic
    return SentryMetricsService.instance;