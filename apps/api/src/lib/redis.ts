import Redis from 'ioredis';
import { config } from './config.js';
import { logger } from './logger.js';

let client: Redis | null = null;

export const getRedis = (): Redis => {
  if (!client) {
    client = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: false,
      lazyConnect: false,
    });

    client.on('connect', () => logger.info('Redis connected'));
    client.on('error',   (err) => logger.error({ err }, 'Redis error'));
  }
  return client;
};

/** Create a duplicate connection (required for subscriptions). */
export const getDuplicateRedis = (): Redis => getRedis().duplicate();
