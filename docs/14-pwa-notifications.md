# 14 — PWA & Notifications

## 14.1 PWA scope

Installable PWAs: **customer app** (`web-user`) and **store platform** (`web-store`).
The website and admin panel are not PWAs.

### Manifest (per app)
- `name` / `short_name`: "Desire Dry Cleaning" / "Desire" (store: "Desire Store").
- `display: standalone`, `orientation: portrait`, `theme_color: "#0B0B0C"`,
  `background_color: "#0B0B0C"` (black/gold system — doc 20 §20.8).
- Icons: 192, 256, 384, 512 (maskable + any), gold monogram on black. Apple touch icon.
  `<meta name="color-scheme" content="dark">`, iOS status bar `black-translucent`.
- `start_url: "/?source=pwa"`, `scope: "/"`.
- `id` set per app so both can be installed on the same device.

### Service worker (vite-plugin-pwa / Workbox)
- **Precache** the app shell (HTML, JS, CSS, icons, fonts).
- **Runtime caching:**
  - API `GET` reads → `StaleWhileRevalidate`, short TTL, cache name per resource;
    never cache mutations or auth endpoints.
  - Images (Cloudinary) → `CacheFirst`, 30-day expiry, max entries cap.
- **Navigation fallback** to `index.html` (SPA).
- `skipWaiting` + `clientsClaim` with an in-app "Update available — reload" toast
  (`registerSW({ onNeedRefresh })`).
- Offline: app shell + last-fetched lists render read-only; a global "You're offline"
  banner; mutating actions disabled (no offline write queue in v1).

### Install UX
- Listen for `beforeinstallprompt`, stash it, show a custom "Install app" button in Profile
  and a one-time contextual prompt **after the first order is placed** (not on first load).
- iOS: detect standalone; if not installed and iOS Safari, show "Add to Home Screen"
  instructions (no prompt API on iOS).

## 14.2 Notification channels

| Channel | Transport | Used for |
|---|---|---|
| **In-app** | `notifications` collection + `notification:new` socket + bell/feed | every status change, ticket replies |
| **Web Push** | VAPID + `pushSubscriptions` + service worker `push` handler | key order events while app is closed |
| **Email** | provider adapter (Brevo/Resend/SES) | invoice issued, payment receipt, **payout statement**, password reset, email verify, store approval, cancellations |
| **SMS** | provider adapter (**MSG91**) | **Core: phone-login OTP (always on).** Optional order alerts (rider assigned, out for delivery) behind `settings.features.smsOrderAlertsEnabled`. |

The **login OTP is sent by SMS**; the **pickup/delivery handover OTPs are shown in the
customer app** (not SMS) — different mechanisms (see doc 06, ADR-0010). India: SMS needs a
DLT-registered sender ID + approved template.

## 14.3 Web Push implementation

- Keys: `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (env), `web-push` on the server.
- Client: after permission granted, `registration.pushManager.subscribe({ applicationServerKey })`
  → `POST /notifications/push/subscribe { endpoint, keys }`.
- Server stores one row per endpoint per user; prune on `410 Gone` from the push service.
- Payload: `{ title, body, data: { url } }`; SW `notificationclick` focuses/opens
  `data.url` (deep link to the order).
- Send path: notification job → for each subscription `webpush.sendNotification(...)`,
  handle failures, dedupe with in-app.

## 14.4 Notification service (backend)

```
modules/notifications/
  notification.service.ts   // notify(userId, type, {title, body, data, channels})
  channels/inApp.ts  push.ts  email.ts  sms.ts     // each behind a small interface
  templates/                 // email + push copy per `type`, one place to edit wording
```

- Order transitions call `notification.service.notify(...)` (enqueued as a job, not inline).
- Channel selection per `type` comes from a table (doc 06 §6.6) merged with the user's
  preferences (`push` opt-in/out; email always for financial docs).
- All copy lives in `templates/` so wording changes don't touch business logic; strings are
  i18n-key shaped even though only English ships in v1.

## 14.5 Testing

- `MockPush` / `MockEmail` / `MockSms` adapters in dev + tests; a dev-only
  `/notifications/preview` route renders templates.
- E2E: assert an in-app notification row + a (mocked) push call fire on `ISSUE_INVOICE` and
  `DELIVERED`.
