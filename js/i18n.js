// ============================================================
//  TRADUCCIONES — 5 idiomas: es, en, de, fr, it
// ============================================================

const I18N = {
  es: {
    tab_grabar: 'Conducir', tab_rutas: 'Rutas', tab_tienda: 'Tienda', tab_premium: 'Premium',
    vel: 'km/h', dist: 'km', tiempo: 'tiempo', max: 'máx', media: 'media',
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
    guardada: 'Ruta guardada', corta: 'Ruta demasiado corta para guardar.', grabando: 'Grabando',
    nav_buscar: '¿A dónde quieres ir?', nav_comenzar: 'Comenzar navegación', nav_buscando: 'Buscando…',
    nav_sin_resultados: 'Sin resultados', nav_error: 'No se pudo calcular la ruta', nav_min: 'min',
    sin_gps: 'Este dispositivo no tiene GPS disponible.',
    permiso_gps: 'Permiso de ubicación denegado. Actívalo para grabar.',
    borrar_ruta: '¿Borrar esta ruta?'
  },
  en: {
    tab_grabar: 'Ride', tab_rutas: 'Routes', tab_tienda: 'Shop', tab_premium: 'Premium',
    vel: 'km/h', dist: 'km', tiempo: 'time', max: 'max', media: 'avg',
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
    guardada: 'Route saved', corta: 'Route too short to save.', grabando: 'Recording',
    nav_buscar: 'Where do you want to go?', nav_comenzar: 'Start navigation', nav_buscando: 'Searching…',
    nav_sin_resultados: 'No results', nav_error: 'Could not get the route', nav_min: 'min',
    sin_gps: 'This device has no GPS available.',
    permiso_gps: 'Location permission denied. Enable it to record.',
    borrar_ruta: 'Delete this route?'
  },
  de: {
    tab_grabar: 'Fahren', tab_rutas: 'Routen', tab_tienda: 'Shop', tab_premium: 'Premium',
    vel: 'km/h', dist: 'km', tiempo: 'Zeit', max: 'max', media: 'Ø',
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
    guardada: 'Route gespeichert', corta: 'Route zu kurz zum Speichern.', grabando: 'Aufnahme',
    nav_buscar: 'Wohin möchtest du?', nav_comenzar: 'Navigation starten', nav_buscando: 'Suche…',
    nav_sin_resultados: 'Keine Ergebnisse', nav_error: 'Route konnte nicht berechnet werden', nav_min: 'Min',
    sin_gps: 'Dieses Gerät hat kein GPS.',
    permiso_gps: 'Standortzugriff verweigert. Bitte aktivieren.',
    borrar_ruta: 'Diese Route löschen?'
  },
  fr: {
    tab_grabar: 'Rouler', tab_rutas: 'Trajets', tab_tienda: 'Boutique', tab_premium: 'Premium',
    vel: 'km/h', dist: 'km', tiempo: 'temps', max: 'max', media: 'moy',
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
    guardada: 'Trajet enregistré', corta: 'Trajet trop court pour être enregistré.', grabando: 'Enregistrement',
    nav_buscar: 'Où veux-tu aller ?', nav_comenzar: 'Démarrer la navigation', nav_buscando: 'Recherche…',
    nav_sin_resultados: 'Aucun résultat', nav_error: 'Impossible de calculer l\'itinéraire', nav_min: 'min',
    sin_gps: 'Cet appareil n\'a pas de GPS.',
    permiso_gps: 'Autorisation de localisation refusée. Activez-la.',
    borrar_ruta: 'Supprimer ce trajet ?'
  },
  it: {
    tab_grabar: 'Guida', tab_rutas: 'Percorsi', tab_tienda: 'Negozio', tab_premium: 'Premium',
    vel: 'km/h', dist: 'km', tiempo: 'tempo', max: 'max', media: 'media',
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
    guardada: 'Percorso salvato', corta: 'Percorso troppo corto per salvarlo.', grabando: 'Registrazione',
    nav_buscar: 'Dove vuoi andare?', nav_comenzar: 'Avvia navigazione', nav_buscando: 'Ricerca…',
    nav_sin_resultados: 'Nessun risultato', nav_error: 'Impossibile calcolare il percorso', nav_min: 'min',
    sin_gps: 'Questo dispositivo non ha il GPS.',
    permiso_gps: 'Permesso di posizione negato. Attivalo.',
    borrar_ruta: 'Eliminare questo percorso?'
  }
};

