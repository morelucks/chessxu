import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import { validateUserOp, validateNonce, type UserOp } from '../services/validator';
import { checkRateLimit } from '../services/rateLimiter';
import { config } from '../config';

const router = Router();
export const provider = new ethers.JsonRpcProvider(config.celoRpcUrl);

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userOp, chainId } = req.body as { userOp: UserOp; chainId: number };

  if (!userOp || typeof chainId !== 'number') {
    res.status(400).json({ error: 'Request must include userOp object and chainId number.' });
    return;
  }

  const validation = validateUserOp(userOp, chainId);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const rateLimit = await checkRateLimit(userOp.sender);
  if (!rateLimit.allowed) {
    res.status(429).json({
      error: `Rate limit exceeded. Max ${config.rateLimitPerAddress} sponsored transactions per address per 24h.`,
      resetAt: rateLimit.resetAt,
    });
    return;
  }

  const nonceCheck = await validateNonce(userOp, provider);
  if (!nonceCheck.valid) {
    res.status(400).json({ error: nonceCheck.error });
    return;
  }

  res.status(501).json({ error: 'Signing not yet wired' });
});

export default router;
