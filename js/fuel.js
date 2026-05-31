// ============================================================
//  GASOLINA — calculadora de combustible + puntos de gasolinera
//  - Consumo (L/100km) tomado de "Mi moto" (editable aquí).
//  - Coste = litros × precio/L (precio editable; en vivo según país).
//  - Gasolineras cercanas reales vía Overpass (OpenStreetMap) con tu GPS.
// ============================================================

const Fuel = {
  simbolo() { return CONFIG.MONEDA === 'EUR' ? '€' : '$'; },

  // Distancia por defecto: la última ruta grabada, o 50 km
  distanciaDefecto() {
    const r = Storage.listarRutas()[0];
    return r ? r.distanciaKm : 50;
  },

  render() {
    const cont = $('view-gasolina');
    // Consumo base (L/100km) desde "Mi moto" → mostrado en la unidad elegida
    const consBase = (Garage.consumo() != null) ? Garage.consumo() : 5.0;
    const consU = Units.consToUser(consBase).toFixed(1);
    const distU = Units.distToUser(this.distanciaDefecto()).toFixed(0);
    const precioU = Units.precioDefecto().toFixed(2);

    cont.innerHTML = `
      <h2 data-i18n="gas_titulo">${i18n.t('gas_titulo')}</h2>
      <p class="muted" data-i18n="gas_sub">${i18n.t('gas_sub')}</p>

      <div class="fuel-form">
        <label>${i18n.t('gas_distancia')} (${Units.distLabel()})
          <input id="f-dist" type="number" step="1" value="${distU}"></label>
        <label>${i18n.t('gas_consumo')} (${Units.consLabel()})
          <input id="f-cons" type="number" step="0.1" value="${consU}"></label>
        <label>${i18n.t('gas_precio')} (${this.simbolo()}${Units.priceLabel()})
          <input id="f-precio" type="number" step="0.01" value="${precioU}"></label>
      </div>

      <div class="fuel-result">
        <div class="fuel-big"><span id="f-litros">0</span><small> ${Units.volLabel()}</small></div>
        <div class="fuel-big accent"><span id="f-coste">0</span><small> ${this.simbolo()}</small></div>
      </div>
      <p class="muted" id="f-autonomia"></p>

      <button class="btn" id="f-vivo" data-i18n="gas_precio_vivo_btn">${i18n.t('gas_precio_vivo_btn')}</button>

      <h2 style="margin-top:24px" data-i18n="gas_estaciones">${i18n.t('gas_estaciones')}</h2>
      <button class="btn primary" id="f-buscar" data-i18n="gas_estaciones_btn">${i18n.t('gas_estaciones_btn')}</button>
      <div id="f-lista" class="gas-list"></div>
    `;

    ['f-dist', 'f-cons', 'f-precio'].forEach(id =>
      $(id).addEventListener('input', () => this.calcular()));
    $('f-buscar').addEventListener('click', () => this.buscarEstaciones());
    $('f-vivo').addEventListener('click', () => this.precioEnVivo());
    this.calcular();
  },

  calcular() {
    // Entradas en la unidad del usuario → se pasan a base (km, L/100km, $/L)
    const distKm = Units.distToBase(parseFloat($('f-dist').value) || 0);
    const consBase = Units.consToBase(parseFloat($('f-cons').value) || 0);
    const precioUser = parseFloat($('f-precio').value) || 0;
    const precioBaseL = Units.imperial ? precioUser / L_POR_GAL : precioUser;

    const litros = distKm / 100 * consBase;          // litros base
    const coste = litros * precioBaseL;
    $('f-litros').textContent = Units.volToUser(litros).toFixed(2);
    $('f-coste').textContent = coste.toFixed(2);

    const dep = parseFloat(Garage.get().deposito);   // litros base
    if (!isNaN(dep) && consBase > 0) {
      const autonomiaKm = dep / consBase * 100;
      $('f-autonomia').textContent =
        `${i18n.t('gas_autonomia')}: ~${Math.round(Units.distToUser(autonomiaKm))} ${Units.distLabel()} ` +
        `(${Units.volToUser(dep).toFixed(1)} ${Units.volLabel()})`;
    } else {
      $('f-autonomia').textContent = '';
    }
  },

  precioEnVivo() {
    // Precio oficial en vivo: solo disponible por país. ES = API del Gobierno.
    if (CONFIG.PAIS !== 'ES') {
      alert(i18n.t('gas_precio_vivo_no'));
      return;
    }
    alert(i18n.t('gas_precio_vivo_no'));
    // NOTA: la API oficial española no envía cabeceras CORS, así que un PWA
    // puro no puede leerla directamente; requiere un pequeño proxy.
    // Pendiente de activar según el país del usuario.
  },

  buscarEstaciones() {
    const lista = $('f-lista');
    lista.innerHTML = `<p class="muted">${i18n.t('gas_buscando')}</p>`;
    if (!('geolocation' in navigator)) { lista.innerHTML = `<p class="muted">${i18n.t('sin_gps')}</p>`; return; }

    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const q = `[out:json][timeout:20];node(around:6000,${lat},${lon})[amenity=fuel];out;`;
      fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: q })
        .then(r => r.json())
        .then(data => this._render(lista, data.elements || [], lat, lon))
        .catch(() => { lista.innerHTML = `<p class="muted">${i18n.t('gas_sin_estaciones')}</p>`; });
    }, () => { lista.innerHTML = `<p class="muted">${i18n.t('permiso_gps')}</p>`; },
    { enableHighAccuracy: true, timeout: 10000 });
  },

  _dist(aLat, aLon, bLat, bLon) {
    const R = 6371, dLat = (bLat - aLat) * Math.PI / 180, dLon = (bLon - aLon) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  },

  _render(lista, nodos, lat, lon) {
    if (!nodos.length) { lista.innerHTML = `<p class="muted">${i18n.t('gas_sin_estaciones')}</p>`; return; }
    const items = nodos.map(n => ({
      nombre: (n.tags && (n.tags.name || n.tags.brand || n.tags.operator)) || 'Gasolinera',
      lat: n.lat, lon: n.lon, d: this._dist(lat, lon, n.lat, n.lon)
    })).sort((a, b) => a.d - b.d).slice(0, 12);

    lista.innerHTML = items.map(s => `
      <div class="gas-card">
        <div>
          <div class="gas-name">⛽ ${s.nombre}</div>
          <div class="gas-dist">${Units.distToUser(s.d).toFixed(1)} ${Units.distLabel()}</div>
        </div>
        <a class="gas-go" target="_blank" rel="noopener"
           href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}"
           data-i18n="gas_como_llegar">${i18n.t('gas_como_llegar')}</a>
      </div>`).join('');
  }
};
