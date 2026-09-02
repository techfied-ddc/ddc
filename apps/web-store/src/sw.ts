/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Push notification handler ────────────────────────────────────────────────

interface PushData {
  title: string;
  body:  string;
  url?:  string;
  tag?:  string;
}

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data: PushData;
  try {
    data = event.data.json() as PushData;
  } catch {
    data = { title: 'Desire DC Store', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:      data.body,
      icon:      '/icons/pwa-192.png',
      badge:     '/icons/pwa-192.png',
      tag:       data.tag ?? 'ddc-store',
      renotify:  true,
      data:      { url: data.url ?? '/' },
    } as unknown as NotificationOptions),
  );
});

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string | undefined) ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (new URL(client.url).pathname === new URL(url, self.location.origin).pathname) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
