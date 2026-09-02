import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { QueryClient } from '@tanstack/react-query';

const API_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:4000';

let _socket: Socket | null = null;

export function connectSocket(userId: string, queryClient: QueryClient): void {
  if (_socket?.connected) {
    _socket.emit('join', [`user:${userId}`]);
    return;
  }

  _socket = io(API_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  _socket.on('connect', () => {
    _socket!.emit('join', [`user:${userId}`]);
  });

  _socket.on('order:updated', (order: { _id?: string; id?: string }) => {
    const id = order._id ?? order.id;
    queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    if (id) queryClient.invalidateQueries({ queryKey: ['order', id] });
    if (id) queryClient.invalidateQueries({ queryKey: ['invoice', id] });
  });

  _socket.on('payment:success', (payload: { orderRef?: string }) => {
    // Invalidate all order lists; detail pages refetch on focus anyway
    queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    if (payload?.orderRef) {
      // Can't resolve orderId from orderRef here — invalidate all invoices
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    }
  });
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
