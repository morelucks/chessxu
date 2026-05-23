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

app.use('/api/v1/sponsor', sponsorRouter);
app.use('/api/v1/health', healthRouter);

app.listen(config.port, () => {
  console.log(`[paymaster-service] Listening on port ${config.port}`);
  console.log(`[paymaster-service] Chain: Celo Mainnet (${config.chainId})`);
  console.log(`[paymaster-service] Paymaster: ${config.paymasterAddress}`);
});

export default app;
