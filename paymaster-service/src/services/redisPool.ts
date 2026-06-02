/**
 * redisPool.ts
 *
 * Manages a singleton Redis connection pool for the paymaster service.
 *
 * Features:
 *   - Lazy initialisation — connection created on first access
 *   - Automatic reconnection with exponential back-off (handled by ioredis)
 *   - Connection health monitoring via periodic PING
 *   - Graceful shutdown support
 *   - Event emitting for observability
 *
 * Usage:
 *   import { getRedisClient, isRedisHealthy, shutdownRedis } from './redisPool';
 *   const client = await getRedisClient(); // null when Redis is not configured
 */

import { EventEmitter } from 'events';
import { config } from '../config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RedisPoolOptions {
  /** Redis connection string (e.g. redis://localhost:6379) */
  url: string;
  /** Maximum number of reconnection attempts before giving up (-1 = infinite) */
  maxReconnectAttempts: number;
  /** Base delay in ms between reconnection attempts */
  reconnectBaseDelayMs: number;
  /** Maximum delay cap in ms for reconnection back-off */
  reconnectMaxDelayMs: number;
  /** Connection timeout in ms */
  connectTimeoutMs: number;
  /** Command timeout in ms */
  commandTimeoutMs: number;
  /** Interval in ms for health check PING */
  healthCheckIntervalMs: number;
  /** Key prefix for all rate-limit keys */
  keyPrefix: string;
  /** Enable ready-check on connect */
  enableReadyCheck: boolean;
  /** Enable offline command queueing */
  enableOfflineQueue: boolean;
}

export type RedisPoolStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed';

