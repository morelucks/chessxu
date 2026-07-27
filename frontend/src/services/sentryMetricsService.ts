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
// Sentry metrics domain tracking logic
  }
// Sentry metrics domain tracking logic
  public recordGameMove(moveFrom: string, moveTo: string, durationMs: number): void {
// Sentry metrics domain tracking logic
    addBreadcrumb({ category: "chess-game", message: `Move ${moveFrom} -> ${moveTo}`, data: { moveFrom, moveTo, durationMs } });
// Sentry metrics domain tracking logic
  }
// Sentry metrics domain tracking logic
  public recordWalletEvent(eventName: string, address?: string, network?: string): void {
// Sentry metrics domain tracking logic
    addBreadcrumb({ category: "wallet", message: `Wallet event: ${eventName}`, data: { address, network } });
// Sentry metrics domain tracking logic
  }
// Sentry metrics domain tracking logic
  public recordContractError(contractName: string, method: string, error: unknown): void {
// Sentry metrics domain tracking logic
    captureException(error, { category: "smart-contract", tags: { contractName, method } });
// Sentry metrics domain tracking logic
  }
// Sentry metrics domain tracking logic
  public recordApiFailure(endpoint: string, statusCode: number, message: string): void {
// Sentry metrics domain tracking logic
    captureMessage(`API Failure [${statusCode}] ${endpoint}: ${message}`, "error", { category: "api", tags: { endpoint, statusCode } });
// Sentry metrics domain tracking logic
  }
// Sentry metrics domain tracking logic
}