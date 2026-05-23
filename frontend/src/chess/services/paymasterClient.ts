/**
 * Chessxu Paymaster Client Module
 * 
 * Handles ERC-4337 Account Abstraction interactions for gasless transactions.
 * Routes UserOperations through the Chessxu Paymaster service for gas sponsorship,
 * then submits signed UserOps to a Bundler for on-chain execution.
 * 
 * @module paymasterClient
 */

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

/**
 * ERC-4337 UserOperation structure.
 * Represents an intent to execute a transaction via Account Abstraction.
 */
export interface UserOperation {
  sender: `0x${string}`;
  nonce: bigint;
  initCode: `0x${string}`;
  callData: `0x${string}`;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: `0x${string}`;
  signature: `0x${string}`;
}

/**
 * Response from the Paymaster sponsorship service.
 * Contains the paymaster signature and gas limit overrides.
 */
export interface SponsorResult {
  paymasterAndData: `0x${string}`;
  preVerificationGas: bigint;
  verificationGasLimit: bigint;
  callGasLimit: bigint;
}

/**
 * Receipt returned after a UserOp is mined on-chain.
 */
export interface UserOpReceipt {
  userOpHash: `0x${string}`;
  transactionHash: `0x${string}`;
  success: boolean;
  actualGasCost: bigint;
  actualGasUsed: bigint;
}

/**
 * Health status of the Paymaster service.
 */
export interface PaymasterHealthStatus {
  available: boolean;
  balance: string;
  lastChecked: number;
}

/**
 * Discriminated union for paymaster execution results.
 */
export type PaymasterResult =
  | { type: 'sponsored'; txHash: `0x${string}`; gasSaved: string }
  | { type: 'fallback'; txHash: `0x${string}`; reason: string }
  | { type: 'error'; error: Error };

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

/** Default timeout for paymaster service requests (ms) */
export const PAYMASTER_REQUEST_TIMEOUT_MS = 10_000;

/** Maximum retry attempts for transient failures */
export const PAYMASTER_MAX_RETRIES = 3;

/** Base delay for exponential backoff (ms) */
export const PAYMASTER_RETRY_BASE_DELAY_MS = 1_000;

/** Polling interval for UserOp receipt (ms) */
export const USEROP_RECEIPT_POLL_INTERVAL_MS = 2_000;

/** Maximum polling attempts for UserOp receipt */
export const USEROP_RECEIPT_MAX_POLLS = 30;

// ──────────────────────────────────────────────
// Error Classification
// ──────────────────────────────────────────────

/**
 * Categories of paymaster errors for structured handling.
 */
export enum PaymasterErrorCategory {
  /** Network connectivity failure */
  NETWORK = 'NETWORK',
  /** Paymaster service returned an auth error */
  AUTH = 'AUTH',
  /** Paymaster has insufficient deposit to sponsor */
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  /** UserOp was rejected by the bundler */
  BUNDLER_REJECTED = 'BUNDLER_REJECTED',
  /** Request timed out */
  TIMEOUT = 'TIMEOUT',
  /** Unknown / unclassified error */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class for Paymaster-specific failures.
 * Includes a structured category for downstream fallback logic.
 */
export class PaymasterError extends Error {
  public readonly category: PaymasterErrorCategory;
  public readonly retriable: boolean;

  constructor(
    message: string,
    category: PaymasterErrorCategory = PaymasterErrorCategory.UNKNOWN,
    retriable = false,
  ) {
    super(message);
    this.name = 'PaymasterError';
    this.category = category;
    this.retriable = retriable;
  }
}

// ──────────────────────────────────────────────
// Internal Helpers
// ──────────────────────────────────────────────

/**
 * Classifies a raw error into a structured PaymasterError.
 * Used internally to decide whether to retry or fall back.
 */
export function classifyError(error: unknown): PaymasterError {
  if (error instanceof PaymasterError) return error;

  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes('AbortError') || msg.includes('timeout') || msg.includes('Timeout')) {
    return new PaymasterError(
      `Paymaster request timed out: ${msg}`,
      PaymasterErrorCategory.TIMEOUT,
      true,
    );
  }

  if (msg.includes('fetch') || msg.includes('network') || msg.includes('ECONNREFUSED')) {
    return new PaymasterError(
      `Paymaster network error: ${msg}`,
      PaymasterErrorCategory.NETWORK,
      true,
    );
  }

  if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized')) {
    return new PaymasterError(
      `Paymaster auth error: ${msg}`,
      PaymasterErrorCategory.AUTH,
      false,
    );
  }

  if (msg.includes('insufficient') || msg.includes('deposit')) {
    return new PaymasterError(
      `Paymaster insufficient funds: ${msg}`,
      PaymasterErrorCategory.INSUFFICIENT_FUNDS,
      false,
    );
  }

  if (msg.includes('rejected') || msg.includes('AA')) {
    return new PaymasterError(
      `Bundler rejected UserOp: ${msg}`,
      PaymasterErrorCategory.BUNDLER_REJECTED,
      false,
    );
  }

  return new PaymasterError(msg, PaymasterErrorCategory.UNKNOWN, false);
}

