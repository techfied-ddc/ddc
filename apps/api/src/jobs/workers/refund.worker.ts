// Processes queued refund requests. Decoupled from the request path so that
// transient gateway failures don't fail the HTTP response — the job retries
// with exponential back-off (configured in queue.ts: 3 attempts, exp delay).
import { Worker } from 'bullmq';
import { getRedis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { QueueName } from '../queue.js';
import { createRefund } from '../../modules/payments/payments.service.js';
import { Order } from '../../modules/orders/order.model.js';
import { emitToUser } from '../../lib/socket.js';

export interface RefundJobData {
  orderId:      string;
  amountPaise?: number;
  reason?:      string;
}

export function startRefundWorker(): Worker<RefundJobData> {
  const worker = new Worker<RefundJobData>(
    QueueName.REFUND,
    async (job) => {
      const { orderId, amountPaise, reason } = job.data;
      const log = logger.child({ worker: 'refund', orderId, jobId: job.id });

      await createRefund(orderId, amountPaise, reason);

      // Notify the customer in real-time
      const order = await Order.findById(orderId).lean();
      if (order) {
        emitToUser(order.userId.toString(), 'refund:processed', {
          orderRef:    order.orderRef,
          amountPaise: amountPaise ?? null,
        });
        log.info({ orderRef: order.orderRef, amountPaise }, 'Refund processed');
      }
    },
    {
      connection:  getRedis(),
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, orderId: job?.data?.orderId }, 'Refund job failed');
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Refund job completed');
  });

  logger.info('Refund worker started');
  return worker;
}
