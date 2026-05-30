// ============================================================
//  MEMBRESÍA PREMIUM — 2.99/mes
//  Si hay STRIPE_PAYMENT_LINK, redirige al pago real.
//  Si no, activa Premium en local (modo demo para probar la app).
// ============================================================

const Premium = {
  esPremium() {
    return localStorage.getItem('msp_premium') === '1';
  },

  activarDemo() {
    localStorage.setItem('msp_premium', '1');
    this.render();
  },

  comprar() {
    if (CONFIG.STRIPE_PAYMENT_LINK) {
      window.location.href = CONFIG.STRIPE_PAYMENT_LINK;
    } else {
      // Modo demo: sin pasarela configurada todavía
      this.activarDemo();
      alert('🎉 Premium activado (modo demo). Cuando conectes Stripe, este botón cobrará de verdad.');
    }
  },

  render() {
    const precioEl = document.getElementById('premium-precio-num');
    if (precioEl) {
      const simbolo = CONFIG.MONEDA === 'EUR' ? '€' : '$';
      precioEl.textContent = simbolo + CONFIG.PRECIO_PREMIUM_MENSUAL.toFixed(2);
    }
    const cta = document.getElementById('btn-premium');
    const activo = document.getElementById('premium-activo');
    if (this.esPremium()) {
      if (cta) cta.style.display = 'none';
      if (activo) activo.style.display = 'block';
    } else {
      if (cta) cta.style.display = 'block';
      if (activo) activo.style.display = 'none';
    }
  }
};
