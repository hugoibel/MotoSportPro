// Service Worker — cachea la app para que funcione sin conexión.
// (Los mapas de OpenStreetMap sí necesitan internet para descargar nuevas zonas.)
const CACHE = 'motosportpro-v4';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/i18n.js',
  './js/storage.js',
  './js/map.js',
  './js/store.js',
  './js/premium.js',
  './js/garage.js',
  './js/fuel.js',
  './js/events.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Los tiles del mapa siempre desde la red (no cachear, son muchísimos)
  if (url.includes('tile.openstreetmap.org')) return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
