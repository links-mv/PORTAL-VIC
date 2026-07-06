// Portal VIC - Service Worker
// v2: cache-first com atualização em segundo plano (stale-while-revalidate)
// para os arquivos estáticos, e bypass total para a API (Google Apps Script)
// para nunca servir dados de funcionários/EPI/férias desatualizados.

const CACHE_NAME = 'portal-vic-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo-pwa.png'
];

self.addEventListener('install', e => {
  self.skipWaiting(); // aplica a versão nova assim que possível, sem esperar todas as abas fecharem
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim()) // assume o controle das abas já abertas imediatamente
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return; // POSTs (envios) sempre vão direto pra rede

  const url = new URL(e.request.url);

  // Chamadas para fora do domínio do app (ex: Google Apps Script) nunca passam pelo cache.
  // Isso garante que a lista de EPIs, férias e histórico sempre venham atualizados.
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Arquivos estáticos locais: responde rápido com o cache, mas já busca
  // uma versão nova em segundo plano para a próxima vez (stale-while-revalidate).
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request)
        .then(resp => {
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resp.clone()));
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});