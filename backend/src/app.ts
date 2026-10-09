import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';
import { incidentRouter } from './modules/incidents/incident.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(requestId);

// Simple request logger via pino — compatible with ESM/NodeNext module resolution
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      { method: req.method, url: req.url, status: res.statusCode, ms: Date.now() - start },
      'request'
    );
  });
  next();
});

// Limit body to 8 KB — generous but bounded.
app.use(express.json({ limit: '8kb' }));

// Rate limiting on API routes
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

app.use('/health', healthRouter);
app.use('/v1/incidents', limiter, incidentRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use(errorHandler);

export { app };
