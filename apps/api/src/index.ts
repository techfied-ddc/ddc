import http from 'http';
import { createApp } from './app.js';
import { connectDb } from './lib/db.js';
import { getRedis } from './lib/redis.js';
import { initSocket } from './lib/socket.js';
import { config } from './lib/config.js';
import { logger } from './lib/logger.js';
import { startRoutingWorker } from './jobs/workers/routing.worker.js';

const start = async () => {
  await connectDb();

  // Warm Redis connection
  getRedis();

  const app        = createApp();
  const httpServer = http.createServer(app);

  initSocket(httpServer);

  // Start BullMQ workers
  if (config.NODE_ENV !== 'test') {
    startRoutingWorker();
  }

  httpServer.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'DDC API started');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully…');

    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    const { disconnectDb } = await import('./lib/db.js');
    await disconnectDb();

    process.exit(0);
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT',  () => void shutdown('SIGINT'));
};

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
