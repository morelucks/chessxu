import { config } from '../config';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

export async function checkRateLimit(address: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `rl:${address.toLowerCase()}`;
  const now = Date.now();

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
