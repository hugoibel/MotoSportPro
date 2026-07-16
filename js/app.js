// ===== MotoSportPro — lógica principal =====

let grabando = false;
let watchId = null;
let distancia = 0;        // metros
let velMax = 0;           // m/s
let tiempoInicio = 0;
let cronometro = null;
let ultimaPos = null;
let nPuntos = 0;

// --- Utilidades ---
function distanciaMetros(a, b) {
  const R = 6371000;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180, lat2 = b[0] * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function fmtTiempo(seg) {
  const m = Math.floor(seg / 60), s = Math.floor(seg % 60), h = Math.floor(m / 60);
  const mm = (m % 60).toString().padStart(2, '0'), ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
const $ = id => document.getElementById(id);
const setGps = (txt, cls) => {
  const el = $('gps-status');
  el.textContent = 'GPS ' + txt;
  el.className = 'gps-badge' + (cls ? ' ' + cls : '');
};

// guardamos los puntos de la sesión para almacenarlos al parar
// (cada punto = [lat, lng, velocidad km/h] para colorear el recorrido después)
let puntosSesion = [];

// Auto-pausa: contamos aparte el tiempo EN MOVIMIENTO, así los semáforos
// y las paradas no hunden la velocidad media (como en las apps deportivas).
let segMov = 0, _ultVelKmh = 0, _ultFixT = 0;

// --- Inclinación (lean angle) calculada con el GPS ---
// Física de una curva coordinada: inclinación = atan(velocidad × giro / gravedad).
// No depende de cómo va montado el móvil (a diferencia del acelerómetro).
let leanMax = 0, leanSuave = 0, _leanHead = null, _leanT = 0;
let _leanSigno = 1;   // lado de la curva: +1 derecha, −1 izquierda (para el Modo Pista)
function calcularLean(velMs, heading, t) {
  if (heading == null || isNaN(heading) || velMs < 5) { _leanHead = null; return 0; } // <18 km/h: ruido
  if (_leanHead == null) { _leanHead = heading; _leanT = t; return 0; }
  const dt = (t - _leanT) / 1000;
  if (dt <= 0.2 || dt > 4) { _leanHead = heading; _leanT = t; return 0; }
  let dh = heading - _leanHead;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  _leanSigno = dh >= 0 ? 1 : -1;
  _leanHead = heading; _leanT = t;
  const omega = (dh * Math.PI / 180) / dt;                       // velocidad de giro (rad/s)
  const lean = Math.atan(Math.abs(velMs * omega) / 9.81) * 180 / Math.PI;
  return Math.min(lean, 65);
}

// --- Wake Lock: mantener la pantalla encendida mientras se graba ---
// Sin esto, al apagarse la pantalla el navegador suspende la app y la ruta
// deja de grabarse. Clave para uso real en moto (móvil en el soporte/bolsillo).
let wakeLock = null;
async function pedirWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch (e) { /* no soportado o denegado: la grabación sigue igualmente */ }
}
function liberarWakeLock() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

// --- Pantalla completa (modo navegación tipo Apple Maps) ---
function entrarPantallaCompleta() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req) { try { req.call(el).catch(() => {}); } catch (e) { /* iOS Safari no lo permite */ } }
}
function salirPantallaCompleta() {
  const sal = document.exitFullscreen || document.webkitExitFullscreen;
  if (sal && (document.fullscreenElement || document.webkitFullscreenElement)) {
    try { sal.call(document); } catch (e) { /* nada */ }
  }
}

// --- Alerta de velocidad (estilo Waze): voz + pitido si supero mi límite ---
// El límite se guarda en km/h (base) y se muestra/edita en las unidades del usuario.
let _velCtx = null, _velUltAviso = 0;
function velAlertaActiva() { return localStorage.getItem('msp_vel_on') === '1'; }
function velLimite() { return parseFloat(localStorage.getItem('msp_vel_lim')) || 0; }
function _pitido() {
  try {
    if (!_velCtx) return;
    const o = _velCtx.createOscillator(), g = _velCtx.createGain();
    o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.4;
    o.connect(g); g.connect(_velCtx.destination);
    o.start(); o.stop(_velCtx.currentTime + 0.18);
  } catch (e) { /* sin audio */ }
}
function _decirAlerta(txt) {
  try {
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = ({ es: 'es-ES', en: 'en-US', de: 'de-DE', fr: 'fr-FR', it: 'it-IT' })[i18n.lang] || 'en-US';
    speechSynthesis.speak(u);
  } catch (e) {}
}
function vigilarVelocidad(velKmh) {
  if (!velAlertaActiva() || velLimite() <= 0) return;
  const lim = velLimite();
  if (velKmh > lim) {
    document.body.classList.add('speeding');
    if (Date.now() - _velUltAviso > 20000) {       // re-avisar como mucho cada 20 s
      _velUltAviso = Date.now();
      _pitido();
      UI.vibrar([80, 60, 80]);
      _decirAlerta(i18n.t('vel_alerta_voz'));
    }
  } else if (velKmh < lim - 3) {                   // histéresis: no parpadear en el límite
    document.body.classList.remove('speeding');
  }
}

