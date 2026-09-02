import React from 'react';
import { OrderStatus, ORDER_STATUS_COLOUR, type StatusColour } from '@ddc/shared';
import { cn } from '../lib/cn.js';

const colourMap: Record<StatusColour, string> = {
  info:    'bg-[rgba(74,143,212,0.12)] text-[#4A8FD4] border-[rgba(74,143,212,0.2)]',
  warning: 'bg-[rgba(232,168,56,0.12)] text-[#E8A838] border-[rgba(232,168,56,0.2)]',
  gold:    'bg-[rgba(212,175,55,0.12)] text-[var(--gold)] border-[rgba(212,175,55,0.25)]',
  success: 'bg-[rgba(95,168,122,0.12)] text-[var(--success)] border-[rgba(95,168,122,0.2)]',
  danger:  'bg-[rgba(200,75,75,0.12)] text-[var(--danger)] border-[rgba(200,75,75,0.2)]',
  muted:   'bg-[var(--bg-ash)] text-[var(--text-subtle)] border-[var(--border-muted)]',
};

const labelMap: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]:              'Draft',
  [OrderStatus.PLACED]:             'Placed',
  [OrderStatus.ROUTED]:             'Routed',
  [OrderStatus.ROUTING_FAILED]:     'Routing Failed',
  [OrderStatus.ACCEPTED]:           'Accepted',
  [OrderStatus.REJECTED]:           'Rejected',
  [OrderStatus.PICKUP_ASSIGNED]:    'Pickup Assigned',
  [OrderStatus.PICKUP_IN_PROGRESS]: 'En Route',
  [OrderStatus.PICKED_UP]:          'Picked Up',
  [OrderStatus.AT_STORE]:           'At Store',
  [OrderStatus.INVOICED]:           'Invoice Sent',
  [OrderStatus.IN_PROCESS]:         'Cleaning',
  [OrderStatus.READY]:              'Ready',
  [OrderStatus.DELIVERY_ASSIGNED]:  'Delivery Assigned',
  [OrderStatus.OUT_FOR_DELIVERY]:   'Out for Delivery',
  [OrderStatus.DELIVERED]:          'Delivered',
  [OrderStatus.COMPLETED]:          'Completed',
  [OrderStatus.CANCELLED]:          'Cancelled',
};

interface StatusPillProps {
  status: OrderStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className, size = 'md' }) => {
  const colour = ORDER_STATUS_COLOUR[status];
  return (
    <span
      className={cn(
        'inline-flex items-center border rounded-full font-mono font-medium whitespace-nowrap',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        colourMap[colour],
        className,
      )}
    >
      {labelMap[status]}
    </span>
  );
};
