import { Worker } from 'bullmq';
import { getRedis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { QueueName } from '../queue.js';
import {
  notifyOrderPlaced,
  notifyOrderAccepted,
  notifyPickupAssigned,
  notifyDeliveryAssigned,
  notifyInvoiceIssued,
  notifyPaymentReceived,
  notifyOrderDelivered,
  notifyRiderNewJob,
} from '../../modules/notifications/notifications.service.js';

// Job data shapes
interface OrderNotificationJob {
  event:       string;
  customerId:  string;
  orderRef:    string;
  totalPaise?: number;
  otp?:        string;
}

interface RiderNotificationJob {
  event:    'rider:job';
  riderId:  string;
  orderRef: string;
  jobType:  'pickup' | 'delivery';
}

type NotificationJob = OrderNotificationJob | RiderNotificationJob;

export function startNotificationWorker(): Worker {
  const worker = new Worker<NotificationJob>(
    QueueName.NOTIFICATION,
    async (job) => {
      const log = logger.child({ worker: 'notification', jobId: job.id, event: (job.data as OrderNotificationJob).event });

      const data = job.data;

      if ((data as RiderNotificationJob).event === 'rider:job') {
        const d = data as RiderNotificationJob;
        await notifyRiderNewJob(d.riderId, d.orderRef, d.jobType);
        log.debug({ riderId: d.riderId }, 'Rider notified');
        return;
      }

      const d = data as OrderNotificationJob;
      switch (d.event) {
        case 'order:placed':
          await notifyOrderPlaced(d.customerId, d.orderRef);
          break;
        case 'order:accepted':
          await notifyOrderAccepted(d.customerId, d.orderRef);
          break;
        case 'pickup:assigned':
          if (!d.otp) { log.warn('No OTP for pickup:assigned'); return; }
          await notifyPickupAssigned(d.customerId, d.orderRef, d.otp);
          break;
        case 'delivery:assigned':
          if (!d.otp) { log.warn('No OTP for delivery:assigned'); return; }
          await notifyDeliveryAssigned(d.customerId, d.orderRef, d.otp);
          break;
        case 'invoice:issued':
          await notifyInvoiceIssued(d.customerId, d.orderRef, d.totalPaise ?? 0);
          break;
        case 'payment:received':
          await notifyPaymentReceived(d.customerId, d.orderRef);
          break;
        case 'order:delivered':
          await notifyOrderDelivered(d.customerId, d.orderRef);
          break;
        default:
          log.warn({ event: d.event }, 'Unknown notification event — skipping');
      }
    },
    {
      connection:  getRedis(),
      concurrency: 20,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, event: (job?.data as OrderNotificationJob)?.event }, 'Notification job failed');
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Notification job completed');
  });

  logger.info('Notification worker started');
  return worker;
}
