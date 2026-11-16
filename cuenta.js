// =============================================
// CUENTAS DE CLIENTES DAVIERCELL
// Registro obligatorio al agregar al carrito (Supabase Auth + perfil + Cloudflare Turnstile).
// - Apagado por defecto: se enciende con DC_CONFIG.registroActivo (config.js).
// - La libreria de Supabase vive en vendor/supabase y solo se carga cuando hace falta.
// - Todo texto del cliente se pone con textContent (nunca innerHTML).
// - La validacion real esta en la base de datos (RLS, checks, trigger); aqui solo es comodidad.
// =============================================
(function () {
  'use strict';

  const cfg = window.DC_CONFIG || {};
  if (!cfg.registroActivo || typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_KEY === 'undefined') {
    window.DCCuenta = { activo: function () { return false; }, listo: function () { return true; }, datosPedido: function () { return null; } };
    return;
  }

  const SITE_KEY = cfg.turnstileSiteKey || '';
  const PEND = 'dc-pendiente';
  const WHATSAPP = '573205972997';
  const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  let sb = null, iniciando = null, user = null, perfil = null;
  let modal = null, caja = null, capToken = '', capId = null, ultimoFoco = null, enviando = false;

  // ---------- utilidades ----------
  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }
  function $(id) { return document.getElementById(id); }
  function soloDigitos(t) {
    let d = String(t || '').replace(/[^0-9]/g, '');
    if (d.length === 12 && d.indexOf('57') === 0) d = d.slice(2);
    return d;
  }
  // Debe coincidir con Supabase Auth: minimo 8, con minuscula, mayuscula, numero y simbolo
  const AYUDA_CLAVE = 'Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo (por ejemplo: Davier#2026).';
  function claveValida(c) { return c.length >= 8 && /[a-z]/.test(c) && /[A-Z]/.test(c) && /[0-9]/.test(c) && /[^A-Za-z0-9]/.test(c); }
  function cargarScript(src) {
    return new Promise(function (ok, fallo) {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = ok;
      s.onerror = function () { fallo(new Error('No se pudo cargar ' + src)); };
      document.head.appendChild(s);
    });
  }

  // ---------- pendiente: el producto que el cliente queria agregar ----------
  function guardarPendiente(p) {
    try {
      const imgs = (p.imagenes || []).filter(function (u) { return typeof u === 'string' && /^https:\/\//i.test(u); }).slice(0, 1);
      localStorage.setItem(PEND, JSON.stringify({ t: Date.now(), p: { codigo: p.codigo, nombre: p.nombre, precio: p.precio, precio_oferta: p.precio_oferta, disponible: p.disponible, imagenes: imgs } }));
    } catch (e) { /* sin almacenamiento */ }
  }
  function leerPendiente() {
    try {
      const j = JSON.parse(localStorage.getItem(PEND) || 'null');
      if (!j || !j.p || Date.now() - j.t > 60 * 60 * 1000) { localStorage.removeItem(PEND); return null; }
      return j.p;
    } catch (e) { return null; }
  }
  function borrarPendiente() { try { localStorage.removeItem(PEND); } catch (e) { /* nada */ } }
  function cumplirPendiente() {
    const p = leerPendiente();
    if (!p) return false;
    borrarPendiente();
    cerrar();
    if (window.DCCarrito) window.DCCarrito.agregar(p);
    return true;
  }

  // ---------- cliente de Supabase (se carga solo cuando hace falta) ----------
  function iniciarCliente() {
    if (iniciando) return iniciando;
    iniciando = (window.supabase && window.supabase.createClient ? Promise.resolve() : cargarScript('vendor/supabase/supabase.js'))
      .then(function () {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
        sb.auth.onAuthStateChange(function (ev, ses) {
          // No se llama a Supabase dentro del callback: se difiere un instante
          setTimeout(function () { alCambiarSesion(ev, ses); }, 0);
        });
      })
      .catch(function (e) { iniciando = null; throw e; });
    return iniciando;
  }

  async function cargarPerfil() {
    if (!user) { perfil = null; return; }
    const r = await sb.from('perfiles').select('nombre,telefono,ciudad,direccion').eq('id', user.id).maybeSingle();
    if (r.error) console.error('Error leyendo el perfil:', r.error.message);
    perfil = r.data || { nombre: null, telefono: null, ciudad: null, direccion: null };
  }
  function perfilCompleto(p) { return !!(p && p.nombre && p.telefono && p.ciudad && p.direccion); }
  function listo() { return !!(user && perfilCompleto(perfil)); }

  async function alCambiarSesion(ev, ses) {
    user = ses && ses.user ? ses.user : null;
    if (ev === 'PASSWORD_RECOVERY') { abrir('newpass'); return; }
    if (ev === 'SIGNED_OUT' || !user) { perfil = null; actualizarEnlace(); return; }
    await cargarPerfil();
    actualizarEnlace();
    if (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') {
      if (ev === 'SIGNED_IN') tocarActividad();
      if (leerPendiente()) {
        if (listo()) cumplirPendiente();
        else abrir('perfil', 'Completa tus datos para terminar tu registro.');
      }
    }
  }

  function tocarActividad() {
    if (!sb || !user) return;
    sb.from('perfiles').update({ ultima_actividad: new Date().toISOString() }).eq('id', user.id)
      .then(function (r) { if (r && r.error) console.error('Actividad:', r.error.message); });
  }

  // ---------- entrada desde el carrito ----------
  async function pedirRegistro(producto) {
    if (producto) guardarPendiente(producto);
    try {
      await iniciarCliente();
      const s = await sb.auth.getSession();
      user = s.data && s.data.session ? s.data.session.user : null;
      if (user) await cargarPerfil();
      if (listo()) { cumplirPendiente(); return; }
      abrir(user ? 'perfil' : 'signup', user ? 'Completa tus datos para poder hacer tu pedido.' : '');
    } catch (e) {
      console.error('Registro no disponible:', e);
      abrir('fallo');
    }
  }

  // ---------- anti-robots (Cloudflare Turnstile) ----------
  function cargarTurnstile() {
    if (window.turnstile) return Promise.resolve();
    return cargarScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit').then(function () {
      return new Promise(function (ok) {
        const t = setInterval(function () { if (window.turnstile) { clearInterval(t); ok(); } }, 50);
        setTimeout(function () { clearInterval(t); ok(); }, 5000);
      });
    });
  }
  function quitarCaptcha() {
    if (capId !== null && window.turnstile && window.turnstile.remove) { try { window.turnstile.remove(capId); } catch (e) { /* ya no existe */ } }
    capId = null;
    capToken = '';
  }
  function montarCaptcha(contenedor) {
    quitarCaptcha();
    if (!SITE_KEY) return;
    const zona = el('div', 'ct-captcha');
    contenedor.appendChild(zona);
    cargarTurnstile().then(function () {
      if (!window.turnstile || !zona.isConnected) return;
      capId = window.turnstile.render(zona, {
        sitekey: SITE_KEY,
        theme: 'auto',
        callback: function (t) { capToken = t; },
        'expired-callback': function () { capToken = ''; },
        'error-callback': function () { capToken = ''; }
      });
    }).catch(function () { mostrarAviso('No pudimos cargar la verificación anti-robots. Revisa tu conexión y recarga la página.', true); });
  }
  function reiniciarCaptcha() {
    capToken = '';
    if (capId !== null && window.turnstile && window.turnstile.reset) { try { window.turnstile.reset(capId); } catch (e) { /* nada */ } }
  }

  // ---------- ventana ----------
  function crearModal() {
    modal = el('div', 'ct-modal');
    modal.hidden = true;
    const fondo = el('div', 'ct-fondo');
    fondo.addEventListener('click', cerrar);
    caja = el('div', 'ct-caja');
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-modal', 'true');
    caja.setAttribute('aria-labelledby', 'ct-titulo');
    modal.appendChild(fondo);
    modal.appendChild(caja);
    document.body.appendChild(modal);
    document.addEventListener('keydown', function (e) {
      if (!modal || modal.hidden) return;
      if (e.key === 'Escape') { e.stopPropagation(); cerrar(); return; }
      if (e.key !== 'Tab') return;
      const foc = caja.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])');
      if (!foc.length) return;
      const primero = foc[0], ultimo = foc[foc.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }, true);
    document.addEventListener('daviercell:seccion', cerrar);
  }

  function bloquear(si) {
    const otro = document.querySelector('.t-modal:not([hidden])') || document.querySelector('.cx-drawer:not([hidden])');
    document.body.style.overflow = (si || otro) ? 'hidden' : '';
  }
  function cerrar() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    quitarCaptcha();
    enviando = false;
    bloquear(false);
    if (ultimoFoco && ultimoFoco.focus && document.contains(ultimoFoco)) ultimoFoco.focus();
  }

  function mostrarAviso(texto, esError) {
    const a = $('ct-aviso');
    if (!a) return;
    a.textContent = texto;
    a.className = 'ct-aviso' + (esError ? ' error' : ' ok');
    a.hidden = !texto;
  }

  function campo(form, id, etiqueta, tipo, o) {
    o = o || {};
    const fila = el('div', 'ct-fila');
    const l = el('label', '', etiqueta);
    l.htmlFor = 'ct-' + id;
    const i = el('input');
    i.id = 'ct-' + id;
    i.name = id;
    i.type = tipo;
    i.required = true;
    if (o.auto) i.autocomplete = o.auto;
    if (o.modo) i.inputMode = o.modo;
    if (o.max) i.maxLength = o.max;
    if (o.min) i.minLength = o.min;
    if (o.ph) i.placeholder = o.ph;
    if (o.valor) i.value = o.valor;
    fila.appendChild(l);
    fila.appendChild(i);
    if (o.ayuda) fila.appendChild(el('small', '', o.ayuda));
    form.appendChild(fila);
    return i;
  }
  function boton(texto, clase, alClic) {
    const b = el('button', 'ct-btn ' + (clase || ''), texto);
    b.type = alClic ? 'button' : 'submit';
    if (alClic) b.addEventListener('click', alClic);
    return b;
  }
  function enlaceTexto(texto, alClic) {
    const b = el('button', 'ct-link', texto);
    b.type = 'button';
    b.addEventListener('click', alClic);
    return b;
  }

  const TITULOS = {
    signup: ['Crea tu cuenta', 'Regístrate una sola vez y no tendrás que volver a llenar tus datos en tus próximos pedidos.'],
    login: ['Inicia sesión', 'Entra con tu correo y tu contraseña.'],
    reset: ['Recupera tu contraseña', 'Te enviaremos un enlace al correo de tu cuenta.'],
    newpass: ['Nueva contraseña', 'Escribe tu contraseña nueva.'],
    perfil: ['Tus datos de entrega', 'Los usaremos solo para preparar y enviar tus pedidos. Los guardamos para que no tengas que escribirlos otra vez.'],
    cuenta: ['Mi cuenta', 'Aquí puedes ver o corregir tus datos, cerrar sesión o eliminar tu cuenta.'],
    exito: ['Revisa tu correo', ''],
    fallo: ['No disponible por ahora', 'No pudimos cargar el registro. Revisa tu conexión e inténtalo de nuevo.']
  };

  function abrir(modo, nota) {
    if (!modal) crearModal();
    if (modal.hidden) ultimoFoco = document.activeElement;
    quitarCaptcha();
    enviando = false;
    caja.innerHTML = '';
    const x = el('button', 'ct-cerrar', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Cerrar');
    x.addEventListener('click', cerrar);
    caja.appendChild(x);
    const t = TITULOS[modo] || TITULOS.fallo;
    const h = el('h2', '', t[0]);
    h.id = 'ct-titulo';
    caja.appendChild(h);
    if (t[1]) caja.appendChild(el('p', 'ct-sub', t[1]));
    const aviso = el('p', 'ct-aviso');
    aviso.id = 'ct-aviso';
    aviso.setAttribute('role', 'alert');
    aviso.hidden = true;
    caja.appendChild(aviso);
    if (nota) mostrarAviso(nota, false);

    if (modo === 'fallo') {
      caja.appendChild(boton('Cerrar', '', cerrar));
    } else if (modo === 'exito') {
      mostrarAviso(nota, false);
      caja.appendChild(boton('Entendido', '', cerrar));
    } else {
      const form = el('form', 'ct-form');
      form.noValidate = false;
      form.addEventListener('submit', function (e) { e.preventDefault(); enviar(modo, form); });
      construirFormulario(modo, form);
      caja.appendChild(form);
    }
    modal.hidden = false;
    bloquear(true);
    const primero = caja.querySelector('input') || x;
    primero.focus();
  }

  function construirFormulario(modo, form) {
    if (modo === 'signup') {
      campo(form, 'nombre', 'Nombre completo', 'text', { auto: 'name', max: 60, min: 2 });
      campo(form, 'email', 'Correo electrónico', 'email', { auto: 'email', max: 120 });
      campo(form, 'password', 'Contraseña', 'password', { auto: 'new-password', min: 8, max: 72, ayuda: AYUDA_CLAVE });
      const f = el('label', 'ct-check');
      const c = el('input');
      c.type = 'checkbox';
      c.id = 'ct-acepto';
      c.required = true;
      f.appendChild(c);
      const span = el('span');
      span.appendChild(document.createTextNode('Acepto el tratamiento de mis datos personales para gestionar mis pedidos, según la '));
      const a = el('a', '', 'Política de Privacidad');
      a.href = '#';
      a.setAttribute('data-seccion', 'privacidad');
      span.appendChild(a);
      span.appendChild(document.createTextNode('. Si pasas 90 días sin actividad, tu cuenta se elimina automáticamente.'));
      f.appendChild(span);
      form.appendChild(f);
      montarCaptcha(form);
      form.appendChild(boton('Crear mi cuenta'));
      const pie = el('p', 'ct-pie', '¿Ya tienes cuenta? ');
      pie.appendChild(enlaceTexto('Inicia sesión', function () { abrir('login'); }));
      form.appendChild(pie);
    } else if (modo === 'login') {
      campo(form, 'email', 'Correo electrónico', 'email', { auto: 'email', max: 120 });
      campo(form, 'password', 'Contraseña', 'password', { auto: 'current-password', max: 72 });
      montarCaptcha(form);
      form.appendChild(boton('Entrar'));
      const pie = el('p', 'ct-pie');
      pie.appendChild(enlaceTexto('Olvidé mi contraseña', function () { abrir('reset'); }));
      pie.appendChild(document.createTextNode(' · '));
      pie.appendChild(enlaceTexto('Crear una cuenta', function () { abrir('signup'); }));
      form.appendChild(pie);
    } else if (modo === 'reset') {
      campo(form, 'email', 'Correo electrónico', 'email', { auto: 'email', max: 120 });
      montarCaptcha(form);
      form.appendChild(boton('Enviar enlace'));
      const pie = el('p', 'ct-pie');
      pie.appendChild(enlaceTexto('Volver a iniciar sesión', function () { abrir('login'); }));
      form.appendChild(pie);
    } else if (modo === 'newpass') {
      campo(form, 'password', 'Contraseña nueva', 'password', { auto: 'new-password', min: 8, max: 72, ayuda: AYUDA_CLAVE });
      form.appendChild(boton('Guardar contraseña'));
    } else if (modo === 'perfil' || modo === 'cuenta') {
      const p = perfil || {};
      campo(form, 'nombre', 'Nombre completo', 'text', { auto: 'name', max: 60, min: 2, valor: p.nombre || '' });
      campo(form, 'telefono', 'Teléfono / WhatsApp', 'tel', { auto: 'tel', modo: 'tel', max: 20, ph: '3205972997', valor: p.telefono || '', ayuda: 'Un número por cuenta. Solo números.' });
      campo(form, 'ciudad', 'Ciudad', 'text', { auto: 'address-level2', max: 60, min: 2, valor: p.ciudad || '' });
      campo(form, 'direccion', 'Dirección de entrega', 'text', { auto: 'street-address', max: 120, min: 5, valor: p.direccion || '' });
      form.appendChild(boton(modo === 'perfil' ? 'Guardar y continuar' : 'Guardar cambios'));
      if (modo === 'cuenta') {
        if (user && user.email) form.appendChild(el('p', 'ct-pie', 'Cuenta: ' + user.email));
        const fila = el('div', 'ct-acciones');
        fila.appendChild(boton('Cerrar sesión', 'sec', cerrarSesion));
        const del = boton('Eliminar mi cuenta', 'peligro', null);
        del.type = 'button';
        let confirma = false, tmp = null;
        del.addEventListener('click', function () {
          if (!confirma) {
            confirma = true;
            del.textContent = 'Confirmar: eliminar todo';
            tmp = setTimeout(function () { confirma = false; del.textContent = 'Eliminar mi cuenta'; }, 4000);
            return;
          }
          clearTimeout(tmp);
          eliminarCuenta();
        });
        fila.appendChild(del);
        form.appendChild(fila);
      }
    }
  }

  // ---------- acciones ----------
  function mensajeError(err, modo) {
    const m = String((err && err.message) || '').toLowerCase();
    const c = String((err && (err.code || err.status)) || '');
    if (m.indexOf('captcha') !== -1) return 'No pudimos verificar que eres una persona. Inténtalo de nuevo.';
    if (m.indexOf('email not confirmed') !== -1) return 'Primero confirma tu correo: te enviamos un enlace al registrarte.';
    if (modo === 'login') return 'Correo o contraseña incorrectos.';
    if (m.indexOf('rate limit') !== -1 || c === '429' || c === 'over_request_rate_limit' || c === 'over_email_send_rate_limit') return 'Hay muchas solicitudes en este momento. Espera unos minutos e inténtalo de nuevo.';
    if (m.indexOf('database error') !== -1) return 'Hay muchos registros en este momento. Inténtalo de nuevo en unos minutos.';
    if (m.indexOf('password') !== -1 || c === 'weak_password') return 'La contraseña es débil. ' + AYUDA_CLAVE;
    return 'No pudimos completar la acción. Inténtalo de nuevo.';
  }
  function valor(form, n) { const i = form.elements[n]; return i ? String(i.value || '').trim() : ''; }
  function ocupado(form, si) {
    enviando = si;
    const b = form.querySelector('button[type="submit"]');
    if (b) b.disabled = si;
  }

  async function enviar(modo, form) {
    if (enviando) return;
    mostrarAviso('', false);
    const necesitaCaptcha = (modo === 'signup' || modo === 'login' || modo === 'reset') && !!SITE_KEY;
    if (necesitaCaptcha && !capToken) { mostrarAviso('Marca la casilla de verificación anti-robots.', true); return; }
    const email = valor(form, 'email');
    if ((modo === 'signup' || modo === 'login' || modo === 'reset') && !RE_EMAIL.test(email)) { mostrarAviso('Escribe un correo válido.', true); return; }
    ocupado(form, true);
    let llamo = false;
    try {
      await iniciarCliente();
      const cap = capToken ? { captchaToken: capToken } : {};
      llamo = true;
      if (modo === 'signup') {
        const nombre = valor(form, 'nombre'), password = form.elements.password.value;
        if (nombre.length < 2) { mostrarAviso('Escribe tu nombre completo.', true); return; }
        if (!claveValida(password)) { mostrarAviso('La contraseña no es segura. ' + AYUDA_CLAVE, true); return; }
        if (!$('ct-acepto').checked) { mostrarAviso('Debes aceptar la política de privacidad.', true); return; }
        const r = await sb.auth.signUp({ email: email, password: password, options: Object.assign({ data: { nombre: nombre, acepto_politica: 'true' }, emailRedirectTo: location.origin + '/' }, cap) });
        if (r.error) { mostrarAviso(mensajeError(r.error, modo), true); return; }
        // Correo ya registrado: Supabase devuelve un usuario sin identidades
        if (r.data && r.data.user && r.data.user.identities && !r.data.user.identities.length) { mostrarAviso('Ese correo ya tiene cuenta. Inicia sesión.', true); return; }
        abrir('exito', '¡Casi listo! Te enviamos un correo para confirmar tu cuenta. Después de confirmarlo, vuelve a esta página y tu producto se agregará al carrito.');
      } else if (modo === 'login') {
        const r = await sb.auth.signInWithPassword({ email: email, password: form.elements.password.value, options: cap });
        if (r.error) { mostrarAviso(mensajeError(r.error, modo), true); return; }
        user = r.data.user;
        await cargarPerfil();
        actualizarEnlace();
        if (listo()) { if (!cumplirPendiente()) cerrar(); } else abrir('perfil', 'Completa tus datos para continuar.');
      } else if (modo === 'reset') {
        await sb.auth.resetPasswordForEmail(email, Object.assign({ redirectTo: location.origin + '/' }, cap));
        abrir('exito', 'Si ese correo tiene cuenta, te enviamos un enlace para cambiar la contraseña.');
      } else if (modo === 'newpass') {
        const nueva = form.elements.password.value;
        if (!claveValida(nueva)) { mostrarAviso('La contraseña no es segura. ' + AYUDA_CLAVE, true); return; }
        const r = await sb.auth.updateUser({ password: nueva });
        if (r.error) { mostrarAviso(mensajeError(r.error, modo), true); return; }
        abrir('exito', 'Tu contraseña se cambió correctamente.');
      } else if (modo === 'perfil' || modo === 'cuenta') {
        await guardarPerfil(modo, form);
      }
    } catch (e) {
      console.error('Error en el registro:', e);
      mostrarAviso('No pudimos completar la acción. Revisa tu conexión e inténtalo de nuevo.', true);
    } finally {
      if (modal && !modal.hidden) { ocupado(form, false); if (llamo && necesitaCaptcha) reiniciarCaptcha(); }
    }
  }

  async function guardarPerfil(modo, form) {
    if (!user) { abrir('login'); return; }
    const datos = {
      id: user.id,
      nombre: valor(form, 'nombre'),
      telefono: soloDigitos(valor(form, 'telefono')),
      ciudad: valor(form, 'ciudad'),
      direccion: valor(form, 'direccion')
    };
    if (datos.nombre.length < 2) { mostrarAviso('Escribe tu nombre completo.', true); return; }
    if (!/^[0-9]{7,15}$/.test(datos.telefono)) { mostrarAviso('Escribe un teléfono válido (solo números, mínimo 7).', true); return; }
    if (datos.ciudad.length < 2) { mostrarAviso('Escribe tu ciudad.', true); return; }
    if (datos.direccion.length < 5) { mostrarAviso('Escribe tu dirección de entrega.', true); return; }
    const r = await sb.from('perfiles').upsert(datos, { onConflict: 'id' }).select('nombre,telefono,ciudad,direccion').single();
    if (r.error) {
      if (r.error.code === '23505') {
        const a = $('ct-aviso');
        a.className = 'ct-aviso error';
        a.textContent = 'Ese teléfono ya tiene una cuenta. Escríbenos por WhatsApp y lo resolvemos: ';
        const w = el('a', '', 'abrir WhatsApp');
        w.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola DAVIERCELL, mi teléfono ya aparece registrado y necesito ayuda con mi cuenta.');
        w.target = '_blank';
        w.rel = 'noopener';
        a.appendChild(w);
        a.hidden = false;
        return;
      }
      mostrarAviso('No pudimos guardar tus datos. Inténtalo de nuevo.', true);
      return;
    }
    perfil = r.data;
    actualizarEnlace();
    if (modo === 'perfil') { if (!cumplirPendiente()) cerrar(); }
    else mostrarAviso('Datos guardados.', false);
  }

  async function cerrarSesion() {
    try { await iniciarCliente(); await sb.auth.signOut(); } catch (e) { console.error(e); }
    user = null; perfil = null;
    actualizarEnlace();
    cerrar();
  }
  async function eliminarCuenta() {
    try {
      await iniciarCliente();
      const r = await sb.rpc('eliminar_mi_cuenta');
      if (r.error) { mostrarAviso('No pudimos eliminar tu cuenta. Escríbenos por WhatsApp.', true); return; }
      await sb.auth.signOut();
      user = null; perfil = null;
      actualizarEnlace();
      abrir('exito', 'Tu cuenta y tus datos fueron eliminados.');
    } catch (e) {
      console.error(e);
      mostrarAviso('No pudimos eliminar tu cuenta. Escríbenos por WhatsApp.', true);
    }
  }

  // ---------- enlace "Mi cuenta" del pie ----------
  function actualizarEnlace() {
    const a = $('mi-cuenta');
    if (!a) return;
    a.hidden = false;
    a.textContent = user ? 'Mi cuenta' : 'Iniciar sesión';
  }
  async function alClicEnlace(e) {
    e.preventDefault();
    try {
      await iniciarCliente();
      const s = await sb.auth.getSession();
      user = s.data && s.data.session ? s.data.session.user : null;
      if (user) { await cargarPerfil(); abrir('cuenta'); } else abrir('login');
    } catch (err) { abrir('fallo'); }
  }

  // ---------- arranque ----------
  function iniciar() {
    const a = $('mi-cuenta');
    if (a) { a.hidden = false; a.addEventListener('click', alClicEnlace); }
    // Si ya hay una sesion guardada, o el cliente vuelve desde un correo de Supabase, se restaura al cargar la pagina
    let sesionGuardada = false;
    try {
      for (let i = 0; i < localStorage.length; i++) { if (/^sb-.+-auth-token$/.test(localStorage.key(i))) { sesionGuardada = true; break; } }
    } catch (e) { /* sin almacenamiento */ }
    const vuelveDeCorreo = /(access_token|refresh_token|type=recovery|type=signup|error_description)/.test(location.hash + location.search);
    if (sesionGuardada || vuelveDeCorreo) iniciarCliente().catch(function (e) { console.error(e); });
    // Al enviar un pedido por WhatsApp se renueva la fecha de actividad (evita que la limpieza de 90 dias borre al cliente)
    document.addEventListener('daviercell:carrito', function (e) { if (e.detail && e.detail.accion === 'checkout') tocarActividad(); });
  }

  window.DCCuenta = {
    activo: function () { return true; },
    listo: listo,
    pedirRegistro: pedirRegistro,
    datosPedido: function () { return listo() ? { nombre: perfil.nombre, telefono: perfil.telefono, ciudad: perfil.ciudad, direccion: perfil.direccion } : null; },
    abrir: abrir
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
