const CACHE_VERSION = 'v1';
const CACHE_NAME = `batman-cache-${CACHE_VERSION}`;

// The list of assets to precache is generated during the build step
// (e.g. via Workbox's `injectManifest` or a custom manifest file).
// Development-only files such as `src/demo-data.js` should not be included.
const ASSETS = (self.__WB_MANIFEST || []).filter(asset => {
  const url = typeof asset === 'string' ? asset : asset.url;
  return !/src\/demo-data\.js$/.test(url);
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
