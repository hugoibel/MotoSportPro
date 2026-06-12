# MotoSportPro 🏍️

App (PWA) para motoristas, pensada para **monetizar**. Funciona en **PC** y **móvil**
(se instala como app nativa) y en **5 idiomas** (es, en, de, fr, it).

**Funciones actuales:**
- 🏍️ Conducir: graba rutas con telemetría (velocidad, distancia, tiempo, máx/media) sobre mapa.
- 🧭 Navegación giro a giro **por voz** con recálculo automático, y modo **ruta con curvas** 🌀 (elige la alternativa más divertida, estilo Calimoto).
- 📐 **Inclinación en curva** (lean angle) en vivo calculada por GPS, con el máximo guardado en cada ruta.
- 🌤️ **Clima** en la pantalla Conducir (temperatura + aviso de lluvia de las próximas horas, sin clave).
- 🛡️ **Detección de caídas + SOS** (acelerómetro, cuenta atrás, SMS con tu ubicación).
- 🗺️ Rutas: historial guardado en el dispositivo, detalle con el **recorrido coloreado por velocidad** y exportación **GPX**. Mapas **sin conexión**.
- ⛽ Gasolina: calcula litros y coste según el consumo de **tu** moto y la distancia; busca **gasolineras cercanas reales** (OpenStreetMap + tu GPS) con "cómo llegar".
- 🏍️ Mi Moto: ficha de la moto con **foto**, datos (marca, modelo, consumo, depósito, km) y **desgaste por mantenimiento** (aceite, cadena, neumáticos…) con barras de aviso.
- 📅 Eventos: organiza quedadas de club (nombre, lugar, fecha, hora) y compártelas.
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
| `PAIS` / `PRECIO_COMBUSTIBLE` | Tu país y precio por litro | Cálculo de gasolina. Precio en vivo necesita la fuente oficial de tu país. |

> Todas requieren una cuenta a tu nombre y aprobación de cada programa. Yo dejo
> el código listo: el día que pegues la clave, esa parte empieza a generar dinero.

> **Gasolineras cercanas** funcionan ya en cualquier país (OpenStreetMap + GPS, sin clave).
> El **precio en vivo** depende de cada país; dime el tuyo y conecto la fuente oficial gratis si existe.

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

- [x] **Rutas curvas** (estilo *Calimoto* / *Scenic*): modo 🌀 que elige la alternativa más sinuosa. (v0.17)
- [ ] **Comunidad y quedadas** (estilo *REVER*): compartir rutas, retos, perfiles.
- [x] **Detección de caídas + SOS** (estilo *Detecht* / *EatSleepRIDE*). (v0.16)
- [ ] **Alertas en tiempo real** (estilo *Waze*): radares, peligros, tráfico.
- [x] **Mapas sin conexión** para viajes largos. (v0.16)
- [x] **Mi moto**: mantenimiento, desgaste, consumo.
- [x] **Inclinación en curva** (lean angle por GPS) y recorrido coloreado por velocidad. (v0.17)
- [x] Exportar rutas a **GPX**. (v0.15)
- [x] **Clima** con aviso de lluvia (Open-Meteo). (v0.17)

## Cómo se gana dinero

1. **Membresía Premium** ($2.99/mes vía Stripe) que desbloquea las funciones marcadas arriba.
2. **Comisión de afiliado** por cada pieza/equipo comprado desde la Tienda (Amazon + RevZilla).
3. (Futuro) Anuncios para usuarios gratuitos / packs de rutas premium.
