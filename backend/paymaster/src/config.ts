import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  celoRpcUrl: process.env.CELO_RPC_URL ?? 'https://forno.celo.org',
  signerPrivateKey: required('PAYMASTER_SIGNER_PRIVATE_KEY'),
  paymasterAddress: required('PAYMASTER_CONTRACT_ADDRESS'),
  entrypointAddress: process.env.ENTRYPOINT_ADDRESS ?? '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  chessxuContractAddress: process.env.CHESSXU_CONTRACT_ADDRESS ?? '0xf4776929EB56F8C0fC41f87Cc7c4aEa4702de02E',
  rateLimitPerAddress: parseInt(process.env.RATE_LIMIT_PER_ADDRESS ?? '100', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '86400000', 10),
  chainId: 42220,
  /** Validity window for signed UserOps in seconds */
  signValiditySeconds: parseInt(process.env.SIGN_VALIDITY_SECONDS ?? '600', 10),

  // ---------------------------------------------------------------------------
  // Redis Configuration
  // ---------------------------------------------------------------------------

  /** Redis connection URL (e.g. redis://localhost:6379). Omit to disable Redis. */
  redisUrl: process.env.REDIS_URL,

  /** Maximum reconnection attempts before giving up (-1 = infinite) */
  redisMaxReconnectAttempts: parseInt(process.env.REDIS_MAX_RECONNECT_ATTEMPTS ?? '50', 10),

  /** Base delay in ms between reconnection attempts */
  redisReconnectBaseDelayMs: parseInt(process.env.REDIS_RECONNECT_BASE_DELAY_MS ?? '500', 10),

  /** Maximum delay cap in ms for reconnection back-off */
  redisReconnectMaxDelayMs: parseInt(process.env.REDIS_RECONNECT_MAX_DELAY_MS ?? '30000', 10),

  /** Connection timeout in ms */
  redisConnectTimeoutMs: parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS ?? '5000', 10),

  /** Command execution timeout in ms */
  redisCommandTimeoutMs: parseInt(process.env.REDIS_COMMAND_TIMEOUT_MS ?? '3000', 10),

  /** Health-check PING interval in ms */
  redisHealthCheckIntervalMs: parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL_MS ?? '15000', 10),

  /** Key prefix for all Redis keys used by the service */
  redisKeyPrefix: process.env.REDIS_KEY_PREFIX ?? 'chessxu:paymaster:',
} as const;
