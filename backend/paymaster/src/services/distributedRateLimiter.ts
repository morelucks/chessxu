/**
 * distributedRateLimiter.ts
 *
 * Redis-backed distributed rate limiter using atomic Lua scripts.
 *
 * Key design decisions:
 *   - Uses a sliding-window counter algorithm for accurate rate limiting
 *   - All Redis operations use atomic Lua scripts to prevent race conditions
 *   - Automatic fallback to in-memory store when Redis is unavailable
 *   - Per-address rate limiting with configurable windows and limits
 *   - Keys auto-expire via Redis TTL so no manual cleanup is needed
 *
 * The Lua script atomically:
 *   1. Checks if the window has expired and resets if needed
 *   2. Checks if the count exceeds the limit
 *   3. Increments the counter if allowed
 *   4. Returns [allowed, currentCount, resetTimestamp]
 */

import { config } from '../config';
import { getRedisClient, isRedisHealthy, getPoolStatus } from './redisPool';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** How many requests remain in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the current window resets */
  resetAt: number;
  /** Which store was used for this check */
  store: 'redis' | 'memory';
}

export interface RateLimiterStats {
  /** Current store being used */
  activeStore: 'redis' | 'memory' | 'none';
  /** Number of fallbacks to memory store */
  memoryFallbackCount: number;
  /** Number of successful Redis operations */
  redisHitCount: number;
  /** Number of entries in the in-memory fallback store */
  memoryStoreSize: number;
  /** Redis pool status */
  redisPoolStatus: string;
}

// ---------------------------------------------------------------------------
// Lua Script — Atomic rate-limit check-and-increment
// ---------------------------------------------------------------------------

/**
 * Lua script for atomic rate limiting.
 *
 * KEYS[1] = rate-limit key (e.g. "rl:sponsor:0xabc...")
 * ARGV[1] = max allowed requests per window
 * ARGV[2] = window duration in milliseconds
 * ARGV[3] = current timestamp in milliseconds
 *
 * Returns: [allowed (0|1), currentCount, resetTimestamp]
 */
const RATE_LIMIT_LUA_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Get current state
local data = redis.call('HMGET', key, 'count', 'resetAt')
local count = tonumber(data[1]) or 0
local resetAt = tonumber(data[2]) or 0

-- Check if window has expired
if now > resetAt then
  -- Start a new window
  count = 0
  resetAt = now + windowMs
  redis.call('HSET', key, 'count', 0, 'resetAt', resetAt)
  redis.call('PEXPIRE', key, windowMs + 1000)
end

-- Check if under limit
if count >= limit then
  return {0, count, resetAt}
end

-- Increment and allow
count = count + 1
redis.call('HSET', key, 'count', count)

return {1, count, resetAt}
`;

/**
 * Lua script for peeking at current count without incrementing.
 *
 * KEYS[1] = rate-limit key
 * ARGV[1] = current timestamp in milliseconds
 *
 * Returns: [currentCount, resetTimestamp]
 */
const PEEK_LUA_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])

local data = redis.call('HMGET', key, 'count', 'resetAt')
local count = tonumber(data[1]) or 0
local resetAt = tonumber(data[2]) or 0

-- If window expired, return zero
if now > resetAt then
  return {0, 0}
end

return {count, resetAt}
`;

/**
 * Lua script for resetting a specific address's rate limit.
 *
 * KEYS[1] = rate-limit key
 *
 * Returns: 1 if key existed, 0 otherwise
 */
const RESET_LUA_SCRIPT = `
return redis.call('DEL', KEYS[1])
`;

// ---------------------------------------------------------------------------
// In-Memory Fallback Store
// ---------------------------------------------------------------------------

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();
let memoryCleanupTimer: ReturnType<typeof setInterval> | null = null;

