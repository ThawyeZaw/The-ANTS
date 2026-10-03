// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Progressive Web App (PWA) Service Worker
// ──────────────────────────────────────────────────────────────────────────────

const CACHE_NAME = 'the-ants-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification click: focus app window & navigate to notification destination
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/student';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If an app window is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            if ('navigate' in client) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle push event (if push notifications are dispatched)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'The ANTs';
    const options = {
      body: data.body || 'You have a new update.',
      icon: data.icon || '/logo.png',
      badge: data.badge || '/logo.png',
      data: {
        url: data.url || '/student',
      },
      tag: data.tag || 'the-ants-notification',
      renotify: true,
      vibrate: [200, 100, 200],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[sw] Failed to handle push payload:', err);
  }
});
