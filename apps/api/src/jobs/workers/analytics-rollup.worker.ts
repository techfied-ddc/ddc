// Pre-computes and caches daily + monthly analytics aggregates into a dedicated
// collection so the admin dashboard reads cached numbers instead of running
// expensive aggregations on every request.
// Run this job once per day (e.g. 02:00 IST) via a cron enqueue.
import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { getRedis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { QueueName } from '../queue.js';
import { Invoice } from '../../modules/invoicing/invoice.model.js';
import { Order } from '../../modules/orders/order.model.js';
import { InvoiceStatus, OrderStatus } from '@ddc/shared';

// Lightweight schema for the rollup cache — upserted by this worker
const AnalyticsRollupSchema = new mongoose.Schema(
  {
    type:        { type: String, enum: ['daily', 'monthly'], required: true },
    date:        { type: String, required: true },  // YYYY-MM-DD (daily) or YYYY-MM (monthly)
    storeId:     { type: mongoose.Schema.Types.ObjectId, default: null }, // null = platform-wide
    revenue:     { type: Number, default: 0 },       // paise
    orderCount:  { type: Number, default: 0 },
    avgOrderPaise: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },    // 0–1
  },
  { timestamps: true },
);

AnalyticsRollupSchema.index({ type: 1, date: 1, storeId: 1 }, { unique: true });

const AnalyticsRollup =
  mongoose.models['AnalyticsRollup'] ??
  mongoose.model('AnalyticsRollup', AnalyticsRollupSchema);

async function rollupDay(dateStr: string): Promise<void> {
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd   = new Date(`${dateStr}T23:59:59.999Z`);

  // Platform-wide daily revenue & order count
  const [revenueResult, orderResult] = await Promise.all([
    Invoice.aggregate<{ total: number; count: number }>([
      {
        $match: {
          status:  InvoiceStatus.PAID,
          paidAt:  { $gte: dayStart, $lte: dayEnd },
        },
      },
      {
        $group: {
          _id:   null,
          total: { $sum: '$totalPaise' },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate<{ total: number; completed: number }>([
      { $match: { createdAt: { $gte: dayStart, $lte: dayEnd } } },
      {
        $group: {
          _id:       null,
          total:     { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.COMPLETED] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const revenue       = revenueResult[0]?.total ?? 0;
  const paidCount     = revenueResult[0]?.count ?? 0;
  const totalOrders   = orderResult[0]?.total ?? 0;
  const completed     = orderResult[0]?.completed ?? 0;
  const avgOrderPaise = paidCount > 0 ? Math.round(revenue / paidCount) : 0;
  const completionRate = totalOrders > 0 ? completed / totalOrders : 0;

  await AnalyticsRollup.findOneAndUpdate(
    { type: 'daily', date: dateStr, storeId: null },
    { revenue, orderCount: totalOrders, avgOrderPaise, completionRate },
    { upsert: true, new: true },
  );
}

async function rollupMonth(monthStr: string): Promise<void> {
  // Sum up all daily rollups for the month
  const rows = await AnalyticsRollup.find({
    type:    'daily',
    date:    { $regex: `^${monthStr}` },
    storeId: null,
  }).lean();

  const revenue      = rows.reduce((s, r) => s + r.revenue,     0);
  const orderCount   = rows.reduce((s, r) => s + r.orderCount,  0);
  const avgOrderPaise = orderCount > 0
    ? Math.round(rows.reduce((s, r) => s + r.revenue, 0) / orderCount)
    : 0;
  const completionRate = rows.length > 0
    ? rows.reduce((s, r) => s + r.completionRate, 0) / rows.length
    : 0;

  await AnalyticsRollup.findOneAndUpdate(
    { type: 'monthly', date: monthStr, storeId: null },
    { revenue, orderCount, avgOrderPaise, completionRate },
    { upsert: true, new: true },
  );
}

export function startAnalyticsRollupWorker(): Worker {
  const worker = new Worker(
    QueueName.ANALYTICS_ROLLUP,
    async (job) => {
      const log = logger.child({ worker: 'analytics-rollup', jobId: job.id });

      // Roll up yesterday's data (the day is complete by the time this runs at ~02:00 IST)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dateStr   = yesterday.toISOString().slice(0, 10);          // YYYY-MM-DD
      const monthStr  = yesterday.toISOString().slice(0, 7);           // YYYY-MM

      await rollupDay(dateStr);
      await rollupMonth(monthStr);

      log.info({ dateStr, monthStr }, 'Analytics rollup completed');
    },
    {
      connection:  getRedis(),
      concurrency: 1,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Analytics-rollup job failed');
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Analytics-rollup job completed');
  });

  logger.info('Analytics-rollup worker started');
  return worker;
}
