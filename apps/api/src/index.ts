import http from 'http';
import { createApp } from './app.js';
import { connectDb } from './lib/db.js';
import { getRedis } from './lib/redis.js';
import { initSocket } from './lib/socket.js';
import { config } from './lib/config.js';
import { logger } from './lib/logger.js';
import { enqueue, QueueName } from './jobs/queue.js';
import { startRoutingWorker } from './jobs/workers/routing.worker.js';
import { startNotificationWorker } from './jobs/workers/notification.worker.js';
import { startPaymentReconcileWorker } from './jobs/workers/payment-reconcile.worker.js';
import { startRefundWorker } from './jobs/workers/refund.worker.js';
import { startSettlementCloseWorker } from './jobs/workers/settlement-close.worker.js';
import { startAutoCompleteWorker } from './jobs/workers/auto-complete.worker.js';
import { startAnalyticsRollupWorker } from './jobs/workers/analytics-rollup.worker.js';

// ── Periodic job scheduler ────────────────────────────────────────────────────
// These jobs run on an in-process interval rather than an external cron so the
// system works out-of-the-box with zero extra infrastructure.
// Intervals: payment-reconcile every 5 min, auto-complete every hour,
//            analytics-rollup once per day at startup (skips if already ran today).

function schedulePeriodicJobs(): void {
  // Payment reconcile — every 5 minutes
  const reconcileMs = 5 * 60 * 1000;
  const runReconcile = () => void enqueue(QueueName.PAYMENT_RECONCILE, 'reconcile', {});
  runReconcile();
  setInterval(runReconcile, reconcileMs);

  // Auto-complete — every hour
  const autoCompleteMs = 60 * 60 * 1000;
  const runAutoComplete = () => void enqueue(QueueName.AUTO_COMPLETE, 'auto-complete', {});
  runAutoComplete();
  setInterval(runAutoComplete, autoCompleteMs);

  // Analytics rollup — once per day (02:00 IST = 20:30 UTC previous day)
  const scheduleRollup = () => {
    const now = new Date();
    // Next 20:30 UTC
    const next = new Date(now);
    next.setUTCHours(20, 30, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const delay = next.getTime() - now.getTime();
    setTimeout(() => {
      void enqueue(QueueName.ANALYTICS_ROLLUP, 'rollup', {});
      setInterval(() => void enqueue(QueueName.ANALYTICS_ROLLUP, 'rollup', {}), 24 * 60 * 60 * 1000);
    }, delay);
    logger.info({ nextRollup: next.toISOString() }, 'Analytics rollup scheduled');
  };
  scheduleRollup();
}

// ── Server startup ────────────────────────────────────────────────────────────

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
    startNotificationWorker();
    startPaymentReconcileWorker();
    startRefundWorker();
    startSettlementCloseWorker();
    startAutoCompleteWorker();
    startAnalyticsRollupWorker();
    schedulePeriodicJobs();
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
