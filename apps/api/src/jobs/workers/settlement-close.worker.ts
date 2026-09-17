// Runs a payout settlement close for a given store + period.
// Enqueued by admin via POST /api/v1/payouts/:storeId/run, or by a scheduled cron.
// Using a worker decouples the (potentially slow) aggregation from the HTTP request.
import { Worker } from 'bullmq';
import { getRedis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { QueueName } from '../queue.js';
import { runSettlement } from '../../modules/payouts/payouts.service.js';
import { emitToStore } from '../../lib/socket.js';

export interface SettlementCloseJobData {
  storeId:    string;
  periodFrom: string; // ISO date string
  periodTo:   string; // ISO date string
  adminId:    string;
}

export function startSettlementCloseWorker(): Worker<SettlementCloseJobData> {
  const worker = new Worker<SettlementCloseJobData>(
    QueueName.SETTLEMENT_CLOSE,
    async (job) => {
      const { storeId, periodFrom, periodTo, adminId } = job.data;
      const log = logger.child({ worker: 'settlement-close', storeId, jobId: job.id });

      const payout = await runSettlement(
        storeId,
        new Date(periodFrom),
        new Date(periodTo),
        adminId,
      );

      emitToStore(storeId, 'payout:generated', {
        payoutId:    payout._id.toString(),
        periodFrom,
        periodTo,
        netPayoutPaise: payout.netPayoutPaise,
      });

      log.info(
        { payoutId: payout._id, netPayoutPaise: payout.netPayoutPaise },
        'Settlement closed successfully',
      );
    },
    {
      connection:  getRedis(),
      concurrency: 3,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, storeId: job?.data?.storeId }, 'Settlement-close job failed');
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Settlement-close job completed');
  });

  logger.info('Settlement-close worker started');
  return worker;
}
