import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { logger } from './config/logger';
import { createApp } from './app';
// Infrastructure
import { initRedis, closeRedis } from './services/redis';
import { initOidcClient } from './services/oidc';
import { initRateLimiters } from './services/rateLimiter';
import { closeDb } from './db/client';
import { closeQueues } from './queues';
import { setupSockets } from './sockets';
// Workers
import { startAnalyticsWorker, stopAnalyticsWorker } from './workers/analyticsWorker';
import { startExpiryWorker } from './workers/expiryWorker';
import { startPublishWorker } from './workers/publishWorker';
import type { Worker } from 'bullmq';

async function bootstrap(): Promise<void> {
  logger.info({ env: env.NODE_ENV, port: env.PORT }, 'Starting Pulse backend...');

  //  connect infrastructure
  await initRedis();
  logger.info('Redis connected');

  await initOidcClient();
  logger.info('OIDC client ready');

  initRateLimiters();
  logger.info('Rate limiters initialized');

  // Create Express app 
  const app = createApp();
  const httpServer = createServer(app);

  //  Attach Socket.io 
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL, env.APP_URL],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e5, // 100 KB max socket message
    transports: ['websocket', 'polling'],
    // compression for large payloads
    perMessageDeflate: {
      threshold: 1024,
    },
  });

  setupSockets(io);
  logger.info('Socket.io initialized');

  // Start BullMQ workers 
  const analyticsWorker = startAnalyticsWorker();
  const expiryWorker    = startExpiryWorker();
  const publishWorker   = startPublishWorker();
  logger.info('Background workers started');

  //  Start HTTP server
  await new Promise<void>((resolve) => {
    httpServer.listen(env.PORT, () => {
      logger.info(`HTTP server listening on port ${env.PORT}`);
      resolve();
    });
  });

  logger.info(`Pulse is live -> http://localhost:${env.PORT}`);

  // Graceful shutdown 
  const shutdown = async (signal: string): Promise<void> => {
    logger.warn({ signal }, 'Shutdown signal received - draining...');

    // Stop accepting new connections
    httpServer.close();

    // Close socket connections gracefully
    io.close();

    // Drain workers (let in-flight jobs finish)
    await Promise.allSettled([
      stopAnalyticsWorker(analyticsWorker as unknown as Worker),
      expiryWorker.close(),
      publishWorker.close(),
    ]);

    // Close queues, redis, db
    await Promise.allSettled([closeQueues(), closeRedis(), closeDb()]);

    logger.info('Graceful shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    void shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection');
    void shutdown('unhandledRejection');
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Bootstrap failed');
  process.exit(1);
});
