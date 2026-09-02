import { describe, expect, it } from 'vitest';
import { OrderStatus, Role } from '../enums.js';
import { orderReducer, assertTransition } from './reducer.js';
import { TERMINAL_STATUSES } from './machine.js';

describe('orderReducer', () => {
  // ── Happy paths ────────────────────────────────────────────────────────────
  it('PLACE: DRAFT → PLACED by CUSTOMER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.DRAFT, event: 'PLACE', actorRole: Role.CUSTOMER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.PLACED });
  });

  it('ROUTE_OK: PLACED → ROUTED by ADMIN', () => {
    const r = orderReducer({ currentStatus: OrderStatus.PLACED, event: 'ROUTE_OK', actorRole: Role.ADMIN });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.ROUTED });
  });

  it('ROUTE_FAIL: PLACED → ROUTING_FAILED by SUPER_ADMIN', () => {
    const r = orderReducer({ currentStatus: OrderStatus.PLACED, event: 'ROUTE_FAIL', actorRole: Role.SUPER_ADMIN });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.ROUTING_FAILED });
  });

  it('ADMIN_ASSIGN: ROUTING_FAILED → ROUTED by ADMIN', () => {
    const r = orderReducer({ currentStatus: OrderStatus.ROUTING_FAILED, event: 'ADMIN_ASSIGN', actorRole: Role.ADMIN });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.ROUTED });
  });

  it('ADMIN_ASSIGN: REJECTED → ROUTED by SUPER_ADMIN', () => {
    const r = orderReducer({ currentStatus: OrderStatus.REJECTED, event: 'ADMIN_ASSIGN', actorRole: Role.SUPER_ADMIN });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.ROUTED });
  });

  it('ACCEPT: ROUTED → ACCEPTED by STORE_OWNER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.ROUTED, event: 'ACCEPT', actorRole: Role.STORE_OWNER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.ACCEPTED });
  });

  it('REJECT: ROUTED → REJECTED by STORE_STAFF', () => {
    const r = orderReducer({ currentStatus: OrderStatus.ROUTED, event: 'REJECT', actorRole: Role.STORE_STAFF });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.REJECTED });
  });

  it('ASSIGN_PICKUP: ACCEPTED → PICKUP_ASSIGNED by STORE_OWNER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.ACCEPTED, event: 'ASSIGN_PICKUP', actorRole: Role.STORE_OWNER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.PICKUP_ASSIGNED });
  });

  it('PICKUP_ACCEPT: PICKUP_ASSIGNED → PICKUP_IN_PROGRESS by RIDER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.PICKUP_ASSIGNED, event: 'PICKUP_ACCEPT', actorRole: Role.RIDER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.PICKUP_IN_PROGRESS });
  });

  it('PICKUP_VERIFY_OTP: PICKUP_IN_PROGRESS → PICKED_UP by RIDER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.PICKUP_IN_PROGRESS, event: 'PICKUP_VERIFY_OTP', actorRole: Role.RIDER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.PICKED_UP });
  });

  it('RECEIVE_AT_STORE: PICKED_UP → AT_STORE by STORE_STAFF', () => {
    const r = orderReducer({ currentStatus: OrderStatus.PICKED_UP, event: 'RECEIVE_AT_STORE', actorRole: Role.STORE_STAFF });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.AT_STORE });
  });

  it('ISSUE_INVOICE: AT_STORE → INVOICED by STORE_OWNER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.AT_STORE, event: 'ISSUE_INVOICE', actorRole: Role.STORE_OWNER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.INVOICED });
  });

  it('START_PROCESS: INVOICED → IN_PROCESS by STORE_STAFF', () => {
    const r = orderReducer({ currentStatus: OrderStatus.INVOICED, event: 'START_PROCESS', actorRole: Role.STORE_STAFF });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.IN_PROCESS });
  });

  it('MARK_READY: IN_PROCESS → READY by STORE_OWNER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.IN_PROCESS, event: 'MARK_READY', actorRole: Role.STORE_OWNER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.READY });
  });

  it('ASSIGN_DELIVERY: READY → DELIVERY_ASSIGNED by STORE_OWNER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.READY, event: 'ASSIGN_DELIVERY', actorRole: Role.STORE_OWNER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.DELIVERY_ASSIGNED });
  });

  it('DELIVERY_ACCEPT: DELIVERY_ASSIGNED → OUT_FOR_DELIVERY by RIDER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.DELIVERY_ASSIGNED, event: 'DELIVERY_ACCEPT', actorRole: Role.RIDER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.OUT_FOR_DELIVERY });
  });

  it('DELIVERY_VERIFY_OTP: OUT_FOR_DELIVERY → DELIVERED by RIDER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.OUT_FOR_DELIVERY, event: 'DELIVERY_VERIFY_OTP', actorRole: Role.RIDER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.DELIVERED });
  });

  it('RATE: DELIVERED → COMPLETED by CUSTOMER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.DELIVERED, event: 'RATE', actorRole: Role.CUSTOMER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.COMPLETED });
  });

  it('AUTO_COMPLETE: DELIVERED → COMPLETED by ADMIN', () => {
    const r = orderReducer({ currentStatus: OrderStatus.DELIVERED, event: 'AUTO_COMPLETE', actorRole: Role.ADMIN });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.COMPLETED });
  });

  // ── Cancellation paths ─────────────────────────────────────────────────────
  it('CANCEL_CUSTOMER: PLACED → CANCELLED by CUSTOMER', () => {
    const r = orderReducer({ currentStatus: OrderStatus.PLACED, event: 'CANCEL_CUSTOMER', actorRole: Role.CUSTOMER });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.CANCELLED });
  });

  it('CANCEL_STORE: PICKED_UP → CANCELLED by STORE_STAFF', () => {
    const r = orderReducer({ currentStatus: OrderStatus.PICKED_UP, event: 'CANCEL_STORE', actorRole: Role.STORE_STAFF });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.CANCELLED });
  });

  it('CANCEL_ADMIN: IN_PROCESS → CANCELLED by SUPER_ADMIN', () => {
    const r = orderReducer({ currentStatus: OrderStatus.IN_PROCESS, event: 'CANCEL_ADMIN', actorRole: Role.SUPER_ADMIN });
    expect(r).toEqual({ ok: true, nextStatus: OrderStatus.CANCELLED });
  });

  // ── Forbidden role ─────────────────────────────────────────────────────────
  it('returns FORBIDDEN when a CUSTOMER tries to ACCEPT an order', () => {
    const r = orderReducer({ currentStatus: OrderStatus.ROUTED, event: 'ACCEPT', actorRole: Role.CUSTOMER });
    expect(r).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('returns FORBIDDEN when a RIDER tries to PLACE an order', () => {
    const r = orderReducer({ currentStatus: OrderStatus.DRAFT, event: 'PLACE', actorRole: Role.RIDER });
    expect(r).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('returns FORBIDDEN when a STORE_OWNER tries to PICKUP_VERIFY_OTP', () => {
    const r = orderReducer({ currentStatus: OrderStatus.PICKUP_IN_PROGRESS, event: 'PICKUP_VERIFY_OTP', actorRole: Role.STORE_OWNER });
    expect(r).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  // ── Invalid state transitions ──────────────────────────────────────────────
  it('returns INVALID_TRANSITION when trying to ACCEPT from PICKED_UP', () => {
    const r = orderReducer({ currentStatus: OrderStatus.PICKED_UP, event: 'ACCEPT', actorRole: Role.STORE_OWNER });
    expect(r).toMatchObject({ ok: false, code: 'INVALID_TRANSITION' });
  });

  it('returns INVALID_TRANSITION when trying to PLACE from ROUTED', () => {
    const r = orderReducer({ currentStatus: OrderStatus.ROUTED, event: 'PLACE', actorRole: Role.CUSTOMER });
    expect(r).toMatchObject({ ok: false, code: 'INVALID_TRANSITION' });
  });

  it('returns INVALID_TRANSITION when CUSTOMER tries to CANCEL after PICKED_UP', () => {
    const r = orderReducer({ currentStatus: OrderStatus.PICKED_UP, event: 'CANCEL_CUSTOMER', actorRole: Role.CUSTOMER });
    expect(r).toMatchObject({ ok: false, code: 'INVALID_TRANSITION' });
  });

  // ── Terminal states ────────────────────────────────────────────────────────
  it('returns TERMINAL when trying to transition from COMPLETED', () => {
    const r = orderReducer({ currentStatus: OrderStatus.COMPLETED, event: 'RATE', actorRole: Role.CUSTOMER });
    expect(r).toMatchObject({ ok: false, code: 'TERMINAL' });
  });

  it('returns TERMINAL when trying to transition from CANCELLED', () => {
    const r = orderReducer({ currentStatus: OrderStatus.CANCELLED, event: 'CANCEL_ADMIN', actorRole: Role.SUPER_ADMIN });
    expect(r).toMatchObject({ ok: false, code: 'TERMINAL' });
  });

  // ── assertTransition ──────────────────────────────────────────────────────
  it('assertTransition returns nextStatus on valid transition', () => {
    const next = assertTransition({ currentStatus: OrderStatus.DRAFT, event: 'PLACE', actorRole: Role.CUSTOMER });
    expect(next).toBe(OrderStatus.PLACED);
  });

  it('assertTransition throws on invalid transition', () => {
    expect(() =>
      assertTransition({ currentStatus: OrderStatus.COMPLETED, event: 'RATE', actorRole: Role.CUSTOMER }),
    ).toThrow(/TERMINAL/);
  });

  // ── TERMINAL_STATUSES ─────────────────────────────────────────────────────
  it('TERMINAL_STATUSES contains COMPLETED and CANCELLED only', () => {
    expect(TERMINAL_STATUSES.has(OrderStatus.COMPLETED)).toBe(true);
    expect(TERMINAL_STATUSES.has(OrderStatus.CANCELLED)).toBe(true);
    expect(TERMINAL_STATUSES.size).toBe(2);
  });
});
