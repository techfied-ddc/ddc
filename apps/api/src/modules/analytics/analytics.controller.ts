import type { Request, Response, NextFunction } from 'express';
import { Order } from '../orders/order.model.js';
import { Store } from '../stores/store.model.js';
import { Invoice } from '../invoicing/invoice.model.js';
import { Ticket } from '../tickets/ticket.model.js';
import { StoreStatus, InvoiceStatus, TicketStatus, OrderStatus } from '@ddc/shared';

// GET /api/v1/analytics/summary — admin dashboard summary stats
export const getSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now     = new Date();
    const day30   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const day7    = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      ordersThisMonth,
      activeStores,
      openTickets,
      revenueResult,
      revenueThisMonthResult,
      statusBreakdown,
      recentRevenue,
    ] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ createdAt: { $gte: day30 } }),
      Store.countDocuments({ status: StoreStatus.APPROVED }),
      Ticket.countDocuments({ status: { $in: [TicketStatus.OPEN, TicketStatus.PENDING_ADMIN] } }),

      // Total paid revenue (paise)
      Invoice.aggregate<{ total: number }>([
        { $match: { status: InvoiceStatus.PAID } },
        { $group: { _id: null, total: { $sum: '$totalPaise' } } },
      ]),

      // Revenue this month
      Invoice.aggregate<{ total: number }>([
        { $match: { status: InvoiceStatus.PAID, paidAt: { $gte: day30 } } },
        { $group: { _id: null, total: { $sum: '$totalPaise' } } },
      ]),

      // Order status breakdown
      Order.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Revenue per day for last 7 days
      Invoice.aggregate<{ _id: string; totalPaise: number; count: number }>([
        { $match: { status: InvoiceStatus.PAID, paidAt: { $gte: day7 } } },
        {
          $group: {
            _id:        { $dateToString: { format: '%Y-%m-%d', date: '$paidAt', timezone: 'Asia/Kolkata' } },
            totalPaise: { $sum: '$totalPaise' },
            count:      { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Build status map
    const statusMap: Record<string, number> = {};
    for (const entry of statusBreakdown) statusMap[entry._id] = entry.count;

    res.json({
      ok: true,
      data: {
        totalOrders,
        ordersThisMonth,
        activeStores,
        openTickets,
        totalRevenuePaise:        revenueResult[0]?.total ?? 0,
        revenueThisMonthPaise:    revenueThisMonthResult[0]?.total ?? 0,
        statusBreakdown:          statusMap,
        revenueByDay:             recentRevenue,
        pendingOrders:            (statusMap[OrderStatus.PLACED] ?? 0) + (statusMap[OrderStatus.ROUTED] ?? 0),
        routingFailedOrders:      statusMap[OrderStatus.ROUTING_FAILED] ?? 0,
      },
    });
  } catch (err) { next(err); }
};
