// MSG91 SMS adapter.
// Uses the Flow API (transactional OTP/template SMS).
// Docs: https://docs.msg91.com/

import { config } from '../../../lib/config.js';
import { logger } from '../../../lib/logger.js';
import type { SmsAdapter } from '../notification.adapter.js';

const MSG91_API = 'https://control.msg91.com/api/v5/flow/';

export class Msg91SmsAdapter implements SmsAdapter {
  async send(to: string, message: string, templateId?: string): Promise<void> {
    if (!config.SMS_API_KEY) {
      logger.warn({ to }, 'SMS_API_KEY not set — SMS skipped in this environment');
      return;
    }

    const e164 = to.startsWith('+') ? to.slice(1) : `91${to.replace(/^0/, '')}`;

    const body = {
      template_id: templateId ?? config.SMS_OTP_TEMPLATE_ID ?? config.SMS_OTP_TEMPLATE ?? '',
      recipients: [
        {
          mobiles: e164,
          var1:    message, // template variable 1 — the OTP or message content
        },
      ],
    };

    const res = await fetch(MSG91_API, {
      method:  'POST',
      headers: {
        authkey:        config.SMS_API_KEY!,
        'Content-Type': 'application/json',
        accept:         'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '(no body)');
      logger.error({ to: e164, status: res.status, text }, 'MSG91 SMS send failed');
      throw new Error(`MSG91 error ${res.status}: ${text}`);
    }

    logger.info({ to: e164 }, 'SMS sent via MSG91');
  }
}

export class LogSmsAdapter implements SmsAdapter {
  async send(to: string, message: string): Promise<void> {
    logger.info({ to, message }, '[LOG-SMS] would send SMS');
  }
}
