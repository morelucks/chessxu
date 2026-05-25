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
  redisUrl: process.env.REDIS_URL,
  chainId: 42220,
  /** Validity window for signed UserOps in seconds */
  signValiditySeconds: parseInt(process.env.SIGN_VALIDITY_SECONDS ?? '600', 10),
} as const;
