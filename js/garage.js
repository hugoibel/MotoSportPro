// ============================================================
//  MI MOTO — perfil de la moto (con foto) + desgaste por mantenimiento
//  Los datos se guardan en el dispositivo (localStorage).
//  El "consumo" (L/100km) alimenta el cálculo de la sección Gasolina.
// ============================================================

// Intervalos genéricos estilo fabricante (km). Editables por el usuario.
const MANT_ITEMS = [
  { id: 'aceite',      intervalo: 6000 },
  { id: 'filtroAire',  intervalo: 12000 },
  { id: 'bujias',      intervalo: 12000 },
  { id: 'cadena',      intervalo: 25000 },
  { id: 'pastillas',   intervalo: 20000 },
  { id: 'neumaticos',  intervalo: 15000 },
  { id: 'refrigerante',intervalo: 24000 }
];

const Garage = {
  KEY: 'msp_moto',

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || this._vacia(); }
    catch { return this._vacia(); }
  },
  _vacia() {
    return { marca: '', modelo: '', anio: '', cc: '', consumo: '', deposito: '', km: 0, foto: null, mant: {} };
  },
  save(m) {
    try { localStorage.setItem(this.KEY, JSON.stringify(m)); }
    catch (e) { alert('No se pudo guardar (foto demasiado grande).'); }
  },

  // consumo para la sección Gasolina (L/100km) o null
  consumo() {
    const c = parseFloat(this.get().consumo);
    return isNaN(c) ? null : c;
  },

  // Redimensiona la foto a máx 720px y la guarda como dataURL ligero
  ponerFoto(file) {
    return new Promise(resolve => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 720, esc = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = img.width * esc; cv.height = img.height * esc;
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          const m = this.get();
          m.foto = cv.toDataURL('image/jpeg', 0.8);
          this.save(m); resolve();
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  },

  guardarDatos() {
    const m = this.get();
    m.marca = $('m-marca').value.trim();
    m.modelo = $('m-modelo').value.trim();
    m.anio = $('m-anio').value.trim();
    m.cc = $('m-cc').value.trim();
    // Consumo, depósito y km se introducen en la unidad elegida → se guardan en base
    const cons = parseFloat($('m-consumo').value);
    m.consumo = isNaN(cons) ? '' : Units.consToBase(cons);
    const dep = parseFloat($('m-deposito').value);
    m.deposito = isNaN(dep) ? '' : Units.volToBase(dep);
    const km = parseFloat($('m-km').value);
    m.km = isNaN(km) ? 0 : Math.round(Units.distToBase(km));
    this.save(m);
    this.render();
  },

  setUltimo(id) {
    const m = this.get();
    const actualUser = Math.round(Units.distToUser(m.mant[id] != null ? m.mant[id] : 0));
    const v = prompt(`${i18n.t('moto_set_ultimo')} (${Units.distLabel()}):`, actualUser);
    if (v === null) return;
    m.mant[id] = Math.round(Units.distToBase(parseFloat(v) || 0));
    this.save(m);
    this.render();
  },

  render() {
    const m = this.get();
    const cont = $('view-moto');
    const fotoHtml = m.foto
      ? `<img src="${m.foto}" class="moto-foto" alt="moto">`
      : `<div class="moto-foto vacia">📷<span data-i18n="moto_anadir_foto">${i18n.t('moto_anadir_foto')}</span></div>`;

    const titulo = (m.marca || m.modelo) ? `${m.marca} ${m.modelo}`.trim() : i18n.t('moto_sin');

    // Valores mostrados en la unidad elegida
    const consU = (m.consumo !== '' && m.consumo != null) ? Units.consToUser(parseFloat(m.consumo)).toFixed(1) : '';
    const depU = (m.deposito !== '' && m.deposito != null) ? Units.volToUser(parseFloat(m.deposito)).toFixed(1) : '';
    const kmU = m.km ? Math.round(Units.distToUser(m.km)) : 0;

    cont.innerHTML = `
      <h2 data-i18n="moto_titulo">${i18n.t('moto_titulo')}</h2>
      <label class="moto-foto-wrap">
        ${fotoHtml}
        <input type="file" id="m-foto" accept="image/*" hidden>
      </label>
      <div class="moto-nombre">${titulo}</div>

      <div class="form-grid">
        <label>${i18n.t('moto_marca')}<input id="m-marca" value="${m.marca || ''}"></label>
        <label>${i18n.t('moto_modelo')}<input id="m-modelo" value="${m.modelo || ''}"></label>
        <label>${i18n.t('moto_anio')}<input id="m-anio" type="number" value="${m.anio || ''}"></label>
        <label>${i18n.t('moto_cc')}<input id="m-cc" type="number" value="${m.cc || ''}"></label>
        <label>${i18n.t('moto_consumo')} (${Units.consLabel()})<input id="m-consumo" type="number" step="0.1" value="${consU}"></label>
        <label>${i18n.t('moto_deposito')} (${Units.volLabel()})<input id="m-deposito" type="number" step="0.1" value="${depU}"></label>
        <label>${i18n.t('moto_km')} (${Units.distLabel()})<input id="m-km" type="number" value="${kmU}"></label>
      </div>
      <button class="btn primary" id="m-guardar" data-i18n="moto_guardar">${i18n.t('moto_guardar')}</button>

      <h2 style="margin-top:24px" data-i18n="moto_mant_titulo">${i18n.t('moto_mant_titulo')}</h2>
      <div class="mant-list">${this._mantHtml(m)}</div>
    `;

    $('m-foto').addEventListener('change', e => {
      if (e.target.files[0]) this.ponerFoto(e.target.files[0]).then(() => this.render());
    });
    $('m-guardar').addEventListener('click', () => this.guardarDatos());
    cont.querySelectorAll('.mant-item').forEach(el =>
      el.addEventListener('click', () => this.setUltimo(el.dataset.id)));
  },

  _mantHtml(m) {
    const km = m.km || 0;
    return MANT_ITEMS.map(it => {
      const ultimo = m.mant[it.id] != null ? m.mant[it.id] : 0;
      const recorrido = Math.max(0, km - ultimo);
      const pct = Math.min(100, Math.round((recorrido / it.intervalo) * 100));
      const restante = it.intervalo - recorrido;
      const clase = pct >= 90 ? 'rojo' : pct >= 70 ? 'ambar' : 'verde';
      const u = Units.distLabel();
      const restU = Math.round(Units.distToUser(restante));
      const recU = Math.round(Units.distToUser(recorrido));
      const intU = Math.round(Units.distToUser(it.intervalo));
      const estado = restante <= 0
        ? `<span class="mant-rev">${i18n.t('moto_revisar')}</span>`
        : `${restU.toLocaleString(i18n.lang)} ${u}`;
      return `
        <div class="mant-item ${clase}" data-id="${it.id}">
          <div class="mant-top">
            <span>${i18n.t('m_' + it.id)}</span>
            <span class="mant-rest">${estado}</span>
          </div>
          <div class="mant-bar"><div class="mant-fill" style="width:${pct}%"></div></div>
          <div class="mant-sub">${recU.toLocaleString(i18n.lang)} / ${intU.toLocaleString(i18n.lang)} ${u}</div>
        </div>`;
    }).join('');
  }
};
