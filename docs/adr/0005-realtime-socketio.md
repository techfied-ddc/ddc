# ADR-0005 — Socket.IO for realtime order updates

- **Status:** accepted
- **Date:** 2026-08-31
- **Deciders:** dev

## Context

The client wants the customer to see **live updates on the order**, the store to see new
orders and payments **without refresh**, and the admin to be alerted immediately when
routing fails. Traffic is modest (a regional dry-cleaning business), messages are small
status pings.

## Decision

- **Socket.IO** on the same Express server. Clients authenticate the socket with the access
  token. Rooms: `user:<id>`, `store:<id>`, `rider:<id>`, `admin`.
- Server emits **minimal events** (`{ orderId, status }`, etc.); clients treat them as
  cache-invalidation hints and refetch detail via the REST API (single source of truth).
- Production: **Socket.IO Redis adapter** so rooms work across multiple API instances.
- Fallback: order-detail screens also `refetchOnWindowFocus` + light polling, so a dropped
  socket never leaves stale status.

## Alternatives considered

- **Raw WebSocket (`ws`)** — no rooms/reconnection/fallback out of the box; we'd rebuild
  Socket.IO's features.
- **Server-Sent Events (SSE)** — one-way only (fine here) and simple, but no rooms
  abstraction and awkward with multiple instances; Socket.IO's ergonomics win.
- **Polling only** — simplest, but wasteful and laggy for "live" tracking and the admin
  routing alert.
- **Managed realtime (Pusher/Ably/Supabase Realtime)** — removes the Redis-adapter concern
  but adds cost + a vendor; unnecessary at this scale.

## Consequences

- Need Redis in production for the adapter (already used for jobs + rate limiting).
- Socket auth + room join/leave logic to maintain; emit only after successful DB writes.
- Events are hints, not payloads of record — keeps client and server loosely coupled and
  avoids trusting socket data.
