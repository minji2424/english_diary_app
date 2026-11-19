// Minimal service worker so the app is installable.
// Network-only on purpose: diaries live in localStorage and AI feedback needs the server,
// so caching pages here would only risk serving a stale build after redeploys.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
