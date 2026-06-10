// ============================================================
//  EVENTOS — quedadas de club / apasionados (nombre, lugar, fecha, hora)
//  Se guardan en el dispositivo. Compartir vía el menú nativo del móvil.
// ============================================================

const Eventos = {
  KEY: 'msp_eventos',

  listar() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },
  _guardar(arr) { localStorage.setItem(this.KEY, JSON.stringify(arr)); },

  crear() {
    const nombre = $('e-nombre').value.trim();
    const lugar = $('e-lugar').value.trim();
    const fecha = $('e-fecha').value;
    const hora = $('e-hora').value;
    const notas = $('e-notas').value.trim();
    if (!nombre || !fecha) { alert(i18n.t('ev_falta')); return; }

    const arr = this.listar();
    arr.push({ id: Date.now().toString(), nombre, lugar, fecha, hora, notas });
    this._guardar(arr);
    ['e-nombre', 'e-lugar', 'e-fecha', 'e-hora', 'e-notas'].forEach(id => $(id).value = '');
    this.render();
  },

  borrar(id) {
    UI.confirmar(i18n.t('ev_borrar')).then(ok => {
      if (!ok) return;
      this._guardar(this.listar().filter(e => e.id !== id));
      this.render();
    });
  },

  compartir(id) {
    const e = this.listar().find(x => x.id === id);
    if (!e) return;
    const texto = `🏍️ ${e.nombre}\n📍 ${e.lugar || ''}\n📅 ${e.fecha} ${e.hora || ''}\n${e.notas || ''}`;
    if (navigator.share) navigator.share({ title: e.nombre, text: texto }).catch(() => {});
    else { navigator.clipboard?.writeText(texto); alert('📋 ' + texto); }
  },

  render() {
    const cont = $('view-eventos');
    cont.innerHTML = `
      <h2 data-i18n="ev_titulo">${i18n.t('ev_titulo')}</h2>
      <div class="ev-form">
        <input id="e-nombre" placeholder="${i18n.t('ev_nombre')}">
        <input id="e-lugar" placeholder="${i18n.t('ev_lugar')}">
        <div class="ev-row">
          <input id="e-fecha" type="date">
          <input id="e-hora" type="time">
        </div>
        <textarea id="e-notas" rows="2" placeholder="${i18n.t('ev_notas')}"></textarea>
        <button class="btn primary" id="e-crear" data-i18n="ev_crear">${i18n.t('ev_crear')}</button>
      </div>
      <div id="e-lista" class="ev-list"></div>
    `;
    $('e-crear').addEventListener('click', () => this.crear());
    this._lista();
  },

  _lista() {
    const cont = $('e-lista');
    const arr = this.listar().sort((a, b) =>
      (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || '')));
    if (!arr.length) { cont.innerHTML = `<p class="empty" data-i18n="ev_vacio">${i18n.t('ev_vacio')}</p>`; return; }

    cont.innerHTML = arr.map(e => {
      const d = new Date(e.fecha + 'T' + (e.hora || '00:00'));
      const fstr = isNaN(d) ? e.fecha : d.toLocaleDateString(i18n.lang, { weekday: 'short', day: '2-digit', month: 'short' });
      return `
        <div class="ev-card">
          <div class="ev-date"><b>${fstr}</b><span>${e.hora || ''}</span></div>
          <div class="ev-info">
            <div class="ev-name">${e.nombre}</div>
            ${e.lugar ? `<div class="ev-place">📍 ${e.lugar}</div>` : ''}
            ${e.notas ? `<div class="ev-notes">${e.notas}</div>` : ''}
          </div>
          <div class="ev-actions">
            <button data-share="${e.id}" title="compartir">↗</button>
            <button data-del="${e.id}" title="borrar">🗑️</button>
          </div>
        </div>`;
    }).join('');

    cont.querySelectorAll('[data-share]').forEach(b =>
      b.addEventListener('click', () => this.compartir(b.dataset.share)));
    cont.querySelectorAll('[data-del]').forEach(b =>
      b.addEventListener('click', () => this.borrar(b.dataset.del)));
  }
};
