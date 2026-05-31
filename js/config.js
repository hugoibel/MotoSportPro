// ============================================================
//  CONFIGURACIÓN DE MOTOSPORTPRO
//  Aquí pones tus claves y datos de cuenta para activar el dinero.
//  Mientras estén vacíos, la app funciona en modo "demo".
// ============================================================

const CONFIG = {

  // --- MAPA ---
  // Clave de Google Maps (Google Cloud → Maps JavaScript API).
  // Si la dejas vacía, la app usa OpenStreetMap gratis automáticamente.
  GOOGLE_MAPS_API_KEY: '',

  // --- AFILIADOS (ganas un % por cada venta de piezas) ---
  // Amazon Associates: tu "tracking id" (ej. "motosportpro-21")
  AMAZON_TAG: '',
  AMAZON_DOMINIO: 'amazon.com',        // amazon.es, amazon.de, etc.

  // RevZilla / AvantLink: tu enlace de afiliado base
  // (RevZilla trabaja con la red AvantLink). Pega aquí tu URL de afiliado.
  REVZILLA_AFILIADO_BASE: '',

  // --- MEMBRESÍA PREMIUM ---
  PRECIO_PREMIUM_MENSUAL: 2.99,
  MONEDA: 'USD',
  // Enlace de pago de Stripe (Payment Link) o tu pasarela.
  // Vacío = botón en modo demo (activa Premium localmente para probar).
  STRIPE_PAYMENT_LINK: '',

  // --- COMBUSTIBLE / GASOLINA ---
  PAIS: 'ES',                          // para precio en vivo por país (ES = API oficial gratis)
  PRECIO_COMBUSTIBLE: 1.65,            // precio por litro (editable; se usa si no hay precio en vivo)
  TIPO_COMBUSTIBLE: 'gasolina95',      // 'gasolina95' | 'gasolina98' | 'diesel'

  // --- GENERAL ---
  IDIOMA_POR_DEFECTO: 'es',            // se autodetecta del navegador si existe
  IDIOMAS: ['es', 'en', 'de', 'fr', 'it']
};
