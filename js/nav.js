// ============================================================
//  NAVEGACIÓN — buscar un destino, trazar la ruta y GUIAR giro a giro.
//  - Geocodificación (texto → coordenadas): Nominatim (OpenStreetMap), gratis.
//  - Ruta por carretera + maniobras: OSRM público (router.project-osrm.org), gratis.
//  - Voz: speechSynthesis del propio móvil (sin internet, en el idioma de la app).
//  Ambos con CORS, sin clave. "Comenzar navegación" lo arranca app.js.
// ============================================================

const Nav = {
  destino: null,   // { lat, lng, nombre }
  ruta: null,      // { distanciaKm, duracionMin }
  pasos: null,     // maniobras OSRM: [{lat,lng,tipo,mod,exit,calle,dist}, ...]
  guiando: false,
  idx: 0,          // índice de la próxima maniobra
  vozOn: true,
  curvas: false,   // modo "ruta con curvas": elegir la alternativa más sinuosa

  init() {
    const input = $('nav-input');
    if (!input) return;
    input.placeholder = i18n.t('nav_buscar');
    $('nav-go').addEventListener('click', () => this.buscar(input.value));

    // Botón 🌀: alterna entre la ruta más rápida y la más curvera (estilo Calimoto)
    this.curvas = localStorage.getItem('msp_curvas') === '1';
    const bc = $('nav-curvas');
    if (bc) {
      bc.classList.toggle('on', this.curvas);
      bc.addEventListener('click', () => {
        this.curvas = !this.curvas;
        localStorage.setItem('msp_curvas', this.curvas ? '1' : '0');
        bc.classList.toggle('on', this.curvas);
        UI.toast(i18n.t(this.curvas ? 'nav_curvas_on' : 'nav_curvas_off'), 'ok');
        // Si ya hay un destino elegido (y aún no se conduce), recalcular la ruta
        if (this.destino && !this.guiando) this.elegir(this.destino.lat, this.destino.lng, this.destino.nombre);
      });
    }
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.buscar(input.value); } });

    // v0.24 — buscador estilo Maps: sugerencias en vivo + recientes + categorías
    input.addEventListener('input', () => this._onTyping(input.value));
    input.addEventListener('focus', () => {
      this._posCache();                        // calentar el GPS ya, antes de que escriba
      if (!input.value.trim()) this._mostrarHome();
    });
    // Tocar fuera del buscador cierra la lista (como en Google Maps)
    document.addEventListener('click', e => {
      const r = $('nav-results');
      if (r && r.style.display !== 'none'
          && !e.target.closest('.nav-search') && !e.target.closest('#nav-results')) {
        r.style.display = 'none';
      }
    });

    $('nav-cancel').addEventListener('click', () => this.cancelar());
    this.vozOn = localStorage.getItem('msp_voz') !== '0';
    const v = $('ng-voice');
    if (v) v.addEventListener('click', () => {
      this.vozOn = !this.vozOn;
      localStorage.setItem('msp_voz', this.vozOn ? '1' : '0');
      if (!this.vozOn && window.speechSynthesis) speechSynthesis.cancel();
      this._pintarVoz();
    });
    // Actualiza el texto del campo al cambiar de idioma
    document.addEventListener('idioma-cambiado', () => { input.placeholder = i18n.t('nav_buscar'); });
  },

  // Busca direcciones que coincidan con el texto y muestra una lista.
  // v0.23 "near me": primero busca SOLO cerca de mi posición (~80 km) y ordena
  // por distancia ("walmart" = los Walmart de mi zona, no uno de Pensilvania);
  // si cerca no hay nada (una ciudad lejana, otra dirección), busca en todas partes.
  async buscar(q) {
    q = (q || '').trim();
    if (!q) return;
    const res = $('nav-results');
    $('nav-info').style.display = 'none';
    res.style.display = 'block';
    res.innerHTML = `<div class="nav-msg">${i18n.t('nav_buscando')}</div>`;
    try {
      const pos = await this._miPos();
      let data = await this._nominatim(q, pos, true);            // solo cerca
      if (pos && !data.length) data = await this._nominatim(q, pos, false);   // lejos: como antes
      if (!data.length) { res.innerHTML = `<div class="nav-msg">${i18n.t('nav_sin_resultados')}</div>`; return; }

      const items = data.map(d => {
        const partes = d.display_name.split(',');
        return {
          lat: parseFloat(d.lat), lng: parseFloat(d.lon),
          nombre: partes.shift().trim(), dir: partes.join(',').trim(),
          completo: d.display_name
        };
      });
      this._pintarResultados(items, pos);
    } catch (e) {
      res.innerHTML = `<div class="nav-msg">${i18n.t('nav_error')}</div>`;
    }
  },

  // Pinta una lista de sitios ({lat,lng,nombre,dir,completo}) ordenada por cercanía
  _pintarResultados(items, pos, icono) {
    const res = $('nav-results');
    res.style.display = 'block';
    if (!items.length) { res.innerHTML = `<div class="nav-msg">${i18n.t('nav_sin_resultados')}</div>`; return; }
    if (pos) {
      items.forEach(it => { it.dist = distanciaMetros(pos, [it.lat, it.lng]); });
      items.sort((a, b) => a.dist - b.dist);
    }
    res.innerHTML = '';
    items.forEach(it => {
      const b = document.createElement('button');
      b.className = 'nav-result';
      let distTxt = '';
      if (it.dist != null) {
        const du = Units.distToUser(it.dist / 1000);
        distTxt = `<em>${du < 10 ? du.toFixed(1) : Math.round(du)} ${Units.distLabel()}</em>`;
      }
      b.innerHTML = `<span>${icono || '📍'}</span><span class="nr-txt"><b>${it.nombre}</b>${it.dir ? `<small>${it.dir}</small>` : ''}</span>${distTxt}`;
      b.addEventListener('click', () => this.elegir(it.lat, it.lng, it.completo || it.nombre));
      res.appendChild(b);
    });
  },

  // ---------- v0.24: sugerencias en vivo (Photon), recientes y categorías ----------

  // Cada tecla: espera 350 ms sin escribir y pide sugerencias (como Google Maps).
  // Photon (komoot) está pensado para esto; Nominatim NO permite autocompletado.
  _onTyping(q) {
    clearTimeout(this._acT);
    q = (q || '').trim();
    if (!q) { this._mostrarHome(); return; }
    if (q.length < 3) return;
    this._acT = setTimeout(() => this._sugerir(q), 350);
  },

  // Mi posición para el sesgo de las sugerencias, cacheada 2 min y con reintento.
  // (v0.24.1: antes se pedía UNA vez en paralelo → la 1ª búsqueda salía SIN posición
  // y Photon devolvía resultados de cualquier parte del mundo, p. ej. Nueva York.)
  async _posCache() {
    const ahora = Date.now();
    if (this._pos && ahora - (this._posT || 0) < 120000) return this._pos;
    const p = await this._miPos();
    if (p) { this._pos = p; this._posT = ahora; }
    return p || ultimaPos || null;
  },

  async _sugerir(q) {
    const req = this._acN = (this._acN || 0) + 1;
    try {
      if (this._acAbort) this._acAbort.abort();
      this._acAbort = new AbortController();
      const pos = await this._posCache();      // ESPERAR la posición: sin ella salen sitios de cualquier parte
      if (req !== this._acN) return;           // se siguió escribiendo mientras llegaba el GPS
      const lang = ({ en: 'en', de: 'de', fr: 'fr' })[i18n.lang] || 'default';
      let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=${lang}`;
      if (pos) url += `&lat=${pos[0].toFixed(4)}&lon=${pos[1].toFixed(4)}&location_bias_scale=0.6&zoom=14`;
      const r = await fetch(url, { signal: this._acAbort.signal });
      const d = await r.json();
      if (req !== this._acN) return;                     // ya se escribió otra cosa
      const input = $('nav-input');
      if (!input || input.value.trim() !== q) return;    // el texto cambió mientras llegaba
      const items = (d.features || []).map(f => {
        const p = f.properties || {}, c = f.geometry.coordinates;
        const nombre = p.name || p.street || '';
        const dir = [p.street && p.name !== p.street ? p.street : '', p.city, p.state]
          .filter(Boolean).join(', ');
        return { lat: c[1], lng: c[0], nombre, dir, completo: nombre + (dir ? ', ' + dir : '') };
      }).filter(it => it.nombre);
      if (!items.length) return;                         // sin sugerencias: no molestar
      $('nav-info').style.display = 'none';
      this._pintarResultados(items, pos);
    } catch (e) { /* autocompletado caído: Enter sigue buscando con Nominatim */ }
  },

  // Campo vacío y enfocado → categorías rápidas + búsquedas recientes
  _mostrarHome() {
    const res = $('nav-results');
    if (!res) return;
    const cats = [
      { k: 'gas', e: '⛽', q: '["amenity"="fuel"]' },
      { k: 'food', e: '🍔', q: '["amenity"~"restaurant|fast_food"]' },
      { k: 'cafe', e: '☕', q: '["amenity"="cafe"]' },
      { k: 'parking', e: '🅿️', q: '["amenity"="parking"]' },
      { k: 'moto', e: '🔧', q: '["shop"~"^motorcycle"]' }
    ];
    res.innerHTML = '';
    res.style.display = 'block';
    const chips = document.createElement('div');
    chips.className = 'nav-chips';
    cats.forEach(c => {
      const b = document.createElement('button');
      b.className = 'nav-chip';
      b.textContent = `${c.e} ${i18n.t('nav_chip_' + c.k)}`;
      b.addEventListener('click', () => this._buscarCat(c));
      chips.appendChild(b);
    });
    res.appendChild(chips);
    const recs = this._recs();
    if (recs.length) {
      const h = document.createElement('div');
      h.className = 'nav-rec-head';
      h.innerHTML = `<span>${i18n.t('nav_recientes')}</span><button id="nav-rec-clear">${i18n.t('nav_hist_borrar')}</button>`;
      res.appendChild(h);
      h.querySelector('#nav-rec-clear').addEventListener('click', e => {
        e.stopPropagation();
        localStorage.removeItem('msp_nav_rec');
        this._mostrarHome();
      });
      recs.slice(0, 6).forEach(rc => {
        const b = document.createElement('button');
        b.className = 'nav-result';
        const partes = rc.n.split(',');
        const nombre = partes.shift().trim();
        const dir = partes.join(',').trim();
        b.innerHTML = `<span>🕘</span><span class="nr-txt"><b>${nombre}</b>${dir ? `<small>${dir}</small>` : ''}</span>`;
        b.addEventListener('click', () => this.elegir(rc.lat, rc.lng, rc.n));
        res.appendChild(b);
      });
    }
  },

  _recs() {
    try { return JSON.parse(localStorage.getItem('msp_nav_rec')) || []; }
    catch (e) { return []; }
  },

  _guardarRec(nombre, lat, lng) {
    const recs = this._recs().filter(r => r.n !== nombre);
    recs.unshift({ n: nombre, lat, lng });
    localStorage.setItem('msp_nav_rec', JSON.stringify(recs.slice(0, 8)));
  },

  // Chip de categoría → sitios REALES cercanos vía Overpass (igual que las
  // gasolineras de fuel.js). Si Overpass falla, cae a la búsqueda por nombre.
  async _buscarCat(cat) {
    const res = $('nav-results');
    $('nav-info').style.display = 'none';
    res.style.display = 'block';
    res.innerHTML = `<div class="nav-msg">${i18n.t('nav_buscando')}</div>`;
    const pos = await this._miPos();
    if (!pos) { res.innerHTML = `<div class="nav-msg">${i18n.t('permiso_gps')}</div>`; return; }
    try {
      const q = `[out:json][timeout:12];(node${cat.q}(around:10000,${pos[0]},${pos[1]});way${cat.q}(around:10000,${pos[0]},${pos[1]}););out center 20;`;
      const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: q });
      const d = await r.json();
      const items = (d.elements || []).map(e => {
        const lat = e.lat != null ? e.lat : (e.center && e.center.lat);
        const lng = e.lon != null ? e.lon : (e.center && e.center.lon);
        if (lat == null) return null;
        const t = e.tags || {};
        const nombre = t.name || i18n.t('nav_chip_' + cat.k);
        const dir = [t['addr:street'], t['addr:city']].filter(Boolean).join(', ');
        return { lat, lng, nombre, dir, completo: nombre + (dir ? ', ' + dir : '') };
      }).filter(Boolean).slice(0, 12);
      this._pintarResultados(items, pos, cat.e);
    } catch (e) {
      // Overpass caído: al menos buscar la categoría por nombre cerca de mí
      this.buscar(i18n.t('nav_chip_' + cat.k));
    }
  },

  // Mi posición para la búsqueda: GPS rápido (vale uno de hace ≤2 min)
  // y, si no responde, la última posición conocida de la app.
  _miPos() {
    return new Promise(resolve => {
      if (!('geolocation' in navigator)) { resolve(ultimaPos || null); return; }
      navigator.geolocation.getCurrentPosition(
        p => resolve([p.coords.latitude, p.coords.longitude]),
        () => resolve(ultimaPos || null),
        { maximumAge: 120000, timeout: 4000 }
      );
    });
  },

  // Llama a Nominatim; con "cerca" limita a un recuadro de ~±0.7° (~50 mi) alrededor
  _nominatim(q, pos, cerca) {
    let url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=' + encodeURIComponent(q);
    if (pos && cerca) {
      const d = 0.7;
      url += `&viewbox=${(pos[1] - d).toFixed(3)},${(pos[0] + d).toFixed(3)},${(pos[1] + d).toFixed(3)},${(pos[0] - d).toFixed(3)}&bounded=1`;
    }
    return fetch(url, { headers: { 'Accept-Language': i18n.lang } })
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : [])
      .catch(() => []);
  },

  // Fija el destino, lo pinta en el mapa y calcula la ruta desde mi posición
  elegir(lat, lng, nombre) {
    this.destino = { lat, lng, nombre };
    this.ruta = null;
    this.pasos = null;
    clearTimeout(this._acT);                  // sin sugerencias pendientes tras elegir
    this._acN = (this._acN || 0) + 1;
    this._guardarRec(nombre, lat, lng);
    $('nav-results').style.display = 'none';
    $('nav-input').value = nombre.split(',')[0];
    Mapa.setDestino(lat, lng);

    const info = $('nav-info');
    info.style.display = 'flex';
    $('nav-dist').textContent = '…';
    $('nav-time').textContent = '';
    const rain = $('nav-rain');
    if (rain) rain.style.display = 'none';

    if (!('geolocation' in navigator)) { Mapa.center(lat, lng, 14); this._error(); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      const o = pos.coords;
      const route = await this._pedirRuta(o.latitude, o.longitude);
      if (!route) { this._error(); return; }
      this._setRuta(route, true);
      const distU = Units.distToUser(this.ruta.distanciaKm).toFixed(1);
      $('nav-dist').textContent = `${distU} ${Units.distLabel()}`;
      $('nav-time').textContent = `${Math.round(this.ruta.duracionMin)} ${i18n.t('nav_min')} · 🏁 ${this._hora(this.ruta.duracionMin * 60)}`;
      this._lluviaRuta(route);   // ¿lloverá por donde voy a pasar? (no bloquea nada)
    }, () => { Mapa.center(lat, lng, 14); this._error(); }, { enableHighAccuracy: true, timeout: 10000 });
  },

  // Comprueba la probabilidad de lluvia en varios puntos de la ruta, cada uno
  // a la HORA en la que se prevé pasar por él (Open-Meteo, gratis sin clave).
  // Si en alguno es ≥40%, muestra el aviso 🌧️ en el panel de navegación.
  async _lluviaRuta(route) {
    const el = $('nav-rain');
    if (!el) return;
    el.style.display = 'none';
    const req = this._lluviaN = (this._lluviaN || 0) + 1;
    try {
      const coords = route.geometry.coordinates;                    // [lng,lat]
      if (!coords || coords.length < 2) return;
      const n = Math.min(5, coords.length);
      const idx = [];
      for (let i = 0; i < n; i++) idx.push(Math.round(i * (coords.length - 1) / (n - 1)));
      const horasRuta = route.duration / 3600;
      const horas = Math.min(24, Math.max(2, Math.ceil(horasRuta) + 1));
      const lats = idx.map(i => coords[i][1].toFixed(3)).join(',');
      const lngs = idx.map(i => coords[i][0].toFixed(3)).join(',');
      const r = await fetch('https://api.open-meteo.com/v1/forecast'
        + `?latitude=${lats}&longitude=${lngs}`
        + `&hourly=precipitation_probability&forecast_hours=${horas}&timezone=auto`);
      const d = await r.json();
      if (req !== this._lluviaN || !this.destino) return;           // ya hay otro destino
      const locs = Array.isArray(d) ? d : [d];
      let peor = 0;
      locs.forEach((loc, i) => {
        const probs = (loc.hourly && loc.hourly.precipitation_probability) || [];
        if (!probs.length) return;
        // hora prevista de paso por ese punto (0 = ahora mismo)
        const h = Math.min(probs.length - 1, Math.round((i / Math.max(locs.length - 1, 1)) * horasRuta));
        const p = Math.max(probs[h] || 0, probs[Math.max(h - 1, 0)] || 0);
        if (p > peor) peor = p;
      });
      if (peor >= 40) {
        el.textContent = `🌧️ ${peor}%`;
        el.style.display = 'inline-flex';
        UI.toast(i18n.t('lluvia_ruta').replace('{p}', peor), 'err');
      }
    } catch (e) { /* sin datos de lluvia: la ruta sigue igual */ }
  },

  // Pide a OSRM la ruta desde (lat,lng) hasta el destino, con las maniobras (steps).
  // En modo curvas pide alternativas y elige la más SINUOSA (más curva por km).
  async _pedirRuta(lat, lng) {
    try {
      const alt = this.curvas ? '&alternatives=3' : '';
      const url = `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${this.destino.lng},${this.destino.lat}?overview=full&geometries=geojson&steps=true${alt}`;
      const r = await fetch(url);
      const data = await r.json();
      const rutas = data.routes || [];
      if (!rutas.length) return null;
      if (!this.curvas || rutas.length === 1) return rutas[0];
      // Sinuosidad = distancia real / distancia en línea recta. Más alta = más curvas.
      const recta = Math.max(distanciaMetros([lat, lng], [this.destino.lat, this.destino.lng]), 1);
      let mejor = rutas[0], mejorS = 0;
      rutas.forEach(rt => {
        const s = rt.distance / recta;
        if (s > mejorS) { mejorS = s; mejor = rt; }
      });
      return mejor;
    } catch (e) { return null; }
  },

  // Guarda la ruta: línea en el mapa + lista de maniobras para la guía
  _setRuta(route, encuadrar) {
    const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);  // [lon,lat] → [lat,lng]
    Mapa.dibujarRutaPlan(coords, encuadrar);
    this.ruta = { distanciaKm: route.distance / 1000, duracionMin: route.duration / 60 };
    this._mps = route.distance / Math.max(route.duration, 1);   // velocidad media prevista (m/s) para la hora de llegada
    const steps = (route.legs && route.legs[0] && route.legs[0].steps) || [];
    this.pasos = steps.map(s => ({
      lat: s.maneuver.location[1], lng: s.maneuver.location[0],
      tipo: s.maneuver.type, mod: s.maneuver.modifier || '', exit: s.maneuver.exit,
      calle: s.name || '', dist: s.distance,
      avisoLejos: false, avisoCerca: false
    }));
  },

  _error() {
    $('nav-info').style.display = 'flex';
    $('nav-dist').textContent = i18n.t('nav_error');
    $('nav-time').textContent = '';
  },

  // ---------- Guía giro a giro ----------

  // Arranca la guía (la llama app.js al pulsar "Comenzar navegación")
  iniciarGuia() {
    if (!this.pasos || this.pasos.length < 2) return;
    this.guiando = true;
    this.idx = 1;                 // el paso 0 es "salida", la 1ª maniobra real es la 1
    this._minDist = Infinity;
    this._lastReroute = 0;
    document.body.classList.add('navigating');
    const g = $('nav-guide');
    if (g) g.style.display = 'flex';
    const ep = $('eta-pill');
    if (ep) ep.style.display = 'inline-flex';
    this._pintarVoz();
    const p = this.pasos[1];
    this._pintarPaso(p, this.pasos[0].dist);
    // Hablar desde el toque del botón también desbloquea la voz en iOS
    this._hablar(i18n.t('g_en').replace('{d}', this._fmtDist(this.pasos[0].dist, true)).replace('{inst}', this._instruccion(p)));
  },

  // Hora de llegada dentro de "seg" segundos, en formato local (14:35 / 2:35 PM)
  _hora(seg) {
    return new Date(Date.now() + seg * 1000)
      .toLocaleTimeString(i18n.lang, { hour: '2-digit', minute: '2-digit' });
  },

  // Actualiza la pastilla 🏁 hora de llegada + distancia restante (estilo Waze)
  _pintarETA(distRestante) {
    const el = $('eta-pill');
    if (!el) return;
    const seg = distRestante / Math.max(this._mps || 11, 1);
    const distU = Units.distToUser(distRestante / 1000);
    el.textContent = `🏁 ${this._hora(seg)} · ${distU < 10 ? distU.toFixed(1) : Math.round(distU)} ${Units.distLabel()}`;
  },

  // La llama app.js con cada posición GPS mientras se graba
  actualizarGuia(lat, lng) {
    if (!this.guiando || !this.pasos) return;
    if (this.idx >= this.pasos.length) { this.terminarGuia(false); return; }
    const p = this.pasos[this.idx];
    const d = distanciaMetros([lat, lng], [p.lat, p.lng]);
    this._pintarPaso(p, d);

    // Distancia restante = lo que falta hasta el próximo giro + el resto de tramos
    let resto = d;
    for (let i = this.idx; i < this.pasos.length; i++) resto += this.pasos[i].dist || 0;
    this._pintarETA(resto);

    // Desvío: si me estoy alejando claramente del próximo giro, recalcular la ruta
    if (d < this._minDist) this._minDist = d;
    else if (d > this._minDist + 100 && d > 80 && Date.now() - this._lastReroute > 20000) {
      this._lastReroute = Date.now();
      this._recalcular(lat, lng);
      return;
    }

    if (!p.avisoLejos && d <= 300 && d > 90) {
      p.avisoLejos = true;
      this._hablar(i18n.t('g_en').replace('{d}', this._fmtDist(d, true)).replace('{inst}', this._instruccion(p)));
    }
    if (!p.avisoCerca && d <= 70) {
      p.avisoCerca = true;
      this._hablar(this._instruccion(p));
    }
    if (d < 25) {
      if (p.tipo === 'arrive') { this.terminarGuia(true); return; }
      this.idx++;
      this._minDist = Infinity;
    }
  },

  // Pide una ruta nueva desde la posición actual (sin reencuadrar el mapa)
  async _recalcular(lat, lng) {
    if (!this.destino) return;
    this._hablar(i18n.t('g_recalc'));
    const route = await this._pedirRuta(lat, lng);
    if (!route || !this.guiando) return;
    this._setRuta(route, false);
    this.idx = this.pasos.length > 1 ? 1 : 0;
    this._minDist = Infinity;
  },

  terminarGuia(llegado) {
    this.guiando = false;
    const ep = $('eta-pill');
    if (ep) ep.style.display = 'none';
    const g = $('nav-guide');
    if (llegado) {
      const t = i18n.t('g_destino');
      if (g) {
        $('ng-arrow').textContent = '🏁';
        $('ng-dist').textContent = '';
        $('ng-inst').textContent = t.charAt(0).toUpperCase() + t.slice(1);
      }
      this._hablar(t);
      // El cartel de llegada se queda unos segundos y desaparece (la grabación sigue)
      setTimeout(() => {
        if (!this.guiando) {
          if (g) g.style.display = 'none';
          document.body.classList.remove('navigating');
        }
      }, 8000);
    } else {
      if (g) g.style.display = 'none';
      document.body.classList.remove('navigating');
    }
  },

  // Texto de la instrucción según el tipo de maniobra de OSRM
  _instruccion(p) {
    switch (p.tipo) {
      case 'arrive': return i18n.t('g_destino');
      case 'roundabout':
      case 'rotary': return i18n.t('g_rotonda').replace('{n}', p.exit || 1);
      case 'exit roundabout': return i18n.t('g_rotonda_salir');
      case 'merge': return i18n.t('g_incorporate');
      case 'on ramp': return i18n.t('g_acceso');
      case 'off ramp': return i18n.t('g_tomar_salida');
    }
    const m = p.mod;
    if (m.indexOf('uturn') >= 0) return i18n.t('g_uturn');
    if (m === 'left') return i18n.t('g_izq');
    if (m === 'right') return i18n.t('g_der');
    if (m === 'slight left') return i18n.t('g_lig_izq');
    if (m === 'slight right') return i18n.t('g_lig_der');
    if (m === 'sharp left') return i18n.t('g_cer_izq');
    if (m === 'sharp right') return i18n.t('g_cer_der');
    return i18n.t('g_recto');
  },

  _flecha(p) {
    if (p.tipo === 'arrive') return '🏁';
    if (p.tipo === 'roundabout' || p.tipo === 'rotary') return '🔄';
    const m = p.mod;
    if (m.indexOf('uturn') >= 0) return '⤸';
    if (m === 'left' || m === 'sharp left') return '⬅';
    if (m === 'right' || m === 'sharp right') return '➡';
    if (m === 'slight left') return '↖';
    if (m === 'slight right') return '↗';
    return '⬆';
  },

  // Distancia para el banner (corta) o para la voz (con la unidad hablada)
  _fmtDist(m, hablada) {
    if (Units.imperial) {
      const ft = m * 3.28084;
      if (ft < 1000) {
        const f = Math.max(100, Math.round(ft / 100) * 100);
        return hablada ? `${f} ${i18n.t('g_ft')}` : `${f} ft`;
      }
      const mi = m / 1609.344;
      const v = mi < 10 ? mi.toFixed(1) : Math.round(mi);
      return hablada ? `${v} ${i18n.t('g_mi')}` : `${v} mi`;
    }
    if (m < 950) {
      const r = Math.max(50, Math.round(m / 50) * 50);
      return hablada ? `${r} ${i18n.t('g_m')}` : `${r} m`;
    }
    const km = m / 1000;
    const v = km < 10 ? km.toFixed(1) : Math.round(km);
    return hablada ? `${v} ${i18n.t('g_km')}` : `${v} km`;
  },

  _pintarPaso(p, d) {
    const a = $('ng-arrow');
    if (!a) return;
    a.textContent = this._flecha(p);
    $('ng-dist').textContent = this._fmtDist(d, false);
    const inst = this._instruccion(p);
    $('ng-inst').textContent = inst.charAt(0).toUpperCase() + inst.slice(1) + (p.calle ? ' · ' + p.calle : '');
  },

  _pintarVoz() {
    const v = $('ng-voice');
    if (v) v.textContent = this.vozOn ? '🔊' : '🔇';
  },

  // Lee la instrucción en voz alta en el idioma de la app (voz del propio móvil)
  _hablar(txt) {
    if (!this.vozOn || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = ({ es: 'es-ES', en: 'en-US', de: 'de-DE', fr: 'fr-FR', it: 'it-IT' })[i18n.lang] || 'en-US';
      u.rate = 1.05;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) { /* sin síntesis de voz: la guía visual sigue */ }
  },

  // Quita destino, ruta, guía y limpia la interfaz
  cancelar() {
    this.destino = null;
    this.ruta = null;
    this.pasos = null;
    this.guiando = false;
    this.idx = 0;
    if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} }
    document.body.classList.remove('navigating');
    if (typeof Mapa !== 'undefined') Mapa.limpiarNav();
    const info = $('nav-info'), res = $('nav-results'), input = $('nav-input'), g = $('nav-guide'), ep = $('eta-pill'), rain = $('nav-rain');
    if (info) info.style.display = 'none';
    if (res) res.style.display = 'none';
    if (input) input.value = '';
    if (g) g.style.display = 'none';
    if (ep) ep.style.display = 'none';
    if (rain) rain.style.display = 'none';
  }
};
