/**
 * /healthz route
 *
 * GET /api/v1/healthz
 *
 * Returns a detailed JSON health report for the paymaster service.
 * HTTP 200 when status is "ok" or "warn".
 * HTTP 503 when status is "error" (one or more critical components are down).
 *
 * Response shape: HealthReport (see healthMonitor.ts)
 */

import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import { config } from '../config';
import { buildHealthReport } from '../services/healthMonitor';

const router = Router();

// Shared provider — reuse across requests to avoid re-establishing connections
const provider = new ethers.JsonRpcProvider(config.celoRpcUrl);

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const report = await buildHealthReport(provider);

    // 503 only when a critical component is fully down
    const httpStatus = report.status === 'error' ? 503 : 200;

    res.status(httpStatus).json(report);
  } catch (err) {
    // Unexpected failure in the health check itself
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Health check failed unexpectedly',
    });
  }
});

export default router;
