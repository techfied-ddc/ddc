import { z } from 'zod';

const schema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT:     z.coerce.number().default(4000),

  // MongoDB
  MONGODB_URI: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET:       z.string().min(32),
  JWT_REFRESH_SECRET:      z.string().min(32),
  JWT_ACCESS_EXPIRES_IN:   z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN:  z.string().default('30d'),

  // Cookie
  COOKIE_DOMAIN:   z.string().optional(),
  COOKIE_SECURE:   z.coerce.boolean().default(true),

  // CORS
  CORS_ORIGINS: z.string().transform((v) => v.split(',')),

  // Google OAuth
  GOOGLE_CLIENT_ID:     z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI:  z.string().url(),

  // SMS (MSG91)
  SMS_PROVIDER:     z.enum(['msg91', 'mock']).default('mock'),
  SMS_API_KEY:      z.string().optional(),
  SMS_SENDER_ID:    z.string().optional(),
  SMS_OTP_TEMPLATE:    z.string().optional(),
  SMS_OTP_TEMPLATE_ID: z.string().optional(), // alias for MSG91 template ID

  // Payment
  PAYMENT_PROVIDER:         z.enum(['razorpay', 'cashfree', 'mock']).default('mock'),
  RAZORPAY_KEY_ID:          z.string().optional(),
  RAZORPAY_KEY_SECRET:      z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET:  z.string().optional(),
  CASHFREE_APP_ID:          z.string().optional(),
  CASHFREE_SECRET_KEY:      z.string().optional(),
  CASHFREE_WEBHOOK_SECRET:  z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY:    z.string(),
  CLOUDINARY_API_SECRET: z.string(),

  // Google Maps
  GOOGLE_MAPS_API_KEY: z.string(),

  // Email
  EMAIL_PROVIDER: z.enum(['sendgrid', 'smtp', 'mock']).default('mock'),
  EMAIL_API_KEY:  z.string().optional(),
  EMAIL_FROM:     z.string().email().default('noreply@desiredrycleaning.in'),

  // Web Push
  VAPID_PUBLIC_KEY:  z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT:     z.string().email().default('techfied.desiredrycleaning@gmail.com'),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