// --- Grabación ---
function iniciarGrabacion() {
  if (!('geolocation' in navigator)) { UI.toast(i18n.t('sin_gps'), 'err'); return; }
  UI.vibrar(30);
  grabando = true;
  distancia = 0; velMax = 0; ultimaPos = null; nPuntos = 0; puntosSesion = [];
  leanMax = 0; leanSuave = 0; _leanHead = null;
  segMov = 0; _ultVelKmh = 0; _ultFixT = 0;
  document.body.classList.remove('paused');
  tiempoInicio = Date.now();
  document.body.classList.add('recording');
  Mapa.reset();

  $('btn-start').disabled = true;
  $('btn-stop').disabled = false;
  cronometro = setInterval(actualizarTiempo, 1000);
  pedirWakeLock();
  // El audio del pitido de velocidad debe crearse desde el toque (iOS)
  if (velAlertaActiva()) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !_velCtx) _velCtx = new AC();
      if (_velCtx && _velCtx.state === 'suspended') _velCtx.resume();
    } catch (e) {}
  }
  _velUltAviso = 0;
  if (typeof SOS !== 'undefined') SOS.armar();   // vigilar caídas (acelerómetro)
  if (typeof Pista !== 'undefined') Pista.reset();   // la vuelta 1 arranca con la grabación

  // Modo navegación a pantalla completa (estilo Apple Maps)
  document.body.classList.add('driving');
  entrarPantallaCompleta();
  Mapa.invalidate();

  // Si hay un destino con ruta calculada, arranca la guía giro a giro por voz
  if (typeof Nav !== 'undefined' && Nav.destino && Nav.pasos) Nav.iniciarGuia();

  watchId = navigator.geolocation.watchPosition(onPosicion, onErrorGps, {
    enableHighAccuracy: true, maximumAge: 1000, timeout: 10000
  });
}

function onPosicion(pos) {
  setGps('●', 'ok');
  const { latitude, longitude, speed, heading } = pos.coords;
  const punto = [latitude, longitude];
  if (ultimaPos) distancia += distanciaMetros(ultimaPos, punto);
  ultimaPos = punto;
  nPuntos++;

  let velMs = (speed != null && speed >= 0) ? speed : 0;
  if (velMs > velMax) velMax = velMs;
  _ultVelKmh = velMs * 3.6; _ultFixT = Date.now();
  puntosSesion.push([latitude, longitude, +(velMs * 3.6).toFixed(1)]);

  // Inclinación en vivo (suavizada para que no baile)
  const lean = calcularLean(velMs, heading, pos.timestamp || Date.now());
  leanSuave = leanSuave * 0.6 + lean * 0.4;
  if (leanSuave > leanMax) leanMax = leanSuave;
  const lv = $('lean-val');
  if (lv) lv.textContent = Math.round(leanSuave) + '°';

  Mapa.addPoint(latitude, longitude, heading, velMs * 3.6);
  vigilarVelocidad(velMs * 3.6);

  // Guía giro a giro: actualizar banner y avisos de voz con cada posición
  if (typeof Nav !== 'undefined' && Nav.guiando) Nav.actualizarGuia(latitude, longitude);

  $('t-velocidad').textContent = Math.round(Units.speedToUser(velMs * 3.6));
  $('t-distancia').textContent = Units.distToUser(distancia / 1000).toFixed(2);
  $('t-maxima').textContent = Math.round(Units.speedToUser(velMax * 3.6));

  // Modo Pista: alimentar el tacómetro digital si está abierto
  if (typeof Pista !== 'undefined') {
    Pista.onVel({ vel: velMs * 3.6, max: velMax * 3.6, dist: distancia, lean: leanSuave, signo: _leanSigno });
  }
}

