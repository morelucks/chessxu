/**
 * healthMonitor.ts
 *
 * Core diagnostics engine for the /healthz endpoint.
 * Measures:
 *   - Sponsor account gas balance (CELO) with low-balance warning
 *   - Paymaster EntryPoint deposit with low-deposit warning
 *   - Celo RPC roundtrip latency
 *   - Redis roundtrip latency (if configured)
 *   - Distributed rate-limiter store diagnostics
 *   - Process uptime, memory usage, Node.js version
 */

import { ethers } from 'ethers';
import { config } from '../config';
import { getSignerAddress } from './signer';
import { getRedisClient, getPoolStats, isRedisHealthy, type RedisPoolStats } from './redisPool';
import { getRateLimiterStats, type RateLimiterStats } from './distributedRateLimiter';

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Warn when signer CELO balance drops below this (in CELO, not wei) */
export const GAS_BALANCE_WARN_THRESHOLD_CELO = parseFloat(
  process.env.GAS_BALANCE_WARN_THRESHOLD ?? '0.5',
);

/** Warn when EntryPoint deposit drops below this (in CELO) */
export const DEPOSIT_WARN_THRESHOLD_CELO = parseFloat(
  process.env.DEPOSIT_WARN_THRESHOLD ?? '0.1',
);

/** RPC latency above this (ms) is flagged as degraded */
export const RPC_LATENCY_WARN_MS = parseInt(
  process.env.RPC_LATENCY_WARN_MS ?? '2000',
  10,
);

