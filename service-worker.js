// service-worker.js

const CACHE_NAME = 'trackmytube-cache-v1';
const ASSETS = [
  '/trackmytube/',
  '/trackmytube/index.html',
  '/trackmytube/about.html',
  '/trackmytube/planner.html',
  '/trackmytube/station.html',
  '/trackmytube/status.html',
  '/trackmytube/css/styles.css',
  '/trackmytube/css/about.css',
  '/trackmytube/css/index.css',
  '/trackmytube/css/planner.css',
  '/trackmytube/css/station.css',
  '/trackmytube/css/status.css',
  '/trackmytube/js/script.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
