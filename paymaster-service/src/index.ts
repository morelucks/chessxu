import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.listen(config.port, () => {
  console.log(`[paymaster-service] Listening on port ${config.port}`);
});

export default app;