/**
 * Performs a fetch request with an automatic timeout via AbortController.
 * Throws a PaymasterError with TIMEOUT category if the request exceeds the deadline.
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch RequestInit options
 * @param timeoutMs - Timeout in milliseconds (defaults to PAYMASTER_REQUEST_TIMEOUT_MS)
 * @returns The fetch Response
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = PAYMASTER_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new PaymasterError(
        `Request to ${url} timed out after ${timeoutMs}ms`,
        PaymasterErrorCategory.TIMEOUT,
        true,
      );
    }
    throw classifyError(error);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Retries an async operation with exponential backoff.
 * Only retries if the caught PaymasterError is marked as retriable.
 *
 * @param fn - The async function to execute
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelayMs - Base delay between retries (doubled each attempt)
 * @returns The result of fn()
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = PAYMASTER_MAX_RETRIES,
  baseDelayMs: number = PAYMASTER_RETRY_BASE_DELAY_MS,
): Promise<T> {
  let lastError: PaymasterError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = classifyError(error);

      if (!lastError.retriable || attempt === maxRetries) {
        throw lastError;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(
        `[Paymaster] Attempt ${attempt + 1}/${maxRetries + 1} failed (${lastError.category}), retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new PaymasterError('Retry exhausted', PaymasterErrorCategory.UNKNOWN, false);
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

import { PAYMASTER_CONFIG } from '../blockchainConstants';

/**
 * Sends an unsigned UserOperation to the Paymaster service for gas sponsorship.
 * The paymaster signs the UserOp and returns `paymasterAndData` along with gas limit overrides.
 *
 * @param userOp - The unsigned UserOperation to sponsor
 * @returns SponsorResult containing paymasterAndData and gas limits
 * @throws PaymasterError if the service is unavailable or rejects the request
 */
export async function sponsorUserOp(userOp: UserOperation): Promise<SponsorResult> {
  return retryWithBackoff(async () => {
    const response = await fetchWithTimeout(
      `${PAYMASTER_CONFIG.SERVICE_URL}/sponsor`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userOp: {
            sender: userOp.sender,
            nonce: userOp.nonce.toString(),
            initCode: userOp.initCode,
            callData: userOp.callData,
            callGasLimit: userOp.callGasLimit.toString(),
            verificationGasLimit: userOp.verificationGasLimit.toString(),
            preVerificationGas: userOp.preVerificationGas.toString(),
            maxFeePerGas: userOp.maxFeePerGas.toString(),
            maxPriorityFeePerGas: userOp.maxPriorityFeePerGas.toString(),
            paymasterAndData: '0x',
            signature: '0x',
          },
          entryPoint: PAYMASTER_CONFIG.ENTRYPOINT_ADDRESS,
        }),
      },
      PAYMASTER_CONFIG.TIMEOUT_MS,
    );

    if (!response.ok) {
      const body = await response.text().catch(() => 'Unknown error');
      throw new PaymasterError(
        `Paymaster sponsorship failed (${response.status}): ${body}`,
        response.status === 401 || response.status === 403
          ? PaymasterErrorCategory.AUTH
          : PaymasterErrorCategory.UNKNOWN,
        response.status >= 500,
      );
    }

    const data = await response.json();

    return {
      paymasterAndData: data.paymasterAndData as `0x${string}`,
      preVerificationGas: BigInt(data.preVerificationGas),
      verificationGasLimit: BigInt(data.verificationGasLimit),
      callGasLimit: BigInt(data.callGasLimit),
    };
  });
}

/**
 * Submits a fully-signed UserOperation to the Bundler for on-chain execution.
 * Uses the eth_sendUserOperation JSON-RPC method.
 *
 * @param signedUserOp - The signed UserOperation to submit
 * @returns The UserOperation hash returned by the bundler
 * @throws PaymasterError if the bundler rejects the UserOp
 */
export async function submitUserOp(signedUserOp: UserOperation): Promise<`0x${string}`> {
  return retryWithBackoff(async () => {
    const response = await fetchWithTimeout(
      PAYMASTER_CONFIG.BUNDLER_RPC_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendUserOperation',
          params: [
            {
              sender: signedUserOp.sender,
              nonce: `0x${signedUserOp.nonce.toString(16)}`,
              initCode: signedUserOp.initCode,
              callData: signedUserOp.callData,
              callGasLimit: `0x${signedUserOp.callGasLimit.toString(16)}`,
              verificationGasLimit: `0x${signedUserOp.verificationGasLimit.toString(16)}`,
              preVerificationGas: `0x${signedUserOp.preVerificationGas.toString(16)}`,
              maxFeePerGas: `0x${signedUserOp.maxFeePerGas.toString(16)}`,
              maxPriorityFeePerGas: `0x${signedUserOp.maxPriorityFeePerGas.toString(16)}`,
              paymasterAndData: signedUserOp.paymasterAndData,
              signature: signedUserOp.signature,
            },
            PAYMASTER_CONFIG.ENTRYPOINT_ADDRESS,
          ],
        }),
      },
      PAYMASTER_CONFIG.TIMEOUT_MS,
    );

    if (!response.ok) {
      const body = await response.text().catch(() => 'Unknown error');
      throw new PaymasterError(
        `Bundler request failed (${response.status}): ${body}`,
        PaymasterErrorCategory.BUNDLER_REJECTED,
        response.status >= 500,
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new PaymasterError(
        `Bundler rejected UserOp: ${data.error.message || JSON.stringify(data.error)}`,
        PaymasterErrorCategory.BUNDLER_REJECTED,
        false,
      );
    }

    return data.result as `0x${string}`;
  });
}