function actualizarTiempo() {
  const seg = (Date.now() - tiempoInicio) / 1000;
  $('t-tiempo').textContent = fmtTiempo(seg);
  // Solo cuenta como "en movimiento" si el GPS es reciente y hay velocidad real
  const moviendo = (Date.now() - _ultFixT < 4000) && _ultVelKmh > 4;
  if (moviendo) segMov++;
  marcarPausa(!moviendo && distancia > 40);   // hasta arrancar no molesta con "En pausa"
  const media = segMov > 0 ? (distancia / 1000) / (segMov / 3600) : 0;
  $('t-media').textContent = Math.round(Units.speedToUser(media));
  if (typeof Pista !== 'undefined') Pista.onTiempo(seg, media);
}

// Rótulo "Grabando" ↔ "En pausa" (punto rojo ↔ ámbar) según si te mueves
function marcarPausa(p) {
  if (document.body.classList.contains('paused') === p) return;
  document.body.classList.toggle('paused', p);
  const el = document.querySelector('.rec-pill [data-i18n]');
  if (el) el.textContent = i18n.t(p ? 'pausa' : 'grabando');
}

// Actualiza las etiquetas de unidad de la pantalla Conducir (km/h ↔ mph, km ↔ mi)
function actualizarEtiquetas() {
  $('t-vel-unit').textContent = Units.speedLabel();
  $('t-dist-label').textContent = Units.distLabel();
  $('t-max-label').textContent = `${i18n.t('max')} ${Units.speedLabel()}`;
  $('t-media-label').textContent = `${i18n.t('media')} ${Units.speedLabel()}`;
  const ll = $('lean-label');
  if (ll) ll.textContent = i18n.t('lean');
  const b = $('btn-unidades');
  if (b) b.textContent = Units.botonTexto();
}

function onErrorGps(err) {
  setGps('✕', 'err');
  if (err.code === 1) UI.toast(i18n.t('permiso_gps'), 'err');
}

function pararGrabacion() {
  UI.vibrar([30, 50, 30]);
  grabando = false;
  if (typeof Pista !== 'undefined') Pista.cerrar(true);   // cerrar el Modo Pista si estaba abierto
  document.body.classList.remove('recording');
  document.body.classList.remove('driving');
  document.body.classList.remove('speeding');
  document.body.classList.remove('paused');
  salirPantallaCompleta();
  if (typeof Nav !== 'undefined') Nav.cancelar();
  Mapa.invalidate();
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
  clearInterval(cronometro);
  liberarWakeLock();
  if (typeof SOS !== 'undefined') SOS.desarmar();
  setGps('·', '');
  $('btn-start').disabled = false;
  $('btn-stop').disabled = true;

  const duracionSeg = (Date.now() - tiempoInicio) / 1000;
  const km = distancia / 1000;
  // Velocidad media sobre el tiempo EN MOVIMIENTO (las paradas no cuentan)
  const media = segMov > 0 ? km / (segMov / 3600)
    : (duracionSeg > 0 ? km / (duracionSeg / 3600) : 0);

  if (nPuntos < 2) { UI.toast(i18n.t('corta'), 'err'); resetTelemetria(); return; }

  const ruta = {
    id: Date.now().toString(),
    fecha: new Date().toISOString(),
    distanciaKm: +km.toFixed(2),
    duracionSeg: Math.round(duracionSeg),
    movSeg: Math.round(segMov),
    velMax: Math.round(velMax * 3.6),
    velMedia: Math.round(media),
    leanMax: Math.round(leanMax),
    puntos: puntosSesion
  };
  Storage.guardarRuta(ruta);
  UI.toast(`✅ ${i18n.t('guardada')}: ${Units.distToUser(km).toFixed(2)} ${Units.distLabel()} · ${fmtTiempo(duracionSeg)}`, 'ok');
  resetTelemetria();
  // Resumen de la salida: se abre solo el detalle de la ruta recién guardada
  setTimeout(() => abrirRutaDetalle(ruta), 450);
}

