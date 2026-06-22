const CACHE = 'force-v4';
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
  'icon.svg',
  'icon-192.png',
  'icon-512.png'
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
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function(e) {
  var req = e.request;

  // index.html → network-first : toujours la version fraîche
  if (req.url.indexOf('index.html') !== -1 || req.url === self.location.origin + '/') {
    e.respondWith(
      fetch(req).then(function(res) {
        return caches.open(CACHE).then(function(cache) {
          cache.put(req, res.clone());
          return res;
        });
      }).catch(function() {
        return caches.match(req);
      })
    );
    return;
  }

  // assets statiques → stale-while-revalidate
  e.respondWith(
    caches.match(req).then(function(cached) {
      var fetchPromise = fetch(req).then(function(res) {
        return caches.open(CACHE).then(function(cache) {
          cache.put(req, res.clone());
          return res;
        });
      });
      return cached || fetchPromise;
    })
  );
});
