// Web Push subscription utility.
// 1. Request permission
// 2. Subscribe via PushManager with the VAPID public key
// 3. Save subscription to API — fire-and-forget on subsequent calls if already subscribed

import { api } from './api.js';

const VAPID_PUBLIC_KEY = import.meta.env['VITE_VAPID_PUBLIC_KEY'] as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw      = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

let _subscribePromise: Promise<void> | null = null;

export async function subscribeToPush(): Promise<void> {
  // Deduplicate concurrent calls (e.g. double-mount in StrictMode)
  if (_subscribePromise) return _subscribePromise;
  _subscribePromise = _doSubscribe().finally(() => { _subscribePromise = null; });
  return _subscribePromise;
}

async function _doSubscribe(): Promise<void> {
  if (!VAPID_PUBLIC_KEY) return; // Push not configured in this env
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const reg = await navigator.serviceWorker.ready;

  // If already subscribed, just re-post (idempotent on server)
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json  = sub.toJSON();
  const keys  = json.keys ?? {};
  await api.post('/api/v1/users/push-subscription', {
    endpoint: sub.endpoint,
    p256dh:   keys['p256dh'] ?? '',
    auth:     keys['auth']   ?? '',
  });
}
