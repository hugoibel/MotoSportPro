// Almacenamiento local de rutas (localStorage).
// Cada ruta: { id, fecha, distanciaKm, duracionSeg, velMax, velMedia, puntos: [[lat,lng], ...] }

const STORAGE_KEY = 'motosportpro_rutas';

const Storage = {
  listarRutas() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },

  guardarRuta(ruta) {
    const rutas = this.listarRutas();
    rutas.unshift(ruta); // la más reciente primero
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rutas));
  },

  borrarRuta(id) {
    const rutas = this.listarRutas().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rutas));
  }
};
