// OrganizeMe — service worker (offline-first)
// Ao alterar o index.html, troque a versão abaixo (v3 -> v4...) para os celulares pegarem a atualização.
const CACHE = 'organizeme-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Abre na hora pelo cache e atualiza em segundo plano (vale na próxima abertura).
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  const chave = req.mode === 'navigate' ? './index.html' : req;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const emCache = await cache.match(chave, { ignoreSearch: true });
      const rede = fetch(req).then(resp => {
        if (resp && resp.ok) cache.put(chave, resp.clone());
        return resp;
      }).catch(() => null);

      if (emCache) { e.waitUntil(rede); return emCache; }
      const resp = await rede;
      return resp || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
    })
  );
});
