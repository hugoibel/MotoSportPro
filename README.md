# MotoSportPro 🏍️

App (PWA) para motoristas. Graba tus rutas en moto con telemetría en tiempo real:
**velocidad, distancia, tiempo, velocidad máxima/media** y traza sobre mapa GPS.

Funciona en **PC** (navegador) y en el **móvil**, donde se instala como una app normal
(icono en la pantalla de inicio, pantalla completa).

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
├── index.html        Interfaz (vistas Grabar / Rutas)
├── manifest.json     Configuración PWA (instalable)
├── sw.js             Service worker (funciona sin conexión)
├── css/styles.css    Estilos
├── js/
│   ├── app.js        Lógica: GPS, telemetría, mapa, navegación
│   └── storage.js    Guardado de rutas (localStorage del dispositivo)
├── icons/            Iconos de la app
└── gen_iconos.py     Generador de iconos (ya ejecutado)
```

## Tecnología

- HTML/CSS/JavaScript puro (sin frameworks, sin paso de compilación)
- [Leaflet](https://leafletjs.com/) + OpenStreetMap para el mapa
- API de Geolocalización del navegador para la telemetría
- PWA (manifest + service worker) para instalación y uso offline

## Ideas para siguientes versiones

- [ ] Sección **Mi moto**: mantenimiento, km, gastos, recordatorios de revisión
- [ ] **Comunidad**: compartir rutas, quedadas en grupo
- [ ] Exportar rutas a GPX
- [ ] Inclinación (ángulo de curva) usando los sensores del móvil
- [ ] Gráfica de velocidad por ruta