/** Periodically clean up expired entries from the in-memory store. */
function ensureMemoryCleanup(): void {
  if (memoryCleanupTimer) return;

  memoryCleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetAt) {
        memoryStore.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[distributedRateLimiter] Cleaned ${cleaned} expired in-memory entries`);
    }
  }, 60_000);

  // Don't block process exit
  if (memoryCleanupTimer && typeof memoryCleanupTimer === 'object' && 'unref' in memoryCleanupTimer) {
    memoryCleanupTimer.unref();
  }
}

/**
 * In-memory rate limit check — used as fallback when Redis is unavailable.
 */
function checkMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  // New or expired entry
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      store: 'memory',
    };
  }

  // Over limit
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      store: 'memory',
    };
  }

  // Allow and increment
  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
    store: 'memory',
  };
}

// ---------------------------------------------------------------------------
// Stats Tracking
// ---------------------------------------------------------------------------

let memoryFallbackCount = 0;
let redisHitCount = 0;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Formats a rate-limit key for an address.
 */
function formatKey(address: string): string {
  return `${config.redisKeyPrefix}rl:sponsor:${address.toLowerCase()}`;
}

/**
 * Checks and increments the rate limit for a given address.
 *
 * Uses Redis when available for distributed rate limiting across multiple
 * service instances. Falls back to in-memory limiting when Redis is unavailable.
 *
 * @param address - The Ethereum address to rate-limit
 * @returns Rate limit result with allowed status, remaining count, and reset time
 */
export async function checkRateLimit(address: string): Promise<RateLimitResult> {
  const key = formatKey(address);
  const limit = config.rateLimitPerAddress;
  const windowMs = config.rateLimitWindowMs;

  // Ensure memory cleanup is running for fallback
  ensureMemoryCleanup();

  // Attempt Redis first
  try {
    const redis = await getRedisClient();

    if (redis && isRedisHealthy()) {
      const result = await redis.eval(
        RATE_LIMIT_LUA_SCRIPT,
        1,
        key,
        String(limit),
        String(windowMs),
        String(Date.now()),
      ) as [number, number, number];

      const [allowed, currentCount, resetAt] = result;

      redisHitCount++;

      return {
        allowed: allowed === 1,
        remaining: Math.max(0, limit - currentCount),
        resetAt,
        store: 'redis',
      };
    }
  } catch (err) {
    console.warn('[distributedRateLimiter] Redis rate-limit check failed, falling back to in-memory:', (err as Error).message);
  }

  // Fallback to in-memory
  memoryFallbackCount++;
  if (memoryFallbackCount === 1 || memoryFallbackCount % 100 === 0) {
    console.warn(`[distributedRateLimiter] Using in-memory fallback (total fallbacks: ${memoryFallbackCount})`);
  }

  return checkMemoryRateLimit(key, limit, windowMs);
}

/**
 * Peeks at the current rate-limit count for an address without incrementing.
 * Useful for monitoring and admin dashboards.
 *
 * @param address - The Ethereum address to check
 * @returns Current count and reset time, or null if no data
 */
export async function peekRateLimit(address: string): Promise<{ count: number; resetAt: number; store: 'redis' | 'memory' } | null> {
  const key = formatKey(address);

  // Try Redis first
  try {
    const redis = await getRedisClient();
    if (redis && isRedisHealthy()) {
      const result = await redis.eval(
        PEEK_LUA_SCRIPT,
        1,
        key,
        String(Date.now()),
      ) as [number, number];

      const [count, resetAt] = result;
      if (count === 0 && resetAt === 0) return null;
      return { count, resetAt, store: 'redis' };
    }
  } catch {
    // Fall through to memory
  }

  // Try memory store
  const entry = memoryStore.get(key);
  if (!entry || Date.now() > entry.resetAt) return null;
  return { count: entry.count, resetAt: entry.resetAt, store: 'memory' };
}

/**
 * Resets the rate limit for a specific address.
 * Clears both Redis and in-memory stores.
 *
 * @param address - The Ethereum address to reset
 */
export async function resetRateLimit(address: string): Promise<void> {
  const key = formatKey(address);

  // Clear memory store
  memoryStore.delete(key);

  // Clear Redis store
  try {
    const redis = await getRedisClient();
    if (redis && isRedisHealthy()) {
      await redis.eval(RESET_LUA_SCRIPT, 1, key);
    }
  } catch (err) {
    console.warn('[distributedRateLimiter] Failed to reset Redis rate limit:', (err as Error).message);
  }
}

/**
 * Returns statistics about the rate limiter for diagnostics.
 */
export function getRateLimiterStats(): RateLimiterStats {
  return {
    activeStore: isRedisHealthy() ? 'redis' : (config.redisUrl ? 'memory' : 'none'),
    memoryFallbackCount,
    redisHitCount,
    memoryStoreSize: memoryStore.size,
    redisPoolStatus: getPoolStatus(),
  };
}

/**
 * Returns the current in-memory store size (for monitoring).
 */
export function getMemoryStoreSize(): number {
  return memoryStore.size;
}

/**
 * Stops the memory cleanup timer — for clean shutdown.
 */
export function stopCleanupTimer(): void {
  if (memoryCleanupTimer) {
    clearInterval(memoryCleanupTimer);
    memoryCleanupTimer = null;
  }
}

/**
 * Resets all internal state — primarily for testing.
 */
export function resetStats(): void {
  memoryFallbackCount = 0;
  redisHitCount = 0;
  memoryStore.clear();
}
