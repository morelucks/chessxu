import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import sponsorRouter from './routes/sponsor';
import healthRouter from './routes/health';
import healthzRouter from './routes/healthz';
import { shutdownRedis, getRedisClient, isRedisHealthy } from './services/redisPool';
import { shutdown as shutdownRateLimiter } from './services/rateLimiter';

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
app.use('/healthz', healthzRouter);
// Also mount under /api/v1/healthz for API consistency
app.use('/api/v1/healthz', healthzRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function bootstrap(): Promise<void> {
  // Attempt to connect to Redis on startup (non-blocking — we fall back to in-memory)
  if (config.redisUrl) {
    try {
      const client = await getRedisClient();
      if (client && isRedisHealthy()) {
        console.log('[paymaster-service] Redis connected — using distributed rate limiting');
      } else {
        console.warn('[paymaster-service] Redis connection failed — falling back to in-memory rate limiting');
      }
    } catch (err) {
      console.warn('[paymaster-service] Redis unavailable at startup — using in-memory fallback:', (err as Error).message);
    }
  } else {
    console.log('[paymaster-service] REDIS_URL not set — using in-memory rate limiting');
  }
}

app.listen(config.port, () => {
  console.log(`[paymaster-service] Listening on port ${config.port}`);
  console.log(`[paymaster-service] Chain: Celo Mainnet (${config.chainId})`);
  console.log(`[paymaster-service] Paymaster: ${config.paymasterAddress}`);
  bootstrap().catch((err) => {
    console.error('[paymaster-service] Bootstrap error:', err);
  });
});

// ---------------------------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------------------------

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`[paymaster-service] ${signal} received, shutting down gracefully`);

  // Stop accepting new connections (server close is handled by process exit)
  shutdownRateLimiter();

  // Close Redis pool
  try {
    await shutdownRedis();
    console.log('[paymaster-service] Redis pool closed');
  } catch (err) {
    console.error('[paymaster-service] Error closing Redis pool:', (err as Error).message);
  }

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
