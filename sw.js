const CACHE = 'force-v2';
const URLS = [
  'index.html',
  'css/style.css',
  'js/data.js',
  'js/badges.js',
  'js/chrono.js',
  'js/log.js',
  'js/journal.js',
  'js/stats.js',
  'js/export.js',
  'js/app.js',
  'manifest.json',
  'icon.svg'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
          .map(function(k) { return caches.delete(k); })
      );
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request);
    })
  );
});
