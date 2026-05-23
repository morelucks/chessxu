import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import { type UserOp } from '../services/validator';
import { config } from '../config';

const router = Router();
export const provider = new ethers.JsonRpcProvider(config.celoRpcUrl);

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userOp, chainId } = req.body as { userOp: UserOp; chainId: number };

  if (!userOp || typeof chainId !== 'number') {
    res.status(400).json({ error: 'Request must include userOp object and chainId number.' });
    return;
  }

  res.status(501).json({ error: 'Not yet implemented' });
});

export default router;
