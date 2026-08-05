/**
 * /health route (legacy simple health check)
 *
 * GET /api/v1/health
 *
 * Kept for backward compatibility with existing Docker healthcheck config.
 * For detailed diagnostics use GET /healthz or GET /api/v1/healthz instead.
 */

import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import { config } from '../config';
import { getSignerAddress } from '../services/signer';
import { getTotalSponsored, incrementSponsored } from '../services/healthMonitor';

export { incrementSponsored };

const router = Router();
const provider = new ethers.JsonRpcProvider(config.celoRpcUrl);
const PAYMASTER_ABI = ['function getDeposit() view returns (uint256)'];

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  let deposit = '0';
  let rpcOk = false;

  try {
    const paymaster = new ethers.Contract(config.paymasterAddress, PAYMASTER_ABI, provider);
    const raw: bigint = await paymaster.getDeposit();
    deposit = ethers.formatEther(raw);
    rpcOk = true;
  } catch {
    // Non-fatal
  }

  res.json({
    status: 'ok',
    signer: getSignerAddress(),
    paymasterAddress: config.paymasterAddress,
    celoDeposit: deposit,
    rpcConnected: rpcOk,
    chainId: config.chainId,
    totalSponsored: getTotalSponsored(),
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    note: 'For detailed diagnostics see GET /healthz',
  });
});

export default router;
