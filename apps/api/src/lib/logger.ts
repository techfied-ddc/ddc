import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from './config.js';

export const logger = pino({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: config.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } }
    : undefined,
  base: { service: 'ddc-api' },
});

export const httpLogger = pinoHttp({
  logger,
  // Skip health check spam
  autoLogging: {
    ignore: (req) => req.url === '/healthz',
  },
  // Attach request-id to logger
  customProps: (req) => ({
    requestId: (req as unknown as { id?: string }).id,
  }),
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
