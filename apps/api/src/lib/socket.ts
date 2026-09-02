import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { config } from './config.js';
import { logger } from './logger.js';

let io: SocketServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'Socket connected');

    // Rooms: 'order:{orderId}', 'store:{storeId}', 'admin', 'user:{userId}'
    socket.on('join', (rooms: string[]) => {
      if (!Array.isArray(rooms)) return;
      rooms.forEach((r) => {
        if (typeof r === 'string' && r.length < 60) {
          socket.join(r);
        }
      });
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Socket disconnected');
    });
  });

  return io;
};

export const getIo = (): SocketServer => {
  if (!io) throw new Error('Socket.IO not initialised');
  return io;
};

// Convenience emit helpers
export const emitToOrder = (orderId: string, event: string, data: unknown) =>
  getIo().to(`order:${orderId}`).emit(event, data);

export const emitToStore = (storeId: string, event: string, data: unknown) =>
  getIo().to(`store:${storeId}`).emit(event, data);

export const emitToUser = (userId: string, event: string, data: unknown) =>
  getIo().to(`user:${userId}`).emit(event, data);

export const emitToAdmins = (event: string, data: unknown) =>
  getIo().to('admin').emit(event, data);
