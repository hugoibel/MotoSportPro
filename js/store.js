// ============================================================
//  TIENDA DE PIEZAS — afiliados Amazon + RevZilla
//  Cada compra a través de estos enlaces te genera comisión.
// ============================================================

// Catálogo inicial de ejemplo. Editable: añade tus propios productos.
// 'img' = ilustración propia (sin marca). 'emoji' = respaldo si la imagen no carga.
// 'amazonId' = ASIN del producto en Amazon. 'revzillaUrl' = enlace al producto.
// 'img' = foto real del producto (con respaldo a la ilustración 'svg' y luego al emoji).
const PRODUCTOS = [
  { img: 'img/casco.jpg', svg: 'img/casco.svg', emoji: '🪖', nombre: 'Casco integral', cat: 'Protección',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-helmets' },
  { img: 'img/chaqueta.jpg', svg: 'img/chaqueta.svg', emoji: '🧥', nombre: 'Chaqueta con protecciones', cat: 'Protección',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-jackets' },
  { img: 'img/guantes.jpg', svg: 'img/guantes.svg', emoji: '🧤', nombre: 'Guantes de cuero', cat: 'Protección',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-gloves' },
  { img: 'img/botas.jpg', svg: 'img/botas.svg', emoji: '👢', nombre: 'Botas de moto', cat: 'Protección',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-boots' },
  { img: 'img/aceite.jpg', svg: 'img/aceite.svg', emoji: '🛢️', nombre: 'Aceite y filtro', cat: 'Mantenimiento',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-oil' },
  { img: 'img/cadena.jpg', svg: 'img/cadena.svg', emoji: '🔗', nombre: 'Kit de cadena', cat: 'Mantenimiento',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-chains' },
  { img: 'img/soporte.jpg', svg: 'img/soporte.svg', emoji: '📱', nombre: 'Soporte de móvil', cat: 'Accesorios',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-phone-mounts' },
  { img: 'img/camara.jpg', svg: 'img/camara.svg', emoji: '🎥', nombre: 'Cámara de acción', cat: 'Accesorios',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-cameras' }
];

const Store = {
  FOTOS_KEY: 'msp_tienda_fotos',

  // --- Fotos propias del usuario (guardadas en el dispositivo) ---
  fotosGet() {
    try { return JSON.parse(localStorage.getItem(this.FOTOS_KEY)) || {}; }
    catch { return {}; }
  },
  fotoDe(nombre) { return this.fotosGet()[nombre] || null; },
  quitarFoto(nombre) {
    const f = this.fotosGet(); delete f[nombre];
    localStorage.setItem(this.FOTOS_KEY, JSON.stringify(f));
    this.render();
  },
  // Redimensiona a máx 800px y guarda como JPEG ligero
  ponerFoto(nombre, file) {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 800, esc = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = img.width * esc; cv.height = img.height * esc;
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        const fotos = this.fotosGet();
        fotos[nombre] = cv.toDataURL('image/jpeg', 0.82);
        try { localStorage.setItem(this.FOTOS_KEY, JSON.stringify(fotos)); }
        catch (e) { alert('No se pudo guardar: foto demasiado grande o sin espacio.'); }
        this.render();
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  },

  // Construye un enlace de Amazon con tu tag de afiliado
  linkAmazon(producto) {
    const dom = CONFIG.AMAZON_DOMINIO || 'amazon.com';
    const base = producto.amazonId
      ? `https://www.${dom}/dp/${producto.amazonId.trim()}`
      : `https://www.${dom}/s?k=${encodeURIComponent('moto ' + producto.nombre)}`;
    return CONFIG.AMAZON_TAG ? `${base}?tag=${CONFIG.AMAZON_TAG}` : base;
  },

  // Construye un enlace de RevZilla con tu base de afiliado si la tienes
  linkRevzilla(producto) {
    const url = producto.revzillaUrl || 'https://www.revzilla.com';
    if (!CONFIG.REVZILLA_AFILIADO_BASE) return url;
    // AvantLink suele envolver la url destino como parámetro
    return `${CONFIG.REVZILLA_AFILIADO_BASE}${encodeURIComponent(url)}`;
  },

  render() {
    const cont = document.getElementById('store-grid');
    if (!cont) return;
    cont.innerHTML = '';
    PRODUCTOS.forEach((p, i) => {
      const foto = this.fotoDe(p.nombre);     // foto propia del usuario, si la hay
      const src = foto || p.img;               // si no, la ilustración
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="shop-imgwrap">
          <img class="shop-img" src="${src}" alt="${p.nombre}" loading="lazy"
               onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${p.svg}'}else{this.outerHTML='<div class=\\'shop-emoji\\'>${p.emoji}</div>'}">
          <button class="shop-foto-btn" data-foto="${i}" title="${i18n.t('foto_cambiar')}">📷</button>
          ${foto ? `<button class="shop-foto-del" data-fotodel="${p.nombre}" title="${i18n.t('foto_quitar')}">✕</button>` : ''}
          <input type="file" accept="image/*" hidden id="tienda-file-${i}">
        </div>
        <div class="shop-cat">${p.cat}</div>
        <div class="shop-name">${p.nombre}</div>
        <div class="shop-btns">
          <a class="shop-btn amazon" href="${this.linkAmazon(p)}" target="_blank" rel="noopener" data-i18n="ver_amazon">${i18n.t('ver_amazon')}</a>
          <a class="shop-btn revzilla" href="${this.linkRevzilla(p)}" target="_blank" rel="noopener" data-i18n="ver_revzilla">${i18n.t('ver_revzilla')}</a>
        </div>`;
      cont.appendChild(card);
    });

    // Botón cámara → abre el selector de archivo de ese producto
    cont.querySelectorAll('.shop-foto-btn').forEach(btn => {
      const i = btn.dataset.foto;
      const input = document.getElementById('tienda-file-' + i);
      btn.addEventListener('click', () => input.click());
      input.addEventListener('change', e => {
        if (e.target.files[0]) this.ponerFoto(PRODUCTOS[i].nombre, e.target.files[0]);
      });
    });
    // Botón ✕ → quita la foto y vuelve a la ilustración
    cont.querySelectorAll('.shop-foto-del').forEach(btn =>
      btn.addEventListener('click', () => this.quitarFoto(btn.dataset.fotodel)));
  }
};
