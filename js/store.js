// ============================================================
//  TIENDA DE PIEZAS — afiliados Amazon + RevZilla
//  Cada compra a través de estos enlaces te genera comisión.
// ============================================================

// Catálogo inicial de ejemplo. Editable: añade tus propios productos.
// 'img' = ilustración propia (sin marca). 'emoji' = respaldo si la imagen no carga.
// 'amazonId' = ASIN del producto en Amazon. 'revzillaUrl' = enlace al producto.
const PRODUCTOS = [
  { img: 'img/casco.svg', emoji: '🪖', nombre: 'Casco integral', cat: 'Protección',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-helmets' },
  { img: 'img/chaqueta.svg', emoji: '🧥', nombre: 'Chaqueta con protecciones', cat: 'Protección',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-jackets' },
  { img: 'img/guantes.svg', emoji: '🧤', nombre: 'Guantes de cuero', cat: 'Protección',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-gloves' },
  { img: 'img/botas.svg', emoji: '👢', nombre: 'Botas de moto', cat: 'Protección',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-boots' },
  { img: 'img/aceite.svg', emoji: '🛢️', nombre: 'Aceite y filtro', cat: 'Mantenimiento',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-oil' },
  { img: 'img/cadena.svg', emoji: '🔗', nombre: 'Kit de cadena', cat: 'Mantenimiento',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-chains' },
  { img: 'img/soporte.svg', emoji: '📱', nombre: 'Soporte de móvil', cat: 'Accesorios',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-phone-mounts' },
  { img: 'img/camara.svg', emoji: '🎥', nombre: 'Cámara de acción', cat: 'Accesorios',
    amazonId: '', revzillaUrl: 'https://www.revzilla.com/motorcycle-cameras' }
];

const Store = {
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
    PRODUCTOS.forEach(p => {
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <img class="shop-img" src="${p.img}" alt="${p.nombre}" loading="lazy"
             onerror="this.outerHTML='<div class=\\'shop-emoji\\'>${p.emoji}</div>'">
        <div class="shop-cat">${p.cat}</div>
        <div class="shop-name">${p.nombre}</div>
        <div class="shop-btns">
          <a class="shop-btn amazon" href="${this.linkAmazon(p)}" target="_blank" rel="noopener" data-i18n="ver_amazon">${i18n.t('ver_amazon')}</a>
          <a class="shop-btn revzilla" href="${this.linkRevzilla(p)}" target="_blank" rel="noopener" data-i18n="ver_revzilla">${i18n.t('ver_revzilla')}</a>
        </div>`;
      cont.appendChild(card);
    });
  }
};
