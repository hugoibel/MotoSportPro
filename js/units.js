// ============================================================
//  UNIDADES — alterna entre IMPERIAL (mi, mph, gal, MPG) y MÉTRICO (km, km/h, L)
//  Internamente TODO se guarda en métrico base: km, km/h, litros, L/100km, $/L.
//  Aquí solo se convierte para mostrar/introducir según el sistema elegido.
// ============================================================

const MI_POR_KM = 0.621371;
const L_POR_GAL = 3.785411784;
const MPG_FACTOR = 235.214583;   // L/100km = MPG_FACTOR / MPG (y viceversa)

const Units = {
  KEY: 'msp_unidades',
  system: 'metric',

  init() {
    this.system = localStorage.getItem(this.KEY) || CONFIG.SISTEMA_UNIDADES || 'metric';
  },
  set(s) {
    this.system = (s === 'imperial') ? 'imperial' : 'metric';
    localStorage.setItem(this.KEY, this.system);
  },
  toggle() { this.set(this.system === 'imperial' ? 'metric' : 'imperial'); },
  get imperial() { return this.system === 'imperial'; },

  // Distancia — base: km
  distLabel() { return this.imperial ? 'mi' : 'km'; },
  distToUser(km) { return this.imperial ? km * MI_POR_KM : km; },
  distToBase(v) { return this.imperial ? v / MI_POR_KM : v; },

  // Velocidad — base: km/h
  speedLabel() { return this.imperial ? 'mph' : 'km/h'; },
  speedToUser(kmh) { return this.imperial ? kmh * MI_POR_KM : kmh; },

  // Volumen — base: litros
  volLabel() { return this.imperial ? 'gal' : 'L'; },
  volToUser(l) { return this.imperial ? l / L_POR_GAL : l; },
  volToBase(v) { return this.imperial ? v * L_POR_GAL : v; },

  // Consumo — base: L/100km ; imperial: MPG
  consLabel() { return this.imperial ? 'MPG' : 'L/100km'; },
  consToUser(lp100) {
    if (!this.imperial) return lp100;
    return lp100 > 0 ? MPG_FACTOR / lp100 : 0;
  },
  consToBase(v) {
    if (!this.imperial) return v;
    return v > 0 ? MPG_FACTOR / v : 0;
  },

  // Precio del combustible — base: por litro ; imperial: por galón
  priceLabel() { return this.imperial ? '/gal' : '/L'; },
  precioDefecto() { return this.imperial ? 3.20 : (CONFIG.PRECIO_COMBUSTIBLE || 1.65); },

  // Etiqueta para el botón conmutador
  botonTexto() { return this.imperial ? 'MI' : 'KM'; }
};
