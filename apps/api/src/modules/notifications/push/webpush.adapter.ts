// Web Push adapter using the VAPID protocol.
// Requires: pnpm add web-push @types/web-push --filter api

import webpush from 'web-push';
import { config } from '../../../lib/config.js';
import { logger } from '../../../lib/logger.js';
import type { PushAdapter, PushSubscription, PushPayload } from '../notification.adapter.js';

let _vapidSet = false;

function ensureVapid() {
  if (_vapidSet) return;
  if (config.VAPID_PUBLIC_KEY && config.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      `mailto:${config.VAPID_SUBJECT}`,
      config.VAPID_PUBLIC_KEY,
      config.VAPID_PRIVATE_KEY,
    );
    _vapidSet = true;
  }
}

export class WebPushAdapter implements PushAdapter {
  async send(subscription: PushSubscription, payload: PushPayload): Promise<void> {
    if (!config.VAPID_PUBLIC_KEY || !config.VAPID_PRIVATE_KEY) {
      logger.warn('VAPID keys not configured — push notification skipped');
      return;
    }
    ensureVapid();
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys:     { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 24 }, // 1 day TTL
      );
      logger.debug({ endpoint: subscription.endpoint.slice(-20) }, 'Push notification sent');
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 410 || code === 404) {
        throw Object.assign(new Error('Push subscription expired'), { expired: true });
      }
      logger.error({ err }, 'Push notification send failed');
      throw err;
    }
  }
}

export class LogPushAdapter implements PushAdapter {
  async send(_sub: PushSubscription, payload: PushPayload): Promise<void> {
    logger.info({ payload }, '[LOG-PUSH] would send push notification');
  }
}
