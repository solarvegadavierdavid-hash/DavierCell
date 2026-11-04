// =============================================
// PQRS - adjuntar archivos (Supabase Storage privado)
// Usa SUPABASE_URL y SUPABASE_KEY definidas en app.js
// Debe cargarse DESPUES de app.js
// =============================================
(function () {
  'use strict';

  const BUCKET = 'pqrs-archivos';
  const MAX_ARCHIVOS = 3;
  const MAX_BYTES = 5 * 1024 * 1024;
  const TIPOS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
  const AYUDA = 'M\u00e1ximo 3 archivos de 5 MB (JPG, PNG, WebP o PDF).';

  function msg(texto, clase) {
    const m = document.getElementById('pqrs-archivos-msg');
    if (!m) return;
    m.textContent = texto;
    m.className = 'pqrs-archivos-msg' + (clase ? ' ' + clase : '');
  }

  function mb(n) { return (n / 1048576).toFixed(1).replace('.', ',') + ' MB'; }

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    const b = window.crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  function problema(lista) {
    if (lista.length > MAX_ARCHIVOS) return 'Puedes adjuntar hasta ' + MAX_ARCHIVOS + ' archivos.';
    for (let i = 0; i < lista.length; i++) {
      const f = lista[i];
      if (!TIPOS[f.type]) return '"' + f.name + '" no es un tipo permitido. Usa JPG, PNG, WebP o PDF.';
      if (f.size === 0) return '"' + f.name + '" est\u00e1 vac\u00edo.';
      if (f.size > MAX_BYTES) return '"' + f.name + '" pesa ' + mb(f.size) + ' y el m\u00e1ximo es 5 MB.';
    }
    return '';
  }

  async function subir(f) {
    const ruta = new Date().toISOString().slice(0, 10) + '/' + uuid() + '.' + TIPOS[f.type];
    const r = await fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + ruta, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': f.type,
        'x-upsert': 'false'
      },
      body: f
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return ruta;
  }

  function enlazar() {
    const input = document.getElementById('pqrs-archivos');
    if (!input) return;
    input.addEventListener('change', function () {
      const lista = Array.prototype.slice.call(input.files || []);
      if (!lista.length) { msg(AYUDA); return; }
      const error = problema(lista);
      if (error) { input.value = ''; msg(error, 'error'); return; }
      msg(lista.map(function (f) { return f.name + ' (' + mb(f.size) + ')'; }).join(' \u00b7 '), 'ok');
    });
    const form = document.getElementById('form-pqrs');
    if (form) form.addEventListener('reset', function () { msg(AYUDA); });
  }

  // Envuelve enviarASupabase (definida en app.js): sube los archivos y agrega sus rutas al registro
  const original = window.enviarASupabase;
  if (typeof original === 'function') {
    window.enviarASupabase = async function (datos) {
      if (!datos || datos.tipo !== 'pqrs') return original(datos);
      const input = document.getElementById('pqrs-archivos');
      const archivos = input ? Array.prototype.slice.call(input.files || []) : [];
      if (!archivos.length) return original(datos);
      const error = problema(archivos);
      if (error) { msg(error, 'error'); return false; }
      try {
        const rutas = [];
        for (let i = 0; i < archivos.length; i++) rutas.push(await subir(archivos[i]));
        datos.archivos = rutas;
      } catch (e) {
        console.error('Error subiendo archivos:', e);
        msg('No pudimos subir tus archivos. Intenta de nuevo o env\u00eda la solicitud sin adjuntos.', 'error');
        return false;
      }
      return original(datos);
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enlazar);
  else enlazar();
})();
