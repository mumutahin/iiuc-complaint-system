import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { generalLimiter, authLimiter } from './middleware/rateLimiters.js';
import { notFoundHandler, errorMiddleware } from './middleware/errorMiddleware.js';
import apiRouter from './routes/index.js';

/**
 * Reads CORS_ORIGINS from the environment (comma-separated) and always
 * includes the two local Vite dev ports so `npm run dev` works out of
 * the box without any .env setup. Called lazily (inside createApp, not
 * at module import time) so it always reads the value AFTER dotenv has
 * loaded, no matter the import order.
 */
function getAllowedOrigins() {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const localDefaults = ['http://localhost:5173', 'http://localhost:5174'];
  return [...new Set([...fromEnv, ...localDefaults])];
}

export function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.set('trust proxy', 1); // required on Render/behind a reverse proxy for correct req.ip / rate limiting

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow tools with no Origin header (curl, server-to-server health checks).
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(generalLimiter);

  // Public health check — used by Render/uptime monitors, must never
  // require auth, so it is deliberately registered BEFORE the /api
  // router (which applies authMiddleware to everything under it).
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authLimiter); // extra throttle specifically on auth traffic
  app.use('/api', apiRouter);

  // 404 + centralized error handler, always LAST, in this order.
  app.use(notFoundHandler);
  app.use(errorMiddleware);

  return app;
}
