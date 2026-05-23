import { config } from '../config';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

let redisClient: import('ioredis').Redis | null = null;

async function getRedis(): Promise<import('ioredis').Redis | null> {
  if (!config.redisUrl) return null;
  if (redisClient) return redisClient;
  try {
    const { default: Redis } = await import('ioredis');
    redisClient = new Redis(config.redisUrl);
    return redisClient;
  } catch {
    console.warn('[rateLimiter] Redis unavailable, falling back to in-memory store.');
    return null;
  }
}

export async function checkRateLimit(address: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `rl:${address.toLowerCase()}`;
  const now = Date.now();
  const redis = await getRedis();

  if (redis) {
    const countKey = `${key}:count`;
    const resetKey = `${key}:reset`;

    const [[, rawCount], [, rawReset]] = await redis.multi()
      .get(countKey)
      .get(resetKey)
      .exec() as [[null, string | null], [null, string | null]];

    const resetAt = rawReset ? parseInt(rawReset, 10) : now + config.rateLimitWindowMs;
    const count = rawCount ? parseInt(rawCount, 10) : 0;

    if (now > resetAt) {
      await redis.multi()
        .set(countKey, '1')
        .set(resetKey, String(now + config.rateLimitWindowMs))
        .pexpire(countKey, config.rateLimitWindowMs)
        .pexpire(resetKey, config.rateLimitWindowMs)
        .exec();
      return { allowed: true, remaining: config.rateLimitPerAddress - 1, resetAt: now + config.rateLimitWindowMs };
    }

    if (count >= config.rateLimitPerAddress) {
      return { allowed: false, remaining: 0, resetAt };
    }

    await redis.incr(countKey);
    return { allowed: true, remaining: config.rateLimitPerAddress - count - 1, resetAt };
  }

  // In-memory fallback
  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + config.rateLimitWindowMs });
    return { allowed: true, remaining: config.rateLimitPerAddress - 1, resetAt: now + config.rateLimitWindowMs };
  }

  if (entry.count >= config.rateLimitPerAddress) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.rateLimitPerAddress - entry.count, resetAt: entry.resetAt };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetAt) memoryStore.delete(key);
  }
}, 60_000);

/** Returns current count for an address without incrementing (for monitoring). */
export function peekCount(address: string): number {
  const entry = memoryStore.get(`rl:${address.toLowerCase()}`);
  if (!entry || Date.now() > entry.resetAt) return 0;
  return entry.count;
}

/** Resets the rate limit for an address (admin use). */
export function resetRateLimit(address: string): void {
  memoryStore.delete(`rl:${address.toLowerCase()}`);
}