export interface RedisPoolStats {
  status: RedisPoolStatus;
  lastPingLatencyMs: number | null;
  totalReconnections: number;
  lastErrorMessage: string | null;
  lastErrorTimestamp: string | null;
  uptimeMs: number | null;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const poolEvents = new EventEmitter();

/**
 * Emitted events:
 *   'connected'        — Redis connection established
 *   'disconnected'     — Redis connection lost
 *   'reconnecting'     — Attempting to reconnect (payload: { attempt: number })
 *   'error'            — Non-fatal error (payload: Error)
 *   'health:ok'        — Health-check PING succeeded (payload: { latencyMs: number })
 *   'health:fail'      — Health-check PING failed (payload: Error)
 *   'shutdown'         — Pool shut down
 */

// ---------------------------------------------------------------------------
// Internal State
// ---------------------------------------------------------------------------

let redisClient: import('ioredis').Redis | null = null;
let poolStatus: RedisPoolStatus = 'disconnected';
let healthCheckTimer: ReturnType<typeof setInterval> | null = null;
let lastPingLatencyMs: number | null = null;
let totalReconnections = 0;
let lastErrorMessage: string | null = null;
let lastErrorTimestamp: string | null = null;
let connectedAt: number | null = null;
let isShuttingDown = false;

// ---------------------------------------------------------------------------
// Default Options
// ---------------------------------------------------------------------------

function getDefaultOptions(): RedisPoolOptions {
  return {
    url: config.redisUrl ?? '',
    maxReconnectAttempts: config.redisMaxReconnectAttempts,
    reconnectBaseDelayMs: config.redisReconnectBaseDelayMs,
    reconnectMaxDelayMs: config.redisReconnectMaxDelayMs,
    connectTimeoutMs: config.redisConnectTimeoutMs,
    commandTimeoutMs: config.redisCommandTimeoutMs,
    healthCheckIntervalMs: config.redisHealthCheckIntervalMs,
    keyPrefix: config.redisKeyPrefix,
    enableReadyCheck: true,
    enableOfflineQueue: false,
  };
}

// ---------------------------------------------------------------------------
// Connection Management
// ---------------------------------------------------------------------------

/**
 * Creates and configures the Redis client with reconnection and event handling.
 */
async function createClient(opts: RedisPoolOptions): Promise<import('ioredis').Redis> {
  const { default: Redis } = await import('ioredis');

  poolStatus = 'connecting';

  const client = new Redis(opts.url, {
    connectTimeout: opts.connectTimeoutMs,
    commandTimeout: opts.commandTimeoutMs,
    maxRetriesPerRequest: 3,
    enableReadyCheck: opts.enableReadyCheck,
    enableOfflineQueue: opts.enableOfflineQueue,
    retryStrategy(times: number) {
      if (isShuttingDown) return null;
      if (opts.maxReconnectAttempts !== -1 && times > opts.maxReconnectAttempts) {
        console.error(`[redisPool] Max reconnection attempts (${opts.maxReconnectAttempts}) reached. Giving up.`);
        poolStatus = 'error';
        return null;
      }
      const delay = Math.min(
        opts.reconnectBaseDelayMs * Math.pow(2, times - 1),
        opts.reconnectMaxDelayMs,
      );
      // Add jitter: ±25%
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      const finalDelay = Math.round(delay + jitter);
      console.log(`[redisPool] Reconnecting in ${finalDelay}ms (attempt ${times})`);
      totalReconnections++;
      poolStatus = 'reconnecting';
      poolEvents.emit('reconnecting', { attempt: times, delayMs: finalDelay });
      return finalDelay;
    },
    lazyConnect: true,
  });

  // Event handlers
  client.on('connect', () => {
    console.log('[redisPool] Connection established');
    poolStatus = 'connected';
    connectedAt = Date.now();
    poolEvents.emit('connected');
  });

  client.on('ready', () => {
    console.log('[redisPool] Client ready — accepting commands');
  });

  client.on('close', () => {
    if (!isShuttingDown) {
      console.warn('[redisPool] Connection closed unexpectedly');
      poolStatus = 'disconnected';
      poolEvents.emit('disconnected');
    }
  });

  client.on('error', (err: Error) => {
    lastErrorMessage = err.message;
    lastErrorTimestamp = new Date().toISOString();
    console.error('[redisPool] Error:', err.message);
    poolEvents.emit('error', err);
  });

  client.on('reconnecting', () => {
    poolStatus = 'reconnecting';
  });

  // Connect
  await client.connect();

  return client;
}

/**
 * Starts the periodic health-check PING loop.
 */
function startHealthCheck(client: import('ioredis').Redis, intervalMs: number): void {
  if (healthCheckTimer) clearInterval(healthCheckTimer);

  healthCheckTimer = setInterval(async () => {
    if (isShuttingDown || poolStatus !== 'connected') return;

    const start = Date.now();
    try {
      await client.ping();
      lastPingLatencyMs = Date.now() - start;
      poolEvents.emit('health:ok', { latencyMs: lastPingLatencyMs });
    } catch (err) {
      lastPingLatencyMs = null;
      poolEvents.emit('health:fail', err);
      console.warn('[redisPool] Health-check PING failed:', (err as Error).message);
    }
  }, intervalMs);

  // Unref so the timer doesn't prevent process exit
  if (healthCheckTimer && typeof healthCheckTimer === 'object' && 'unref' in healthCheckTimer) {
    healthCheckTimer.unref();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the singleton Redis client, creating it on first call.
 * Returns null when REDIS_URL is not configured or the connection has failed permanently.
 */
export async function getRedisClient(): Promise<import('ioredis').Redis | null> {
  // Not configured — skip entirely
  if (!config.redisUrl) return null;

  // Already have a healthy client
  if (redisClient && poolStatus === 'connected') {
    return redisClient;
  }

  // Client exists but is reconnecting — return it so commands queue/fail fast
  if (redisClient && poolStatus === 'reconnecting') {
    return redisClient;
  }

  // Permanently failed or shutting down
  if (isShuttingDown || poolStatus === 'error') {
    return null;
  }

  // First-time init
  try {
    const opts = getDefaultOptions();
    redisClient = await createClient(opts);
    startHealthCheck(redisClient, opts.healthCheckIntervalMs);
    return redisClient;
  } catch (err) {
    console.error('[redisPool] Initial connection failed:', (err as Error).message);
    lastErrorMessage = (err as Error).message;
    lastErrorTimestamp = new Date().toISOString();
    poolStatus = 'error';
    poolEvents.emit('error', err);
    return null;
  }
}

/**
 * Returns true when the Redis client is connected and healthy.
 */
export function isRedisHealthy(): boolean {
  return poolStatus === 'connected' && redisClient !== null;
}

/**
 * Returns the current pool status for diagnostics.
 */
export function getPoolStats(): RedisPoolStats {
  return {
    status: poolStatus,
    lastPingLatencyMs,
    totalReconnections,
    lastErrorMessage,
    lastErrorTimestamp,
    uptimeMs: connectedAt ? Date.now() - connectedAt : null,
  };
}

/**
 * Returns the current pool status string.
 */
export function getPoolStatus(): RedisPoolStatus {
  return poolStatus;
}

/**
 * Gracefully shuts down the Redis connection.
 */
export async function shutdownRedis(): Promise<void> {
  isShuttingDown = true;

  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }

  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('[redisPool] Graceful shutdown complete');
    } catch (err) {
      console.warn('[redisPool] Error during shutdown, forcing disconnect:', (err as Error).message);
      try {
        redisClient.disconnect();
      } catch {
        // Ignore
      }
    }
    redisClient = null;
  }

  poolStatus = 'closed';
  poolEvents.emit('shutdown');
}

/**
 * Resets the pool state — primarily for testing.
 */
export async function resetPool(): Promise<void> {
  await shutdownRedis();
  poolStatus = 'disconnected';
  lastPingLatencyMs = null;
  totalReconnections = 0;
  lastErrorMessage = null;
  lastErrorTimestamp = null;
  connectedAt = null;
  isShuttingDown = false;
}
