// ============================================================
//  UI PREMIUM — avisos elegantes (toasts), diálogo de confirmación
//  propio y vibración. Sustituye a los alert()/confirm() feos del
//  navegador en toda la app.
// ============================================================

const UI = {
  _cont: null,

  _contenedor() {
    if (!this._cont) {
      this._cont = document.createElement('div');
      this._cont.className = 'toasts';
      document.body.appendChild(this._cont);
    }
    return this._cont;
  },

  // Aviso flotante que desaparece solo. tipo: 'ok' | 'err' | '' (neutro)
  toast(msg, tipo = '') {
    const c = this._contenedor();
    const t = document.createElement('div');
    t.className = 'toast' + (tipo ? ' ' + tipo : '');
    t.textContent = msg;
    c.appendChild(t);
    if (tipo === 'err') this.vibrar(60);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => {
      t.classList.remove('in');
      setTimeout(() => t.remove(), 350);
    }, 3800);
  },

  // Diálogo de confirmación con el diseño de la app → Promise<boolean>
  confirmar(msg) {
    return new Promise(res => {
      const o = document.createElement('div');
      o.className = 'confirm-overlay';
      o.innerHTML = `
        <div class="confirm-card">
          <p></p>
          <div class="confirm-btns">
            <button class="btn c-no"></button>
            <button class="btn danger c-si"></button>
          </div>
        </div>`;
      o.querySelector('p').textContent = msg;
      o.querySelector('.c-no').textContent = i18n.t('no');
      o.querySelector('.c-si').textContent = i18n.t('si');
      const fin = v => { o.classList.remove('in'); setTimeout(() => o.remove(), 200); res(v); };
      o.querySelector('.c-no').addEventListener('click', () => fin(false));
      o.querySelector('.c-si').addEventListener('click', () => fin(true));
      o.addEventListener('click', e => { if (e.target === o) fin(false); });
      document.body.appendChild(o);
      requestAnimationFrame(() => o.classList.add('in'));
    });
  },

  // Respuesta táctil (si el móvil lo soporta); patron: ms o [ms,pausa,ms]
  vibrar(patron) {
    try { if (navigator.vibrate) navigator.vibrate(patron); } catch (e) { /* sin vibración */ }
  }
};

// Todos los alert() de la app pasan a ser toasts elegantes
window.alert = msg => UI.toast(String(msg));
