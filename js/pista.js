// pista.js — Modo Pista: tacómetro digital a pantalla completa + vueltas.
// Se abre con el botón 🏁 mientras conduces (la grabación sigue igual por
// debajo; esto es solo otra forma de VER los datos, estilo salpicadero racing).
// Datos: velocidad GPS en un dial de 240° con color verde→rojo, inclinación
// con su lado (izquierda/derecha), cronómetro de vuelta manual y 4 tarjetas
// (distancia, tiempo, máx, media). Sin APIs nuevas: todo sale del GPS que ya usa app.js.
const Pista = {
  abierto: false,
  laps: [],            // tiempos de vuelta cerrados (ms)
  lapStart: 0,         // inicio de la vuelta actual (Date.now)
  mejor: 0,            // mejor vuelta (ms)
  _timer: null,
  _arc: 343.6,         // longitud del arco del dial (240° de r=82)
  _scale: 160,         // fondo de escala del dial (en unidades del usuario)
  _leanMax: 0,

  $(id) { return document.getElementById(id); },

  init() {
    const b = this.$('btn-pista');
    if (b) b.addEventListener('click', () => this.abrir());
    const x = this.$('pista-cerrar');
    if (x) x.addEventListener('click', () => this.cerrar());
    const lap = this.$('lap-btn');
    if (lap) lap.addEventListener('click', () => this.vuelta());
  },

  // Al empezar a grabar: vueltas a cero (la vuelta 1 arranca con la grabación)
  reset() {
    this.laps = [];
    this.mejor = 0;
    this._leanMax = 0;
    this.lapStart = Date.now();
    this._pintarLaps();
  },

  abrir() {
    // Escala del dial según las unidades del usuario (mph o km/h)
    this._scale = Units.imperial ? 160 : 240;
    this._ticks();
    this.$('pg-unit').textContent = Units.speedLabel();
    this.$('ps-dist-u').textContent = Units.distLabel();
    if (!this.lapStart) this.lapStart = Date.now();
    document.body.classList.add('pista');
    this.$('pista-overlay').style.display = 'flex';
    this.abierto = true;
    UI.vibrar(20);
    this._pintarLaps();
    // El crono de vuelta corre en décimas → refresco propio de 100 ms
    this._timer = setInterval(() => this._lapTick(), 100);
    this._lapTick();
  },

  cerrar(fin) {
    this.abierto = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    const o = this.$('pista-overlay');
    if (o) o.style.display = 'none';
    document.body.classList.remove('pista');
    if (fin) this.lapStart = 0;   // al parar la grabación, el crono muere
  },

  // Botón VUELTA: cierra la vuelta actual y arranca la siguiente
  vuelta() {
    if (!this.lapStart) return;
    const t = Date.now() - this.lapStart;
    if (t < 3000) return;         // anti doble-toque con guantes
    this.laps.push(t);
    if (!this.mejor || t < this.mejor) this.mejor = t;
    this.lapStart = Date.now();
    UI.vibrar([40, 40, 40]);
    this._pintarLaps();
  },

  _pintarLaps() {
    const n = this.$('lap-n'), ult = this.$('lap-ult'), mej = this.$('lap-mejor');
    if (n) n.textContent = this.laps.length + 1;
    if (ult) ult.textContent = this.laps.length ? this.fmtLap(this.laps[this.laps.length - 1]) : '—';
    if (mej) mej.textContent = this.mejor ? this.fmtLap(this.mejor) : '—';
  },

  fmtLap(ms) {
    const t = Math.max(0, ms);
    const m = Math.floor(t / 60000);
    const s = Math.floor((t % 60000) / 1000);
    const d = Math.floor((t % 1000) / 100);
    return `${m}:${String(s).padStart(2, '0')}.${d}`;
  },

  _lapTick() {
    if (!this.abierto || !this.lapStart) return;
    this.$('lap-time').textContent = this.fmtLap(Date.now() - this.lapStart);
  },

  // Llamado por app.js con cada posición GPS (vel/max en km/h, dist en m, lean en °)
  onVel(d) {
    if (!this.abierto) return;
    const v = Units.speedToUser(d.vel);
    this.$('pg-vel').textContent = Math.round(v);
    const f = Math.min(Math.max(v / this._scale, 0), 1);
    this.$('pg-fill').style.strokeDashoffset = (this._arc * (1 - f)).toFixed(1);
    const vmax = Math.round(Units.speedToUser(d.max));
    this.$('pg-max').textContent = vmax;
    this.$('ps-max').textContent = vmax;
    this.$('ps-dist').textContent = Units.distToUser(d.dist / 1000).toFixed(2);

    // Inclinación: barra desde el centro hacia el lado de la curva
    const lean = Math.round(d.lean);
    if (lean > this._leanMax) this._leanMax = lean;
    this.$('pl-val').textContent = lean + '°';
    this.$('pl-max').textContent = i18n.t('max') + ' ' + this._leanMax + '°';
    const fill = this.$('pl-fill');
    const mitad = Math.min(lean / 60, 1) * 50;   // 60° = barra llena hasta el borde
    if (d.signo >= 0) { fill.style.left = '50%'; fill.style.right = 'auto'; }
    else { fill.style.right = '50%'; fill.style.left = 'auto'; }
    fill.style.width = mitad + '%';
  },

  // Llamado por app.js cada segundo (tiempo de sesión y media en km/h)
  onTiempo(seg, mediaKmh) {
    if (!this.abierto) return;
    this.$('ps-tiempo').textContent = fmtTiempo(seg);
    this.$('ps-media').textContent = Math.round(Units.speedToUser(mediaKmh));
  },

  // Marcas y números del dial (se regeneran al abrir, por si cambian las unidades)
  _ticks() {
    const g = this.$('pg-ticks');
    if (!g) return;
    const cx = 100, cy = 100;
    let out = '';
    for (let i = 0; i <= 8; i++) {
      const f = i / 8;
      const a = (150 + 240 * f) * Math.PI / 180;
      const cos = Math.cos(a), sin = Math.sin(a);
      const mayor = i % 2 === 0;
      const r1 = mayor ? 60 : 63, r2 = 69;
      out += `<line x1="${(cx + r1 * cos).toFixed(1)}" y1="${(cy + r1 * sin).toFixed(1)}"`
           + ` x2="${(cx + r2 * cos).toFixed(1)}" y2="${(cy + r2 * sin).toFixed(1)}"`
           + ` stroke="rgba(233,237,244,${mayor ? 0.55 : 0.25})" stroke-width="${mayor ? 2 : 1.2}" stroke-linecap="round"/>`;
      if (mayor) {
        const rl = 47;
        out += `<text x="${(cx + rl * cos).toFixed(1)}" y="${(cy + rl * sin + 3).toFixed(1)}"`
             + ` text-anchor="middle" fill="rgba(233,237,244,0.5)" font-size="10"`
             + ` font-family="Rajdhani, Inter, sans-serif" font-weight="600">${Math.round(this._scale * f)}</text>`;
      }
    }
    g.innerHTML = out;
  }
};
