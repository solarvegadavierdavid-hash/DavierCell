// =============================================
// PANEL DE ADMINISTRACION DAVIERCELL
// - Ingreso: correo + contrasena + Turnstile, y luego codigo 2FA (TOTP).
// - Todo permiso real vive en la base (RLS: es_admin() exige administrador + aal2).
// - Todo texto se pinta con textContent (nunca innerHTML con datos).
// =============================================
(function () {
  'use strict';

  const BUCKET = 'daviercell';
  const PUBLICA = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/';
  const SITE_KEY = (window.DC_CONFIG || {}).turnstileSiteKey || '';
  const POR_PAGINA = 30;
  const RE_COD = /^[A-Za-z0-9-]{3,24}$/;
  const peso = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });

  const st = { productos: [], categorias: [], resenas: [], pagina: 1, factorId: null, capToken: '', capId: null, editando: null, fotos: [], subiendo: 0 };
  const $ = function (id) { return document.getElementById(id); };

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
  }
  function ico(c) { const i = el('i', c); i.setAttribute('aria-hidden', 'true'); return i; }
  function norm(s) { return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); }

  let tToast = null;
  function aviso(texto, error) {
    const t = $('ad-toast');
    t.textContent = texto;
    t.className = 'ad-toast' + (error ? ' error' : '');
    t.hidden = false;
    clearTimeout(tToast);
    tToast = setTimeout(function () { t.hidden = true; }, error ? 6000 : 2500);
  }
  function falla(contexto, err) {
    console.error(contexto, err);
    const m = String((err && (err.message || err.error_description)) || '');
    if (/JWT|token|expired|not authorized|permission denied|row-level security/i.test(m)) {
      aviso('Sin permiso o sesión vencida. Vuelve a entrar.', true);
    } else if (/duplicate key|unique/i.test(m)) {
      aviso('Ese código ya existe. Usa otro.', true);
    } else if (/precio_oferta|check constraint/i.test(m)) {
      aviso('Revisa los precios: la oferta debe ser menor que el precio.', true);
    } else {
      aviso(contexto + ': ' + (m || 'error desconocido'), true);
    }
  }

  // ---------------- vistas ----------------
  function vista(id) {
    ['v-login', 'v-2fa', 'v-no', 'v-panel'].forEach(function (v) { $(v).hidden = v !== id; });
    $('ad-cargando').hidden = true;
    $('ad-tabs').hidden = id !== 'v-panel';
    $('ad-salir').hidden = id === 'v-login';
  }

  // ---------------- Turnstile ----------------
  function cargarTurnstile() {
    return new Promise(function (ok, mal) {
      if (window.turnstile) { ok(); return; }
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = function () { const t = setInterval(function () { if (window.turnstile) { clearInterval(t); ok(); } }, 50); };
      s.onerror = function () { mal(new Error('No cargo Turnstile')); };
      document.head.appendChild(s);
    });
  }
  function montarCaptcha() {
    st.capToken = '';
    if (!SITE_KEY) return;
    cargarTurnstile().then(function () {
      const zona = $('l-captcha');
      zona.textContent = '';
      st.capId = window.turnstile.render(zona, {
        sitekey: SITE_KEY, theme: 'dark',
        callback: function (t) { st.capToken = t; },
        'expired-callback': function () { st.capToken = ''; },
        'error-callback': function () { st.capToken = ''; }
      });
    }).catch(function () { aviso('No se pudo cargar la verificación anti-robots. Recarga la página.', true); });
  }

  // ---------------- ingreso y 2FA ----------------
  async function decidir() {
    const r = await sb.rpc('admin_estado');
    if (r.error) {
      if (/admin_estado/.test(r.error.message || '')) { aviso('Falta correr el SQL 5_panel_admin.sql en Supabase.', true); }
      else falla('Comprobando permisos', r.error);
      vista('v-no');
      return;
    }
    const u = (await sb.auth.getUser()).data.user;
    $('ad-correo').textContent = u ? u.email : '';
    if (r.data === 'ok') { vista('v-panel'); await cargarTodo(); return; }
    if (r.data === 'falta_2fa') { await flujo2fa(); return; }
    vista('v-no');
  }

  async function flujo2fa() {
    vista('v-2fa');
    $('m-codigo').value = '';
    const f = await sb.auth.mfa.listFactors();
    if (f.error) { falla('2FA', f.error); return; }
    const verificados = (f.data.totp || []).filter(function (x) { return x.status === 'verified'; });
    if (verificados.length) {
      st.factorId = verificados[0].id;
      $('m-alta').hidden = true;
      $('m-pide').hidden = false;
      $('m-titulo').textContent = 'Código de tu app';
    } else {
      // Quita intentos anteriores sin terminar y crea uno nuevo
      const viejos = (f.data.all || []).filter(function (x) { return x.factor_type === 'totp' && x.status !== 'verified'; });
      for (let i = 0; i < viejos.length; i++) { await sb.auth.mfa.unenroll({ factorId: viejos[i].id }); }
      const e = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'DAVIERCELL panel' });
      if (e.error) { falla('Activando 2FA', e.error); return; }
      st.factorId = e.data.id;
      $('m-qr').src = e.data.totp.qr_code;
      $('m-secreto').textContent = e.data.totp.secret;
      $('m-alta').hidden = false;
      $('m-pide').hidden = false;
      $('m-titulo').textContent = 'Activa la verificación en dos pasos';
    }
    $('m-codigo').focus();
  }

  $('f-login').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (SITE_KEY && !st.capToken) { aviso('Marca la casilla anti-robots.', true); return; }
    const b = this.querySelector('button[type="submit"]');
    b.disabled = true;
    try {
      const r = await sb.auth.signInWithPassword({ email: $('l-email').value.trim(), password: $('l-pass').value, options: st.capToken ? { captchaToken: st.capToken } : {} });
      if (r.error) { aviso('Correo o contraseña incorrectos.', true); return; }
      $('l-pass').value = '';
      await decidir();
    } catch (e) { falla('Ingreso', e); }
    finally {
      b.disabled = false;
      st.capToken = '';
      if (st.capId !== null && window.turnstile) { try { window.turnstile.reset(st.capId); } catch (e) { /* nada */ } }
    }
  });

  $('f-2fa').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    const codigo = $('m-codigo').value.replace(/\D/g, '');
    if (codigo.length !== 6) { aviso('El código tiene 6 dígitos.', true); return; }
    const b = this.querySelector('button[type="submit"]');
    b.disabled = true;
    try {
      const r = await sb.auth.mfa.challengeAndVerify({ factorId: st.factorId, code: codigo });
      if (r.error) { aviso('Código incorrecto o vencido. Prueba con el siguiente.', true); return; }
      await decidir();
    } catch (e) { falla('2FA', e); }
    finally { b.disabled = false; }
  });

  $('ad-salir').addEventListener('click', async function () {
    await sb.auth.signOut();
    st.productos = []; st.categorias = []; st.resenas = [];
    $('ad-correo').textContent = '';
    vista('v-login');
    montarCaptcha();
  });

  // ---------------- datos ----------------
  async function cargarTodo() {
    const r = await Promise.all([
      sb.from('categorias').select('*').order('orden', { ascending: true }),
      sb.from('productos').select('*').order('id', { ascending: true }),
      sb.from('resenas').select('*').order('created_at', { ascending: false })
    ]);
    for (let i = 0; i < r.length; i++) { if (r[i].error) { falla('Cargando datos', r[i].error); return; } }
    st.categorias = r[0].data;
    st.productos = r[1].data;
    st.resenas = r[2].data;
    llenarSelectsCategoria();
    pintarProductos();
    pintarCategorias();
    pintarResenas();
  }

  function padres() { return st.categorias.filter(function (c) { return c.padre_id === null; }).sort(function (a, b) { return a.orden - b.orden; }); }
  function hijos(id) { return st.categorias.filter(function (c) { return c.padre_id === id; }).sort(function (a, b) { return a.orden - b.orden; }); }
  function catPorId(id) { return st.categorias.find(function (c) { return c.id === id; }); }
  function rutaCat(id) {
    const c = catPorId(id);
    if (!c) return 'Sin categoría';
    const p = c.padre_id ? catPorId(c.padre_id) : null;
    return p ? p.nombre + ' › ' + c.nombre : c.nombre;
  }

  function llenarSelectsCategoria() {
    const filtro = $('p-cat');
    const previo = filtro.value;
    filtro.textContent = '';
    filtro.appendChild(new Option('Todas las categorías', ''));
    const ed = $('e-cat');
    ed.textContent = '';
    padres().forEach(function (p) {
      filtro.appendChild(new Option(p.nombre, 'p' + p.id));
      const g = document.createElement('optgroup');
      g.label = p.nombre;
      g.appendChild(new Option(p.nombre + ' (general)', String(p.id)));
      hijos(p.id).forEach(function (h) {
        filtro.appendChild(new Option('   › ' + h.nombre, 'h' + h.id));
        g.appendChild(new Option(h.nombre, String(h.id)));
      });
      ed.appendChild(g);
    });
    filtro.value = previo;
  }

  // ---------------- productos: lista ----------------
  function filtrados() {
    const palabras = norm($('p-buscar').value).split(/\s+/).filter(Boolean);
    const cat = $('p-cat').value;
    const estado = $('p-estado').value;
    let ids = null;
    if (cat.charAt(0) === 'p') { const id = Number(cat.slice(1)); ids = [id].concat(hijos(id).map(function (h) { return h.id; })); }
    if (cat.charAt(0) === 'h') ids = [Number(cat.slice(1))];
    return st.productos.filter(function (p) {
      if (ids && ids.indexOf(p.categoria_id) === -1) return false;
      if (estado === 'visibles' && !p.activo) return false;
      if (estado === 'ocultos' && p.activo) return false;
      if (estado === 'agotados' && p.disponible) return false;
      if (estado === 'oferta' && !p.precio_oferta) return false;
      if (estado === 'destacados' && !p.destacado) return false;
      if (estado === 'sinfoto' && (p.imagenes || []).length) return false;
      if (!palabras.length) return true;
      const t = norm([p.nombre, p.codigo, p.marca, (p.etiquetas || []).join(' ')].join(' '));
      return palabras.every(function (w) { return t.indexOf(w) !== -1; });
    }).sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
  }

  function interruptor(p, campo, titulo) {
    const l = el('label', 'ad-sw');
    l.title = titulo;
    const c = el('input');
    c.type = 'checkbox';
    c.checked = !!p[campo];
    c.setAttribute('aria-label', titulo + ': ' + p.nombre);
    c.addEventListener('change', async function () {
      c.disabled = true;
      const cambio = {};
      cambio[campo] = c.checked;
      const r = await sb.from('productos').update(cambio).eq('id', p.id).select().single();
      c.disabled = false;
      if (r.error) { c.checked = !c.checked; falla('Guardando', r.error); return; }
      Object.assign(p, r.data);
      aviso(titulo + (c.checked ? ': sí' : ': no'));
      pintarResumen();
    });
    l.appendChild(c);
    l.appendChild(el('span', 'ad-sw-txt', titulo));
    return l;
  }

  function campoPrecio(p, campo, etiqueta) {
    const w = el('label', 'ad-precio');
    w.appendChild(el('span', '', etiqueta));
    const i = el('input');
    i.type = 'number';
    i.min = '1';
    i.step = '1';
    i.inputMode = 'numeric';
    i.value = p[campo] || '';
    i.placeholder = campo === 'precio_oferta' ? '—' : '';
    i.setAttribute('aria-label', etiqueta + ' de ' + p.nombre);
    async function guardar() {
      const v = i.value.trim() === '' ? null : Math.round(Number(i.value));
      if (v === (p[campo] || null)) return;
      if (campo === 'precio' && (!v || v <= 0)) { i.value = p.precio; aviso('El precio debe ser mayor que 0.', true); return; }
      if (campo === 'precio_oferta' && v !== null && v >= p.precio) { i.value = p.precio_oferta || ''; aviso('La oferta debe ser menor que el precio.', true); return; }
      if (campo === 'precio' && p.precio_oferta && v <= p.precio_oferta) { i.value = p.precio; aviso('El precio debe ser mayor que la oferta actual.', true); return; }
      const cambio = {};
      cambio[campo] = v;
      i.disabled = true;
      const r = await sb.from('productos').update(cambio).eq('id', p.id).select().single();
      i.disabled = false;
      if (r.error) { i.value = p[campo] || ''; falla('Guardando precio', r.error); return; }
      Object.assign(p, r.data);
      aviso('Precio guardado: ' + (v ? peso.format(v) : 'sin oferta'));
      pintarResumen();
    }
    i.addEventListener('change', guardar);
    i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); i.blur(); } });
    w.appendChild(i);
    return w;
  }

  function fila(p) {
    const f = el('article', 'ad-fila' + (p.activo ? '' : ' oculto') + (p.disponible ? '' : ' agotado'));
    const img = el('img', 'ad-mini');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    const u = (p.imagenes || [])[0];
    if (u && /^https:\/\//.test(u)) img.src = u; else img.classList.add('vacia');
    f.appendChild(img);
    const info = el('div', 'ad-info');
    info.appendChild(el('strong', '', p.nombre));
    info.appendChild(el('span', 'ad-meta', p.codigo + ' · ' + rutaCat(p.categoria_id) + ((p.imagenes || []).length > 1 ? ' · ' + p.imagenes.length + ' fotos' : '')));
    const marcas = el('div', 'ad-marcas');
    if (!p.activo) marcas.appendChild(el('span', 'ad-chip gris', 'Oculto'));
    if (!p.disponible) marcas.appendChild(el('span', 'ad-chip rojo', 'Agotado'));
    if (p.precio_oferta) marcas.appendChild(el('span', 'ad-chip verde', 'Oferta'));
    if (p.destacado) marcas.appendChild(el('span', 'ad-chip azul', 'Destacado'));
    if (!(p.imagenes || []).length) marcas.appendChild(el('span', 'ad-chip gris', 'Sin foto'));
    info.appendChild(marcas);
    f.appendChild(info);
    const precios = el('div', 'ad-precios');
    precios.appendChild(campoPrecio(p, 'precio', 'Precio'));
    precios.appendChild(campoPrecio(p, 'precio_oferta', 'Oferta'));
    f.appendChild(precios);
    const sw = el('div', 'ad-sws');
    sw.appendChild(interruptor(p, 'disponible', 'Disponible'));
    sw.appendChild(interruptor(p, 'activo', 'Visible'));
    sw.appendChild(interruptor(p, 'destacado', 'Destacado'));
    f.appendChild(sw);
    const acc = el('div', 'ad-acc');
    const ed = el('button', 'ad-btn sec');
    ed.type = 'button';
    ed.appendChild(ico('fas fa-pen'));
    ed.appendChild(document.createTextNode(' Editar'));
    ed.addEventListener('click', function () { abrirEditor(p); });
    acc.appendChild(ed);
    acc.appendChild(botonBorrar('Borrar', function () { return borrarProducto(p); }));
    f.appendChild(acc);
    return f;
  }

  function botonBorrar(texto, accion) {
    const b = el('button', 'ad-btn peligro');
    b.type = 'button';
    b.appendChild(ico('fas fa-trash-can'));
    const t = document.createTextNode(' ' + texto);
    b.appendChild(t);
    let armado = false, tm = null;
    b.addEventListener('click', async function () {
      if (!armado) {
        armado = true;
        t.nodeValue = ' Confirmar';
        b.classList.add('armado');
        tm = setTimeout(function () { armado = false; t.nodeValue = ' ' + texto; b.classList.remove('armado'); }, 4000);
        return;
      }
      clearTimeout(tm);
      b.disabled = true;
      await accion();
      b.disabled = false;
    });
    return b;
  }

  function pintarResumen() {
    const P = st.productos;
    const n = function (f) { return P.filter(f).length; };
    $('p-resumen').textContent = P.length + ' productos · ' + n(function (p) { return p.activo; }) + ' visibles · ' +
      n(function (p) { return !p.disponible; }) + ' agotados · ' + n(function (p) { return !p.activo; }) + ' ocultos · ' +
      n(function (p) { return !(p.imagenes || []).length; }) + ' sin foto';
  }

  function pintarProductos() {
    pintarResumen();
    const lista = filtrados();
    const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (st.pagina > total) st.pagina = total;
    const cont = $('p-lista');
    cont.textContent = '';
    if (!lista.length) cont.appendChild(el('p', 'ad-centro', 'No hay productos con ese filtro.'));
    lista.slice((st.pagina - 1) * POR_PAGINA, st.pagina * POR_PAGINA).forEach(function (p) { cont.appendChild(fila(p)); });
    $('p-paginas').hidden = lista.length <= POR_PAGINA;
    $('p-pag').textContent = st.pagina + ' / ' + total + ' (' + lista.length + ')';
    $('p-ant').disabled = st.pagina <= 1;
    $('p-sig').disabled = st.pagina >= total;
  }

  let tBuscar = null;
  $('p-buscar').addEventListener('input', function () { clearTimeout(tBuscar); tBuscar = setTimeout(function () { st.pagina = 1; pintarProductos(); }, 200); });
  $('p-cat').addEventListener('change', function () { st.pagina = 1; pintarProductos(); });
  $('p-estado').addEventListener('change', function () { st.pagina = 1; pintarProductos(); });
  $('p-ant').addEventListener('click', function () { st.pagina--; pintarProductos(); window.scrollTo(0, 0); });
  $('p-sig').addEventListener('click', function () { st.pagina++; pintarProductos(); window.scrollTo(0, 0); });
  $('p-nuevo').addEventListener('click', function () { abrirEditor(null); });

  // ---------------- fotos ----------------
  function rutaDeUrl(u) { return typeof u === 'string' && u.indexOf(PUBLICA) === 0 ? decodeURIComponent(u.slice(PUBLICA.length)) : null; }

  async function aWebp(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error(file.name + ': usa JPG, PNG o WebP');
    if (file.size > 25 * 1024 * 1024) throw new Error(file.name + ': supera 25 MB');
    let bmp;
    try { bmp = await createImageBitmap(file); } catch (e) { throw new Error(file.name + ': no se pudo leer la imagen'); }
    const k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * k));
    c.height = Math.max(1, Math.round(bmp.height * k));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    let calidad = 0.85, blob = null;
    while (calidad >= 0.5) {
      blob = await new Promise(function (ok) { c.toBlob(ok, 'image/webp', calidad); });
      if (blob && blob.size <= 1.9 * 1024 * 1024) break;
      calidad -= 0.15;
    }
    if (!blob || blob.type !== 'image/webp') throw new Error('Tu navegador no pudo convertir a WebP. Usa Chrome o Edge.');
    return blob;
  }

  async function subirFotos(files) {
    const cod = $('e-codigo').value.trim();
    const base = RE_COD.test(cod) ? cod : 'nuevo';
    const nota = $('e-subiendo');
    for (let i = 0; i < files.length; i++) {
      if (st.fotos.length >= 8) { aviso('Máximo 8 fotos por producto.', true); break; }
      st.subiendo++;
      nota.hidden = false;
      nota.textContent = 'Subiendo foto ' + (i + 1) + ' de ' + files.length + '…';
      try {
        const blob = await aWebp(files[i]);
        const ruta = base + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + '.webp';
        const r = await sb.storage.from(BUCKET).upload(ruta, blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
        if (r.error) throw r.error;
        st.fotos.push({ url: PUBLICA + ruta, nueva: true });
        pintarFotos();
      } catch (e) { falla('Foto', e); }
      finally { st.subiendo--; }
    }
    nota.hidden = st.subiendo === 0;
  }

  function pintarFotos() {
    const cont = $('e-fotos');
    cont.textContent = '';
    if (!st.fotos.length) { cont.appendChild(el('p', 'ad-nota', 'Sin fotos todavía.')); return; }
    st.fotos.forEach(function (f, i) {
      const c = el('div', 'ad-foto' + (i === 0 ? ' principal' : ''));
      const img = el('img');
      img.src = f.url;
      img.alt = 'Foto ' + (i + 1);
      c.appendChild(img);
      if (i === 0) c.appendChild(el('span', 'ad-foto-tag', 'Principal'));
      const b = el('div', 'ad-foto-btns');
      function boton(icono, titulo, fn, deshab) {
        const x = el('button', 'ad-mini-btn');
        x.type = 'button';
        x.title = titulo;
        x.setAttribute('aria-label', titulo);
        x.disabled = !!deshab;
        x.appendChild(ico('fas ' + icono));
        x.addEventListener('click', fn);
        b.appendChild(x);
      }
      boton('fa-star', 'Poner como principal', function () { st.fotos.unshift(st.fotos.splice(i, 1)[0]); pintarFotos(); }, i === 0);
      boton('fa-arrow-left', 'Mover a la izquierda', function () { const t = st.fotos[i - 1]; st.fotos[i - 1] = st.fotos[i]; st.fotos[i] = t; pintarFotos(); }, i === 0);
      boton('fa-arrow-right', 'Mover a la derecha', function () { const t = st.fotos[i + 1]; st.fotos[i + 1] = st.fotos[i]; st.fotos[i] = t; pintarFotos(); }, i === st.fotos.length - 1);
      boton('fa-xmark', 'Quitar foto', function () { st.fotos.splice(i, 1); pintarFotos(); });
      c.appendChild(b);
      cont.appendChild(c);
    });
  }

  $('e-archivos').addEventListener('change', function () {
    const files = Array.prototype.slice.call(this.files || []);
    this.value = '';
    if (files.length) subirFotos(files);
  });

  // Borra del almacenamiento las fotos que ya no usa ningun producto
  async function limpiarFotos(urls, exceptoId) {
    const rutas = urls.filter(function (u) {
      if (!rutaDeUrl(u)) return false;
      return !st.productos.some(function (p) { return p.id !== exceptoId && (p.imagenes || []).indexOf(u) !== -1; });
    }).map(rutaDeUrl);
    if (!rutas.length) return;
    const r = await sb.storage.from(BUCKET).remove(rutas);
    if (r.error) console.error('No se pudieron borrar fotos viejas:', r.error);
  }

  // ---------------- editor ----------------
  function siguienteCodigo() {
    let max = 4000;
    st.productos.forEach(function (p) { const m = /^DC-(\d+)$/.exec(p.codigo || ''); if (m) max = Math.max(max, Number(m[1])); });
    return 'DC-' + (max + 1);
  }

  function abrirEditor(p) {
    st.editando = p;
    st.fotos = (p ? (p.imagenes || []) : []).map(function (u) { return { url: u, nueva: false }; });
    $('ed-titulo').textContent = p ? 'Editar: ' + p.nombre : 'Nuevo producto';
    $('e-codigo').value = p ? p.codigo : siguienteCodigo();
    $('e-nombre').value = p ? p.nombre : '';
    $('e-cat').value = p && p.categoria_id ? String(p.categoria_id) : '';
    $('e-marca').value = p && p.marca ? p.marca : '';
    $('e-precio').value = p ? p.precio : '';
    $('e-oferta').value = p && p.precio_oferta ? p.precio_oferta : '';
    $('e-stock').value = p && p.stock !== null && p.stock !== undefined ? p.stock : '';
    $('e-disp').checked = p ? !!p.disponible : true;
    $('e-activo').checked = p ? !!p.activo : true;
    $('e-dest').checked = p ? !!p.destacado : false;
    $('e-corta').value = p && p.descripcion_corta ? p.descripcion_corta : '';
    $('e-larga').value = p && p.descripcion ? p.descripcion : '';
    $('e-tags').value = p && p.etiquetas ? p.etiquetas.join(', ') : '';
    $('e-error').hidden = true;
    pintarFotos();
    $('ed').hidden = false;
    document.body.classList.add('ad-bloqueo');
    $('e-nombre').focus();
  }

  async function cerrarEditor() {
    if (st.subiendo > 0) { aviso('Espera a que terminen de subir las fotos.', true); return; }
    // Fotos subidas en esta edicion que no se guardaron: se borran
    const nuevas = st.fotos.filter(function (f) { return f.nueva; }).map(function (f) { return f.url; });
    st.fotos = [];
    $('ed').hidden = true;
    document.body.classList.remove('ad-bloqueo');
    if (nuevas.length) await limpiarFotos(nuevas, null);
  }

  $('ed').addEventListener('click', function (e) { if (e.target.closest('[data-cerrar]')) cerrarEditor(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('ed').hidden) cerrarEditor(); });

  function errorEditor(t) { const x = $('e-error'); x.textContent = t; x.hidden = false; }

  $('f-ed').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (st.subiendo > 0) { errorEditor('Espera a que terminen de subir las fotos.'); return; }
    const codigo = $('e-codigo').value.trim().toUpperCase();
    const precio = Math.round(Number($('e-precio').value));
    const oferta = $('e-oferta').value.trim() === '' ? null : Math.round(Number($('e-oferta').value));
    const stock = $('e-stock').value.trim() === '' ? null : Math.round(Number($('e-stock').value));
    const catId = Number($('e-cat').value);
    if (!RE_COD.test(codigo)) { errorEditor('Código inválido: 3 a 24 letras, números o guiones.'); return; }
    if (st.productos.some(function (x) { return x.codigo === codigo && (!st.editando || x.id !== st.editando.id); })) { errorEditor('Ya existe un producto con el código ' + codigo + '.'); return; }
    if ($('e-nombre').value.trim().length < 2) { errorEditor('Escribe el nombre.'); return; }
    if (!catId) { errorEditor('Elige la categoría.'); return; }
    if (!(precio > 0)) { errorEditor('El precio debe ser mayor que 0.'); return; }
    if (oferta !== null && !(oferta > 0 && oferta < precio)) { errorEditor('La oferta debe ser mayor que 0 y menor que el precio.'); return; }
    if (stock !== null && stock < 0) { errorEditor('El stock no puede ser negativo.'); return; }
    const datos = {
      codigo: codigo,
      nombre: $('e-nombre').value.trim(),
      categoria_id: catId,
      marca: $('e-marca').value.trim() || null,
      precio: precio,
      precio_oferta: oferta,
      stock: stock,
      disponible: $('e-disp').checked,
      activo: $('e-activo').checked,
      destacado: $('e-dest').checked,
      descripcion_corta: $('e-corta').value.trim() || null,
      descripcion: $('e-larga').value.trim() || null,
      etiquetas: $('e-tags').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 20),
      imagenes: st.fotos.map(function (f) { return f.url; })
    };
    const b = $('e-guardar');
    b.disabled = true;
    try {
      const anterior = st.editando ? (st.editando.imagenes || []).slice() : [];
      const r = st.editando
        ? await sb.from('productos').update(datos).eq('id', st.editando.id).select().single()
        : await sb.from('productos').insert(datos).select().single();
      if (r.error) { falla('Guardando producto', r.error); return; }
      if (st.editando) Object.assign(st.editando, r.data); else st.productos.push(r.data);
      const quitadas = anterior.filter(function (u) { return datos.imagenes.indexOf(u) === -1; });
      st.fotos = [];
      $('ed').hidden = true;
      document.body.classList.remove('ad-bloqueo');
      await limpiarFotos(quitadas, r.data.id);
      aviso('Producto guardado.');
      pintarProductos();
      pintarCategorias();
    } finally { b.disabled = false; }
  });

  async function borrarProducto(p) {
    const r = await sb.from('productos').delete().eq('id', p.id);
    if (r.error) { falla('Borrando', r.error); return; }
    st.productos = st.productos.filter(function (x) { return x.id !== p.id; });
    await limpiarFotos(p.imagenes || [], p.id);
    aviso('Producto borrado.');
    pintarProductos();
    pintarCategorias();
  }

  // ---------------- exportar ----------------
  $('p-exportar').addEventListener('click', function () {
    const cab = ['codigo', 'nombre', 'categoria', 'marca', 'precio', 'precio_oferta', 'disponible', 'visible', 'destacado', 'stock', 'descripcion_corta', 'etiquetas', 'imagenes'];
    const q = function (v) { v = v === null || v === undefined ? '' : String(v); return /[",;\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const filas = filtrados().map(function (p) {
      return [p.codigo, p.nombre, rutaCat(p.categoria_id), p.marca, p.precio, p.precio_oferta, p.disponible ? 'si' : 'no', p.activo ? 'si' : 'no',
        p.destacado ? 'si' : 'no', p.stock, p.descripcion_corta, (p.etiquetas || []).join(', '), (p.imagenes || []).join(' ')].map(q).join(';');
    });
    const blob = new Blob(['﻿' + cab.join(';') + '\r\n' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'daviercell-productos-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });

  // ---------------- categorias ----------------
  function contarEn(id) { return st.productos.filter(function (p) { return p.categoria_id === id; }).length; }

  function filaCat(c, esHija) {
    const f = el('div', 'ad-cat' + (esHija ? ' hija' : ''));
    const nombre = el('input');
    nombre.type = 'text';
    nombre.value = c.nombre;
    nombre.maxLength = 60;
    nombre.setAttribute('aria-label', 'Nombre de la categoría');
    const orden = el('input');
    orden.type = 'number';
    orden.value = c.orden;
    orden.step = '1';
    orden.className = 'ad-orden';
    orden.setAttribute('aria-label', 'Orden');
    const lab = el('label', 'ad-check');
    const act = el('input');
    act.type = 'checkbox';
    act.checked = !!c.activa;
    lab.appendChild(act);
    lab.appendChild(document.createTextNode(' Activa'));
    const n = esHija ? contarEn(c.id) : contarEn(c.id) + hijos(c.id).reduce(function (s, h) { return s + contarEn(h.id); }, 0);
    const guardar = el('button', 'ad-btn sec', 'Guardar');
    guardar.type = 'button';
    guardar.addEventListener('click', async function () {
      const nom = nombre.value.trim();
      if (nom.length < 2) { aviso('Nombre muy corto.', true); return; }
      const r = await sb.from('categorias').update({ nombre: nom, orden: Math.round(Number(orden.value) || 0), activa: act.checked }).eq('id', c.id).select().single();
      if (r.error) { falla('Guardando categoría', r.error); return; }
      Object.assign(c, r.data);
      llenarSelectsCategoria();
      pintarCategorias();
      aviso('Categoría guardada.');
    });
    f.appendChild(nombre);
    f.appendChild(orden);
    f.appendChild(lab);
    f.appendChild(el('span', 'ad-meta', n + ' productos'));
    f.appendChild(guardar);
    if (!esHija) {
      const sub = el('button', 'ad-btn sec', '+ Subcategoría');
      sub.type = 'button';
      sub.addEventListener('click', function () { crearCategoria(c); });
      f.appendChild(sub);
    }
    if (n === 0 && (esHija || !hijos(c.id).length)) {
      f.appendChild(botonBorrar('Borrar', async function () {
        const r = await sb.from('categorias').delete().eq('id', c.id);
        if (r.error) { falla('Borrando categoría', r.error); return; }
        st.categorias = st.categorias.filter(function (x) { return x.id !== c.id; });
        llenarSelectsCategoria();
        pintarCategorias();
        aviso('Categoría borrada.');
      }));
    }
    return f;
  }

  async function crearCategoria(padre) {
    const nom = (window.prompt(padre ? 'Nombre de la nueva subcategoría de ' + padre.nombre + ':' : 'Nombre de la nueva categoría principal:') || '').trim();
    if (!nom) return;
    if (nom.length < 2 || nom.length > 60) { aviso('El nombre debe tener entre 2 y 60 caracteres.', true); return; }
    let s = slug(nom);
    if (st.categorias.some(function (c) { return c.slug === s; })) s = slug((padre ? padre.slug + '-' : '') + nom);
    if (st.categorias.some(function (c) { return c.slug === s; })) s = s + '-' + Date.now().toString(36).slice(-4);
    const hermanos = padre ? hijos(padre.id) : padres();
    const orden = hermanos.reduce(function (m, c) { return Math.max(m, c.orden || 0); }, 0) + 1;
    const r = await sb.from('categorias').insert({ nombre: nom, slug: s, orden: orden, activa: true, padre_id: padre ? padre.id : null }).select().single();
    if (r.error) { falla('Creando categoría', r.error); return; }
    st.categorias.push(r.data);
    llenarSelectsCategoria();
    pintarCategorias();
    aviso('Categoría creada.');
  }
  $('c-nueva').addEventListener('click', function () { crearCategoria(null); });

  function pintarCategorias() {
    const cont = $('c-lista');
    cont.textContent = '';
    padres().forEach(function (p) {
      const g = el('section', 'ad-catgrupo');
      g.appendChild(filaCat(p, false));
      hijos(p.id).forEach(function (h) { g.appendChild(filaCat(h, true)); });
      cont.appendChild(g);
    });
  }

  // ---------------- resenas ----------------
  function pintarResenas() {
    const pend = st.resenas.filter(function (r) { return !r.aprobada; }).length;
    const b = $('ad-pend');
    b.textContent = String(pend);
    b.hidden = pend === 0;
    const filtro = $('r-filtro').value;
    const lista = st.resenas.filter(function (r) { return filtro === 'todas' || (filtro === 'aprobadas' ? r.aprobada : !r.aprobada); });
    const cont = $('r-lista');
    cont.textContent = '';
    if (!lista.length) { cont.appendChild(el('p', 'ad-centro', filtro === 'pendientes' ? 'No hay reseñas pendientes.' : 'No hay reseñas.')); return; }
    lista.forEach(function (r) {
      const c = el('article', 'ad-resena' + (r.aprobada ? ' ok' : ''));
      const cab = el('div', 'ad-resena-cab');
      cab.appendChild(el('strong', '', r.nombre || 'Anónimo'));
      cab.appendChild(el('span', 'ad-est', '★'.repeat(r.estrellas || 0) + '☆'.repeat(5 - (r.estrellas || 0))));
      cab.appendChild(el('span', 'ad-meta', new Date(r.created_at).toLocaleString('es-CO')));
      c.appendChild(cab);
      c.appendChild(el('p', '', r.comentario || ''));
      const acc = el('div', 'ad-acc');
      const t = el('button', 'ad-btn' + (r.aprobada ? ' sec' : ''), r.aprobada ? 'Ocultar' : 'Aprobar y publicar');
      t.type = 'button';
      t.addEventListener('click', async function () {
        const x = await sb.from('resenas').update({ aprobada: !r.aprobada }).eq('id', r.id).select().single();
        if (x.error) { falla('Reseña', x.error); return; }
        Object.assign(r, x.data);
        pintarResenas();
        aviso(r.aprobada ? 'Reseña publicada.' : 'Reseña ocultada.');
      });
      acc.appendChild(t);
      acc.appendChild(botonBorrar('Borrar', async function () {
        const x = await sb.from('resenas').delete().eq('id', r.id);
        if (x.error) { falla('Reseña', x.error); return; }
        st.resenas = st.resenas.filter(function (y) { return y.id !== r.id; });
        pintarResenas();
        aviso('Reseña borrada.');
      }));
      c.appendChild(acc);
      cont.appendChild(c);
    });
  }
  $('r-filtro').addEventListener('change', pintarResenas);

  // ---------------- pestanas ----------------
  $('ad-tabs').addEventListener('click', function (e) {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    document.querySelectorAll('.ad-tab').forEach(function (x) { x.classList.toggle('activo', x === b); });
    ['productos', 'categorias', 'resenas'].forEach(function (t) { $('t-' + t).hidden = t !== b.dataset.tab; });
  });

  // ---------------- arranque ----------------
  (async function () {
    try {
      const s = await sb.auth.getSession();
      if (s.data && s.data.session) { await decidir(); return; }
    } catch (e) { console.error(e); }
    vista('v-login');
    montarCaptcha();
  })();
})();
