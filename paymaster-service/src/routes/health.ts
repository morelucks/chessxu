import { Router, Request, Response } from 'express';
import { config } from '../config';
import { getSignerAddress } from '../services/signer';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    signer: getSignerAddress(),
    paymasterAddress: config.paymasterAddress,
    chainId: config.chainId,
    timestamp: new Date().toISOString(),
  });
});

export default router;
