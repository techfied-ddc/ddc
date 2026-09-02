import { config } from '../../../../lib/config.js';
import { logger } from '../../../../lib/logger.js';

export interface EmailOtpAdapter {
  sendOtp(email: string, otp: string): Promise<void>;
}

function buildOtpHtml(otp: string): string {
  return `<!DOCTYPE html>
<html>
<body style="background:#0B0B0C;color:#E8E0CC;font-family:Inter,sans-serif;padding:40px 20px;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#141416;border:1px solid rgba(212,175,55,0.18);border-radius:10px;padding:40px">
    <h1 style="font-family:Georgia,serif;color:#D4AF37;margin:0 0 8px">Desire Dry Cleaning</h1>
    <p style="color:#7A7060;margin:0 0 32px;font-size:14px">Premium Dry Cleaning Service</p>
    <p style="margin:0 0 24px">Your login verification code:</p>
    <div style="background:#0B0B0C;border:1px solid rgba(212,175,55,0.3);border-radius:8px;padding:20px;text-align:center;margin:0 0 24px">
      <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:700;color:#D4AF37;letter-spacing:8px">${otp}</span>
    </div>
    <p style="color:#7A7060;font-size:13px;margin:0">This code expires in 5 minutes. Do not share it with anyone.</p>
  </div>
</body>
</html>`;
}

class ResendEmailOtpAdapter implements EmailOtpAdapter {
  async sendOtp(email: string, otp: string): Promise<void> {
    const apiKey = config.RESEND_API_KEY;
    if (!apiKey) {
      logger.warn({ email }, '[ResendAdapter] RESEND_API_KEY not set — OTP not sent');
      logger.info({ otp }, '[ResendAdapter] OTP for dev (remove in prod)');
      return;
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Desire Dry Cleaning <${config.EMAIL_FROM}>`,
        to: [email],
        subject: `${otp} — Your Desire Dry Cleaning login code`,
        html: buildOtpHtml(otp),
        text: `Your Desire Dry Cleaning login code is: ${otp}\n\nThis code expires in 5 minutes.`,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => 'unknown');
      throw new Error(`Resend API error ${res.status}: ${body}`);
    }
  }
}

let _adapter: EmailOtpAdapter | null = null;

export function getEmailOtpAdapter(): EmailOtpAdapter {
  if (!_adapter) _adapter = new ResendEmailOtpAdapter();
  return _adapter;
}
