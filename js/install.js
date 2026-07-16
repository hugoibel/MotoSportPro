// install.js — Guía para instalar MotoSportPro como app (PWA)
// iOS/Safari: instalación manual (Compartir → Añadir a inicio); no hay prompt automático.
// Android/Chrome/Edge: usa el evento beforeinstallprompt → botón "Instalar" nativo.
const Install = {
  deferredPrompt: null,
  DIAS_SILENCIO: 14, // tras cerrar el aviso, no volver a molestar en 14 días

  yaInstalada() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
  },

  silenciado() {
    const t = Number(localStorage.getItem('msp_install_dismiss') || 0);
    return t && (Date.now() - t) < this.DIAS_SILENCIO * 24 * 60 * 60 * 1000;
  },

  esIOS() {
    const ua = navigator.userAgent || '';
    // iPhone/iPod/iPad clásico + iPad moderno (se identifica como Mac con pantalla táctil)
    return /iphone|ipad|ipod/i.test(ua)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },

  init() {
    if (this.yaInstalada() || this.silenciado()) return;
    const banner = document.getElementById('install-banner');
    if (!banner) return;

    const cerrar = document.getElementById('install-close');
    if (cerrar) cerrar.addEventListener('click', () => this.dismiss());

    // Android / escritorio: prompt de instalación nativo
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.mostrar('android');
    });
    const btn = document.getElementById('install-btn');
    if (btn) btn.addEventListener('click', async () => {
      if (!this.deferredPrompt) return;
      this.deferredPrompt.prompt();
      try { await this.deferredPrompt.userChoice; } catch (_) {}
      this.deferredPrompt = null;
      this.ocultar();
    });
    window.addEventListener('appinstalled', () => {
      this.ocultar();
      localStorage.setItem('msp_install_dismiss', String(Date.now()));
    });

    // iOS: no hay prompt → guía manual (con un pequeño retardo para no molestar al abrir)
    if (this.esIOS()) {
      setTimeout(() => { if (!this.yaInstalada()) this.mostrar('ios'); }, 2500);
    }
  },

  mostrar(tipo) {
    const banner = document.getElementById('install-banner');
    if (!banner) return;
    const ios = document.getElementById('install-ios');
    const android = document.getElementById('install-android');
    const btn = document.getElementById('install-btn');
    if (ios) ios.style.display = tipo === 'ios' ? '' : 'none';
    if (android) android.style.display = tipo === 'android' ? '' : 'none';
    if (btn) btn.style.display = tipo === 'android' ? '' : 'none';
    banner.style.display = 'flex';
  },

  ocultar() {
    const banner = document.getElementById('install-banner');
    if (banner) banner.style.display = 'none';
  },

  dismiss() {
    this.ocultar();
    localStorage.setItem('msp_install_dismiss', String(Date.now()));
  }
};

document.addEventListener('DOMContentLoaded', () => Install.init());
