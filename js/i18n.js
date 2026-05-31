// ============================================================
//  TRADUCCIONES — 5 idiomas: es, en, de, fr, it
// ============================================================

const I18N = {
  es: {
    tab_grabar: 'Conducir', tab_rutas: 'Rutas', tab_tienda: 'Tienda', tab_premium: 'Premium',
    vel: 'km/h', dist: 'km', tiempo: 'tiempo', max: 'máx km/h', media: 'media km/h',
    iniciar: '▶ Iniciar', parar: '■ Parar y guardar',
    mis_rutas: 'Mis rutas', rutas_vacio: 'Aún no has grabado ninguna ruta.',
    tienda_titulo: 'Tienda de piezas y equipo',
    tienda_sub: 'Las mejores piezas para tu moto. Compra en Amazon o RevZilla.',
    ver_amazon: 'Ver en Amazon', ver_revzilla: 'Ver en RevZilla',
    premium_titulo: 'MotoSportPro Premium',
    premium_precio: 'al mes', premium_cta: 'Hazte Premium',
    premium_activo: '✅ Eres Premium. ¡Gracias por apoyar la app!',
    premium_f1: 'Rutas curvas inteligentes (las mejores carreteras)',
    premium_f2: 'Mapas sin conexión para viajes largos',
    premium_f3: 'Detección de caídas y aviso SOS automático',
    premium_f4: 'Estadísticas avanzadas e inclinación en curva',
    premium_f5: 'Sin anuncios y rutas ilimitadas',
    ajustes: 'Ajustes', idioma: 'Idioma',
    guardada: 'Ruta guardada', corta: 'Ruta demasiado corta para guardar.',
    sin_gps: 'Este dispositivo no tiene GPS disponible.',
    permiso_gps: 'Permiso de ubicación denegado. Actívalo para grabar.',
    borrar_ruta: '¿Borrar esta ruta?'
  },
  en: {
    tab_grabar: 'Ride', tab_rutas: 'Routes', tab_tienda: 'Shop', tab_premium: 'Premium',
    vel: 'km/h', dist: 'km', tiempo: 'time', max: 'max km/h', media: 'avg km/h',
    iniciar: '▶ Start', parar: '■ Stop & save',
    mis_rutas: 'My routes', rutas_vacio: 'You haven\'t recorded any route yet.',
    tienda_titulo: 'Parts & gear shop',
    tienda_sub: 'Best parts for your bike. Buy on Amazon or RevZilla.',
    ver_amazon: 'View on Amazon', ver_revzilla: 'View on RevZilla',
    premium_titulo: 'MotoSportPro Premium',
    premium_precio: 'per month', premium_cta: 'Go Premium',
    premium_activo: '✅ You are Premium. Thanks for supporting the app!',
    premium_f1: 'Smart curvy routes (the best roads)',
    premium_f2: 'Offline maps for long trips',
    premium_f3: 'Crash detection with automatic SOS',
    premium_f4: 'Advanced stats and lean angle',
    premium_f5: 'No ads and unlimited routes',
    ajustes: 'Settings', idioma: 'Language',
    guardada: 'Route saved', corta: 'Route too short to save.',
    sin_gps: 'This device has no GPS available.',
    permiso_gps: 'Location permission denied. Enable it to record.',
    borrar_ruta: 'Delete this route?'
  },
  de: {
    tab_grabar: 'Fahren', tab_rutas: 'Routen', tab_tienda: 'Shop', tab_premium: 'Premium',
    vel: 'km/h', dist: 'km', tiempo: 'Zeit', max: 'max km/h', media: 'Ø km/h',
    iniciar: '▶ Start', parar: '■ Stopp & speichern',
    mis_rutas: 'Meine Routen', rutas_vacio: 'Du hast noch keine Route aufgezeichnet.',
    tienda_titulo: 'Teile & Ausrüstung',
    tienda_sub: 'Beste Teile für dein Motorrad. Kaufe bei Amazon oder RevZilla.',
    ver_amazon: 'Bei Amazon ansehen', ver_revzilla: 'Bei RevZilla ansehen',
    premium_titulo: 'MotoSportPro Premium',
    premium_precio: 'pro Monat', premium_cta: 'Premium holen',
    premium_activo: '✅ Du bist Premium. Danke für die Unterstützung!',
    premium_f1: 'Intelligente Kurvenrouten (die besten Straßen)',
    premium_f2: 'Offline-Karten für lange Touren',
    premium_f3: 'Sturzerkennung mit automatischem SOS',
    premium_f4: 'Erweiterte Statistiken und Schräglage',
    premium_f5: 'Keine Werbung und unbegrenzte Routen',
    ajustes: 'Einstellungen', idioma: 'Sprache',
    guardada: 'Route gespeichert', corta: 'Route zu kurz zum Speichern.',
    sin_gps: 'Dieses Gerät hat kein GPS.',
    permiso_gps: 'Standortzugriff verweigert. Bitte aktivieren.',
    borrar_ruta: 'Diese Route löschen?'
  },
  fr: {
    tab_grabar: 'Rouler', tab_rutas: 'Trajets', tab_tienda: 'Boutique', tab_premium: 'Premium',
    vel: 'km/h', dist: 'km', tiempo: 'temps', max: 'max km/h', media: 'moy km/h',
    iniciar: '▶ Démarrer', parar: '■ Arrêter et enregistrer',
    mis_rutas: 'Mes trajets', rutas_vacio: 'Vous n\'avez encore enregistré aucun trajet.',
    tienda_titulo: 'Pièces et équipement',
    tienda_sub: 'Les meilleures pièces pour votre moto. Achetez sur Amazon ou RevZilla.',
    ver_amazon: 'Voir sur Amazon', ver_revzilla: 'Voir sur RevZilla',
    premium_titulo: 'MotoSportPro Premium',
    premium_precio: 'par mois', premium_cta: 'Passer Premium',
    premium_activo: '✅ Vous êtes Premium. Merci de soutenir l\'app !',
    premium_f1: 'Itinéraires sinueux intelligents (les meilleures routes)',
    premium_f2: 'Cartes hors ligne pour les longs trajets',
    premium_f3: 'Détection de chute avec SOS automatique',
    premium_f4: 'Statistiques avancées et angle d\'inclinaison',
    premium_f5: 'Sans publicité et trajets illimités',
    ajustes: 'Réglages', idioma: 'Langue',
    guardada: 'Trajet enregistré', corta: 'Trajet trop court pour être enregistré.',
    sin_gps: 'Cet appareil n\'a pas de GPS.',
    permiso_gps: 'Autorisation de localisation refusée. Activez-la.',
    borrar_ruta: 'Supprimer ce trajet ?'
  },
  it: {
    tab_grabar: 'Guida', tab_rutas: 'Percorsi', tab_tienda: 'Negozio', tab_premium: 'Premium',
    vel: 'km/h', dist: 'km', tiempo: 'tempo', max: 'max km/h', media: 'media km/h',
    iniciar: '▶ Avvia', parar: '■ Ferma e salva',
    mis_rutas: 'I miei percorsi', rutas_vacio: 'Non hai ancora registrato nessun percorso.',
    tienda_titulo: 'Ricambi ed equipaggiamento',
    tienda_sub: 'I migliori ricambi per la tua moto. Acquista su Amazon o RevZilla.',
    ver_amazon: 'Vedi su Amazon', ver_revzilla: 'Vedi su RevZilla',
    premium_titulo: 'MotoSportPro Premium',
    premium_precio: 'al mese', premium_cta: 'Passa a Premium',
    premium_activo: '✅ Sei Premium. Grazie per il supporto!',
    premium_f1: 'Percorsi tortuosi intelligenti (le strade migliori)',
    premium_f2: 'Mappe offline per i viaggi lunghi',
    premium_f3: 'Rilevamento cadute con SOS automatico',
    premium_f4: 'Statistiche avanzate e angolo di piega',
    premium_f5: 'Senza pubblicità e percorsi illimitati',
    ajustes: 'Impostazioni', idioma: 'Lingua',
    guardada: 'Percorso salvato', corta: 'Percorso troppo corto per salvarlo.',
    sin_gps: 'Questo dispositivo non ha il GPS.',
    permiso_gps: 'Permesso di posizione negato. Attivalo.',
    borrar_ruta: 'Eliminare questo percorso?'
  }
};

const NOMBRES_IDIOMA = { es: 'Español', en: 'English', de: 'Deutsch', fr: 'Français', it: 'Italiano' };

const i18n = {
  lang: 'es',

  init() {
    const guardado = localStorage.getItem('msp_idioma');
    const nav = (navigator.language || 'es').slice(0, 2);
    this.lang = guardado || (CONFIG.IDIOMAS.includes(nav) ? nav : CONFIG.IDIOMA_POR_DEFECTO);
    document.documentElement.lang = this.lang;
  },

  set(lang) {
    if (!I18N[lang]) return;
    this.lang = lang;
    localStorage.setItem('msp_idioma', lang);
    document.documentElement.lang = lang;
    this.aplicar();
  },

  t(clave) {
    return (I18N[this.lang] && I18N[this.lang][clave]) || I18N.es[clave] || clave;
  },

  // Sustituye el texto de todo elemento con data-i18n="clave"
  aplicar() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.dispatchEvent(new Event('idioma-cambiado'));
  }
};
