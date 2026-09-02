import { Worker } from 'bullmq';
import { getRedis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { QueueName } from '../queue.js';
import { Order } from '../../modules/orders/order.model.js';
import { transitionOrder } from '../../modules/orders/orders.service.js';
import { Store } from '../../modules/stores/store.model.js';
import { routeOrder } from '../../modules/geo/geo.service.js';
import { OrderStatus, Role } from '@ddc/shared';

export function startRoutingWorker(): Worker {
  const worker = new Worker(
    QueueName.ROUTING,
    async (job) => {
      const { orderId } = job.data as { orderId: string };
      const log = logger.child({ worker: 'routing', orderId, jobId: job.id });

      const order = await Order.findById(orderId).lean();
      if (!order) { log.warn('Order not found — skipping routing'); return; }

      if (order.status !== OrderStatus.PLACED) {
        log.info({ status: order.status }, 'Order not in PLACED state — skipping routing');
        return;
      }

      const result = await routeOrder({
        pincode: order.address.pincode,
        lat:     order.address.lat,
        lng:     order.address.lng,
      });

      if (!result) {
        // No store found — transition to ROUTE_FAIL; admin will assign manually
        await transitionOrder({
          orderId,
          event:     'ROUTE_FAIL',
          actorId:   'system',
          actorRole: Role.SUPER_ADMIN,
          payload:   { note: 'No matching store found for the customer location.' },
        });
        log.warn('No matching store — order moved to ROUTE_FAIL');
        return;
      }

      // Lookup slot window details from the routed store
      const store    = await Store.findById(result.storeId).lean();
      const fullOrder = await Order.findById(orderId).lean();
      const window   = store?.pickupSlots?.windows?.find(
        (w) => w._id.toString() === fullOrder?.pickupSlot.windowId?.toString(),
      );

      await transitionOrder({
        orderId,
        event:     'ROUTE_OK',
        actorId:   'system',
        actorRole: Role.SUPER_ADMIN,
        payload: {
          storeId:        result.storeId,
          routingMethod:  result.method,
          windowLabel:    window?.label ?? '',
          start:          window?.start ?? '',
          end:            window?.end   ?? '',
        },
      });

      log.info({ storeId: result.storeId, method: result.method }, 'Order routed successfully');
    },
    {
      connection:  getRedis(),
      concurrency: 10,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, orderId: job?.data?.orderId }, 'Routing job failed');
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Routing job completed');
  });

  logger.info('Routing worker started');
  return worker;
}
