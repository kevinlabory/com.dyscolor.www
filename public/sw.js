const CACHE = 'dyscolor-v3';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/favicon.svg']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      // Force a reload so pages that were served by the old SW get fresh HTML.
      .then((clients) => clients.forEach((c) => c.navigate(c.url)))
  );
});

self.addEventListener('fetch', (e) => {
  // Network-first pour les navigations : index.html est toujours récupéré
  // depuis le réseau pour éviter de servir d'anciens chemins CSS hashés.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // Cache-first pour les assets statiques (fonts, images, manifest…)
  e.respondWith(
    caches.match(e.request).then((cached) => cached ?? fetch(e.request))
  );
});
