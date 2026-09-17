// Periodically checks PENDING online payments that haven't been confirmed via
// webhook. If a payment is still PENDING after 30 minutes it is marked FAILED
// so the customer can retry. Triggered by the scheduler (enqueue every 5 min).
import { Worker } from 'bullmq';
import { getRedis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { QueueName } from '../queue.js';
import { Invoice } from '../../modules/invoicing/invoice.model.js';
import { Order } from '../../modules/orders/order.model.js';
import { InvoiceStatus, PaymentStatus, PaymentMode } from '@ddc/shared';

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export function startPaymentReconcileWorker(): Worker {
  const worker = new Worker(
    QueueName.PAYMENT_RECONCILE,
    async (job) => {
      const log = logger.child({ worker: 'payment-reconcile', jobId: job.id });

      const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

      // Find ISSUED invoices with a gatewayOrderId that are older than threshold
      // (these never had a webhook fire)
      const staleInvoices = await Invoice.find({
        status:         InvoiceStatus.ISSUED,
        gatewayOrderId: { $exists: true, $ne: null },
        updatedAt:      { $lt: cutoff },
      }).lean();

      if (staleInvoices.length === 0) {
        log.debug('No stale payments to reconcile');
        return;
      }

      log.info({ count: staleInvoices.length }, 'Reconciling stale payments');

      for (const invoice of staleInvoices) {
        const order = await Order.findById(invoice.orderId);
        if (!order) continue;

        // Only touch ONLINE orders that are still PENDING
        if (
          order.paymentMode !== PaymentMode.ONLINE ||
          order.paymentStatus !== PaymentStatus.PENDING
        ) continue;

        // Mark the payment as FAILED so the customer can retry
        order.paymentStatus = PaymentStatus.FAILED;
        await order.save();

        log.warn(
          { orderId: order._id, orderRef: order.orderRef, gatewayOrderId: invoice.gatewayOrderId },
          'Stale payment marked FAILED',
        );
      }
    },
    {
      connection:  getRedis(),
      concurrency: 1, // runs serially; no need for parallelism
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Payment-reconcile job failed');
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Payment-reconcile job completed');
  });

  logger.info('Payment-reconcile worker started');
  return worker;
}
