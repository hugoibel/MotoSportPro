// ============================================================
//  DETECCIÓN DE CAÍDAS + SOS
//  Mientras se graba, vigila el acelerómetro del móvil. Un golpe
//  muy fuerte (> ~5G) dispara una alarma con cuenta atrás:
//  - Si el motorista pulsa "ESTOY BIEN", no pasa nada.
//  - Si no responde, se abre la pantalla SOS con su ubicación y
//    el SMS / llamada al contacto de emergencia preparados.
//  Todo ocurre en el móvil: no necesita internet ni servidor.
// ============================================================

const SOS = {
  UMBRAL: 49,          // m/s² ≈ 5G — un bache no llega, una caída sí
  CUENTA_SEG: 30,      // segundos para responder antes de activar el SOS

  activo: true,        // ajuste del usuario (toggle)
  tel: '',             // teléfono de emergencia
  _armado: false,      // escuchando el acelerómetro (solo al grabar)
  _enCurso: false,     // alarma ya disparada (no re-disparar)
  _test: false,
  _onMotion: null,

  init() {
    this.activo = localStorage.getItem('msp_sos_on') !== '0';
    this.tel = localStorage.getItem('msp_sos_tel') || '';
    const chk = $('sos-on'), tel = $('sos-tel');
    if (chk) {
      chk.checked = this.activo;
      chk.addEventListener('change', () => {
        this.activo = chk.checked;
        localStorage.setItem('msp_sos_on', this.activo ? '1' : '0');
      });
    }
    if (tel) {
      tel.value = this.tel;
      tel.addEventListener('change', () => {
        this.tel = tel.value.trim();
        localStorage.setItem('msp_sos_tel', this.tel);
      });
    }
    const test = $('sos-test');
    if (test) test.addEventListener('click', () => this.probar());
    $('sos-bien').addEventListener('click', () => this._estoyBien());
    $('sos-ya').addEventListener('click', () => this._activarSOS());
    $('sos-cerrar').addEventListener('click', () => this._estoyBien());
  },

  // La llama app.js al INICIAR la grabación (gesto del usuario:
  // necesario para el permiso de movimiento en iOS y para el audio)
  armar() {
    if (!this.activo) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !this._actx) this._actx = new AC();
      if (this._actx && this._actx.state === 'suspended') this._actx.resume();
    } catch (e) { /* sin audio: la alarma será solo visual/vibración */ }

    const escuchar = () => {
      if (this._onMotion) return;
      this._onMotion = e => this._medir(e);
      window.addEventListener('devicemotion', this._onMotion);
      this._armado = true;
    };
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(st => { if (st === 'granted') escuchar(); })
        .catch(() => {});
    } else escuchar();
  },

  // La llama app.js al PARAR la grabación
  desarmar() {
    if (this._onMotion) {
      window.removeEventListener('devicemotion', this._onMotion);
      this._onMotion = null;
    }
    this._armado = false;
  },

  _medir(e) {
    if (this._enCurso) return;
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    if (mag > this.UMBRAL) this._posibleCaida(false);
  },

  // Botón "Probar alarma" de Ajustes (cuenta corta y sin SMS automático)
  probar() {
    const m = $('ajustes-modal');
    if (m) { m.classList.remove('in'); m.style.display = 'none'; }
    this._posibleCaida(true);
  },

  _posibleCaida(esTest) {
    if (this._enCurso) return;
    this._enCurso = true;
    this._test = !!esTest;
    this._restante = esTest ? 10 : this.CUENTA_SEG;

    const o = $('sos-overlay');
    o.style.display = 'flex';
    $('sos-acciones').style.display = 'none';
    $('sos-pregunta-bloque').style.display = 'flex';
    this._pintarCuenta();

    this._sirena();
    this._vibraInt = setInterval(() => UI.vibrar([300, 100, 300]), 900);
    this._decir(i18n.t('sos_detectada'));

    this._cuentaInt = setInterval(() => {
      this._restante--;
      if (this._restante <= 0) { this._activarSOS(); return; }
      this._pintarCuenta();
    }, 1000);
  },

  _pintarCuenta() {
    $('sos-cuenta').textContent = this._restante;
    $('sos-sub').textContent = i18n.t('sos_enviando').replace('{s}', this._restante);
  },

  _estoyBien() {
    this._pararAlarma();
    this._enCurso = false;
    const o = $('sos-overlay');
    o.style.display = 'none';
  },

  // Se acabó la cuenta (o pulsó "SOS AHORA"): pantalla de auxilio
  _activarSOS() {
    clearInterval(this._cuentaInt);
    this._pararSirena();                  // la sirena para; la vibración sigue
    $('sos-pregunta-bloque').style.display = 'none';
    $('sos-acciones').style.display = 'flex';

    const pos = (typeof ultimaPos !== 'undefined' && ultimaPos) ? ultimaPos : null;
    const ubic = pos ? `https://maps.google.com/?q=${pos[0].toFixed(6)},${pos[1].toFixed(6)}` : '';
    const msj = `${i18n.t('sos_msj')} ${ubic}`.trim();

    const sms = $('sos-sms'), tel = $('sos-tel-btn');
    sms.href = this._smsHref(this.tel, msj);
    sms.textContent = '💬 ' + i18n.t('sos_sms');
    if (this.tel) {
      tel.style.display = '';
      tel.href = 'tel:' + this.tel;
      tel.textContent = '📞 ' + i18n.t('sos_llamar') + ' ' + this.tel;
    } else {
      tel.style.display = 'none';
      UI.toast(i18n.t('sos_sin_tel'), 'err');
    }
    $('sos-ubic').textContent = pos ? `📍 ${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}` : '';

    this._decir(i18n.t('sos_activado_voz'));
    // Intento automático de abrir el SMS ya redactado (el envío final
    // siempre lo hace la app de mensajes; en una web no se puede enviar solo)
    if (!this._test && this.tel) {
      try { window.location.href = sms.href; } catch (e) { /* bloqueado: quedan los botones */ }
    }
  },

  _pararAlarma() {
    clearInterval(this._cuentaInt);
    clearInterval(this._vibraInt);
    this._pararSirena();
    try { if (navigator.vibrate) navigator.vibrate(0); } catch (e) {}
  },

  // --- Sirena con el altavoz (Web Audio, sin archivos) ---
  _sirena() {
    try {
      if (!this._actx) return;
      const o = this._actx.createOscillator(), g = this._actx.createGain();
      o.type = 'square';
      g.gain.value = 0.5;
      o.connect(g); g.connect(this._actx.destination);
      o.start();
      this._osc = o; this._gain = g;
      let alto = false;
      this._sirenaInt = setInterval(() => {
        alto = !alto;
        try { o.frequency.setValueAtTime(alto ? 1300 : 750, this._actx.currentTime); } catch (e) {}
      }, 350);
    } catch (e) { /* sin audio */ }
  },
  _pararSirena() {
    clearInterval(this._sirenaInt);
    try { if (this._osc) this._osc.stop(); } catch (e) {}
    try { if (this._gain) this._gain.disconnect(); } catch (e) {}
    this._osc = null; this._gain = null;
  },

  _decir(txt) {
    try {
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = ({ es: 'es-ES', en: 'en-US', de: 'de-DE', fr: 'fr-FR', it: 'it-IT' })[i18n.lang] || 'en-US';
      u.rate = 1.0;
      speechSynthesis.speak(u);
    } catch (e) {}
  },

  // iOS separa el cuerpo del SMS con '&', Android con '?'
  _smsHref(tel, cuerpo) {
    const sep = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?';
    return `sms:${tel || ''}${sep}body=${encodeURIComponent(cuerpo)}`;
  }
};
