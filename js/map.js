// ============================================================
//  MAPA — usa Google Maps si hay clave en CONFIG, si no OpenStreetMap.
//  Interfaz común: Mapa.init / center / addPoint / marker / reset / invalidate
// ============================================================

const Mapa = {
  motor: null,        // 'google' | 'leaflet'
  _map: null,
  _line: null,
  _lineCasing: null,  // borde oscuro bajo la línea (acabado premium)
  _marker: null,
  _pts: [],
  _seguir: true,      // seguir mi posición; se pausa si el usuario arrastra el mapa
  _lastPos: null,
  _lastHead: null,

  // --- Estilos de mapa elegibles (Ajustes → Mapa) ---
  // CARTO es gratis y sin clave (con atribución); OSM es el clásico.
  ESTILOS: {
    oscuro:  { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', sub: 'abcd' },
    dia:     { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', sub: 'abcd' },
    clasico: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', sub: 'abc' }
  },
  estiloActual() {
    const e = localStorage.getItem('msp_mapa_estilo');
    return this.ESTILOS[e] ? e : 'oscuro';
  },
  tileUrl() { return this.ESTILOS[this.estiloActual()].url; },
  tileSub() { return this.ESTILOS[this.estiloActual()].sub; },
  setEstilo(id) {
    if (!this.ESTILOS[id]) return;
    localStorage.setItem('msp_mapa_estilo', id);
    if (this.motor === 'leaflet' && this._map && this._tiles) {
      this._map.removeLayer(this._tiles);
      this._tiles = L.tileLayer(this.tileUrl(), { maxZoom: 19, subdomains: this.tileSub() }).addTo(this._map);
    }
  },

  usaGoogle() {
    return !!(CONFIG.GOOGLE_MAPS_API_KEY && CONFIG.GOOGLE_MAPS_API_KEY.trim());
  },

  // Carga la librería adecuada y resuelve cuando esté lista
  init(elId, centro = [40.4168, -3.7038]) {
    return new Promise(resolve => {
      if (this.usaGoogle()) {
        this.motor = 'google';
        this._cargarGoogle(() => { this._initGoogle(elId, centro); resolve(); });
      } else {
        this.motor = 'leaflet';
        this._initLeaflet(elId, centro);
        resolve();
      }
    });
  },

  // --- Google Maps ---
  _cargarGoogle(cb) {
    if (window.google && window.google.maps) return cb();
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}`;
    s.async = true;
    s.onload = cb;
    s.onerror = () => { console.error('Google Maps no cargó; revisa la clave.'); cb(); };
    document.head.appendChild(s);
  },
  _initGoogle(elId, c) {
    this._map = new google.maps.Map(document.getElementById(elId), {
      center: { lat: c[0], lng: c[1] }, zoom: 14, disableDefaultUI: true,
      styles: MAP_DARK_STYLE
    });
    this._line = new google.maps.Polyline({
      map: this._map, strokeColor: '#ff5c2a', strokeWeight: 5, path: []
    });
  },

  // --- Leaflet ---
  _initLeaflet(elId, c) {
    this._map = L.map(elId, { zoomControl: false, attributionControl: false }).setView(c, 14);
    this._tiles = L.tileLayer(this.tileUrl(), { maxZoom: 19, subdomains: this.tileSub() }).addTo(this._map);
    // La línea recorrida lleva un borde oscuro debajo (casing) — se ve premium
    this._lineCasing = L.polyline([], { color: '#8c2c0e', weight: 9, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }).addTo(this._map);
    this._line = L.polyline([], { color: '#ff5c2a', weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(this._map);
    // Si el usuario arrastra el mapa mientras conduce, dejamos de seguirle
    // y aparece el botón "Re-centrar" (como Waze / Google Maps)
    this._map.on('dragstart', () => {
      if (!document.body.classList.contains('driving')) return;
      this._seguir = false;
      const b = document.getElementById('btn-recentrar');
      if (b) b.style.display = 'inline-flex';
    });
  },

  // Vuelve a seguir mi posición (botón Re-centrar)
  recentrar() {
    this._seguir = true;
    const b = document.getElementById('btn-recentrar');
    if (b) b.style.display = 'none';
    if (this._lastPos) this.center(this._lastPos[0], this._lastPos[1], this.seguirZoom);
  },

  center(lat, lng, zoom) {
    if (this.motor === 'google') {
      this._map.setCenter({ lat, lng });
      if (zoom) this._map.setZoom(Math.max(this._map.getZoom(), zoom));
    } else {
      this._map.setView([lat, lng], zoom ? Math.max(this._map.getZoom(), zoom) : this._map.getZoom());
    }
  },

  seguirZoom: 17,   // zoom de seguimiento al conducir (más cerca = se ve mejor por dónde voy)

  // --- Tipo de marcador elegible (Ajustes → Mapa): emoji / flecha / moto ---
  marcadorTipo() {
    const t = localStorage.getItem('msp_marcador');
    return ['auto', 'flecha', 'moto'].includes(t) ? t : 'auto';
  },
  // Flecha navegador estilo Waze (gira 360° con el rumbo)
  _svgFlecha() {
    return `<svg viewBox="0 0 24 24" width="32" height="32">
      <path d="M12 2.2 19.6 20 12 15.6 4.4 20z" fill="#0a84ff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
    </svg>`;
  },
  // Moto deportiva vista desde arriba (gira 360° con el rumbo)
  _svgMoto() {
    return `<svg viewBox="0 0 24 44" width="26" height="46">
      <rect x="10" y="1" width="4" height="9" rx="2" fill="#1c1f26" stroke="#5a6170" stroke-width="0.9"/>
      <rect x="10" y="34" width="4" height="9" rx="2" fill="#1c1f26" stroke="#5a6170" stroke-width="0.9"/>
      <path d="M12 5.5 C15.2 9.5 15.6 13 14.6 17 L14.9 24 C15.1 30 14.2 36.5 12 38.8 C9.8 36.5 8.9 30 9.1 24 L9.4 17 C8.4 13 8.8 9.5 12 5.5 Z"
            fill="#ff5c2a" stroke="#ffd2c0" stroke-width="0.7"/>
      <path d="M4.6 11.5 10.4 13.8 M19.4 11.5 13.6 13.8" stroke="#cfd6e4" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="21.5" r="3.4" fill="#11151f" stroke="#fff" stroke-width="0.9"/>
    </svg>`;
  },

  // Marca/actualiza mi posición con el marcador elegido, orientado al rumbo
  marcarPosicion(lat, lng, heading) {
    this._lastPos = [lat, lng];
    if (heading != null && !isNaN(heading)) this._lastHead = heading;
    if (this.motor === 'google') {
      // Google Maps no rota etiquetas: se mantiene el círculo azul clásico
      if (!this._marker) {
        this._marker = new google.maps.Marker({
          map: this._map, position: { lat, lng }, zIndex: 999,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#0a84ff', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 }
        });
      } else this._marker.setPosition({ lat, lng });
    } else {
      const tipo = this.marcadorTipo();
      if (!this._marker) {
        const dentro = (tipo === 'flecha') ? `<div class="mk-rot" id="mk-rot">${this._svgFlecha()}</div>`
          : (tipo === 'moto') ? `<div class="mk-rot" id="mk-rot">${this._svgMoto()}</div>`
          : `<span class="moto-emoji" id="moto-emoji-live">${this._emojiMoto()}</span>`;
        this._marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'moto-icon',
            html: `<div class="moto-marker"><div class="moto-halo"></div>${dentro}</div>`,
            iconSize: [48, 48], iconAnchor: [24, 24]
          }),
          interactive: false, keyboard: false, zIndexOffset: 1000
        }).addTo(this._map);
      } else this._marker.setLatLng([lat, lng]);
      if (tipo === 'auto') this._orientarEmoji(heading);
      else this._rotarMarcador(this._lastHead);
    }
  },

  // Recrea el marcador al cambiar de tipo en Ajustes
  refrescarMarcador() {
    if (this._marker && this.motor === 'leaflet') {
      this._map.removeLayer(this._marker);
      this._marker = null;
      if (this._lastPos) this.marcarPosicion(this._lastPos[0], this._lastPos[1], this._lastHead);
    }
  },

  // Flecha/moto: rotación completa hacia el rumbo (como el coche de Waze)
  _rotarMarcador(h) {
    if (h == null || isNaN(h)) return;
    const el = document.getElementById('mk-rot');
    if (el) el.style.transform = `rotate(${Math.round(h)}deg)`;
  },

  // El emoji mira hacia donde conduces y se inclina un poco (efecto 3D).
  // El emoji de serie mira a la IZQUIERDA: rumbo este → se voltea.
  _orientarEmoji(h) {
    if (h == null || isNaN(h)) return;   // parado: el GPS no da rumbo, se mantiene el último
    const el = document.getElementById('moto-emoji-live');
    if (!el) return;
    h = ((h % 360) + 360) % 360;
    let tilt, t;
    if (h <= 180) {            // hacia el este → voltear para mirar a la derecha
      tilt = Math.max(-25, Math.min(25, (h - 90) * 0.28));
      t = `rotate(${tilt}deg) scaleX(-1)`;
    } else {                   // hacia el oeste → mirando a la izquierda (natural)
      tilt = Math.max(-25, Math.min(25, (h - 270) * 0.28));
      t = `rotate(${tilt}deg)`;
    }
    el.style.transform = t;
  },

  // Elige el emoji según la moto guardada en "Mi Moto"
  _emojiMoto() {
    let m = {};
    try { m = JSON.parse(localStorage.getItem('msp_moto')) || {}; } catch (e) {}
    const txt = `${m.marca || ''} ${m.modelo || ''}`.toLowerCase();
    const cc = parseFloat(m.cc);
    const SCOOTERS = ['vespa', 'scooter', 'pcx', 'xmax', 'x-max', 'nmax', 'n-max', 'burgman',
      'primavera', 'beverly', 'medley', 'lambretta', 'forza', 'agility', 'address',
      'symphony', 'fiddle', 'joymax', 'citycom', 'liberty', 'zip', 'typhoon', 'gts'];
    if (SCOOTERS.some(p => txt.includes(p)) || (!isNaN(cc) && cc > 0 && cc <= 180)) return '🛵';
    return '🏍️';
  },

  // Zoom según velocidad (como Waze): rápido = mapa más abierto para ver más allá
  _zoomVel(velKmh) {
    if (velKmh == null || isNaN(velKmh)) return this.seguirZoom;
    if (velKmh >= 75) return 15;
    if (velKmh >= 40) return 16;
    return this.seguirZoom;   // 17
  },

  addPoint(lat, lng, heading, velKmh) {
    this._pts.push([lat, lng]);
    if (this.motor === 'google') {
      this._line.getPath().push(new google.maps.LatLng(lat, lng));
    } else {
      this._line.addLatLng([lat, lng]);
      if (this._lineCasing) this._lineCasing.addLatLng([lat, lng]);
    }
    this.marcarPosicion(lat, lng, heading);
    if (!this._seguir) return;   // el usuario está mirando otra zona: no recentrar
    if (this.motor === 'leaflet') {
      this._map.setView([lat, lng], this._zoomVel(velKmh), { animate: true });
    } else {
      this.center(lat, lng, this.seguirZoom);
    }
  },

  // --- Navegación: destino + ruta trazada hasta él ---
  setDestino(lat, lng) {
    this.limpiarDestino();
    if (this.motor === 'google') {
      this._destMarker = new google.maps.Marker({ map: this._map, position: { lat, lng }, zIndex: 998 });
    } else {
      this._destMarker = L.marker([lat, lng], {
        icon: L.divIcon({ className: 'dest-icon', html: '<div class="dest-pin">📍</div>', iconSize: [34, 38], iconAnchor: [17, 36] }),
        interactive: false
      }).addTo(this._map);
    }
  },
  // coords = [[lat, lng], ...]  (línea azul de la ruta planificada)
  // encuadrar=false al recalcular en marcha: no alejar el mapa mientras se conduce
  dibujarRutaPlan(coords, encuadrar = true) {
    this.limpiarRutaPlan();
    if (this.motor === 'google') {
      const path = coords.map(c => ({ lat: c[0], lng: c[1] }));
      this._routePlan = new google.maps.Polyline({ map: this._map, path, strokeColor: '#0a84ff', strokeWeight: 7, strokeOpacity: 0.9, zIndex: 1 });
      if (encuadrar) { const b = new google.maps.LatLngBounds(); path.forEach(p => b.extend(p)); this._map.fitBounds(b); }
    } else {
      // Borde azul oscuro debajo (casing): acabado tipo Google/Waze
      this._routePlanCasing = L.polyline(coords, { color: '#063a78', weight: 11, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(this._map);
      this._routePlan = L.polyline(coords, { color: '#0a84ff', weight: 7, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(this._map);
      if (encuadrar) { try { this._map.fitBounds(this._routePlan.getBounds(), { padding: [60, 60] }); } catch (e) { /* ruta vacía */ } }
    }
  },
  limpiarDestino() {
    if (!this._destMarker) return;
    if (this.motor === 'google') this._destMarker.setMap(null);
    else this._map.removeLayer(this._destMarker);
    this._destMarker = null;
  },
  limpiarRutaPlan() {
    if (this._routePlanCasing) { this._map.removeLayer(this._routePlanCasing); this._routePlanCasing = null; }
    if (!this._routePlan) return;
    if (this.motor === 'google') this._routePlan.setMap(null);
    else this._map.removeLayer(this._routePlan);
    this._routePlan = null;
  },
  limpiarNav() { this.limpiarDestino(); this.limpiarRutaPlan(); },

  reset() {
    this._pts = [];
    this._seguir = true;
    const b = document.getElementById('btn-recentrar');
    if (b) b.style.display = 'none';
    if (this.motor === 'google') {
      this._line.setPath([]);
      if (this._marker) { this._marker.setMap(null); this._marker = null; }
    } else {
      this._line.setLatLngs([]);
      if (this._lineCasing) this._lineCasing.setLatLngs([]);
      if (this._marker) { this._map.removeLayer(this._marker); this._marker = null; }
    }
  },

  invalidate() {
    if (this.motor === 'leaflet' && this._map) setTimeout(() => this._map.invalidateSize(), 100);
  }
};

// Estilo oscuro para Google Maps (combina con el diseño de la app)
const MAP_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0e1320' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a93a6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0e14' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1d2433' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a3142' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1a2a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] }
];
