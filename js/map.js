// ============================================================
//  MAPA — usa Google Maps si hay clave en CONFIG, si no OpenStreetMap.
//  Interfaz común: Mapa.init / center / addPoint / marker / reset / invalidate
// ============================================================

const Mapa = {
  motor: null,        // 'google' | 'leaflet'
  _map: null,
  _line: null,
  _marker: null,
  _pts: [],

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

  // --- Leaflet / OpenStreetMap ---
  _initLeaflet(elId, c) {
    this._map = L.map(elId, { zoomControl: false, attributionControl: false }).setView(c, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this._map);
    this._line = L.polyline([], { color: '#ff5c2a', weight: 5 }).addTo(this._map);
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

  // Marca/actualiza mi posición con el emoji 3D de la moto del usuario
  // (🏍️ o 🛵 según su marca/modelo/cc de "Mi Moto"), orientado al rumbo.
  marcarPosicion(lat, lng, heading) {
    if (this.motor === 'google') {
      // Google Maps no rota etiquetas: se mantiene el círculo azul clásico
      if (!this._marker) {
        this._marker = new google.maps.Marker({
          map: this._map, position: { lat, lng }, zIndex: 999,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#0a84ff', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 }
        });
      } else this._marker.setPosition({ lat, lng });
    } else {
      if (!this._marker) {
        this._marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'moto-icon',
            html: `<div class="moto-marker"><div class="moto-halo"></div><span class="moto-emoji" id="moto-emoji-live">${this._emojiMoto()}</span></div>`,
            iconSize: [44, 44], iconAnchor: [22, 22]
          }),
          interactive: false, keyboard: false, zIndexOffset: 1000
        }).addTo(this._map);
      } else this._marker.setLatLng([lat, lng]);
      this._orientarEmoji(heading);
    }
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

  addPoint(lat, lng, heading) {
    this._pts.push([lat, lng]);
    if (this.motor === 'google') {
      this._line.getPath().push(new google.maps.LatLng(lat, lng));
    } else {
      this._line.addLatLng([lat, lng]);
    }
    this.marcarPosicion(lat, lng, heading);
    this.center(lat, lng, this.seguirZoom);
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
      this._routePlan = L.polyline(coords, { color: '#0a84ff', weight: 7, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }).addTo(this._map);
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
    if (!this._routePlan) return;
    if (this.motor === 'google') this._routePlan.setMap(null);
    else this._map.removeLayer(this._routePlan);
    this._routePlan = null;
  },
  limpiarNav() { this.limpiarDestino(); this.limpiarRutaPlan(); },

  reset() {
    this._pts = [];
    if (this.motor === 'google') {
      this._line.setPath([]);
      if (this._marker) { this._marker.setMap(null); this._marker = null; }
    } else {
      this._line.setLatLngs([]);
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
