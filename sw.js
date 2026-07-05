// Service Worker — cachea la app para que funcione sin conexión.
// Desde v16 también guarda los trozos de mapa que vas viendo (caché
// msp-tiles), así el mapa de tus zonas funciona sin internet.
const CACHE = 'motosportpro-v19';
const TILES = 'msp-tiles';
const TILES_MAX = 4500;   // tope de trozos guardados (~70 MB)
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/units.js',
  './js/i18n.js',
  './js/ui.js',
  './js/weather.js',
  './js/sos.js',
  './js/offline.js',
  './js/storage.js',
  './js/map.js',
  './js/nav.js',
  './js/store.js',
  './js/backup.js',
  './js/premium.js',
  './js/garage.js',
  './js/fuel.js',
  './js/events.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './img/casco.jpg',
  './img/chaqueta.jpg',
  './img/guantes.jpg',
  './img/botas.jpg',
  './img/aceite.jpg',
  './img/cadena.jpg',
  './img/soporte.jpg',
  './img/camara.jpg',
  './img/casco.svg',
  './img/chaqueta.svg',
  './img/guantes.svg',
  './img/botas.svg',
  './img/aceite.svg',
  './img/cadena.svg',
  './img/soporte.svg',
  './img/camara.svg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      // OJO: la caché de mapas (TILES) se conserva entre versiones
      Promise.all(keys.filter(k => k !== CACHE && k !== TILES).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Trozos de mapa (OSM clásico + estilos CARTO oscuro/día): primero la caché
  // (mapas sin conexión), si no hay se descarga y se guarda. Se normaliza el
  // subdominio a/b/c/d para que el mismo trozo valga venga de donde venga.
  if (url.includes('tile.openstreetmap.org') || url.includes('basemaps.cartocdn.com')) {
    const clave = url.replace(/:\/\/[abc]\.tile\./, '://tile.').replace(/:\/\/[abcd]\.basemaps\./, '://basemaps.');
    e.respondWith(
      caches.open(TILES).then(c =>
        c.match(clave).then(hit => hit || fetch(e.request).then(resp => {
          // Las imágenes del mapa llegan como respuesta "opaque" (ok=false): también valen
          if (resp.ok || resp.type === 'opaque') {
            c.put(clave, resp.clone());
            // De vez en cuando, recortar la caché si crece demasiado
            if (Math.random() < 0.01) {
              c.keys().then(ks => {
                if (ks.length > TILES_MAX) ks.slice(0, ks.length - TILES_MAX + 500).forEach(k => c.delete(k));
              });
            }
          }
          return resp;
        }))
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
