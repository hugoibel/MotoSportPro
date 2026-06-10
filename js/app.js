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
let puntosSesion = [];

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

// --- Grabación ---
function iniciarGrabacion() {
  if (!('geolocation' in navigator)) { UI.toast(i18n.t('sin_gps'), 'err'); return; }
  UI.vibrar(30);
  grabando = true;
  distancia = 0; velMax = 0; ultimaPos = null; nPuntos = 0; puntosSesion = [];
  tiempoInicio = Date.now();
  document.body.classList.add('recording');
  Mapa.reset();

  $('btn-start').disabled = true;
  $('btn-stop').disabled = false;
  cronometro = setInterval(actualizarTiempo, 1000);
  pedirWakeLock();

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
  const { latitude, longitude, speed } = pos.coords;
  const punto = [latitude, longitude];
  if (ultimaPos) distancia += distanciaMetros(ultimaPos, punto);
  ultimaPos = punto;
  puntosSesion.push(punto);
  nPuntos++;

  let velMs = (speed != null && speed >= 0) ? speed : 0;
  if (velMs > velMax) velMax = velMs;

  Mapa.addPoint(latitude, longitude);

  // Guía giro a giro: actualizar banner y avisos de voz con cada posición
  if (typeof Nav !== 'undefined' && Nav.guiando) Nav.actualizarGuia(latitude, longitude);

  $('t-velocidad').textContent = Math.round(Units.speedToUser(velMs * 3.6));
  $('t-distancia').textContent = Units.distToUser(distancia / 1000).toFixed(2);
  $('t-maxima').textContent = Math.round(Units.speedToUser(velMax * 3.6));
}

function actualizarTiempo() {
  const seg = (Date.now() - tiempoInicio) / 1000;
  $('t-tiempo').textContent = fmtTiempo(seg);
  const horas = seg / 3600;
  const media = horas > 0 ? (distancia / 1000) / horas : 0;
  $('t-media').textContent = Math.round(Units.speedToUser(media));
}

// Actualiza las etiquetas de unidad de la pantalla Conducir (km/h ↔ mph, km ↔ mi)
function actualizarEtiquetas() {
  $('t-vel-unit').textContent = Units.speedLabel();
  $('t-dist-label').textContent = Units.distLabel();
  $('t-max-label').textContent = `${i18n.t('max')} ${Units.speedLabel()}`;
  $('t-media-label').textContent = `${i18n.t('media')} ${Units.speedLabel()}`;
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
  document.body.classList.remove('recording');
  document.body.classList.remove('driving');
  salirPantallaCompleta();
  if (typeof Nav !== 'undefined') Nav.cancelar();
  Mapa.invalidate();
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
  clearInterval(cronometro);
  liberarWakeLock();
  setGps('·', '');
  $('btn-start').disabled = false;
  $('btn-stop').disabled = true;

  const duracionSeg = (Date.now() - tiempoInicio) / 1000;
  const km = distancia / 1000;
  const media = duracionSeg > 0 ? km / (duracionSeg / 3600) : 0;

  if (nPuntos < 2) { UI.toast(i18n.t('corta'), 'err'); resetTelemetria(); return; }

  Storage.guardarRuta({
    id: Date.now().toString(),
    fecha: new Date().toISOString(),
    distanciaKm: +km.toFixed(2),
    duracionSeg: Math.round(duracionSeg),
    velMax: Math.round(velMax * 3.6),
    velMedia: Math.round(media),
    puntos: puntosSesion
  });
  UI.toast(`✅ ${i18n.t('guardada')}: ${Units.distToUser(km).toFixed(2)} ${Units.distLabel()} · ${fmtTiempo(duracionSeg)}`, 'ok');
  resetTelemetria();
}

function resetTelemetria() {
  Mapa.reset();
  $('t-velocidad').textContent = '0';
  $('t-distancia').textContent = '0.00';
  $('t-tiempo').textContent = '00:00';
  $('t-maxima').textContent = '0';
  $('t-media').textContent = '0';
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

function abrirRutaDetalle(r) {
  rutaAbierta = r;
  const m = $('ruta-modal');
  m.style.display = 'flex';
  requestAnimationFrame(() => m.classList.add('in'));
  $('rm-titulo').textContent = new Date(r.fecha).toLocaleString(i18n.lang, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  $('rm-stats').innerHTML = `
    <div><b>${Units.distToUser(r.distanciaKm).toFixed(2)}</b><span>${Units.distLabel()}</span></div>
    <div><b>${fmtTiempo(r.duracionSeg)}</b><span>${i18n.t('tiempo')}</span></div>
    <div><b>${Math.round(Units.speedToUser(r.velMax))}</b><span>${i18n.t('max')} ${Units.speedLabel()}</span></div>
    <div><b>${Math.round(Units.speedToUser(r.velMedia))}</b><span>${i18n.t('media')} ${Units.speedLabel()}</span></div>`;

  // El mapa del detalle siempre usa Leaflet (ya está cargado en la app)
  if (!rmMap) {
    rmMap = L.map('rm-map', { zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(rmMap);
  }
  [rmLine, rmIni, rmFin].forEach(c => { if (c) rmMap.removeLayer(c); });
  rmLine = rmIni = rmFin = null;
  const pts = r.puntos || [];
  if (pts.length) {
    rmLine = L.polyline(pts, { color: '#ff5c2a', weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(rmMap);
    rmIni = L.circleMarker(pts[0], { radius: 7, color: '#fff', weight: 2, fillColor: '#2ad17a', fillOpacity: 1 }).addTo(rmMap);
    rmFin = L.circleMarker(pts[pts.length - 1], { radius: 7, color: '#fff', weight: 2, fillColor: '#ff3b5c', fillOpacity: 1 }).addTo(rmMap);
  }
  setTimeout(() => {
    rmMap.invalidateSize();
    if (rmLine) { try { rmMap.fitBounds(rmLine.getBounds(), { padding: [30, 30] }); } catch (e) {} }
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

  // Detalle de ruta (mapa + GPX + borrar)
  $('rm-cerrar').addEventListener('click', cerrarRutaDetalle);
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
      pos => Mapa.center(pos.coords.latitude, pos.coords.longitude, 15),
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
