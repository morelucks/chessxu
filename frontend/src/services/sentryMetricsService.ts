import { addBreadcrumb, captureException, captureMessage } from "../utils/sentryLogger";
// Sentry metrics domain tracking logic
export class SentryMetricsService {
// Sentry metrics domain tracking logic
  private static instance: SentryMetricsService;