// ============================================================
//  RANK (v0.27) — motor de relevancia del buscador de destinos.
//
//  Antes la lista se ordenaba SOLO por distancia: buscabas "Walmart" y
//  salía primero cualquier cosa cercana que hubiera devuelto la API, con
//  el Walmart de verdad enterrado abajo. Un buscador serio pondera cuatro
//  cosas a la vez:
//
//    nombre (50%)  ¿se llama de verdad como lo que escribiste?
//    tipo   (22%)  ¿es un negocio concreto o una región enorme?
//    cerca  (22%)  a menos distancia, mejor — pero con caída suave
//    fama   (6%)   la "importance" que trae OpenStreetMap
//
//  Además traduce la intención: escribir "gasolinera" ya no busca sitios
//  LLAMADOS gasolinera, busca gasolineras de verdad (en 5 idiomas).
//
//  Todo es cálculo local: ni una llamada de red, ni una clave de API.
// ============================================================

const Rank = {

  // ---------- Normalización ----------

  // Minúsculas, sin acentos, sin puntuación y con espacios colapsados.
  // "Café  Málaga's!" -> "cafe malaga s"
  norm(s) {
    return (s || '').toString().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  palabras(s) {
    return this.norm(s).split(' ').filter(Boolean);
  },

  // ---------- Parecido entre textos ----------

  // Distancia de edición (Levenshtein) acotada: si se pasa de `max` corta y
  // devuelve max+1. Acotarla evita recorrer cadenas largas sin necesidad.
  _edit(a, b, max) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > max) return max + 1;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let mejor = i;
      for (let j = 1; j <= b.length; j++) {
        const coste = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + coste);
        if (cur[j] < mejor) mejor = cur[j];
      }
      if (mejor > max) return max + 1;   // toda la fila se pasó: imposible mejorar
      prev = cur;
    }
    return prev[b.length];
  },

  // Parecido 0..1 tolerante a erratas ("walmar" ~ "walmart")
  _similar(a, b) {
    if (!a || !b) return 0;
    const largo = Math.max(a.length, b.length);
    const max = Math.min(4, Math.floor(largo * 0.34));   // hasta ~1/3 de erratas
    if (max < 1) return a === b ? 1 : 0;
    const d = this._edit(a, b, max);
    if (d > max) return 0;
    return 1 - d / largo;
  },

  // ---------- Puntuación del NOMBRE (0..1) ----------
  // Se prueba contra el nombre del sitio y contra su marca; gana el mejor.
  nombreScore(consulta, nombre, marca) {
    const q = this.norm(consulta);
    if (!q) return 0;
    let mejor = 0;
    for (const cand of [nombre, marca]) {
      const n = this.norm(cand);
      if (!n) continue;
      mejor = Math.max(mejor, this._unScore(q, n));
      if (mejor >= 1) break;
    }
    return mejor;
  },

  _unScore(q, n) {
    if (n === q) return 1;                       // "walmart" = "Walmart"
    if (n.startsWith(q + ' ')) return 0.95;      // "Walmart Supercenter"
    if (n.startsWith(q)) return 0.90;            // "Walmarket"

    const qp = q.split(' ').filter(Boolean);
    const np = n.split(' ').filter(Boolean);

    // Todas las palabras buscadas aparecen (aunque estén sueltas o en otro orden)
    const todas = qp.every(w => np.some(x => x === w || x.startsWith(w)));
    if (todas) {
      // Menos relleno alrededor = mejor: "Planet Fitness" gana a
      // "Planet Fitness Orlando East Colonial Drive Suite 200"
      const relleno = Math.max(0, np.length - qp.length);
      return Math.max(0.72, 0.88 - relleno * 0.03);
    }

    if (n.includes(q)) return 0.70;              // la frase aparece dentro

    // Coincidencia parcial: cuántas palabras buscadas están presentes
    const hay = qp.filter(w => np.some(x => x === w || x.startsWith(w) || x.includes(w))).length;
    if (hay) {
      const frac = hay / qp.length;
      if (frac >= 0.5) return 0.40 + frac * 0.22;   // 0.51..0.62
      return frac * 0.40;
    }

    // Nada coincide literalmente: última oportunidad, erratas
    const sim = Math.max(
      this._similar(q, n),
      // también contra las primeras palabras, para nombres largos
      this._similar(q, np.slice(0, qp.length).join(' '))
    );
    return sim > 0.68 ? sim * 0.62 : 0;
  },

  // ---------- Tipo de lugar ----------
  // Clave OSM -> icono + etiqueta traducible + peso.
  // Un negocio concreto es un destino mucho más probable que "Condado de Orange".
  TIPOS: {
    fuel:        { i: '⛽', t: 'tipo_gas',     p: 1.00 },
    charging:    { i: '🔌', t: 'tipo_gas',     p: 1.00 },
    restaurant:  { i: '🍽️', t: 'tipo_food',    p: 1.00 },
    fast_food:   { i: '🍔', t: 'tipo_food',    p: 1.00 },
    cafe:        { i: '☕', t: 'tipo_cafe',    p: 1.00 },
    bar:         { i: '🍺', t: 'tipo_bar',     p: 0.96 },
    pub:         { i: '🍺', t: 'tipo_bar',     p: 0.96 },
    hotel:       { i: '🏨', t: 'tipo_hotel',   p: 1.00 },
    motel:       { i: '🏨', t: 'tipo_hotel',   p: 1.00 },
    parking:     { i: '🅿️', t: 'tipo_parking', p: 0.94 },
    motorcycle:  { i: '🏍️', t: 'tipo_moto',    p: 1.00 },
    car_repair:  { i: '🔧', t: 'tipo_taller',  p: 0.98 },
    supermarket: { i: '🛒', t: 'tipo_super',   p: 1.00 },
    pharmacy:    { i: '💊', t: 'tipo_farm',    p: 1.00 },
    hospital:    { i: '🏥', t: 'tipo_hosp',    p: 1.00 },
    bank:        { i: '🏦', t: 'tipo_banco',   p: 0.98 },
    atm:         { i: '🏧', t: 'tipo_banco',   p: 0.94 },
    toilets:     { i: '🚻', t: 'tipo_aseo',    p: 0.90 },
    viewpoint:   { i: '🌄', t: 'tipo_mirador', p: 0.98 },
    attraction:  { i: '📸', t: 'tipo_ver',     p: 0.96 },
    museum:      { i: '🏛️', t: 'tipo_ver',     p: 0.96 },
    cinema:      { i: '🎬', t: 'tipo_ver',     p: 0.96 },
    theme_park:  { i: '🎢', t: 'tipo_ver',     p: 0.98 },
    airport:     { i: '✈️', t: 'tipo_aero',    p: 1.00 },
    fitness_centre: { i: '🏋️', t: 'tipo_gym',   p: 1.00 },
    gym:         { i: '🏋️', t: 'tipo_gym',     p: 1.00 },
    convenience: { i: '🏪', t: 'tipo_super',   p: 0.98 },
    department_store: { i: '🏬', t: 'tipo_tienda', p: 0.98 },
    mall:        { i: '🏬', t: 'tipo_tienda',  p: 0.98 },
    bakery:      { i: '🥐', t: 'tipo_food',    p: 0.96 },
    car_wash:    { i: '🧼', t: 'tipo_lavado',  p: 0.94 },
    beach:       { i: '🏖️', t: 'tipo_playa',   p: 0.96 },
    park:        { i: '🌳', t: 'tipo_parque',  p: 0.90 },
    camp_site:   { i: '⛺', t: 'tipo_camping', p: 0.96 },
    police:      { i: '👮', t: 'tipo_policia', p: 0.96 },
    doctors:     { i: '🩺', t: 'tipo_hosp',    p: 0.96 },
    clinic:      { i: '🩺', t: 'tipo_hosp',    p: 0.96 },
    // Geografía: destinos válidos, pero menos concretos que un negocio
    city:        { i: '🏙️', t: 'tipo_ciudad',  p: 0.62 },
    town:        { i: '🏘️', t: 'tipo_ciudad',  p: 0.60 },
    village:     { i: '🏘️', t: 'tipo_pueblo',  p: 0.56 },
    suburb:      { i: '🏘️', t: 'tipo_barrio',  p: 0.52 },
    neighbourhood: { i: '🏘️', t: 'tipo_barrio', p: 0.52 },
    house:       { i: '🏠', t: 'tipo_dir',     p: 0.80 },
    street:      { i: '🛣️', t: 'tipo_calle',   p: 0.58 },
    state:       { i: '🗺️', t: 'tipo_region',  p: 0.28 },
    county:      { i: '🗺️', t: 'tipo_region',  p: 0.26 },
    country:     { i: '🌍', t: 'tipo_pais',    p: 0.20 }
  },

  // Deduce el tipo a partir de lo que devuelven Photon / Nominatim / Overpass.
  // Devuelve {i: icono, t: clave i18n, p: peso 0..1}
  tipo(it) {
    const v = (it.osmValue || '').toLowerCase();
    const k = (it.osmKey || '').toLowerCase();
    if (v && this.TIPOS[v]) return this.TIPOS[v];

    // Carreteras y direcciones
    if (k === 'highway') {
      if (['residential', 'primary', 'secondary', 'tertiary', 'trunk', 'motorway',
        'unclassified', 'living_street', 'road', 'service'].includes(v)) return this.TIPOS.street;
    }
    if (k === 'place') {
      if (v === 'house' || v === 'houses') return this.TIPOS.house;
      if (v === 'city') return this.TIPOS.city;
      if (v === 'town') return this.TIPOS.town;
      if (v === 'village' || v === 'hamlet') return this.TIPOS.village;
      if (v === 'suburb' || v === 'neighbourhood' || v === 'quarter') return this.TIPOS.suburb;
      if (v === 'state' || v === 'region' || v === 'province') return this.TIPOS.state;
      if (v === 'county' || v === 'district') return this.TIPOS.county;
      if (v === 'country') return this.TIPOS.country;
    }
    if (k === 'boundary' || v === 'administrative') return this.TIPOS.county;
    if (k === 'aeroway') return this.TIPOS.airport;

    // Cualquier otro comercio/servicio con nombre propio: destino concreto
    if (['shop', 'amenity', 'tourism', 'leisure', 'healthcare', 'office', 'craft'].includes(k)) {
      return { i: '📍', t: 'tipo_sitio', p: 0.92 };
    }
    return { i: '📍', t: '', p: 0.70 };   // desconocido: ni premiar ni castigar
  },

  // ---------- Cercanía (0..1) ----------
  // Caída suave: a 12 km vale la mitad. Un decaimiento brusco escondería
  // la ciudad que buscas a 60 km; uno lineal ignoraría que 2 km importa.
  cercaScore(metros) {
    if (metros == null) return 0.45;            // sin GPS: valor neutro
    return 1 / (1 + (metros / 1000) / 12);
  },

  // ¿Es un sitio "geográfico" (ciudad, pueblo, región, país)?
  _esLocalidad(tp) {
    return ['tipo_ciudad', 'tipo_pueblo', 'tipo_barrio', 'tipo_region', 'tipo_pais'].includes(tp.t);
  },

  // ---------- Puntuación final ----------
  puntuar(items, consulta, pos) {
    const out = (items || []).map(it => {
      const dist = (pos && it.lat != null)
        ? this._dist(pos, [it.lat, it.lng]) : (it.dist != null ? it.dist : null);
      const tp = this.tipo(it);
      const nom = consulta ? this.nombreScore(consulta, it.nombre, it.marca) : 0.6;
      let cer = this.cercaScore(dist);
      let peso = tp.p;

      // Una CIUDAD escrita con su nombre exacto es un destino de viaje: desde
      // Orlando, "miami" tiene que dar Miami — no un "Miami Subs" de la esquina.
      // Se limita a sitios geográficos a propósito: para un negocio la cercanía
      // debe seguir mandando (un Starbucks a 300 km jamás gana al de al lado).
      if (nom >= 1 && this._esLocalidad(tp)) {
        cer = Math.max(cer, 0.85);
        peso = Math.max(peso, 0.95);
      }

      const fama = Math.max(0, Math.min(1, +it.importancia || 0));
      const score = nom * 0.50 + peso * 0.22 + cer * 0.22 + fama * 0.06;
      return Object.assign({}, it, {
        dist, score, icono: it.icono || tp.i, tipoClave: tp.t, _nom: nom
      });
    });
    // Descarta lo que no tiene nada que ver (p. ej. una región lejana sin
    // relación con lo escrito), pero nunca lo deja todo vacío.
    const buenos = out.filter(x => x._nom >= 0.35);
    const lista = buenos.length ? buenos : out;
    lista.sort((a, b) => b.score - a.score || (a.dist || 0) - (b.dist || 0));
    return lista;
  },

  _dist(a, b) {
    const R = 6371000, r = Math.PI / 180;
    const dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  },

  // ---------- Intención: "gasolinera" = gasolineras, no sitios así llamados ----------
  // Sinónimos en los 5 idiomas de la app + inglés de EE.UU. (el usuario va por Florida).
  CATEGORIAS: [
    {
      k: 'gas', e: '⛽', q: '["amenity"="fuel"]',
      w: ['gasolinera', 'gasolineras', 'gasolina', 'combustible', 'bencinera', 'nafta',
        'gas', 'gas station', 'fuel', 'petrol', 'petrol station', 'gasoline',
        'tankstelle', 'benzin', 'essence', 'station service', 'carburant',
        'benzina', 'distributore', 'rifornimento']
    },
    {
      k: 'food', e: '🍔', q: '["amenity"~"restaurant|fast_food"]',
      w: ['comida', 'comer', 'restaurante', 'restaurantes', 'food', 'eat', 'restaurant',
        'restaurants', 'diner', 'essen', 'restaurang', 'nourriture', 'manger',
        'mangiare', 'ristorante', 'cibo', 'lunch', 'almuerzo', 'cena', 'dinner']
    },
    {
      k: 'cafe', e: '☕', q: '["amenity"="cafe"]',
      w: ['cafe', 'cafeteria', 'coffee', 'coffee shop', 'kaffee', 'kaffeehaus',
        'caffe', 'caffetteria', 'cafes']
    },
    {
      k: 'parking', e: '🅿️', q: '["amenity"="parking"]',
      w: ['parking', 'aparcamiento', 'estacionamiento', 'parkplatz', 'parcheggio',
        'stationnement', 'aparcar', 'park']
    },
    {
      k: 'moto', e: '🏍️', q: '["shop"~"^motorcycle"]',
      w: ['moto', 'motos', 'motorcycle', 'motorcycles', 'motorrad', 'taller moto',
        'tienda de motos', 'motorcycle shop', 'moto shop', 'concesionario']
    },
    {
      k: 'hotel', e: '🏨', q: '["tourism"~"hotel|motel"]',
      w: ['hotel', 'hoteles', 'hotels', 'motel', 'moteles', 'motels', 'alojamiento',
        'dormir', 'hostal', 'albergo', 'hebergement', 'unterkunft', 'sleep']
    },
    {
      k: 'taller', e: '🔧', q: '["shop"="car_repair"]',
      w: ['taller', 'talleres', 'mecanico', 'mechanic', 'repair', 'car repair',
        'werkstatt', 'garage', 'officina', 'reparacion']
    },
    {
      k: 'super', e: '🛒', q: '["shop"~"supermarket|convenience"]',
      w: ['supermercado', 'supermercados', 'super', 'supermarket', 'grocery',
        'groceries', 'tienda', 'market', 'supermarkt', 'supermarche',
        'supermercato', 'compra']
    },
    {
      k: 'farm', e: '💊', q: '["amenity"="pharmacy"]',
      w: ['farmacia', 'farmacias', 'pharmacy', 'drugstore', 'apotheke',
        'pharmacie', 'medicina', 'medicine']
    },
    {
      k: 'banco', e: '🏧', q: '["amenity"~"bank|atm"]',
      w: ['banco', 'bancos', 'cajero', 'atm', 'bank', 'cash', 'cash machine',
        'geldautomat', 'distributeur', 'bancomat', 'dinero']
    }
  ],

  // ¿La consulta es una categoría genérica? Devuelve la categoría o null.
  // Solo acepta la frase COMPLETA (o casi): "gas" sí, pero "gas monkey garage" no
  // (ahí el usuario busca un negocio concreto con esa palabra en el nombre).
  categoria(q) {
    const n = this.norm(q);
    if (!n || n.length < 3) return null;
    for (const c of this.CATEGORIAS) {
      for (const w of c.w) {
        const wn = this.norm(w);
        if (n === wn) return c;
      }
    }
    // "una gasolinera", "gasolineras cerca", "gas near me"
    const relleno = /^(un|una|unos|unas|el|la|los|las|a|an|the|de|di|du|le|les|der|die|das|ein|eine)$/;
    const cola = /^(cerca|cercana|cercanas|cercano|proxima|proximo|near|nearby|me|near me|aqui|hier|pres|vicino|in der nahe|nahe)$/;
    const ps = n.split(' ').filter(p => !relleno.test(p));
    const limpio = ps.filter((p, i) => !(i > 0 && cola.test(p))).join(' ');
    if (limpio && limpio !== n) {
      for (const c of this.CATEGORIAS) {
        for (const w of c.w) if (this.norm(w) === limpio) return c;
      }
    }
    return null;
  }
};