// --- Traducciones de las secciones Gasolina / Mi Moto / Eventos ---
Object.assign(I18N.es, {
  tab_gasolina: 'Gasolina', tab_moto: 'Mi Moto', tab_eventos: 'Eventos', volver: '← Volver',
  gas_titulo: 'Gasolina', gas_sub: 'Calcula el coste según tu moto y encuentra gasolineras cerca.',
  gas_distancia: 'Distancia', gas_consumo: 'Consumo', gas_precio: 'Precio', gas_autonomia: 'Autonomía',
  gas_estaciones: 'Gasolineras cerca', gas_estaciones_btn: '📍 Buscar gasolineras cerca',
  gas_buscando: 'Buscando…', gas_sin_estaciones: 'No se encontraron gasolineras cerca.',
  gas_como_llegar: 'Cómo llegar', gas_precio_vivo_btn: 'Precio en vivo',
  gas_precio_vivo_no: 'El precio en vivo requiere conectar la fuente oficial de tu país. De momento, edita el precio a mano.',
  gas_eia_sin_clave: 'El precio en vivo aún no está activado. De momento, edita el precio a mano.',
  gas_precio_cargando: 'Consultando…',
  gas_precio_vivo_ok: 'Precio oficial: {precio} (semana del {fecha}, fuente EIA).',
  gas_precio_vivo_err: 'No se pudo obtener el precio en vivo ahora mismo. Inténtalo más tarde.',
  moto_titulo: 'Mi Moto', moto_sin: 'Aún no has añadido tu moto', moto_anadir_foto: 'Añadir foto',
  moto_marca: 'Marca', moto_modelo: 'Modelo', moto_anio: 'Año', moto_cc: 'Cilindrada (cc)',
  moto_consumo: 'Consumo', moto_deposito: 'Depósito', moto_km: 'Distancia total',
  moto_guardar: 'Guardar', moto_mant_titulo: 'Mantenimiento y desgaste', moto_revisar: '¡Revisar!',
  moto_set_ultimo: 'Km del último cambio',
  m_aceite: 'Aceite y filtro', m_filtroAire: 'Filtro de aire', m_bujias: 'Bujías',
  m_cadena: 'Kit de cadena', m_pastillas: 'Pastillas de freno', m_neumaticos: 'Neumáticos', m_refrigerante: 'Refrigerante',
  ev_titulo: 'Eventos y quedadas', ev_nombre: 'Nombre del evento', ev_lugar: 'Lugar',
  ev_fecha: 'Fecha', ev_hora: 'Hora', ev_notas: 'Notas', ev_crear: 'Crear evento',
  ev_vacio: 'No hay eventos. ¡Organiza una quedada!', ev_borrar: '¿Borrar este evento?',
  ev_falta: 'Pon al menos un nombre y una fecha.',
  foto_cambiar: 'Poner mi foto', foto_quitar: 'Quitar foto',
  backup_titulo: 'Copia de seguridad de fotos',
  backup_sub: 'Guarda en un archivo las fotos que subiste para no perderlas y poder publicarlas luego.',
  backup_export: '⬇ Exportar mis fotos', backup_import: '⬆ Importar',
  backup_ok: '✅ Fotos importadas correctamente.', backup_error: 'Archivo no válido.',
  backup_vacio: 'Aún no has subido ninguna foto.'
});
Object.assign(I18N.en, {
  tab_gasolina: 'Fuel', tab_moto: 'My Bike', tab_eventos: 'Events', volver: '← Back',
  gas_titulo: 'Fuel', gas_sub: 'Calculate cost based on your bike and find gas stations nearby.',
  gas_distancia: 'Distance', gas_consumo: 'Consumption', gas_precio: 'Price', gas_autonomia: 'Range',
  gas_estaciones: 'Gas stations nearby', gas_estaciones_btn: '📍 Find stations nearby',
  gas_buscando: 'Searching…', gas_sin_estaciones: 'No stations found nearby.',
  gas_como_llegar: 'Directions', gas_precio_vivo_btn: 'Live price',
  gas_precio_vivo_no: 'Live price needs your country\'s official source connected. For now, edit the price manually.',
  gas_eia_sin_clave: 'Live price is not enabled yet. For now, edit the price manually.',
  gas_precio_cargando: 'Fetching…',
  gas_precio_vivo_ok: 'Official price: {precio} (week of {fecha}, source: EIA).',
  gas_precio_vivo_err: 'Could not get the live price right now. Please try again later.',
  moto_titulo: 'My Bike', moto_sin: 'You haven\'t added your bike yet', moto_anadir_foto: 'Add photo',
  moto_marca: 'Brand', moto_modelo: 'Model', moto_anio: 'Year', moto_cc: 'Displacement (cc)',
  moto_consumo: 'Consumption', moto_deposito: 'Tank', moto_km: 'Total distance',
  moto_guardar: 'Save', moto_mant_titulo: 'Maintenance & wear', moto_revisar: 'Check now!',
  moto_set_ultimo: 'Mileage at last change',
  m_aceite: 'Oil & filter', m_filtroAire: 'Air filter', m_bujias: 'Spark plugs',
  m_cadena: 'Chain kit', m_pastillas: 'Brake pads', m_neumaticos: 'Tyres', m_refrigerante: 'Coolant',
  ev_titulo: 'Events & meetups', ev_nombre: 'Event name', ev_lugar: 'Place',
  ev_fecha: 'Date', ev_hora: 'Time', ev_notas: 'Notes', ev_crear: 'Create event',
  ev_vacio: 'No events. Organize a meetup!', ev_borrar: 'Delete this event?',
  ev_falta: 'Add at least a name and a date.',
  foto_cambiar: 'Set my photo', foto_quitar: 'Remove photo',
  backup_titulo: 'Photo backup',
  backup_sub: 'Save your uploaded photos to a file so you don\'t lose them and can publish them later.',
  backup_export: '⬇ Export my photos', backup_import: '⬆ Import',
  backup_ok: '✅ Photos imported successfully.', backup_error: 'Invalid file.',
  backup_vacio: 'You haven\'t uploaded any photo yet.'
});
Object.assign(I18N.de, {
  tab_gasolina: 'Sprit', tab_moto: 'Mein Bike', tab_eventos: 'Events', volver: '← Zurück',
  gas_titulo: 'Sprit', gas_sub: 'Berechne die Kosten für dein Motorrad und finde Tankstellen.',
  gas_distancia: 'Distanz', gas_consumo: 'Verbrauch', gas_precio: 'Preis', gas_autonomia: 'Reichweite',
  gas_estaciones: 'Tankstellen in der Nähe', gas_estaciones_btn: '📍 Tankstellen suchen',
  gas_buscando: 'Suche…', gas_sin_estaciones: 'Keine Tankstellen in der Nähe gefunden.',
  gas_como_llegar: 'Route', gas_precio_vivo_btn: 'Live-Preis',
  gas_precio_vivo_no: 'Der Live-Preis benötigt die offizielle Quelle deines Landes. Bitte den Preis vorerst manuell eingeben.',
  gas_eia_sin_clave: 'Der Live-Preis ist noch nicht aktiviert. Bitte den Preis vorerst manuell eingeben.',
  gas_precio_cargando: 'Wird abgefragt…',
  gas_precio_vivo_ok: 'Offizieller Preis: {precio} (Woche vom {fecha}, Quelle: EIA).',
  gas_precio_vivo_err: 'Der Live-Preis konnte gerade nicht abgerufen werden. Bitte später erneut versuchen.',
  moto_titulo: 'Mein Bike', moto_sin: 'Du hast dein Motorrad noch nicht hinzugefügt', moto_anadir_foto: 'Foto hinzufügen',
  moto_marca: 'Marke', moto_modelo: 'Modell', moto_anio: 'Jahr', moto_cc: 'Hubraum (cc)',
  moto_consumo: 'Verbrauch', moto_deposito: 'Tank', moto_km: 'Gesamtstrecke',
  moto_guardar: 'Speichern', moto_mant_titulo: 'Wartung & Verschleiß', moto_revisar: 'Prüfen!',
  moto_set_ultimo: 'Km beim letzten Wechsel',
  m_aceite: 'Öl & Filter', m_filtroAire: 'Luftfilter', m_bujias: 'Zündkerzen',
  m_cadena: 'Kettensatz', m_pastillas: 'Bremsbeläge', m_neumaticos: 'Reifen', m_refrigerante: 'Kühlmittel',
  ev_titulo: 'Events & Treffen', ev_nombre: 'Eventname', ev_lugar: 'Ort',
  ev_fecha: 'Datum', ev_hora: 'Uhrzeit', ev_notas: 'Notizen', ev_crear: 'Event erstellen',
  ev_vacio: 'Keine Events. Organisiere ein Treffen!', ev_borrar: 'Dieses Event löschen?',
  ev_falta: 'Bitte mindestens Name und Datum angeben.',
  foto_cambiar: 'Mein Foto', foto_quitar: 'Foto entfernen',
  backup_titulo: 'Foto-Sicherung',
  backup_sub: 'Speichere deine hochgeladenen Fotos in einer Datei, um sie nicht zu verlieren.',
  backup_export: '⬇ Fotos exportieren', backup_import: '⬆ Importieren',
  backup_ok: '✅ Fotos erfolgreich importiert.', backup_error: 'Ungültige Datei.',
  backup_vacio: 'Du hast noch keine Fotos hochgeladen.'
});
Object.assign(I18N.fr, {
  tab_gasolina: 'Carburant', tab_moto: 'Ma Moto', tab_eventos: 'Événements', volver: '← Retour',
  gas_titulo: 'Carburant', gas_sub: 'Calcule le coût selon ta moto et trouve des stations proches.',
  gas_distancia: 'Distance', gas_consumo: 'Consommation', gas_precio: 'Prix', gas_autonomia: 'Autonomie',
  gas_estaciones: 'Stations à proximité', gas_estaciones_btn: '📍 Chercher des stations',
  gas_buscando: 'Recherche…', gas_sin_estaciones: 'Aucune station trouvée à proximité.',
  gas_como_llegar: 'Itinéraire', gas_precio_vivo_btn: 'Prix en direct',
  gas_precio_vivo_no: 'Le prix en direct nécessite la source officielle de ton pays. Pour l\'instant, modifie le prix à la main.',
  gas_eia_sin_clave: 'Le prix en direct n\'est pas encore activé. Pour l\'instant, modifie le prix à la main.',
  gas_precio_cargando: 'Consultation…',
  gas_precio_vivo_ok: 'Prix officiel : {precio} (semaine du {fecha}, source : EIA).',
  gas_precio_vivo_err: 'Impossible d\'obtenir le prix en direct pour le moment. Réessaie plus tard.',
  moto_titulo: 'Ma Moto', moto_sin: 'Tu n\'as pas encore ajouté ta moto', moto_anadir_foto: 'Ajouter une photo',
  moto_marca: 'Marque', moto_modelo: 'Modèle', moto_anio: 'Année', moto_cc: 'Cylindrée (cc)',
  moto_consumo: 'Consommation', moto_deposito: 'Réservoir', moto_km: 'Distance totale',
  moto_guardar: 'Enregistrer', moto_mant_titulo: 'Entretien & usure', moto_revisar: 'À vérifier !',
  moto_set_ultimo: 'Km au dernier changement',
  m_aceite: 'Huile & filtre', m_filtroAire: 'Filtre à air', m_bujias: 'Bougies',
  m_cadena: 'Kit chaîne', m_pastillas: 'Plaquettes de frein', m_neumaticos: 'Pneus', m_refrigerante: 'Liquide de refroidissement',
  ev_titulo: 'Événements & sorties', ev_nombre: 'Nom de l\'événement', ev_lugar: 'Lieu',
  ev_fecha: 'Date', ev_hora: 'Heure', ev_notas: 'Notes', ev_crear: 'Créer l\'événement',
  ev_vacio: 'Aucun événement. Organise une sortie !', ev_borrar: 'Supprimer cet événement ?',
  ev_falta: 'Indique au moins un nom et une date.',
  foto_cambiar: 'Ma photo', foto_quitar: 'Retirer la photo',
  backup_titulo: 'Sauvegarde des photos',
  backup_sub: 'Enregistre tes photos dans un fichier pour ne pas les perdre et les publier plus tard.',
  backup_export: '⬇ Exporter mes photos', backup_import: '⬆ Importer',
  backup_ok: '✅ Photos importées avec succès.', backup_error: 'Fichier non valide.',
  backup_vacio: 'Tu n\'as encore importé aucune photo.'
});
Object.assign(I18N.it, {
  tab_gasolina: 'Carburante', tab_moto: 'La mia Moto', tab_eventos: 'Eventi', volver: '← Indietro',
  gas_titulo: 'Carburante', gas_sub: 'Calcola il costo in base alla tua moto e trova distributori vicini.',
  gas_distancia: 'Distanza', gas_consumo: 'Consumo', gas_precio: 'Prezzo', gas_autonomia: 'Autonomia',
  gas_estaciones: 'Distributori vicini', gas_estaciones_btn: '📍 Cerca distributori',
  gas_buscando: 'Ricerca…', gas_sin_estaciones: 'Nessun distributore trovato vicino.',
  gas_como_llegar: 'Indicazioni', gas_precio_vivo_btn: 'Prezzo live',
  gas_precio_vivo_no: 'Il prezzo live richiede la fonte ufficiale del tuo paese. Per ora, modifica il prezzo a mano.',
  gas_eia_sin_clave: 'Il prezzo live non è ancora attivato. Per ora, modifica il prezzo a mano.',
  gas_precio_cargando: 'Caricamento…',
  gas_precio_vivo_ok: 'Prezzo ufficiale: {precio} (settimana del {fecha}, fonte: EIA).',
  gas_precio_vivo_err: 'Impossibile ottenere il prezzo live in questo momento. Riprova più tardi.',
  moto_titulo: 'La mia Moto', moto_sin: 'Non hai ancora aggiunto la tua moto', moto_anadir_foto: 'Aggiungi foto',
  moto_marca: 'Marca', moto_modelo: 'Modello', moto_anio: 'Anno', moto_cc: 'Cilindrata (cc)',
  moto_consumo: 'Consumo', moto_deposito: 'Serbatoio', moto_km: 'Distanza totale',
  moto_guardar: 'Salva', moto_mant_titulo: 'Manutenzione e usura', moto_revisar: 'Da controllare!',
  moto_set_ultimo: 'Km all\'ultimo cambio',
  m_aceite: 'Olio e filtro', m_filtroAire: 'Filtro aria', m_bujias: 'Candele',
  m_cadena: 'Kit catena', m_pastillas: 'Pastiglie freni', m_neumaticos: 'Pneumatici', m_refrigerante: 'Refrigerante',
  ev_titulo: 'Eventi e raduni', ev_nombre: 'Nome dell\'evento', ev_lugar: 'Luogo',
  ev_fecha: 'Data', ev_hora: 'Ora', ev_notas: 'Note', ev_crear: 'Crea evento',
  ev_vacio: 'Nessun evento. Organizza un raduno!', ev_borrar: 'Eliminare questo evento?',
  ev_falta: 'Inserisci almeno un nome e una data.',
  foto_cambiar: 'La mia foto', foto_quitar: 'Rimuovi foto',
  backup_titulo: 'Backup delle foto',
  backup_sub: 'Salva in un file le foto caricate per non perderle e pubblicarle in seguito.',
  backup_export: '⬇ Esporta le mie foto', backup_import: '⬆ Importa',
  backup_ok: '✅ Foto importate correttamente.', backup_error: 'File non valido.',
  backup_vacio: 'Non hai ancora caricato nessuna foto.'
});

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
