import { Queue, type JobsOptions } from 'bullmq';
import { getRedis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

// All named queues in the system
export const QueueName = {
  ROUTING:              'routing',
  NOTIFICATION:         'notification',
  PAYMENT_RECONCILE:    'payment-reconcile',
  REFUND:               'refund',
  SETTLEMENT_CLOSE:     'settlement-close',
  AUTO_COMPLETE:        'auto-complete',
  ANALYTICS_ROLLUP:     'analytics-rollup',
} as const;

export type QueueNameKey = typeof QueueName[keyof typeof QueueName];

const queues = new Map<QueueNameKey, Queue>();

const getQueue = (name: QueueNameKey): Queue => {
  if (!queues.has(name)) {
    queues.set(
      name,
      new Queue(name, {
        connection: getRedis(),
        defaultJobOptions: {
          attempts:    3,
          backoff:     { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 1000 },
          removeOnFail:     { count: 5000 },
        },
      }),
    );
  }
  return queues.get(name)!;
};

export const enqueue = async <T>(
  queueName: QueueNameKey,
  jobName: string,
  data: T,
  opts?: JobsOptions,
): Promise<void> => {
  try {
    const queue = getQueue(queueName);
    await queue.add(jobName, data, opts);
    logger.debug({ queue: queueName, job: jobName }, 'Job enqueued');
  } catch (err) {
    logger.error({ err, queue: queueName, job: jobName }, 'Failed to enqueue job');
    // Don't throw — job enqueueing failure must not break the request
  }
};

export { getQueue };
