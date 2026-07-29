import { addBreadcrumb, captureException, captureMessage } from "../utils/sentryLogger";

export class SentryMetricsService {
  private static instance: SentryMetricsService;

  public static getInstance(): SentryMetricsService {
    if (!SentryMetricsService.instance) {
      SentryMetricsService.instance = new SentryMetricsService();
    }
    return SentryMetricsService.instance;
  }

  public recordGameMove(moveFrom: string, moveTo: string, durationMs: number): void {
    addBreadcrumb({
      category: "chess-game",
      message: `Move ${moveFrom} -> ${moveTo}`,
      data: { moveFrom, moveTo, durationMs },
    });
  }

  public recordWalletEvent(eventName: string, address?: string, network?: string): void {
    addBreadcrumb({
      category: "wallet",
      message: `Wallet event: ${eventName}`,
      data: { address, network },
    });
  }

  public recordContractError(contractName: string, method: string, error: unknown): void {
    captureException(error, {
      category: "smart-contract",
      tags: { contractName, method },
    });
  }

  public recordApiFailure(endpoint: string, statusCode: number, message: string): void {
    captureMessage(`API Failure [${statusCode}] ${endpoint}: ${message}`, "error", {
      category: "api",
      tags: { endpoint, statusCode },
    });
  }
}

export const sentryMetrics = SentryMetricsService.getInstance();