function resetTelemetria() {
  Mapa.reset();
  $('t-velocidad').textContent = '0';
  $('t-distancia').textContent = '0.00';
  $('t-tiempo').textContent = '00:00';
  $('t-maxima').textContent = '0';
  $('t-media').textContent = '0';
  const lv = $('lean-val');
  if (lv) lv.textContent = '0°';
}

// --- Lista de rutas ---
function renderRutas() {
  const lista = $('lista-rutas'), vacio = $('rutas-vacio');
  const rutas = Storage.listarRutas();
  lista.innerHTML = '';
  vacio.style.display = rutas.length ? 'none' : 'block';
  renderResumenRutas(rutas);
  rutas.forEach(r => {
    const fecha = new Date(r.fecha).toLocaleString(i18n.lang, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    const li = document.createElement('li');
    li.className = 'route-card';
    li.innerHTML = `
      <button class="r-del" data-id="${r.id}" title="x">🗑️</button>
      <div class="r-fecha">${fecha}</div>
      <div class="r-stats">
        <span><b>${Units.distToUser(r.distanciaKm).toFixed(1)}</b> ${Units.distLabel()}</span>
        <span><b>${fmtTiempo(r.duracionSeg)}</b></span>
        <span><b>${Math.round(Units.speedToUser(r.velMax))}</b> ${i18n.t('max')} ${Units.speedLabel()}</span>
        <span><b>${Math.round(Units.speedToUser(r.velMedia))}</b> ${i18n.t('media')} ${Units.speedLabel()}</span>
      </div>`;
    // Tocar la tarjeta abre la ruta en el mapa
    li.addEventListener('click', () => abrirRutaDetalle(r));
    lista.appendChild(li);
  });
  lista.querySelectorAll('.r-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      UI.confirmar(i18n.t('borrar_ruta')).then(ok => {
        if (ok) { Storage.borrarRuta(btn.dataset.id); renderRutas(); }
      });
    });
  });
}

// Resumen de totales encima de la lista (salidas, distancia, tiempo, vel. máx)
function renderResumenRutas(rutas) {
  const el = $('rutas-resumen');
  if (!el) return;
  if (!rutas.length) { el.style.display = 'none'; return; }
  const totKm = rutas.reduce((s, r) => s + (r.distanciaKm || 0), 0);
  const totSeg = rutas.reduce((s, r) => s + (r.duracionSeg || 0), 0);
  const vmax = Math.max(...rutas.map(r => r.velMax || 0));
  el.style.display = 'grid';
  el.innerHTML = `
    <div><b>${rutas.length}</b><span>${i18n.t('tot_salidas')}</span></div>
    <div><b>${Units.distToUser(totKm).toFixed(0)}</b><span>${Units.distLabel()}</span></div>
    <div><b>${fmtTiempo(totSeg)}</b><span>${i18n.t('tiempo')}</span></div>
    <div><b>${Math.round(Units.speedToUser(vmax))}</b><span>${i18n.t('max')} ${Units.speedLabel()}</span></div>`;
}

// --- Detalle de ruta: mapa con el recorrido + exportar GPX ---
let rmMap = null, rmLine = null, rmIni = null, rmFin = null, rutaAbierta = null;
let rmTiles = null, rmTilesUrl = '';

