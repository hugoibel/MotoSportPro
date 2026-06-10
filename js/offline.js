// ============================================================
//  MAPAS SIN CONEXIÓN
//  Dos vías complementarias:
//  1) Automática: el service worker (sw.js) guarda cada trozo de
//     mapa que ves mientras hay internet → tus zonas habituales
//     quedan disponibles sin conexión solas.
//  2) Manual: "Descargar mi zona" baja de golpe los alrededores
//     (~8 km, zooms 12-16) a la misma caché.
//  Los trozos se guardan SIN subdominio (tile.openstreetmap.org)
//  — el service worker normaliza igual al buscar/guardar.
// ============================================================

const Offline = {
  TILES: 'msp-tiles',
  // radio en km por nivel de zoom (más detalle = radio menor)
  ZONA: { 12: 8, 13: 8, 14: 8, 15: 6, 16: 3 },
  _bajando: false,

  init() {
    const d = $('off-desc'), b = $('off-borrar');
    if (d) d.addEventListener('click', () => this.descargar());
    if (b) b.addEventListener('click', () => {
      UI.confirmar(i18n.t('mapa_off_borrar') + '?').then(ok => {
        if (!ok) return;
        caches.delete(this.TILES).then(() => { UI.toast('✅', 'ok'); this.refrescarEstado(); });
      });
    });
  },

  async refrescarEstado() {
    const el = $('off-estado');
    if (!el || !('caches' in window)) return;
    try {
      const c = await caches.open(this.TILES);
      const n = (await c.keys()).length;
      el.textContent = i18n.t('mapa_off_estado')
        .replace('{n}', n)
        .replace('{mb}', Math.max(1, Math.round(n * 0.015)));
    } catch (e) { el.textContent = ''; }
  },

  descargar() {
    if (this._bajando) return;
    if (!('geolocation' in navigator)) { UI.toast(i18n.t('sin_gps'), 'err'); return; }
    if (!('caches' in window)) { UI.toast(i18n.t('mapa_off_err'), 'err'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => this._bajarZona(pos.coords.latitude, pos.coords.longitude),
      () => UI.toast(i18n.t('permiso_gps'), 'err'),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  },

  async _bajarZona(lat, lng) {
    this._bajando = true;
    const btn = $('off-desc');
    const orig = btn.textContent;
    btn.disabled = true;
    try {
      const urls = this._urlsZona(lat, lng);
      const c = await caches.open(this.TILES);
      let hechas = 0;
      for (let i = 0; i < urls.length; i += 4) {       // de 4 en 4, sin saturar
        await Promise.all(urls.slice(i, i + 4).map(async u => {
          try {
            if (!(await c.match(u))) {
              const r = await fetch(u);
              if (r.ok) await c.put(u, r);
            }
          } catch (e) { /* trozo fallido: se ignora */ }
          hechas++;
        }));
        btn.textContent = i18n.t('mapa_off_prog').replace('{p}', Math.round(hechas / urls.length * 100));
        await new Promise(r => setTimeout(r, 120));    // pausa: respeto al servidor de OSM
      }
      UI.toast(i18n.t('mapa_off_ok'), 'ok');
    } catch (e) {
      UI.toast(i18n.t('mapa_off_err'), 'err');
    }
    btn.textContent = orig;
    btn.disabled = false;
    this._bajando = false;
    this.refrescarEstado();
  },

  // URLs de todos los trozos de mapa alrededor de (lat,lng) según ZONA
  _urlsZona(lat, lng) {
    const urls = [];
    for (const z of Object.keys(this.ZONA).map(Number)) {
      const rKm = this.ZONA[z];
      const dLat = rKm / 111.32;
      const dLng = rKm / (111.32 * Math.cos(lat * Math.PI / 180));
      const x1 = this._tileX(lng - dLng, z), x2 = this._tileX(lng + dLng, z);
      const y1 = this._tileY(lat + dLat, z), y2 = this._tileY(lat - dLat, z);
      const max = Math.pow(2, z) - 1;
      for (let x = Math.max(0, x1); x <= Math.min(max, x2); x++)
        for (let y = Math.max(0, y1); y <= Math.min(max, y2); y++)
          urls.push(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`);
    }
    return urls;
  },
  _tileX(lng, z) { return Math.floor((lng + 180) / 360 * Math.pow(2, z)); },
  _tileY(lat, z) {
    const r = lat * Math.PI / 180;
    return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z));
  }
};
