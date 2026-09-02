import mongoose from 'mongoose';
import { config } from './config.js';
import { logger } from './logger.js';

let isConnected = false;

export const connectDb = async (): Promise<void> => {
  if (isConnected) return;

  mongoose.connection.on('connected',    () => logger.info('MongoDB connected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('error',        (err) => logger.error({ err }, 'MongoDB error'));

  await mongoose.connect(config.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45_000,
  });

  isConnected = true;
};

export const disconnectDb = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
};
