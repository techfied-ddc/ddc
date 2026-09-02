// Notifications service — fan-out to SMS, push, and email based on user preferences.
// All notification events flow through this file; never call channel adapters directly
// from business logic.

import { config } from '../../lib/config.js';
import { logger } from '../../lib/logger.js';
import { User } from '../users/user.model.js';
import { Msg91SmsAdapter, LogSmsAdapter } from './sms/msg91.adapter.js';
import { WebPushAdapter, LogPushAdapter } from './push/webpush.adapter.js';
import type { SmsAdapter, PushAdapter, PushPayload } from './notification.adapter.js';

// ── Adapter singletons ────────────────────────────────────────────────────────

function getSmsAdapter(): SmsAdapter {
  return config.SMS_PROVIDER === 'msg91' ? new Msg91SmsAdapter() : new LogSmsAdapter();
}

function getPushAdapter(): PushAdapter {
  return config.VAPID_PUBLIC_KEY ? new WebPushAdapter() : new LogPushAdapter();
}

// ── Core fan-out helper ───────────────────────────────────────────────────────

async function notifyUser(
  userId: string,
  opts: {
    sms?:  { message: string; templateId?: string };
    push?: PushPayload;
  },
): Promise<void> {
  const user = await User.findById(userId).select('phone notifyBySms notifyByPush pushSubscriptions').lean();
  if (!user) return;

  const promises: Promise<void>[] = [];

  if (opts.sms && user.notifyBySms && user.phone) {
    const sms = getSmsAdapter();
    promises.push(
      sms.send(user.phone, opts.sms.message, opts.sms.templateId).catch((err) => {
        logger.error({ err, userId }, 'SMS notification failed');
      }),
    );
  }

  if (opts.push && user.notifyByPush && user.pushSubscriptions?.length) {
    const push = getPushAdapter();
    for (const sub of user.pushSubscriptions) {
      promises.push(
        push.send(sub, opts.push).catch(async (err) => {
          if ((err as { expired?: boolean }).expired) {
            // Remove stale subscription
            await User.updateOne(
              { _id: userId },
              { $pull: { pushSubscriptions: { endpoint: sub.endpoint } } },
            ).catch(() => undefined);
          } else {
            logger.error({ err, userId }, 'Push notification failed');
          }
        }),
      );
    }
  }

  await Promise.allSettled(promises);
}

// ── Notification events ───────────────────────────────────────────────────────

export async function notifyOrderPlaced(
  customerId: string,
  orderRef:   string,
): Promise<void> {
  await notifyUser(customerId, {
    sms:  { message: `Your Desire Dry Cleaning order ${orderRef} has been placed. We will confirm shortly.` },
    push: { title: 'Order Placed', body: `Order ${orderRef} placed. Awaiting store confirmation.`, data: { orderRef } },
  });
}

export async function notifyOrderAccepted(
  customerId: string,
  orderRef:   string,
): Promise<void> {
  await notifyUser(customerId, {
    sms:  { message: `Good news! Your order ${orderRef} has been accepted. A rider will be assigned soon.` },
    push: { title: 'Order Accepted', body: `Order ${orderRef} accepted by the store.`, data: { orderRef } },
  });
}

export async function notifyPickupAssigned(
  customerId: string,
  orderRef:   string,
  pickupOtp:  string,
): Promise<void> {
  await notifyUser(customerId, {
    sms:  { message: `Rider is on the way for ${orderRef}. Your pickup OTP is ${pickupOtp}. Share ONLY with the rider.` },
    push: { title: 'Rider Assigned', body: `Your pickup OTP for ${orderRef}: ${pickupOtp}`, data: { orderRef, pickupOtp } },
  });
}

export async function notifyDeliveryAssigned(
  customerId:  string,
  orderRef:    string,
  deliveryOtp: string,
): Promise<void> {
  await notifyUser(customerId, {
    sms:  { message: `Your clothes are on the way! Order ${orderRef}. Delivery OTP: ${deliveryOtp}. Share ONLY with the rider.` },
    push: { title: 'Out for Delivery', body: `Delivery OTP for ${orderRef}: ${deliveryOtp}`, data: { orderRef, deliveryOtp } },
  });
}

export async function notifyInvoiceIssued(
  customerId: string,
  orderRef:   string,
  totalPaise: number,
): Promise<void> {
  const total = `₹${(totalPaise / 100).toFixed(2)}`;
  await notifyUser(customerId, {
    sms:  { message: `Invoice issued for ${orderRef}. Amount: ${total}. Log in to pay online or choose COD.` },
    push: { title: 'Invoice Ready', body: `${orderRef}: ${total} due. Tap to pay.`, data: { orderRef } },
  });
}

export async function notifyPaymentReceived(
  customerId: string,
  orderRef:   string,
): Promise<void> {
  await notifyUser(customerId, {
    sms:  { message: `Payment confirmed for order ${orderRef}. Thank you for choosing Desire Dry Cleaning!` },
    push: { title: 'Payment Confirmed', body: `Order ${orderRef} — payment received.`, data: { orderRef } },
  });
}

export async function notifyOrderDelivered(
  customerId: string,
  orderRef:   string,
): Promise<void> {
  await notifyUser(customerId, {
    sms:  { message: `Order ${orderRef} delivered! Your clothes are fresh and clean. Rate us on the app.` },
    push: { title: 'Order Delivered!', body: `${orderRef} — enjoy your fresh clothes! Rate your experience.`, data: { orderRef } },
  });
}

// ── Rider notification ────────────────────────────────────────────────────────

export async function notifyRiderNewJob(
  riderId:  string,
  orderRef: string,
  jobType:  'pickup' | 'delivery',
): Promise<void> {
  await notifyUser(riderId, {
    sms:  { message: `New ${jobType} job assigned: ${orderRef}. Check the Desire app for details.` },
    push: { title: `New ${jobType === 'pickup' ? 'Pickup' : 'Delivery'}`, body: `Order ${orderRef} assigned to you.`, data: { orderRef, jobType } },
  });
}
