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
    this.pasos = null;
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
      const route = await this._pedirRuta(o.latitude, o.longitude);
      if (!route) { this._error(); return; }
      this._setRuta(route, true);
      const distU = Units.distToUser(this.ruta.distanciaKm).toFixed(1);
      $('nav-dist').textContent = `${distU} ${Units.distLabel()}`;
      $('nav-time').textContent = `${Math.round(this.ruta.duracionMin)} ${i18n.t('nav_min')} · 🏁 ${this._hora(this.ruta.duracionMin * 60)}`;
    }, () => { Mapa.center(lat, lng, 14); this._error(); }, { enableHighAccuracy: true, timeout: 10000 });
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
    const info = $('nav-info'), res = $('nav-results'), input = $('nav-input'), g = $('nav-guide'), ep = $('eta-pill');
    if (info) info.style.display = 'none';
    if (res) res.style.display = 'none';
    if (input) input.value = '';
    if (g) g.style.display = 'none';
    if (ep) ep.style.display = 'none';
  }
};
