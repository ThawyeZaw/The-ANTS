'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker in the browser and keeps it updated.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Check for updates periodically
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available; will activate on next visit or skipWaiting
              }
            };
          }
        };
      })
      .catch((err) => {
        // Non-blocking in local development or sandboxed iframes
        if (process.env.NODE_ENV === 'development') {
          console.debug('[sw] Service worker registration note:', err?.message || err);
        }
      });
  }, []);

  return null;
}
