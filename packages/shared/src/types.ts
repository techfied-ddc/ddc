// API response envelope — used by every route on the Express API.
// Frontends import these types to type their fetch/query wrappers.

export interface ApiOk<T = unknown> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;       // stable string enum, e.g. 'ORDER_NOT_FOUND'
    message: string;    // human-readable, may be shown to the user
    details?: unknown;  // Zod validation errors, field-level breakdown, etc.
  };
}

export type ApiResponse<T = unknown> = ApiOk<T> | ApiError;

// Paginated list wrapper
export interface PaginatedList<T> {
  items: T[];
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

// ── Auth token payloads ────────────────────────────────────────────────────────

import type { Role } from './enums.js';

export interface AccessTokenPayload {
  sub:     string; // user._id as string
  role:    Role;
  storeId: string | null; // null for CUSTOMER / ADMIN / SUPER_ADMIN
  iat:     number;
  exp:     number;
}

export interface RefreshTokenPayload {
  sub:     string;
  family:  string; // rotation family ID for refresh-token rotation detection
  iat:     number;
  exp:     number;
}

// ── Socket.IO event shapes ────────────────────────────────────────────────────

export interface SocketOrderUpdatedPayload {
  orderId:    string;
  orderRef:   string; // DPD-XXXXXX
  status:     string;
  storeId?:   string;
  customerId: string;
}

export interface SocketRiderLocationPayload {
  riderId:  string;
  orderId:  string;
  lat:      number;
  lng:      number;
  ts:       number; // Unix ms
}

// ── Notification shapes ────────────────────────────────────────────────────────

export interface PushNotificationPayload {
  title:  string;
  body:   string;
  icon?:  string;
  data?:  Record<string, unknown>;
  badge?: string;
}
