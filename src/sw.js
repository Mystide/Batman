const CACHE_VERSION = 'v1';
const CACHE_NAME = `batman-cache-${CACHE_VERSION}`;

const ASSETS = [
  '/',
  'index.html',
  'styles.css',
  'constants.js',
  'ui.js',
  'src/app.js',
  'src/api.js',
  'src/demo-data.js',
  'src/filters.js',
  'src/render.js',
  'icons/batman-logo.png',
  'icons/dc-logo.png',
  'icons/light-switch.png',
  'data/batman(1940-2011).json',
  'data/batman_the_monster_men(2005-2006).json',
  'data/detective_comics(1937-2011).json',
  'data/worlds_finest_comics(1941-1986).json',
  'data/list.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
