// =============================================
// CARRITO DAVIERCELL - el pedido se cierra por WhatsApp
// Usa SUPABASE_URL y SUPABASE_KEY definidas en app.js
// No guarda datos personales: solo codigo y cantidad de cada producto (localStorage "dc-carrito").
// =============================================
(function () {
  'use strict';
  if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_KEY === 'undefined') return;

  const WHATSAPP = '573205972997';
  const CLAVE = 'dc-carrito';
  const AVISO = 'dc-carrito-aviso';
  const MAX_ITEMS = 12;          // limite para que el mensaje de WhatsApp (con los datos del cliente) no se haga demasiado largo
  const MAX_CANT = 10;
  const ENVIO_GRATIS = 400000;   // mismo valor que el beneficio de la tienda (Cartagena)
  const API = SUPABASE_URL + '/rest/v1/';
  const HEADERS = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY };
  const RE_COD = /^[A-Za-z0-9-]{3,24}$/;
  const peso = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const SIN_FOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e9eef6"/>' +
    '<rect x="40" y="22" width="40" height="76" rx="7" fill="none" stroke="#9db4d6" stroke-width="4"/>' +
    '<circle cx="60" cy="88" r="3" fill="#9db4d6"/></svg>');

  let items = leer();
  let seccion = 'inicio';
  let fab = null, badge = null, drawer = null, panel = null, cuerpo = null, pie = null, toastEl = null;
  let ultimoFoco = null, temporizadorToast = null, temporizadorVaciar = null, confirmaVaciar = false;

  // ---------- utilidades ----------
  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }
  function icono(clases) { const i = el('i', clases); i.setAttribute('aria-hidden', 'true'); return i; }
  // Dibujo del carrito de DAVIERCELL (img/carrito.webp)
  function imgCarrito() {
    const i = document.createElement('img');
    i.src = 'img/carrito.webp';
    i.alt = '';
    i.width = 260;
    i.height = 240;
    i.className = 'cx-ico';
    i.decoding = 'async';
    i.draggable = false;
    return i;
  }
  function chipCarrito(extra) {
    const c = el('span', 'cx-chip' + (extra ? ' ' + extra : ''));
    c.appendChild(imgCarrito());
    return c;
  }
  function urlSegura(u) { return typeof u === 'string' && /^https:\/\//i.test(u) && u.length < 400; }
  function entero(n, min, max) {
    n = parseInt(n, 10);
    if (!isFinite(n)) n = min;
    return Math.max(min, Math.min(max, n));
  }
  function plural(n, uno, varios) { return n === 1 ? uno : varios; }

  // ---------- almacenamiento ----------
  function leer() {
    try {
      const raw = JSON.parse(localStorage.getItem(CLAVE) || '[]');
      if (!Array.isArray(raw)) return [];
      const vistos = {};
      const out = [];
      raw.forEach(function (x) {
        if (!x || typeof x.c !== 'string' || !RE_COD.test(x.c) || vistos[x.c] || out.length >= MAX_ITEMS) return;
        const p = Number(x.p);
        if (!isFinite(p) || p <= 0 || p > 100000000) return;
        vistos[x.c] = 1;
        out.push({ c: x.c, q: entero(x.q, 1, MAX_CANT), n: String(x.n || x.c).slice(0, 120), p: Math.round(p), i: urlSegura(x.i) ? x.i : '', d: x.d !== false });
      });
      return out;
    } catch (e) { return []; }
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch (e) { /* sin almacenamiento: el carrito vive solo en esta visita */ }
  }

  // ---------- calculos ----------
  function disponibles() { return items.filter(function (x) { return x.d; }); }
  function unidades() { return disponibles().reduce(function (s, x) { return s + x.q; }, 0); }
  function total() { return disponibles().reduce(function (s, x) { return s + x.p * x.q; }, 0); }

  function mensaje() {
    const lineas = disponibles().map(function (x, i) {
      return (i + 1) + '. ' + x.n.slice(0, 55) + ' (Cód. ' + x.c + ') x' + x.q + ' - ' + peso.format(x.p * x.q);
    });
    const dc = window.DCCuenta && window.DCCuenta.datosPedido ? window.DCCuenta.datosPedido() : null;
    const cliente = dc ? 'Cliente: ' + dc.nombre + ' (Tel. ' + dc.telefono + ')\nEntrega: ' + dc.ciudad + ', ' + dc.direccion + '\n\n' : '';
    return 'Hola DAVIERCELL, quiero hacer este pedido:\n\n' + cliente + lineas.join('\n') +
      '\n\nTotal: ' + peso.format(total()) + '\n¿Me confirman disponibilidad y envío? Gracias.';
  }
  function enlaceWhatsApp() { return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensaje()); }

  function evento(accion, d) {
    document.dispatchEvent(new CustomEvent('daviercell:carrito', { detail: Object.assign({ accion: accion }, d || {}) }));
  }

  // ---------- agregar / quitar ----------
  function agregar(p, boton) {
    if (!p || typeof p.codigo !== 'string' || !RE_COD.test(p.codigo)) return;
    if (p.disponible === false) { avisar('Producto agotado', 'Este producto no se puede agregar por ahora.', null, 'alerta'); return; }
    // Registro obligatorio: si el cliente no tiene cuenta con sus datos completos, primero se registra y luego se agrega solo
    if (window.DCCuenta && window.DCCuenta.activo() && !window.DCCuenta.listo()) { window.DCCuenta.pedirRegistro(p); return; }
    const precio = Math.round(Number(p.precio_oferta || p.precio));
    if (!isFinite(precio) || precio <= 0) return;
    const nombre = String(p.nombre || p.codigo).slice(0, 120);
    let it = items.filter(function (x) { return x.c === p.codigo; })[0];

    if (it) {
      if (it.q >= MAX_CANT) { avisar('Máximo por producto', 'Puedes pedir hasta ' + MAX_CANT + ' unidades de cada producto.', null, 'alerta'); return; }
      it.q += 1;
      it.d = true;
    } else {
      if (items.length >= MAX_ITEMS) {
        avisar('Tu carrito está lleno', 'Envía este pedido por WhatsApp y luego haz otro (máximo ' + MAX_ITEMS + ' productos por pedido).', { texto: 'Ver carrito', fn: abrir }, 'alerta');
        return;
      }
      const img = (p.imagenes || []).filter(urlSegura)[0] || '';
      it = { c: p.codigo, q: 1, n: nombre, p: precio, i: img, d: true };
      items.push(it);
    }
    it.p = precio;
    guardar();
    actualizar(true);
    const n = unidades();
    avisar('Agregado al carrito: ' + nombre,
      'Tienes ' + n + ' ' + plural(n, 'producto pendiente', 'productos pendientes') + ' en tu carrito. ¡Termina tu pedido por WhatsApp!',
      { texto: 'Ver carrito', fn: abrir });
    if (boton) {
      boton.classList.add('agregado');
      setTimeout(function () { boton.classList.remove('agregado'); }, 1300);
    }
    evento('agregar', { codigo: p.codigo, nombre: nombre, precio: precio });
  }

  function cambiar(codigo, delta) {
    const it = items.filter(function (x) { return x.c === codigo; })[0];
    if (!it) return;
    const q = it.q + delta;
    if (q < 1) { quitar(codigo); return; }
    if (q > MAX_CANT) return;
    it.q = q;
    guardar();
    actualizar(false);
  }
  function quitar(codigo) {
    items = items.filter(function (x) { return x.c !== codigo; });
    guardar();
    actualizar(false);
  }
  function vaciar() {
    items = [];
    guardar();
    confirmaVaciar = false;
    actualizar(false);
  }

  // ---------- precios al dia ----------
  async function refrescar() {
    if (!items.length) return;
    try {
      const cods = items.map(function (x) { return encodeURIComponent(x.c); }).join(',');
      const r = await fetch(API + 'productos?select=codigo,nombre,precio,precio_oferta,disponible,activo,imagenes&codigo=in.(' + cods + ')', { headers: HEADERS });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const datos = await r.json();
      const mapa = {};
      datos.forEach(function (d) { mapa[d.codigo] = d; });
      let quitados = 0;
      items = items.filter(function (x) {
        const d = mapa[x.c];
        if (!d || d.activo === false) { quitados++; return false; }
        const precio = Math.round(Number(d.precio_oferta || d.precio));
        if (isFinite(precio) && precio > 0) x.p = precio;
        if (d.nombre) x.n = String(d.nombre).slice(0, 120);
        x.d = d.disponible !== false;
        const img = (d.imagenes || []).filter(urlSegura)[0];
        if (img) x.i = img;
        return true;
      });
      guardar();
      actualizar(false);
      if (quitados) avisar('Actualizamos tu carrito', quitados + ' ' + plural(quitados, 'producto ya no está', 'productos ya no están') + ' disponible en la tienda y se quitó del pedido.', null, 'alerta');
    } catch (e) { console.error('Error actualizando el carrito:', e); }
  }

  // ---------- avisos en pantalla ----------
  function avisar(titulo, detalle, accion, tipo) {
    if (!toastEl) {
      toastEl = el('div', 'cx-toast');
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      toastEl.hidden = true;
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '';
    toastEl.className = 'cx-toast' + (tipo === 'alerta' ? ' alerta' : '');
    toastEl.appendChild(tipo === 'alerta' ? icono('fas fa-circle-exclamation cx-toast-ico') : chipCarrito('mini'));
    const txt = el('div', 'cx-toast-txt');
    txt.appendChild(el('strong', '', titulo));
    if (detalle) txt.appendChild(el('span', '', detalle));
    toastEl.appendChild(txt);
    if (accion) {
      const b = el('button', 'cx-toast-btn', accion.texto);
      b.type = 'button';
      b.addEventListener('click', function () { ocultarAviso(); accion.fn(); });
      toastEl.appendChild(b);
    }
    const x = el('button', 'cx-toast-x', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Cerrar aviso');
    x.addEventListener('click', ocultarAviso);
    toastEl.appendChild(x);
    toastEl.hidden = false;
    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(ocultarAviso, 7000);
  }
  function ocultarAviso() { if (toastEl) toastEl.hidden = true; }

  // ---------- boton flotante ----------
  function crearFab() {
    fab = el('button', 'cx-fab');
    fab.type = 'button';
    fab.appendChild(imgCarrito());
    badge = el('span', 'cx-badge', '0');
    badge.setAttribute('aria-hidden', 'true');
    fab.appendChild(badge);
    fab.addEventListener('click', abrir);
    document.body.appendChild(fab);
  }
  function actualizarFab(pulso) {
    if (!fab) return;
    const n = unidades();
    badge.textContent = n > 99 ? '99+' : String(n);
    badge.hidden = n === 0;
    fab.setAttribute('aria-label', n ? 'Abrir carrito: ' + n + ' ' + plural(n, 'producto', 'productos') : 'Abrir carrito (vacío)');
    fab.hidden = n === 0 && seccion !== 'tienda';
    if (pulso) {
      fab.classList.remove('pulso');
      void fab.offsetWidth;
      fab.classList.add('pulso');
    }
  }

  // ---------- panel del carrito ----------
  function crearPanel() {
    drawer = el('div', 'cx-drawer');
    drawer.hidden = true;
    const fondo = el('div', 'cx-fondo');
    fondo.addEventListener('click', cerrar);
    panel = el('aside', 'cx-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'cx-titulo');
    const cab = el('div', 'cx-cab');
    const h = el('h2', '', 'Tu carrito');
    h.id = 'cx-titulo';
    cab.appendChild(chipCarrito());
    cab.appendChild(h);
    const x = el('button', 'cx-cerrar', '×');
    x.type = 'button';
    x.id = 'cx-cerrar';
    x.setAttribute('aria-label', 'Cerrar carrito');
    x.addEventListener('click', cerrar);
    cab.appendChild(x);
    cuerpo = el('div', 'cx-cuerpo');
    pie = el('div', 'cx-pie');
    panel.appendChild(cab);
    panel.appendChild(cuerpo);
    panel.appendChild(pie);
    drawer.appendChild(fondo);
    drawer.appendChild(panel);
    document.body.appendChild(drawer);

    // Esc cierra el carrito (y no el detalle del producto que pueda estar debajo); Tab queda dentro del panel
    document.addEventListener('keydown', function (e) {
      if (!drawer || drawer.hidden) return;
      if (e.key === 'Escape') { e.stopPropagation(); cerrar(); return; }
      if (e.key !== 'Tab') return;
      const foc = panel.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
      if (!foc.length) return;
      const primero = foc[0], ultimo = foc[foc.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }, true);
  }

  function fila(x) {
    const li = el('li', 'cx-item' + (x.d ? '' : ' agotado'));
    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', function () { if (!img.dataset.fallo) { img.dataset.fallo = '1'; img.src = SIN_FOTO; } });
    img.src = urlSegura(x.i) ? x.i : SIN_FOTO;
    li.appendChild(img);

    const info = el('div', 'cx-info');
    info.appendChild(el('span', 'cx-nombre', x.n));
    info.appendChild(el('span', 'cx-cod', 'Cód. ' + x.c));
    if (!x.d) {
      info.appendChild(el('span', 'cx-agot', 'Agotado: no se incluirá en el pedido'));
    } else {
      info.appendChild(el('span', 'cx-unit', peso.format(x.p) + ' c/u'));
    }
    const ctl = el('div', 'cx-ctl');
    if (x.d) {
      const menos = el('button', 'cx-q');
      menos.type = 'button';
      menos.setAttribute('aria-label', 'Quitar una unidad de ' + x.n);
      menos.appendChild(icono('fas fa-minus'));
      menos.addEventListener('click', function () { cambiar(x.c, -1); });
      const cant = el('span', 'cx-cant', String(x.q));
      cant.setAttribute('aria-label', x.q + ' ' + plural(x.q, 'unidad', 'unidades'));
      const mas = el('button', 'cx-q');
      mas.type = 'button';
      mas.setAttribute('aria-label', 'Agregar una unidad de ' + x.n);
      mas.disabled = x.q >= MAX_CANT;
      mas.appendChild(icono('fas fa-plus'));
      mas.addEventListener('click', function () { cambiar(x.c, 1); });
      ctl.appendChild(menos); ctl.appendChild(cant); ctl.appendChild(mas);
    }
    const del = el('button', 'cx-quitar');
    del.type = 'button';
    del.setAttribute('aria-label', 'Quitar ' + x.n + ' del carrito');
    del.appendChild(icono('fas fa-trash-can'));
    del.addEventListener('click', function () { quitar(x.c); });
    ctl.appendChild(del);
    info.appendChild(ctl);
    li.appendChild(info);
    if (x.d) li.appendChild(el('strong', 'cx-sub', peso.format(x.p * x.q)));
    return li;
  }

  function pintar() {
    if (!drawer) return;
    cuerpo.innerHTML = '';
    pie.innerHTML = '';
    if (!items.length) {
      const vacio = el('div', 'cx-vacio');
      vacio.appendChild(chipCarrito('grande'));
      vacio.appendChild(el('strong', '', 'Tu carrito está vacío'));
      vacio.appendChild(el('span', '', 'Agrega productos desde la tienda y cierra tu pedido por WhatsApp.'));
      const ir = el('button', 'cx-btn secundario', 'Ver productos');
      ir.type = 'button';
      ir.addEventListener('click', function () {
        cerrar();
        if (typeof window.mostrarSeccion === 'function') window.mostrarSeccion('tienda');
      });
      vacio.appendChild(ir);
      cuerpo.appendChild(vacio);
      return;
    }
    const ul = el('ul', 'cx-lista');
    items.forEach(function (x) { ul.appendChild(fila(x)); });
    cuerpo.appendChild(ul);

    const n = unidades();
    const t = total();
    const fila1 = el('div', 'cx-total');
    fila1.appendChild(el('span', '', 'Total (' + n + ' ' + plural(n, 'producto', 'productos') + ')'));
    fila1.appendChild(el('strong', '', peso.format(t)));
    pie.appendChild(fila1);
    if (n) {
      const envio = el('p', 'cx-envio' + (t >= ENVIO_GRATIS ? ' ok' : ''));
      envio.appendChild(icono('fas ' + (t >= ENVIO_GRATIS ? 'fa-gift' : 'fa-truck')));
      envio.appendChild(document.createTextNode(t >= ENVIO_GRATIS
        ? ' ¡Tu pedido tiene envío gratis en Cartagena!'
        : ' Te faltan ' + peso.format(ENVIO_GRATIS - t) + ' para envío gratis en Cartagena.'));
      pie.appendChild(envio);
    }
    if (n) {
      const wa = el('a', 'cx-btn whatsapp');
      wa.href = enlaceWhatsApp();
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.appendChild(icono('fab fa-whatsapp'));
      wa.appendChild(document.createTextNode(' Enviar pedido por WhatsApp'));
      wa.addEventListener('click', function () { evento('checkout', { valor: t, unidades: n, productos: disponibles().map(function (x) { return { codigo: x.c, nombre: x.n, precio: x.p, cantidad: x.q }; }) }); });
      pie.appendChild(wa);
    } else {
      pie.appendChild(el('p', 'cx-envio', 'Todos los productos de tu carrito están agotados. Quita los que no estén disponibles.'));
    }
    pie.appendChild(el('p', 'cx-nota', 'El pedido se confirma por WhatsApp. Precios y disponibilidad sujetos a confirmación.'));
    const acciones = el('div', 'cx-acciones');
    const seguir = el('button', 'cx-btn secundario', 'Seguir comprando');
    seguir.type = 'button';
    seguir.addEventListener('click', cerrar);
    const vac = el('button', 'cx-btn texto' + (confirmaVaciar ? ' peligro' : ''), confirmaVaciar ? 'Confirmar: vaciar todo' : 'Vaciar carrito');
    vac.type = 'button';
    vac.addEventListener('click', function () {
      if (confirmaVaciar) { clearTimeout(temporizadorVaciar); vaciar(); return; }
      confirmaVaciar = true;
      pintar();
      temporizadorVaciar = setTimeout(function () { confirmaVaciar = false; pintar(); }, 4000);
    });
    acciones.appendChild(seguir);
    acciones.appendChild(vac);
    pie.appendChild(acciones);
  }

  function bloquear(si) {
    const modalAbierto = document.querySelector('.t-modal:not([hidden])');
    document.body.style.overflow = (si || modalAbierto) ? 'hidden' : '';
  }
  function abrir() {
    if (!drawer) crearPanel();
    ocultarAviso();
    ultimoFoco = document.activeElement;
    confirmaVaciar = false;
    pintar();
    drawer.hidden = false;
    bloquear(true);
    const c = $('cx-cerrar');
    if (c) c.focus();
    refrescar();
  }
  function cerrar() {
    if (!drawer || drawer.hidden) return;
    drawer.hidden = true;
    confirmaVaciar = false;
    clearTimeout(temporizadorVaciar);
    bloquear(false);
    if (ultimoFoco && ultimoFoco.focus && document.contains(ultimoFoco)) ultimoFoco.focus();
  }
  function $(id) { return document.getElementById(id); }

  function actualizar(pulso) {
    actualizarFab(pulso);
    if (drawer && !drawer.hidden) pintar();
  }

  // ---------- arranque ----------
  function iniciar() {
    const activa = document.querySelector('section:not(.oculto)');
    if (activa && activa.id) seccion = activa.id;
    crearFab();
    actualizarFab(false);
    document.addEventListener('daviercell:seccion', function (e) {
      seccion = (e.detail && e.detail.id) || seccion;
      actualizarFab(false);
    });
    // Si el cliente dejo productos pendientes en una visita anterior, se lo recordamos una vez por sesion
    if (disponibles().length) {
      refrescar();
      let visto = false;
      try { visto = sessionStorage.getItem(AVISO) === '1'; } catch (e) { /* sin sessionStorage */ }
      if (!visto) {
        setTimeout(function () {
          const n = unidades();
          if (!n) return;
          avisar('Tienes ' + n + ' ' + plural(n, 'producto pendiente', 'productos pendientes') + ' en tu carrito',
            'Termina tu pedido por WhatsApp cuando quieras.', { texto: 'Ver carrito', fn: abrir });
          try { sessionStorage.setItem(AVISO, '1'); } catch (e) { /* sin sessionStorage */ }
        }, 2500);
      }
    }
  }

  window.DCCarrito = { agregar: agregar, abrir: abrir, cerrar: cerrar, unidades: unidades, imagen: imgCarrito };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
