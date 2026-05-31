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

// --- Grabación ---
function iniciarGrabacion() {
  if (!('geolocation' in navigator)) { alert(i18n.t('sin_gps')); return; }
  grabando = true;
  distancia = 0; velMax = 0; ultimaPos = null; nPuntos = 0; puntosSesion = [];
  tiempoInicio = Date.now();
  document.body.classList.add('recording');
  Mapa.reset();

  $('btn-start').disabled = true;
  $('btn-stop').disabled = false;
  cronometro = setInterval(actualizarTiempo, 1000);

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
  if (err.code === 1) alert(i18n.t('permiso_gps'));
}

function pararGrabacion() {
  grabando = false;
  document.body.classList.remove('recording');
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
  clearInterval(cronometro);
  setGps('·', '');
  $('btn-start').disabled = false;
  $('btn-stop').disabled = true;

  const duracionSeg = (Date.now() - tiempoInicio) / 1000;
  const km = distancia / 1000;
  const media = duracionSeg > 0 ? km / (duracionSeg / 3600) : 0;

  if (nPuntos < 2) { alert(i18n.t('corta')); resetTelemetria(); return; }

  Storage.guardarRuta({
    id: Date.now().toString(),
    fecha: new Date().toISOString(),
    distanciaKm: +km.toFixed(2),
    duracionSeg: Math.round(duracionSeg),
    velMax: Math.round(velMax * 3.6),
    velMedia: Math.round(media),
    puntos: puntosSesion
  });
  alert(`${i18n.t('guardada')}: ${Units.distToUser(km).toFixed(2)} ${Units.distLabel()} · ${fmtTiempo(duracionSeg)}`);
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
    lista.appendChild(li);
  });
  lista.querySelectorAll('.r-del').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm(i18n.t('borrar_ruta'))) { Storage.borrarRuta(btn.dataset.id); renderRutas(); }
    });
  });
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
});
