const CACHE = 'dyscolor-v4';

// No pre-caching in install: addAll() would abort the entire install if any
// resource returns a non-2xx, leaving the old SW active indefinitely.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      // postMessage is more reliable than client.navigate() across browsers.
      .then((clients) => clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED' })))
  );
});

self.addEventListener('fetch', (e) => {
  // Network-first for navigation: always fetch fresh index.html so hashed
  // asset paths are never stale after a new deploy.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // Cache-first for static assets (fonts, images, wasm, manifest…)
  e.respondWith(
    caches.match(e.request).then((cached) => cached ?? fetch(e.request).then((res) => {
      if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
      return res;
    }))
  );
});
