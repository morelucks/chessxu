/**
 * rateLimiter.ts
 *
 * Public-facing rate-limiter interface for the paymaster service.
 *
 * This module delegates to the distributed (Redis-backed) rate limiter,
 * which automatically falls back to an in-memory store when Redis is
 * unavailable. This ensures rate limits are shared across multiple API
 * instances behind a load balancer while maintaining availability during
 * Redis downtime.
 *
 * Migration note:
 *   Previously this module contained its own in-memory Map store and a
 *   basic Redis wrapper. That logic has been extracted into dedicated
 *   modules (redisPool.ts + distributedRateLimiter.ts) for cleaner
 *   separation of concerns and atomic Lua-script-based operations.
 */

import {
  checkRateLimit as distributedCheck,
  peekRateLimit,
  resetRateLimit as distributedReset,
  getRateLimiterStats,
  getMemoryStoreSize,
  stopCleanupTimer,
  type RateLimitResult,
  type RateLimiterStats,
} from './distributedRateLimiter';

// ---------------------------------------------------------------------------
// Re-exports — maintain backward-compatible public API
// ---------------------------------------------------------------------------

/**
 * Checks and increments the rate limit for a given address.
 *
 * Uses Redis when available for distributed rate limiting across multiple
 * service instances. Automatically falls back to in-memory limiting if
 * the Redis connection drops, ensuring the service never blocks all
 * transactions due to a Redis outage.
 *
 * @param address - The Ethereum address to rate-limit
 * @returns Rate limit result with allowed status, remaining count, and reset time
 */
export async function checkRateLimit(address: string): Promise<RateLimitResult> {
  return distributedCheck(address);
}

/**
 * Returns current count for an address without incrementing (for monitoring).
 *
 * Checks Redis first, then falls back to the in-memory store.
 */
export async function peekCount(address: string): Promise<number> {
  const result = await peekRateLimit(address);
  return result?.count ?? 0;
}

/**
 * Resets the rate limit for an address (admin use).
 * Clears both Redis and in-memory stores to ensure consistency.
 */
export async function resetRateLimit(address: string): Promise<void> {
  return distributedReset(address);
}

/**
 * Returns diagnostics about the rate limiter for health monitoring.
 */
export function getStats(): RateLimiterStats {
  return getRateLimiterStats();
}

/**
 * Returns the number of entries in the in-memory fallback store.
 */
export function getMemorySize(): number {
  return getMemoryStoreSize();
}

/**
 * Stops internal timers for clean shutdown.
 */
export function shutdown(): void {
  stopCleanupTimer();
}

// Re-export types for consumers
export type { RateLimitResult, RateLimiterStats };
