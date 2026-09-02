import { config } from '../../../lib/config.js';
import { logger } from '../../../lib/logger.js';

export interface SmsAdapter {
  sendOtp(phone: string, otp: string): Promise<void>;
  sendText(phone: string, message: string): Promise<void>;
}

// ── MSG91 ─────────────────────────────────────────────────────────────────────
class Msg91Adapter implements SmsAdapter {
  private readonly apiKey:    string;
  private readonly senderId:  string;
  private readonly templateId: string;

  constructor() {
    if (!config.SMS_API_KEY || !config.SMS_SENDER_ID || !config.SMS_OTP_TEMPLATE) {
      throw new Error('MSG91 env vars not set (SMS_API_KEY, SMS_SENDER_ID, SMS_OTP_TEMPLATE)');
    }
    this.apiKey     = config.SMS_API_KEY;
    this.senderId   = config.SMS_SENDER_ID;
    this.templateId = config.SMS_OTP_TEMPLATE;
  }

  async sendOtp(phone: string, otp: string): Promise<void> {
    // MSG91 OTP API v5
    const body = JSON.stringify({
      template_id: this.templateId,
      mobile:      phone.replace('+', ''), // MSG91 expects without +
      authkey:     this.apiKey,
      otp,
    });

    const res = await fetch('https://control.msg91.com/api/v5/otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MSG91 OTP send failed: ${res.status} ${text}`);
    }

    logger.info({ phone: phone.slice(0, 6) + '****' }, 'OTP SMS sent via MSG91');
  }

  async sendText(phone: string, message: string): Promise<void> {
    const params = new URLSearchParams({
      authkey:  this.apiKey,
      mobiles:  phone.replace('+', ''),
      message,
      sender:   this.senderId,
      route:    '4',
    });

    const res = await fetch(`https://control.msg91.com/api/sendhttp.php?${params}`);
    if (!res.ok) throw new Error(`MSG91 sendText failed: ${res.status}`);
  }
}

// ── Mock (development / test) ──────────────────────────────────────────────────
class MockSmsAdapter implements SmsAdapter {
  async sendOtp(phone: string, otp: string): Promise<void> {
    logger.info({ phone, otp }, '[MockSMS] OTP would be sent');
  }

  async sendText(phone: string, message: string): Promise<void> {
    logger.info({ phone, message }, '[MockSMS] Text would be sent');
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────
let _smsAdapter: SmsAdapter | null = null;

export const getSmsAdapter = (): SmsAdapter => {
  if (!_smsAdapter) {
    _smsAdapter = config.SMS_PROVIDER === 'msg91'
      ? new Msg91Adapter()
      : new MockSmsAdapter();
  }
  return _smsAdapter;
};
