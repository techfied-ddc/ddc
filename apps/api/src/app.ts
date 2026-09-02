import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './lib/config.js';
import { httpLogger } from './lib/logger.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { storesRouter } from './modules/stores/stores.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { couponsRouter } from './modules/coupons/coupons.routes.js';
import { geoRouter } from './modules/geo/geo.routes.js';
import { invoicingRouter } from './modules/invoicing/invoicing.routes.js';
import { paymentsRouter, paymentWebhookHandler } from './modules/payments/payments.routes.js';
import { ridersRouter } from './modules/riders/riders.routes.js';
import { payoutsRouter } from './modules/payouts/payouts.routes.js';
import { mediaRouter } from './modules/media/media.routes.js';
import { ticketsRouter } from './modules/tickets/tickets.routes.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';

export const createApp = () => {
  const app = express();

  // ── Security headers ───────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        connectSrc:  ["'self'", 'https://api.cloudinary.com'],
        imgSrc:      ["'self'", 'data:', 'https://res.cloudinary.com'],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // ── CORS ───────────────────────────────────────────────────
  app.use(cors({
    origin:      config.CORS_ORIGINS,
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  }));

  // ── Request instrumentation ────────────────────────────────
  app.use(requestId);
  app.use(httpLogger);

  // ── Payment webhook (raw body must precede express.json) ──────────────────
  app.post(
    '/api/v1/payments/webhook/:provider',
    express.raw({ type: 'application/json' }),
    paymentWebhookHandler,
  );

  // ── Body parsing ───────────────────────────────────────────
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // ── Health check (no auth) ─────────────────────────────────
  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, service: 'ddc-api', ts: new Date().toISOString() });
  });

  // ── API routes ─────────────────────────────────────────────
  app.use('/api/v1/auth',    authRouter);
  app.use('/api/v1/users',   usersRouter);
  app.use('/api/v1/stores',  storesRouter);
  app.use('/api/v1/catalog', catalogRouter);
  app.use('/api/v1/orders',  ordersRouter);
  app.use('/api/v1/coupons', couponsRouter);
  app.use('/api/v1/geo',      geoRouter);
  app.use('/api/v1/invoices', invoicingRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/riders',   ridersRouter);
  app.use('/api/v1/payouts',  payoutsRouter);
  app.use('/api/v1/media',    mediaRouter);
  app.use('/api/v1/tickets',   ticketsRouter);
  app.use('/api/v1/analytics', analyticsRouter);

  // ── 404 catch-all ──────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Route not found.' } });
  });

  // ── Error handler ─────────────────────────────────────────
  app.use(errorHandler);

  return app;
};
