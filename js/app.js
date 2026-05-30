// ===== MotoSportPro — lógica principal =====

// --- Estado de la sesión de grabación ---
let grabando = false;
let watchId = null;
let puntos = [];          // [[lat, lng], ...]
let distancia = 0;        // metros acumulados
let velMax = 0;           // m/s
let tiempoInicio = 0;
let cronometro = null;
let ultimaPos = null;

// --- Mapa ---
let map, traza, marcador;

function initMapa() {
  map = L.map('map', { zoomControl: false, attributionControl: false })
    .setView([40.4168, -3.7038], 13); // Madrid por defecto
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);
  traza = L.polyline([], { color: '#ff5c2a', weight: 5 }).addTo(map);
}

// --- Utilidades ---
function distanciaMetros(a, b) {
  // Haversine
  const R = 6371000;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function fmtTiempo(seg) {
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  const h = Math.floor(m / 60);
  const mm = (m % 60).toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const setGps = (txt, cls) => {
  const el = document.getElementById('gps-status');
  el.textContent = 'GPS ' + txt;
  el.className = 'gps-badge' + (cls ? ' ' + cls : '');
};

// --- Grabación ---
function iniciarGrabacion() {
  if (!('geolocation' in navigator)) {
    alert('Este dispositivo no tiene GPS / geolocalización disponible.');
    return;
  }
  grabando = true;
  puntos = [];
  distancia = 0;
  velMax = 0;
  ultimaPos = null;
  tiempoInicio = Date.now();
  traza.setLatLngs([]);

  document.getElementById('btn-start').disabled = true;
  document.getElementById('btn-stop').disabled = false;

  cronometro = setInterval(actualizarTiempo, 1000);

  watchId = navigator.geolocation.watchPosition(onPosicion, onErrorGps, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 10000
  });
}

function onPosicion(pos) {
  setGps('●', 'ok');
  const { latitude, longitude, speed } = pos.coords;
  const punto = [latitude, longitude];

  if (ultimaPos) {
    distancia += distanciaMetros(ultimaPos, punto);
  }
  ultimaPos = punto;
  puntos.push(punto);

  // Velocidad: usa la del GPS si existe (m/s), si no se infiere por tiempo/distancia
  let velMs = (speed != null && speed >= 0) ? speed : 0;
  if (velMs > velMax) velMax = velMs;

  // Pintar en el mapa
  traza.addLatLng(punto);
  if (!marcador) {
    marcador = L.circleMarker(punto, { radius: 7, color: '#fff', fillColor: '#ff5c2a', fillOpacity: 1 }).addTo(map);
  } else {
    marcador.setLatLng(punto);
  }
  map.setView(punto, Math.max(map.getZoom(), 15));

  // Refrescar telemetría
  document.getElementById('t-velocidad').textContent = Math.round(velMs * 3.6);
  document.getElementById('t-distancia').textContent = (distancia / 1000).toFixed(2);
  document.getElementById('t-maxima').textContent = Math.round(velMax * 3.6);
}

function actualizarTiempo() {
  const seg = (Date.now() - tiempoInicio) / 1000;
  document.getElementById('t-tiempo').textContent = fmtTiempo(seg);
  const km = distancia / 1000;
  const horas = seg / 3600;
  const media = horas > 0 ? km / horas : 0;
  document.getElementById('t-media').textContent = Math.round(media);
}

function onErrorGps(err) {
  console.warn('Error GPS:', err);
  setGps('✕', 'err');
  if (err.code === 1) {
    alert('Permiso de ubicación denegado. Actívalo para grabar la ruta.');
  }
}

function pararGrabacion() {
  grabando = false;
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
  clearInterval(cronometro);
  setGps('·', '');

  document.getElementById('btn-start').disabled = false;
  document.getElementById('btn-stop').disabled = true;

  const duracionSeg = (Date.now() - tiempoInicio) / 1000;
  const km = distancia / 1000;
  const media = duracionSeg > 0 ? km / (duracionSeg / 3600) : 0;

  if (puntos.length < 2) {
    alert('Ruta demasiado corta para guardar (no se registró movimiento).');
    resetTelemetria();
    return;
  }

  Storage.guardarRuta({
    id: Date.now().toString(),
    fecha: new Date().toISOString(),
    distanciaKm: +km.toFixed(2),
    duracionSeg: Math.round(duracionSeg),
    velMax: Math.round(velMax * 3.6),
    velMedia: Math.round(media),
    puntos
  });

  alert(`Ruta guardada: ${km.toFixed(2)} km en ${fmtTiempo(duracionSeg)}`);
  resetTelemetria();
}

function resetTelemetria() {
  if (marcador) { map.removeLayer(marcador); marcador = null; }
  document.getElementById('t-velocidad').textContent = '0';
  document.getElementById('t-distancia').textContent = '0.00';
  document.getElementById('t-tiempo').textContent = '00:00';
  document.getElementById('t-maxima').textContent = '0';
  document.getElementById('t-media').textContent = '0';
}

// --- Lista de rutas ---
function renderRutas() {
  const lista = document.getElementById('lista-rutas');
  const vacio = document.getElementById('rutas-vacio');
  const rutas = Storage.listarRutas();
  lista.innerHTML = '';
  vacio.style.display = rutas.length ? 'none' : 'block';

  rutas.forEach(r => {
    const fecha = new Date(r.fecha).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    const li = document.createElement('li');
    li.className = 'route-card';
    li.innerHTML = `
      <button class="r-del" data-id="${r.id}" title="Borrar">🗑️</button>
      <div class="r-fecha">${fecha}</div>
      <div class="r-stats">
        <span><b>${r.distanciaKm}</b> km</span>
        <span><b>${fmtTiempo(r.duracionSeg)}</b></span>
        <span><b>${r.velMax}</b> máx km/h</span>
        <span><b>${r.velMedia}</b> media km/h</span>
      </div>`;
    lista.appendChild(li);
  });

  lista.querySelectorAll('.r-del').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('¿Borrar esta ruta?')) {
        Storage.borrarRuta(btn.dataset.id);
        renderRutas();
      }
    });
  });
}

// --- Navegación entre vistas ---
function cambiarVista(nombre) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('view-' + nombre).classList.add('active');
  document.querySelector(`.tab[data-view="${nombre}"]`).classList.add('active');
  if (nombre === 'rutas') renderRutas();
  if (nombre === 'grabar') setTimeout(() => map.invalidateSize(), 100);
}

// --- Arranque ---
window.addEventListener('DOMContentLoaded', () => {
  initMapa();

  document.getElementById('btn-start').addEventListener('click', iniciarGrabacion);
  document.getElementById('btn-stop').addEventListener('click', pararGrabacion);
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => cambiarVista(t.dataset.view));
  });

  // Centrar el mapa en la posición actual al abrir (sin grabar todavía)
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      pos => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
      () => setGps('·', ''),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // Registrar service worker (PWA)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW:', e));
  }
});
