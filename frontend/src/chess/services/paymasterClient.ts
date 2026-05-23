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
