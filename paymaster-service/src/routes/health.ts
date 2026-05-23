import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    chainId: config.chainId,
    timestamp: new Date().toISOString(),
  });
});

export default router;
