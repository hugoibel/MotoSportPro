// ============================================================
//  CLIMA — Open-Meteo (gratis, sin clave, CORS abierto).
//  Chip en la pantalla Conducir: temperatura + icono del cielo.
//  Tocar el chip → probabilidad de lluvia de las próximas horas.
//  Antes de salir en moto, la lluvia es lo que más importa.
// ============================================================

const Weather = {
  datos: null,        // { temp, code, probLluvia }
  _timer: null,
  _pos: null,

  // La llama app.js cuando consigue la posición; se refresca cada 30 min
  cargar(lat, lng) {
    this._pos = [lat, lng];
    this._pedir();
    clearInterval(this._timer);
    this._timer = setInterval(() => this._pedir(), 30 * 60 * 1000);
  },

  async _pedir() {
    if (!this._pos) return;
    try {
      const unidad = Units.imperial ? '&temperature_unit=fahrenheit' : '';
      const url = 'https://api.open-meteo.com/v1/forecast'
        + `?latitude=${this._pos[0]}&longitude=${this._pos[1]}`
        + '&current=temperature_2m,weather_code'
        + '&hourly=precipitation_probability&forecast_hours=3'
        + unidad + '&timezone=auto';
      const r = await fetch(url);
      const d = await r.json();
      const probs = (d.hourly && d.hourly.precipitation_probability) || [];
      this.datos = {
        temp: Math.round(d.current.temperature_2m),
        code: d.current.weather_code,
        probLluvia: probs.length ? Math.max(...probs) : 0
      };
      this._pintar();
    } catch (e) { /* sin internet: el chip simplemente no aparece */ }
  },

  // Icono según el código WMO de Open-Meteo
  _icono(code) {
    if (code === 0) return '☀️';
    if (code <= 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code <= 48) return '🌫️';
    if (code <= 67 || (code >= 80 && code <= 82)) return '🌧️';
    if (code <= 77 || (code >= 85 && code <= 86)) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  },

  _pintar() {
    const el = document.getElementById('weather-chip');
    if (!el || !this.datos) return;
    const d = this.datos;
    const lluvia = d.probLluvia >= 40 ? ` · 💧${d.probLluvia}%` : '';
    el.textContent = `${this._icono(d.code)} ${d.temp}°${lluvia}`;
    el.style.display = 'inline-flex';
  },

  init() {
    const el = document.getElementById('weather-chip');
    if (!el) return;
    el.addEventListener('click', () => {
      if (!this.datos) return;
      const d = this.datos;
      UI.toast(`${this._icono(d.code)} ${d.temp}°${Units.imperial ? 'F' : 'C'} · ` +
        i18n.t('clima_prob').replace('{p}', d.probLluvia), d.probLluvia >= 40 ? 'err' : 'ok');
    });
    // Si cambian las unidades (°C/°F) o el idioma, volver a pedir/pintar
    document.addEventListener('idioma-cambiado', () => this._pintar());
  },

  // Al alternar MI/KM hay que volver a pedir la temperatura en la otra escala
  refrescarUnidades() { if (this._pos) this._pedir(); }
};
