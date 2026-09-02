import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { QueryClient } from '@tanstack/react-query';

const API_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:4000';

let _socket: Socket | null = null;

export function connectSocket(storeId: string, queryClient: QueryClient): void {
  if (_socket?.connected) {
    _socket.emit('join', [`store:${storeId}`]);
    return;
  }

  _socket = io(API_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  _socket.on('connect', () => {
    _socket!.emit('join', [`store:${storeId}`]);
  });

  _socket.on('order:updated', (order: { _id?: string; id?: string }) => {
    const id = order._id ?? order.id;
    queryClient.invalidateQueries({ queryKey: ['store-orders'] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['store-order', id] });
      queryClient.invalidateQueries({ queryKey: ['order-invoice', id] });
    }
  });

  _socket.on('payment:success', (payload: { orderRef?: string }) => {
    // Invalidate store order lists so the status badge updates immediately
    queryClient.invalidateQueries({ queryKey: ['store-orders'] });
    if (payload) queryClient.invalidateQueries({ queryKey: ['order-invoice'] });
  });
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
