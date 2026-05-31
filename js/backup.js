// ============================================================
//  COPIA DE SEGURIDAD DE FOTOS
//  Exporta a un archivo todas las fotos que el usuario ha subido
//  (productos de la tienda + foto de la moto) para no perderlas y
//  poder pasármelas el día de publicar. También permite importarlas.
// ============================================================

const Backup = {
  exportar() {
    const data = {
      app: 'MotoSportPro',
      version: 1,
      fecha: new Date().toISOString(),
      tienda: Store.fotosGet(),                 // { nombreProducto: dataURL }
      moto_foto: Garage.get().foto || null      // foto de "Mi Moto"
    };
    const n = Object.keys(data.tienda).length + (data.moto_foto ? 1 : 0);
    if (n === 0) { alert(i18n.t('backup_vacio')); return; }

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'motosportpro-fotos.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  importar(file) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const d = JSON.parse(fr.result);
        if (d.tienda) localStorage.setItem(Store.FOTOS_KEY, JSON.stringify(d.tienda));
        if (d.moto_foto) { const m = Garage.get(); m.foto = d.moto_foto; Garage.save(m); }
        alert(i18n.t('backup_ok'));
        Store.render();
      } catch (e) {
        alert(i18n.t('backup_error'));
      }
    };
    fr.readAsText(file);
  }
};
