import 'express-async-errors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import pinoHttp from 'pino-http';

import { env } from './config/env';
import { logger } from './config/logger';
import { correlationIdMiddleware } from './middleware/correlationId';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// route modules
import authRoutes      from './modules/auth/auth.routes';
import pollsRoutes     from './modules/polls/polls.routes';
import responsesRoutes from './modules/responses/responses.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import resultsRoutes   from './modules/results/results.routes';
import usersRoutes     from './modules/users/users.routes';
import healthRoutes    from './modules/health/health.routes';

export function createApp(): Express {
  const app = express();

  // Security headers 
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS 
  app.use(
    cors({
      origin: (origin, cb) => {
        const allowed = [env.FRONTEND_URL, env.APP_URL];
        if (!origin || allowed.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Session-ID'],
      exposedHeaders: ['X-Correlation-ID', 'Retry-After'],
    })
  );

  app.use(express.json({ limit: '512kb' }));
  app.use(express.urlencoded({ extended: true, limit: '512kb' }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(compression());

  // request logging
  app.use(
    pinoHttp({
      logger,
      customLogLevel(_req: express.Request, res: express.Response) {
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      autoLogging: {
        ignore: (req) =>
          env.NODE_ENV === 'production' && (req.url?.startsWith('/health') ?? false),
      },
    })
  );

  //  Correlation IDs
  app.use(correlationIdMiddleware);

  // Trust proxy
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Routes
  const API = '/api/v1';

  app.use('/health',                            healthRoutes);
  app.use(`${API}/auth`,                        authRoutes);
  app.use(`${API}/users`,                       usersRoutes);
  app.use(`${API}/polls`,                       pollsRoutes);
  app.use(`${API}/polls/:pollId/responses`,     responsesRoutes);
  app.use(`${API}/polls/:pollId/analytics`,     analyticsRoutes);
  app.use(`${API}/polls/:pollId/results`,       resultsRoutes);

  // 404 & error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}