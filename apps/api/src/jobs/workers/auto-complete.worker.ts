// Auto-completes orders that are in DELIVERED status for more than
// AUTO_COMPLETE_HOURS without a manual action from store or customer.
// Enqueue this job on a schedule (e.g. every hour via a cron or startup interval).
import { Worker } from 'bullmq';
import { getRedis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { QueueName } from '../queue.js';
import { Order } from '../../modules/orders/order.model.js';
import { transitionOrder } from '../../modules/orders/orders.service.js';
import { OrderStatus, Role } from '@ddc/shared';

const AUTO_COMPLETE_HOURS = 48; // complete orders 48 h after DELIVERED

export function startAutoCompleteWorker(): Worker {
  const worker = new Worker(
    QueueName.AUTO_COMPLETE,
    async (job) => {
      const log = logger.child({ worker: 'auto-complete', jobId: job.id });

      const cutoff = new Date(Date.now() - AUTO_COMPLETE_HOURS * 60 * 60 * 1000);

      const deliveredOrders = await Order.find({
        status:    OrderStatus.DELIVERED,
        updatedAt: { $lt: cutoff },
      }).select('_id orderRef').lean();

      if (deliveredOrders.length === 0) {
        log.debug('No orders to auto-complete');
        return;
      }

      log.info({ count: deliveredOrders.length }, 'Auto-completing delivered orders');

      const results = await Promise.allSettled(
        deliveredOrders.map((order) =>
          transitionOrder({
            orderId:   order._id.toString(),
            event:     'COMPLETE',
            actorId:   'system',
            actorRole: Role.SUPER_ADMIN,
            payload:   { note: `Auto-completed after ${AUTO_COMPLETE_HOURS}h in DELIVERED state.` },
          }),
        ),
      );

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        log.warn({ failed: failed.length }, 'Some orders could not be auto-completed');
      }

      log.info(
        { completed: results.length - failed.length, failed: failed.length },
        'Auto-complete run finished',
      );
    },
    {
      connection:  getRedis(),
      concurrency: 1,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Auto-complete job failed');
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Auto-complete job completed');
  });

  logger.info('Auto-complete worker started');
  return worker;
}
