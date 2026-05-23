import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import sponsorRouter from './routes/sponsor';
import healthRouter from './routes/health';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/v1/sponsor', sponsorRouter);
app.use('/api/v1/health', healthRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`[paymaster-service] Listening on port ${config.port}`);
  console.log(`[paymaster-service] Chain: Celo Mainnet (${config.chainId})`);
  console.log(`[paymaster-service] Paymaster: ${config.paymasterAddress}`);
});

export default app;
