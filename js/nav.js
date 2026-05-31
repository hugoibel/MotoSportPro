// ============================================================
//  NAVEGACIÓN — buscar un destino y trazar la ruta hasta él.
//  - Geocodificación (texto → coordenadas): Nominatim (OpenStreetMap), gratis.
//  - Ruta por carretera: OSRM público (router.project-osrm.org), gratis.
//  Ambos con CORS, sin clave. "Comenzar navegación" lo arranca app.js.
// ============================================================

const Nav = {
  destino: null,   // { lat, lng, nombre }
  ruta: null,      // { distanciaKm, duracionMin }

  init() {
    const input = $('nav-input');
    if (!input) return;
    input.placeholder = i18n.t('nav_buscar');
    $('nav-go').addEventListener('click', () => this.buscar(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.buscar(input.value); } });
    $('nav-cancel').addEventListener('click', () => this.cancelar());
    // Actualiza el texto del campo al cambiar de idioma
    document.addEventListener('idioma-cambiado', () => { input.placeholder = i18n.t('nav_buscar'); });
  },

  // Busca direcciones que coincidan con el texto y muestra una lista
  async buscar(q) {
    q = (q || '').trim();
    if (!q) return;
    const res = $('nav-results');
    $('nav-info').style.display = 'none';
    res.style.display = 'block';
    res.innerHTML = `<div class="nav-msg">${i18n.t('nav_buscando')}</div>`;
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=' + encodeURIComponent(q);
      const r = await fetch(url, { headers: { 'Accept-Language': i18n.lang } });
      const data = await r.json();
      if (!data.length) { res.innerHTML = `<div class="nav-msg">${i18n.t('nav_sin_resultados')}</div>`; return; }
      res.innerHTML = '';
      data.forEach(d => {
        const b = document.createElement('button');
        b.className = 'nav-result';
        b.innerHTML = `<span>📍</span><span>${d.display_name}</span>`;
        b.addEventListener('click', () => this.elegir(parseFloat(d.lat), parseFloat(d.lon), d.display_name));
        res.appendChild(b);
      });
    } catch (e) {
      res.innerHTML = `<div class="nav-msg">${i18n.t('nav_error')}</div>`;
    }
  },

  // Fija el destino, lo pinta en el mapa y calcula la ruta desde mi posición
  elegir(lat, lng, nombre) {
    this.destino = { lat, lng, nombre };
    this.ruta = null;
    $('nav-results').style.display = 'none';
    $('nav-input').value = nombre.split(',')[0];
    Mapa.setDestino(lat, lng);

    const info = $('nav-info');
    info.style.display = 'flex';
    $('nav-dist').textContent = '…';
    $('nav-time').textContent = '';

    if (!('geolocation' in navigator)) { Mapa.center(lat, lng, 14); this._error(); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      const o = pos.coords;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${o.longitude},${o.latitude};${lng},${lat}?overview=full&geometries=geojson`;
        const r = await fetch(url);
        const data = await r.json();
        const route = data.routes && data.routes[0];
        if (!route) { this._error(); return; }
        const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);  // [lon,lat] → [lat,lng]
        Mapa.dibujarRutaPlan(coords);
        this.ruta = { distanciaKm: route.distance / 1000, duracionMin: route.duration / 60 };
        const distU = Units.distToUser(this.ruta.distanciaKm).toFixed(1);
        $('nav-dist').textContent = `${distU} ${Units.distLabel()}`;
        $('nav-time').textContent = `${Math.round(this.ruta.duracionMin)} ${i18n.t('nav_min')}`;
      } catch (e) { this._error(); }
    }, () => { Mapa.center(lat, lng, 14); this._error(); }, { enableHighAccuracy: true, timeout: 10000 });
  },

  _error() {
    $('nav-info').style.display = 'flex';
    $('nav-dist').textContent = i18n.t('nav_error');
    $('nav-time').textContent = '';
  },

  // Quita destino, ruta y limpia la interfaz
  cancelar() {
    this.destino = null;
    this.ruta = null;
    if (typeof Mapa !== 'undefined') Mapa.limpiarNav();
    const info = $('nav-info'), res = $('nav-results'), input = $('nav-input');
    if (info) info.style.display = 'none';
    if (res) res.style.display = 'none';
    if (input) input.value = '';
  }
};
