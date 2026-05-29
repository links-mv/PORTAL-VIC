const CACHE_NAME = 'portal-vic-v1';
const assets = [
  './',
  './index.html'
];

// Instala o Service Worker e guarda o HTML básico no cache offline
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Executa as requisições (permite que o app abra mesmo sem internet)
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});