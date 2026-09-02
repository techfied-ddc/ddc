# 09 — Geo Location & Order Routing

Goal: when a customer places an order, automatically assign it to the store that serves
their pickup address. If none matches, drop it into the **admin routing-fallback queue**
(client's rule: *"in case fails then order will be highlighted in Admin & Admin sends
manually"*).

## 9.1 Location capture

- Customer address form: browser Geolocation to pre-fill, then a **draggable Google Map
  pin** to correct it. We store `{ line1, line2, city, state, pincode, location:
  GeoJSON Point [lng,lat], contactName, contactPhone }`.
- Pincode is **required** (it's the primary routing key for the Greater Noida West market)
  and validated (6 digits). Reverse-geocode fills city/state/pincode; user can edit.
- Store address + service area captured the same way in the store profile.

## 9.2 Store service area

A store defines its area (`stores.serviceArea`) with any of:

1. `pincodes: string[]` — **primary**, simplest, matches Indian addressing.
2. `polygon` (GeoJSON Polygon) — optional finer boundary drawn on a map.
3. `maxRadiusKm` from `store.location` — optional crude fallback.

Admin can also create `zones` docs (named pincode groups / polygons → `storeId`, with
`priority`) to override or fill gaps without touching store profiles.

## 9.3 Routing algorithm

`geo.routeOrder(order)` runs on `PLACE` (async job, retried):

```
input: order.pickupAddress { pincode, location }

1. candidates = stores where status = APPROVED and currently within operating hours
   (hours check is soft — see 9.5).

2. PINCODE match:
   a. stores where serviceArea.pincodes includes address.pincode   → method = PINCODE
   b. else zones where pincodes includes address.pincode, highest priority → that store

3. If still none and address.location present — POLYGON match:
   stores/zones whose polygon $geoIntersects the point                → method = POLYGON

4. If still none — RADIUS match:
   stores with maxRadiusKm set, where distance(store.location, point) ≤ maxRadiusKm,
   nearest wins ($nearSphere)                                          → method = RADIUS

5. Tie-break when multiple candidates:
   lowest current open-order load  →  highest ratingAvg  →  nearest.

6. Resolved → ROUTE_OK (set storeId, routing.method).
   None      → ROUTE_FAIL (status ROUTING_FAILED, routing.failedReason).
```

- The chosen store still has to **ACCEPT**. On `REJECT`, the order returns to the admin
  queue (not silently re-routed) so a human decides.
- `routing.method` and `routing.autoAssigned` are stored for analytics ("routing accuracy").

## 9.3b Store preview before placement (for pickup slots)

The customer must pick a pickup slot **before** placing, and slots belong to a store — so
the checkout flow resolves the serving store first:

1. Customer selects a pickup address → `POST /cart/estimate` returns a **store preview**
   (`{ storeId, storeName, covers: true }`) using the same `routeOrder` resolution (steps
   1–4 above), or `covers: false` if nothing matches.
2. App calls `GET /stores/:storeId/pickup-slots?date=` for the preview store and shows
   available windows.
3. On `POST /orders`, `routeOrder` runs again authoritatively. If it now resolves to a
   **different** store (rare — e.g. the preview store just got suspended), the chosen slot
   is re-validated against the new store; if invalid, the order is placed but flagged and
   the customer is asked to re-pick a slot. If it resolves to none → `ROUTING_FAILED`.

The preview is advisory; the placement-time routing + slot-capacity check are the source of
truth.

## 9.4 Admin fallback queue

- `GET /orders/routing-queue` → all `ROUTING_FAILED` (and `REJECTED` awaiting re-route),
  newest first, with a map view.
- Socket `routing:failed` pushes to the `admin` room + a push/email to on-call admin.
- Admin picks a store (`POST /orders/:id/reassign-store`) → `ADMIN_ASSIGN` transition,
  `routing.method = MANUAL`.
- Dashboard KPI: count + age of the queue; alert if any item > 15 min old.

## 9.5 Operating hours & capacity

- Hours check is **soft** in v1: if the only matching store is closed, still route to it but
  flag `order.timeline` note "store closed at placement"; the store sees it in the New
  queue when it opens. (Hard cutoff can be enabled later per store.)
- `store.capacityPerDay` (optional): if today's accepted count ≥ capacity, deprioritise in
  tie-break; if it's the only candidate, still route + flag.

## 9.6 Google Maps usage

| Where | API | Key |
|---|---|---|
| Address pin / store area drawing | Maps JavaScript API + Places Autocomplete | `VITE_GOOGLE_MAPS_BROWSER_KEY` (HTTP-referrer restricted) |
| Reverse geocode on the server (normalise pincode) | Geocoding API | `GOOGLE_MAPS_SERVER_KEY` (IP restricted) |
| Rider "Navigate" button | Deep link — `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` | none |
| Distance for RADIUS routing | MongoDB `$nearSphere` (no API call) | – |

Directions API is **not** required for v1 (deep link handles navigation). Keep Maps calls
client-side where possible to control cost; cache server geocodes on the address doc.

## 9.7 Failure handling

| Case | Behaviour |
|---|---|
| Geocoding API down | Use the pincode only; if pincode routes, proceed; else ROUTE_FAIL |
| Customer outside all service areas | ROUTE_FAIL + customer sees "We don't cover this area yet — notify me" (captures pincode as demand signal) |
| Pincode on the border of two stores | Tie-break rules (9.3 step 5); admin can set a `zones` override |
| Store suspended after routing, before accept | Auto-return to admin queue |
