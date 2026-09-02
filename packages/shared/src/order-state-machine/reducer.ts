import type { OrderStatus, Role } from '../enums.js';
import { ORDER_STATE_MACHINE, TERMINAL_STATUSES, type OrderEvent } from './machine.js';

export interface OrderReducerInput {
  currentStatus: OrderStatus;
  event: OrderEvent;
  actorRole: Role;
}

export interface OrderReducerSuccess {
  ok: true;
  nextStatus: OrderStatus;
}

export interface OrderReducerError {
  ok: false;
  code: 'INVALID_TRANSITION' | 'FORBIDDEN' | 'TERMINAL';
  message: string;
}

export type OrderReducerResult = OrderReducerSuccess | OrderReducerError;

/**
 * Pure state-machine reducer.
 * Returns the next status or an error — no DB calls, no side effects.
 * Side effects and guards that require DB context live in orders.service.
 */
export const orderReducer = (input: OrderReducerInput): OrderReducerResult => {
  const { currentStatus, event, actorRole } = input;

  if (TERMINAL_STATUSES.has(currentStatus)) {
    return {
      ok: false,
      code: 'TERMINAL',
      message: `Order is already in terminal status "${currentStatus}" and cannot be transitioned.`,
    };
  }

  const transition = ORDER_STATE_MACHINE[event];
  if (!transition) {
    return {
      ok: false,
      code: 'INVALID_TRANSITION',
      message: `Unknown event "${event}".`,
    };
  }

  if (!transition.from.includes(currentStatus)) {
    return {
      ok: false,
      code: 'INVALID_TRANSITION',
      message: `Event "${event}" is not valid from status "${currentStatus}". Valid from: ${transition.from.join(', ')}.`,
    };
  }

  if (!transition.allowedRoles.includes(actorRole)) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: `Role "${actorRole}" is not allowed to perform event "${event}". Allowed: ${transition.allowedRoles.join(', ')}.`,
    };
  }

  return { ok: true, nextStatus: transition.to };
};

/** Convenience: assert a transition is valid or throw (for internal service use). */
export const assertTransition = (input: OrderReducerInput): OrderStatus => {
  const result = orderReducer(input);
  if (!result.ok) throw new Error(`[OrderStateMachine] ${result.code}: ${result.message}`);
  return result.nextStatus;
};