function abrirRutaDetalle(r) {
  rutaAbierta = r;
  const m = $('ruta-modal');
  m.style.display = 'flex';
  requestAnimationFrame(() => m.classList.add('in'));
  $('rm-titulo').textContent = new Date(r.fecha).toLocaleString(i18n.lang, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const leanStat = (r.leanMax > 0)
    ? `<div><b>${r.leanMax}°</b><span>${i18n.t('lean')}</span></div>` : '';
  const movStat = (r.movSeg > 0 && r.movSeg < r.duracionSeg)
    ? `<div><b>${fmtTiempo(r.movSeg)}</b><span>${i18n.t('mov')}</span></div>` : '';
  $('rm-stats').innerHTML = `
    <div><b>${Units.distToUser(r.distanciaKm).toFixed(2)}</b><span>${Units.distLabel()}</span></div>
    <div><b>${fmtTiempo(r.duracionSeg)}</b><span>${i18n.t('tiempo')}</span></div>
    <div><b>${Math.round(Units.speedToUser(r.velMax))}</b><span>${i18n.t('max')} ${Units.speedLabel()}</span></div>
    <div><b>${Math.round(Units.speedToUser(r.velMedia))}</b><span>${i18n.t('media')} ${Units.speedLabel()}</span></div>
    ${movStat}${leanStat}`;

  // El mapa del detalle siempre usa Leaflet (ya está cargado en la app)
  if (!rmMap) {
    rmMap = L.map('rm-map', { zoomControl: false, attributionControl: false });
  }
  // Mismo estilo de mapa que el principal (y se actualiza si lo cambias en Ajustes)
  if (rmTilesUrl !== Mapa.tileUrl()) {
    if (rmTiles) rmMap.removeLayer(rmTiles);
    rmTilesUrl = Mapa.tileUrl();
    rmTiles = L.tileLayer(rmTilesUrl, { maxZoom: 19, subdomains: Mapa.tileSub() }).addTo(rmMap);
  }
  [rmLine, rmIni, rmFin].forEach(c => { if (c) rmMap.removeLayer(c); });
  rmLine = rmIni = rmFin = null;
  const pts = r.puntos || [];
  if (pts.length) {
    // Si los puntos traen velocidad (rutas nuevas), el recorrido se colorea
    // por tramos: verde = lento → amarillo → rojo = rápido. Si no, naranja.
    const conVel = pts[0].length >= 3;
    if (conVel && pts.length > 1) {
      const vmax = Math.max(...pts.map(p => p[2] || 0), 1);
      rmLine = L.layerGroup().addTo(rmMap);
      for (let i = 1; i < pts.length; i++) {
        const f = Math.min((pts[i][2] || 0) / vmax, 1);             // 0 = parado, 1 = vel. máx
        const color = `hsl(${Math.round(120 * (1 - f))}, 85%, 52%)`;
        L.polyline([[pts[i - 1][0], pts[i - 1][1]], [pts[i][0], pts[i][1]]],
          { color, weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(rmLine);
      }
    } else {
      rmLine = L.polyline(pts.map(p => [p[0], p[1]]),
        { color: '#ff5c2a', weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(rmMap);
    }
    rmIni = L.circleMarker([pts[0][0], pts[0][1]], { radius: 7, color: '#fff', weight: 2, fillColor: '#2ad17a', fillOpacity: 1 }).addTo(rmMap);
    rmFin = L.circleMarker([pts[pts.length - 1][0], pts[pts.length - 1][1]], { radius: 7, color: '#fff', weight: 2, fillColor: '#ff3b5c', fillOpacity: 1 }).addTo(rmMap);
  }
  setTimeout(() => {
    rmMap.invalidateSize();
    if (pts.length) {
      try { rmMap.fitBounds(L.latLngBounds(pts.map(p => [p[0], p[1]])), { padding: [30, 30] }); } catch (e) {}
    }
  }, 150);
}

function cerrarRutaDetalle() {
  const m = $('ruta-modal');
  m.classList.remove('in');
  setTimeout(() => { m.style.display = 'none'; }, 220);
  rutaAbierta = null;
}

// Genera un archivo GPX (estándar que entienden Google Maps, Garmin, Calimoto…)
function exportarGPX(r) {
  if (!r || !(r.puntos || []).length) { UI.toast(i18n.t('gpx_vacio'), 'err'); return; }
  const fecha = new Date(r.fecha).toISOString().slice(0, 16).replace('T', ' ');
  const pts = r.puntos.map(p => `      <trkpt lat="${p[0]}" lon="${p[1]}"></trkpt>`).join('\n');
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MotoSportPro" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>MotoSportPro ${fecha}</name>
    <trkseg>
${pts}
    </trkseg>
  </trk>
</gpx>`;
  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `motosportpro-${new Date(r.fecha).toISOString().slice(0, 10)}.gpx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  UI.toast(i18n.t('gpx_ok'), 'ok');
}

// Compartir el resumen de la salida (WhatsApp, SMS…) con la hoja nativa del
// móvil; si el navegador no la tiene, se copia al portapapeles.
async function compartirRuta(r) {
  if (!r) return;
  const fecha = new Date(r.fecha).toLocaleDateString(i18n.lang, { day: '2-digit', month: 'short', year: 'numeric' });
  const u = Units.speedLabel();
  const txt = `🏍️ MotoSportPro · ${fecha}\n`
    + `📏 ${Units.distToUser(r.distanciaKm).toFixed(1)} ${Units.distLabel()} · ⏱ ${fmtTiempo(r.duracionSeg)}\n`
    + `🚀 ${i18n.t('max')} ${Math.round(Units.speedToUser(r.velMax))} ${u} · ${i18n.t('media')} ${Math.round(Units.speedToUser(r.velMedia))} ${u}`
    + (r.leanMax > 0 ? ` · 🏍️ ${r.leanMax}°` : '')
    + `\nhttps://hugoibel.github.io/MotoSportPro/`;
  if (navigator.share) {
    try { await navigator.share({ text: txt }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; /* canceló: nada */ }
  }
  try {
    await navigator.clipboard.writeText(txt);
    UI.toast(i18n.t('share_copiado'), 'ok');
  } catch (e) { UI.toast(txt); }
}

// --- Ajustes → Mapa: estilo, marcador y alerta de velocidad ---
function initAjustesMapa() {
  // Chips de estilo del mapa (oscuro / día / clásico)
  const pintarEstilos = () => {
    document.querySelectorAll('#estilo-chips .chip').forEach(b =>
      b.classList.toggle('on', b.dataset.estilo === Mapa.estiloActual()));
  };
  document.querySelectorAll('#estilo-chips .chip').forEach(b => {
    b.addEventListener('click', () => { Mapa.setEstilo(b.dataset.estilo); pintarEstilos(); });
  });
  pintarEstilos();

  // Chips del marcador (emoji / flecha / moto)
  const pintarMk = () => {
    document.querySelectorAll('#marcador-chips .chip').forEach(b =>
      b.classList.toggle('on', b.dataset.mk === Mapa.marcadorTipo()));
  };
  document.querySelectorAll('#marcador-chips .chip').forEach(b => {
    b.addEventListener('click', () => {
      localStorage.setItem('msp_marcador', b.dataset.mk);
      Mapa.refrescarMarcador();
      pintarMk();
    });
  });
  pintarMk();

  // Alerta de velocidad: toggle + límite en las unidades del usuario
  const chk = $('vel-on'), inp = $('vel-lim');
  if (chk) {
    chk.checked = velAlertaActiva();
    chk.addEventListener('change', () => localStorage.setItem('msp_vel_on', chk.checked ? '1' : '0'));
  }
  if (inp) {
    const lim = velLimite();
    if (lim > 0) inp.value = Math.round(Units.speedToUser(lim));
    inp.addEventListener('change', () => {
      const v = parseFloat(inp.value);
      if (v > 0) localStorage.setItem('msp_vel_lim', Units.imperial ? v / 0.621371 : v);
      else localStorage.removeItem('msp_vel_lim');
    });
  }
  actualizarVelUnidad();
}

// Etiqueta y valor del límite al alternar MI/KM
function actualizarVelUnidad() {
  const u = $('vel-unit'), inp = $('vel-lim');
  if (u) u.textContent = Units.speedLabel();
  if (inp) {
    const lim = velLimite();
    inp.value = lim > 0 ? Math.round(Units.speedToUser(lim)) : '';
    inp.placeholder = Units.imperial ? '70' : '110';
  }
}

// --- Navegación entre vistas ---
const TAB_VIEWS = ['grabar', 'gasolina', 'moto', 'eventos', 'tienda'];
let vistaTab = 'grabar';  // última pestaña real, para el botón "Volver"

function cambiarVista(nombre) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const view = $('view-' + nombre);
  view.classList.add('active');
  view.scrollTop = 0;
  const tabEl = document.querySelector(`.tab[data-view="${nombre}"]`);
  if (tabEl) tabEl.classList.add('active');
  if (TAB_VIEWS.includes(nombre)) vistaTab = nombre;

  if (nombre === 'rutas') renderRutas();
  else if (nombre === 'tienda') Store.render();
  else if (nombre === 'premium') Premium.render();
  else if (nombre === 'gasolina') Fuel.render();
  else if (nombre === 'moto') Garage.render();
  else if (nombre === 'eventos') Eventos.render();
  else if (nombre === 'grabar') Mapa.invalidate();
}

// --- Arranque ---
window.addEventListener('DOMContentLoaded', async () => {
  i18n.init();
  i18n.aplicar();
  Units.init();
  actualizarEtiquetas();

  await Mapa.init('map');

  $('btn-start').addEventListener('click', iniciarGrabacion);
  $('btn-stop').addEventListener('click', pararGrabacion);
  $('btn-premium').addEventListener('click', () => Premium.comprar());

  // Navegación: buscador de destino + "Comenzar navegación" (arranca la grabación)
  Nav.init();
  $('nav-start').addEventListener('click', () => iniciarGrabacion());

  // Clima (chip con temperatura + lluvia)
  Weather.init();

  // Modo Pista (tacómetro digital + vueltas)
  if (typeof Pista !== 'undefined') Pista.init();

  // Botón "Re-centrar" (aparece al arrastrar el mapa mientras conduces)
  $('btn-recentrar').addEventListener('click', () => Mapa.recentrar());

  // Ajustes (SOS + mapas sin conexión)
  SOS.init();
  Offline.init();
  initAjustesMapa();
  $('btn-ajustes').addEventListener('click', () => {
    const m = $('ajustes-modal');
    m.style.display = 'flex';
    requestAnimationFrame(() => m.classList.add('in'));
    Offline.refrescarEstado();
  });
  const cerrarAjustes = () => {
    const m = $('ajustes-modal');
    m.classList.remove('in');
    setTimeout(() => { m.style.display = 'none'; }, 220);
  };
  $('aj-cerrar').addEventListener('click', cerrarAjustes);
  $('ajustes-modal').addEventListener('click', e => { if (e.target === $('ajustes-modal')) cerrarAjustes(); });

  // Detalle de ruta (mapa + GPX + borrar)
  $('rm-cerrar').addEventListener('click', cerrarRutaDetalle);
  $('rm-share').addEventListener('click', () => compartirRuta(rutaAbierta));
  $('rm-gpx').addEventListener('click', () => exportarGPX(rutaAbierta));
  $('rm-borrar').addEventListener('click', () => {
    if (!rutaAbierta) return;
    UI.confirmar(i18n.t('borrar_ruta')).then(ok => {
      if (ok) { Storage.borrarRuta(rutaAbierta.id); cerrarRutaDetalle(); renderRutas(); }
    });
  });
  $('ruta-modal').addEventListener('click', e => { if (e.target === $('ruta-modal')) cerrarRutaDetalle(); });

  // Copia de seguridad de fotos (exportar / importar)
  $('btn-export').addEventListener('click', () => Backup.exportar());
  $('btn-import').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', e => {
    if (e.target.files[0]) Backup.importar(e.target.files[0]);
  });

  // Conmutador de unidades MI / KM
  $('btn-unidades').addEventListener('click', () => {
    Units.toggle();
    actualizarEtiquetas();
    Weather.refrescarUnidades();   // la temperatura cambia de °C a °F
    actualizarVelUnidad();         // el límite de velocidad cambia de km/h a mph
    const activa = document.querySelector('.view.active');
    if (activa) cambiarVista(activa.id.replace('view-', ''));
  });

  // Navegación: todo elemento con data-view cambia de vista.
  // El botón "Volver" regresa a la última pestaña real.
  document.querySelectorAll('[data-view]').forEach(el => {
    if (el.classList.contains('btn-back')) {
      el.addEventListener('click', () => cambiarVista(vistaTab));
    } else {
      el.addEventListener('click', () => cambiarVista(el.dataset.view));
    }
  });

  // Selector de idioma
  const sel = $('selector-idioma');
  CONFIG.IDIOMAS.forEach(l => {
    const o = document.createElement('option');
    o.value = l; o.textContent = NOMBRES_IDIOMA[l] || l;
    if (l === i18n.lang) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', e => {
    i18n.set(e.target.value);
    actualizarEtiquetas();
    // re-renderiza la vista activa para traducir su contenido dinámico
    const activa = document.querySelector('.view.active');
    if (activa) cambiarVista(activa.id.replace('view-', ''));
  });

  Premium.render();

  // Centrar en posición actual al abrir
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        Mapa.center(pos.coords.latitude, pos.coords.longitude, 15);
        Weather.cargar(pos.coords.latitude, pos.coords.longitude);
      },
      () => setGps('·', ''),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW:', e));
  }

  // Si volvemos a la app y seguimos grabando, re-activar la pantalla encendida.
  document.addEventListener('visibilitychange', () => {
    if (grabando && wakeLock === null && document.visibilityState === 'visible') pedirWakeLock();
  });
});