/** Redis latency above this (ms) is flagged as degraded */
export const REDIS_LATENCY_WARN_MS = parseInt(
  process.env.REDIS_LATENCY_WARN_MS ?? '100',
  10,
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComponentStatus = 'ok' | 'warn' | 'error';

export interface RpcDiagnostic {
  status: ComponentStatus;
  latencyMs: number | null;
  blockNumber: number | null;
  error?: string;
}

export interface BalanceDiagnostic {
  status: ComponentStatus;
  balanceCelo: string | null;
  thresholdCelo: number;
  warning?: string;
  error?: string;
}

export interface DepositDiagnostic {
  status: ComponentStatus;
  depositCelo: string | null;
  thresholdCelo: number;
  warning?: string;
  error?: string;
}

export interface RedisDiagnostic {
  status: ComponentStatus;
  configured: boolean;
  connected: boolean;
  latencyMs: number | null;
  poolStats: RedisPoolStats | null;
  error?: string;
}

export interface RateLimiterDiagnostic {
  activeStore: string;
  memoryFallbackCount: number;
  redisHitCount: number;
  memoryStoreSize: number;
}

export interface MemoryDiagnostic {
  heapUsedMb: number;
  heapTotalMb: number;
  externalMb: number;
  rssMb: number;
}

export interface HealthReport {
  /** Overall service status — worst of all component statuses */
  status: ComponentStatus;
  version: string;
  nodeVersion: string;
  uptimeSeconds: number;
  timestamp: string;
  signerAddress: string;
  paymasterAddress: string;
  chainId: number;
  totalSponsored: number;
  rpc: RpcDiagnostic;
  signerBalance: BalanceDiagnostic;
  paymasterDeposit: DepositDiagnostic;
  redis: RedisDiagnostic;
  rateLimiter: RateLimiterDiagnostic;
  memory: MemoryDiagnostic;
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mb(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

function worstStatus(...statuses: ComponentStatus[]): ComponentStatus {
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('warn')) return 'warn';
  return 'ok';
}

// ---------------------------------------------------------------------------
// Individual probes
// ---------------------------------------------------------------------------

export async function probeRpc(
  provider: ethers.JsonRpcProvider,
): Promise<RpcDiagnostic> {
  const start = Date.now();
  try {
    const blockNumber = await provider.getBlockNumber();
    const latencyMs = Date.now() - start;
    return {
      status: latencyMs > RPC_LATENCY_WARN_MS ? 'warn' : 'ok',
      latencyMs,
      blockNumber,
    };
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      blockNumber: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function probeSignerBalance(
  provider: ethers.JsonRpcProvider,
): Promise<BalanceDiagnostic> {
  try {
    const signerAddress = getSignerAddress();
    const raw = await provider.getBalance(signerAddress);
    const balanceCelo = ethers.formatEther(raw);
    const numeric = parseFloat(balanceCelo);

    if (numeric < GAS_BALANCE_WARN_THRESHOLD_CELO) {
      return {
        status: 'warn',
        balanceCelo,
        thresholdCelo: GAS_BALANCE_WARN_THRESHOLD_CELO,
        warning: `Signer balance ${numeric.toFixed(4)} CELO is below warning threshold of ${GAS_BALANCE_WARN_THRESHOLD_CELO} CELO. Top up soon.`,
      };
    }

    return {
      status: 'ok',
      balanceCelo,
      thresholdCelo: GAS_BALANCE_WARN_THRESHOLD_CELO,
    };
  } catch (err) {
    return {
      status: 'error',
      balanceCelo: null,
      thresholdCelo: GAS_BALANCE_WARN_THRESHOLD_CELO,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function probePaymasterDeposit(
  provider: ethers.JsonRpcProvider,
): Promise<DepositDiagnostic> {
  const PAYMASTER_ABI = ['function getDeposit() view returns (uint256)'];
  try {
    const paymaster = new ethers.Contract(
      config.paymasterAddress,
      PAYMASTER_ABI,
      provider,
    );
    const raw: bigint = await paymaster.getDeposit();
    const depositCelo = ethers.formatEther(raw);
    const numeric = parseFloat(depositCelo);

    if (numeric < DEPOSIT_WARN_THRESHOLD_CELO) {
      return {
        status: 'warn',
        depositCelo,
        thresholdCelo: DEPOSIT_WARN_THRESHOLD_CELO,
        warning: `Paymaster EntryPoint deposit ${numeric.toFixed(4)} CELO is below warning threshold of ${DEPOSIT_WARN_THRESHOLD_CELO} CELO. Replenish deposit.`,
      };
    }

    return {
      status: 'ok',
      depositCelo,
      thresholdCelo: DEPOSIT_WARN_THRESHOLD_CELO,
    };
  } catch (err) {
    return {
      status: 'error',
      depositCelo: null,
      thresholdCelo: DEPOSIT_WARN_THRESHOLD_CELO,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Probes Redis health using the shared connection pool.
 *
 * Uses the existing pool-managed client rather than creating throwaway
 * connections, providing accurate latency measurements and avoiding
 * unnecessary connection churn.
 */
export async function probeRedis(): Promise<RedisDiagnostic> {
  const poolStats = getPoolStats();

  if (!config.redisUrl) {
    return {
      status: 'ok',
      configured: false,
      connected: false,
      latencyMs: null,
      poolStats: null,
    };
  }

  try {
    const client = await getRedisClient();

    if (!client) {
      return {
        status: 'error',
        configured: true,
        connected: false,
        latencyMs: null,
        poolStats,
        error: 'Redis client unavailable — pool returned null',
      };
    }

    const start = Date.now();
    await client.ping();
    const latencyMs = Date.now() - start;

    return {
      status: latencyMs > REDIS_LATENCY_WARN_MS ? 'warn' : 'ok',
      configured: true,
      connected: isRedisHealthy(),
      latencyMs,
      poolStats,
    };
  } catch (err) {
    return {
      status: 'error',
      configured: true,
      connected: false,
      latencyMs: null,
      poolStats,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Main report builder
// ---------------------------------------------------------------------------

let _totalSponsored = 0;
export function incrementSponsored(): void {
  _totalSponsored++;
}
export function getTotalSponsored(): number {
  return _totalSponsored;
}

export async function buildHealthReport(
  provider: ethers.JsonRpcProvider,
): Promise<HealthReport> {
  // Run all probes concurrently
  const [rpc, signerBalance, paymasterDeposit, redis] = await Promise.all([
    probeRpc(provider),
    probeSignerBalance(provider),
    probePaymasterDeposit(provider),
    probeRedis(),
  ]);

  // Gather rate limiter diagnostics
  const rlStats = getRateLimiterStats();
  const rateLimiter: RateLimiterDiagnostic = {
    activeStore: rlStats.activeStore,
    memoryFallbackCount: rlStats.memoryFallbackCount,
    redisHitCount: rlStats.redisHitCount,
    memoryStoreSize: rlStats.memoryStoreSize,
  };

  const warnings: string[] = [];
  if (signerBalance.warning) warnings.push(signerBalance.warning);
  if (paymasterDeposit.warning) warnings.push(paymasterDeposit.warning);
  if (rpc.status === 'warn') {
    warnings.push(`RPC latency ${rpc.latencyMs}ms exceeds threshold of ${RPC_LATENCY_WARN_MS}ms.`);
  }
  if (redis.status === 'warn') {
    warnings.push(`Redis latency ${redis.latencyMs}ms exceeds threshold of ${REDIS_LATENCY_WARN_MS}ms.`);
  }
  if (redis.status === 'error' && redis.configured) {
    warnings.push('Redis is configured but unavailable — rate limiting is using in-memory fallback.');
  }
  if (rlStats.memoryFallbackCount > 0 && rlStats.activeStore === 'memory') {
    warnings.push(`Rate limiter has fallen back to in-memory store ${rlStats.memoryFallbackCount} times.`);
  }

  const mem = process.memoryUsage();

  return {
    status: worstStatus(rpc.status, signerBalance.status, paymasterDeposit.status, redis.status),
    version: process.env.npm_package_version ?? '1.0.0',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    signerAddress: getSignerAddress(),
    paymasterAddress: config.paymasterAddress,
    chainId: config.chainId,
    totalSponsored: getTotalSponsored(),
    rpc,
    signerBalance,
    paymasterDeposit,
    redis,
    rateLimiter,
    memory: {
      heapUsedMb: mb(mem.heapUsed),
      heapTotalMb: mb(mem.heapTotal),
      externalMb: mb(mem.external),
      rssMb: mb(mem.rss),
    },
    warnings,
  };
}
