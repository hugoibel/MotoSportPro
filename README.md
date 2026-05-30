# MotoSportPro 🏍️

App (PWA) para motoristas, pensada para **monetizar**. Funciona en **PC** y **móvil**
(se instala como app nativa) y en **5 idiomas** (es, en, de, fr, it).

**Funciones actuales:**
- 🏍️ Conducir: graba rutas con telemetría (velocidad, distancia, tiempo, máx/media) sobre mapa.
- 🗺️ Rutas: historial guardado en el dispositivo.
- 🛒 Tienda: piezas y equipo con enlaces de **afiliado** (Amazon + RevZilla) → comisión por venta.
- 👑 Premium: membresía mensual ($2.99) con paywall listo para Stripe.

## ⚙️ Activar la monetización — qué tienes que conseguir tú

Edita `js/config.js` y rellena estas claves (la app funciona en modo demo sin ellas):

| Clave en config.js | De dónde sale | Para qué |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Google Cloud → Maps JavaScript API (tiene capa gratis) | Mapa de Google. Sin clave usa OpenStreetMap gratis. |
| `AMAZON_TAG` | Amazon Associates (programa de afiliados) | Comisión por compras en Amazon |
| `REVZILLA_AFILIADO_BASE` | RevZilla vía red **AvantLink** | Comisión por compras en RevZilla |
| `STRIPE_PAYMENT_LINK` | Stripe → Payment Link de 2.99/mes | Cobrar la membresía Premium |

> Todas requieren una cuenta a tu nombre y aprobación de cada programa. Yo dejo
> el código listo: el día que pegues la clave, esa parte empieza a generar dinero.

## Cómo probarla en el PC

La geolocalización y la PWA necesitan servirse por HTTP (no vale abrir el archivo
directamente). Arranca un servidor local:

```powershell
cd C:\Users\TechTablet\MotoSportPro
python -m http.server 8000
```

Luego abre en el navegador: **http://localhost:8000**

> En el PC el GPS suele dar una posición aproximada por wifi/IP. La telemetría real
> (velocidad sobre la moto) se ve de verdad en el móvil con el GPS activo.

## Cómo usarla en el móvil

Para que el móvil acceda al GPS necesita **HTTPS**. Dos opciones:

1. **Misma red wifi (rápido para probar):** arranca el servidor con tu IP local y
   acéptalo como sitio no seguro. (El GPS puede quedar limitado por falta de HTTPS.)
2. **Publicarla (recomendado):** subir la carpeta a un hosting con HTTPS gratis
   (GitHub Pages, Netlify, Vercel). Una vez abierta, el móvil ofrecerá
   *"Añadir a pantalla de inicio"* y quedará instalada como app.

## Estructura

```
MotoSportPro/
├── index.html        Interfaz (Conducir / Rutas / Tienda / Premium)
├── manifest.json     Configuración PWA (instalable)
├── sw.js             Service worker (funciona sin conexión)
├── css/styles.css    Estilos
├── js/
│   ├── config.js     ⚙️ TUS CLAVES (Google, afiliados, Stripe)
│   ├── i18n.js       Traducciones (5 idiomas)
│   ├── map.js        Mapa: Google Maps o OpenStreetMap
│   ├── storage.js    Guardado de rutas (localStorage)
│   ├── store.js      Tienda con enlaces de afiliado
│   ├── premium.js    Membresía / paywall
│   └── app.js        Lógica: GPS, telemetría, navegación
├── icons/            Iconos de la app
└── gen_iconos.py     Generador de iconos (ya ejecutado)
```

## Tecnología

- HTML/CSS/JavaScript puro (sin frameworks, sin paso de compilación)
- [Leaflet](https://leafletjs.com/) + OpenStreetMap para el mapa
- API de Geolocalización del navegador para la telemetría
- PWA (manifest + service worker) para instalación y uso offline

## Roadmap — lo mejor de cada app famosa

Inspirado en lo más valorado de las apps líderes, para añadir por fases:

- [ ] **Rutas curvas inteligentes** (estilo *Calimoto* / *Scenic*): genera las carreteras más divertidas. → Premium
- [ ] **Comunidad y quedadas** (estilo *REVER*): compartir rutas, retos, perfiles.
- [ ] **Detección de caídas + SOS** (estilo *Detecht* / *EatSleepRIDE*): aviso automático a contactos. → Premium
- [ ] **Alertas en tiempo real** (estilo *Waze*): radares, peligros, tráfico.
- [ ] **Mapas sin conexión** para viajes largos. → Premium
- [ ] **Mi moto**: mantenimiento, km, gastos, recordatorios de revisión.
- [ ] **Inclinación en curva** y gráfica de velocidad usando los sensores del móvil.
- [ ] Exportar rutas a **GPX**.

## Cómo se gana dinero

1. **Membresía Premium** ($2.99/mes vía Stripe) que desbloquea las funciones marcadas arriba.
2. **Comisión de afiliado** por cada pieza/equipo comprado desde la Tienda (Amazon + RevZilla).
3. (Futuro) Anuncios para usuarios gratuitos / packs de rutas premium.
