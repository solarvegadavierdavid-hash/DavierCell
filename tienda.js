// =============================================
// TIENDA DAVIERCELL - Fase 1: catalogo
// Usa SUPABASE_URL y SUPABASE_KEY definidas en app.js
// =============================================
(function () {
  'use strict';

  const WHATSAPP = '573205972997';
  const POR_PAGINA = 24;
  const API = SUPABASE_URL + '/rest/v1/';
  const HEADERS = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY };
  const peso = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const SIN_FOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e9eef6"/>' +
    '<rect x="40" y="22" width="40" height="76" rx="7" fill="none" stroke="#9db4d6" stroke-width="4"/>' +
    '<circle cx="60" cy="88" r="3" fill="#9db4d6"/></svg>');

  const estado = {
    cargado: false, cargando: false, categorias: [], productos: [],
    cat: null, sub: null, texto: '', orden: 'relevancia', visibles: POR_PAGINA
  };

  const $ = function (id) { return document.getElementById(id); };

  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function norm(s) {
    return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function precioFinal(p) { return p.precio_oferta || p.precio; }

  function urlSegura(u) { return typeof u === 'string' && /^https:\/\//i.test(u); }

  function imagen(url, alt) {
    const img = document.createElement('img');
    img.alt = alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', function () {
      if (!img.dataset.fallo) { img.dataset.fallo = '1'; img.src = SIN_FOTO; }
    });
    img.src = urlSegura(url) ? url : SIN_FOTO;
    return img;
  }

  async function pedir(ruta) {
    const r = await fetch(API + ruta, { headers: HEADERS });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  function pintarEstado(mensaje, reintento) {
    const grid = $('tienda-grid');
    grid.innerHTML = '';
    grid.appendChild(el('p', 'tienda-vacio', mensaje));
    if (reintento) {
      const b = el('button', 'btn-primario sm', 'Reintentar');
      b.type = 'button';
      b.addEventListener('click', cargar);
      grid.appendChild(b);
    }
    $('tienda-conteo').textContent = '';
    $('tienda-mas').hidden = true;
  }

  async function cargar() {
    if (estado.cargando) return;
    estado.cargando = true;
    pintarEstado('Cargando productos...', false);
    try {
      const res = await Promise.all([
        pedir('categorias?select=id,padre_id,nombre,slug,orden&order=orden.asc'),
        pedir('productos?select=id,categoria_id,codigo,nombre,descripcion_corta,marca,etiquetas,precio,precio_oferta,disponible,stock,imagenes,destacado&order=nombre.asc&limit=1000')
      ]);
      estado.categorias = res[0];
      estado.productos = res[1].map(function (p) {
        p.busqueda = norm([p.nombre, p.marca, p.codigo, (p.etiquetas || []).join(' ')].join(' '));
        return p;
      });
      estado.cargado = true;
      pintarTodo();
    } catch (e) {
      console.error('Error cargando tienda:', e);
      pintarEstado('No pudimos cargar los productos. Revisa tu conexi\u00f3n e intenta de nuevo.', true);
    } finally {
      estado.cargando = false;
    }
  }

  function hijos(padreId) {
    return estado.categorias
      .filter(function (c) { return c.padre_id === padreId; })
      .sort(function (a, b) { return a.orden - b.orden; });
  }

  function idsDeCategoria() {
    if (estado.sub !== null) return [estado.sub];
    if (estado.cat !== null) {
      return [estado.cat].concat(hijos(estado.cat).map(function (h) { return h.id; }));
    }
    return null;
  }

  function contar(ids) {
    return estado.productos.filter(function (p) { return ids.indexOf(p.categoria_id) !== -1; }).length;
  }

  function filtrados() {
    const ids = idsDeCategoria();
    const palabras = norm(estado.texto).split(/\s+/).filter(Boolean);
    const lista = estado.productos.filter(function (p) {
      if (ids && ids.indexOf(p.categoria_id) === -1) return false;
      return palabras.every(function (w) { return p.busqueda.indexOf(w) !== -1; });
    });
    const o = estado.orden;
    lista.sort(function (a, b) {
      if (a.disponible !== b.disponible) return a.disponible ? -1 : 1;
      if (o === 'precio-asc') return precioFinal(a) - precioFinal(b);
      if (o === 'precio-desc') return precioFinal(b) - precioFinal(a);
      if (o === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
      if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
      return a.nombre.localeCompare(b.nombre, 'es');
    });
    return lista;
  }

  function chip(texto, activo, alClic) {
    const b = el('button', 'tienda-chip' + (activo ? ' activo' : ''), texto);
    b.type = 'button';
    b.addEventListener('click', alClic);
    return b;
  }

  function pintarChips() {
    const cont = $('tienda-cats');
    cont.innerHTML = '';
    cont.appendChild(chip('Todos (' + estado.productos.length + ')', estado.cat === null, function () {
      estado.cat = null; estado.sub = null; estado.visibles = POR_PAGINA; pintarTodo();
    }));
    estado.categorias
      .filter(function (c) { return c.padre_id === null; })
      .sort(function (a, b) { return a.orden - b.orden; })
      .forEach(function (c) {
        const n = contar([c.id].concat(hijos(c.id).map(function (h) { return h.id; })));
        if (!n) return;
        cont.appendChild(chip(c.nombre + ' (' + n + ')', estado.cat === c.id, function () {
          estado.cat = c.id; estado.sub = null; estado.visibles = POR_PAGINA; pintarTodo();
        }));
      });

    const sub = $('tienda-subcats');
    sub.innerHTML = '';
    if (estado.cat === null) return;
    const hs = hijos(estado.cat);
    if (!hs.length) return;
    sub.appendChild(chip('Todas', estado.sub === null, function () {
      estado.sub = null; estado.visibles = POR_PAGINA; pintarTodo();
    }));
    hs.forEach(function (h) {
      const n = contar([h.id]);
      if (!n) return;
      sub.appendChild(chip(h.nombre + ' (' + n + ')', estado.sub === h.id, function () {
        estado.sub = h.id; estado.visibles = POR_PAGINA; pintarTodo();
      }));
    });
  }

  function tarjeta(p) {
    const card = el('article', 'prod-card' + (p.disponible ? '' : ' agotado'));
    const caja = el('button', 'prod-img');
    caja.type = 'button';
    caja.setAttribute('aria-label', 'Ver ' + p.nombre);
    caja.appendChild(imagen(p.imagenes && p.imagenes[0], p.nombre));
    if (!p.disponible) {
      caja.appendChild(el('span', 'prod-badge agotado', 'Agotado'));
    } else if (p.precio_oferta) {
      caja.appendChild(el('span', 'prod-badge oferta', '-' + Math.round((1 - p.precio_oferta / p.precio) * 100) + '%'));
    }
    caja.addEventListener('click', function () { abrirDetalle(p); });

    const info = el('div', 'prod-info');
    if (p.marca) info.appendChild(el('span', 'prod-marca', p.marca));
    info.appendChild(el('h3', 'prod-nombre', p.nombre));
    const precio = el('div', 'prod-precio');
    precio.appendChild(el('strong', 'ahora', peso.format(precioFinal(p))));
    if (p.precio_oferta) precio.appendChild(el('s', 'antes', peso.format(p.precio)));
    info.appendChild(precio);
    const btn = el('button', 'btn-primario sm prod-btn', 'Ver detalle');
    btn.type = 'button';
    btn.addEventListener('click', function () { abrirDetalle(p); });
    info.appendChild(btn);

    card.appendChild(caja);
    card.appendChild(info);
    return card;
  }

  function pintarGrid() {
    const lista = filtrados();
    const grid = $('tienda-grid');
    grid.innerHTML = '';
    $('tienda-conteo').textContent = lista.length + (lista.length === 1 ? ' producto' : ' productos');
    if (!lista.length) {
      grid.appendChild(el('p', 'tienda-vacio', 'No encontramos productos con esa b\u00fasqueda. Prueba con otra palabra o cambia de categor\u00eda.'));
    }
    lista.slice(0, estado.visibles).forEach(function (p) { grid.appendChild(tarjeta(p)); });
    $('tienda-mas').hidden = lista.length <= estado.visibles;
  }

  function pintarTodo() { pintarChips(); pintarGrid(); }

  let modal = null;
  let ultimoFoco = null;

  function enlaceWhatsApp(p) {
    const msg = 'Hola DAVIERCELL, quiero este producto: ' + p.nombre + ' (C\u00f3d. ' + p.codigo + ') - ' +
      peso.format(precioFinal(p)) + '. \u00bfEst\u00e1 disponible?';
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
  }

  function crearModal() {
    modal = el('div', 'tienda-modal');
    modal.hidden = true;
    const fondo = el('div', 'tienda-modal-fondo');
    const caja = el('div', 'tienda-modal-caja');
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-modal', 'true');
    caja.setAttribute('aria-labelledby', 'tm-titulo');
    const cerrar = el('button', 'tienda-modal-cerrar', '\u00d7');
    cerrar.type = 'button';
    cerrar.id = 'tm-cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar');
    const cuerpo = el('div', 'tienda-modal-cuerpo');
    cuerpo.id = 'tm-cuerpo';
    caja.appendChild(cerrar);
    caja.appendChild(cuerpo);
    modal.appendChild(fondo);
    modal.appendChild(caja);
    fondo.addEventListener('click', cerrarDetalle);
    cerrar.addEventListener('click', cerrarDetalle);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) cerrarDetalle();
    });
    document.body.appendChild(modal);
  }

  async function cargarDescripcion(p, nodo) {
    try {
      const r = await pedir('productos?id=eq.' + encodeURIComponent(p.id) + '&select=descripcion');
      const d = r[0] && r[0].descripcion;
      if (d && nodo.isConnected) nodo.textContent = d;
    } catch (e) {
      console.error('Error cargando descripcion:', e);
    }
  }

  function abrirDetalle(p) {
    if (!modal) crearModal();
    ultimoFoco = document.activeElement;
    const cuerpo = $('tm-cuerpo');
    cuerpo.innerHTML = '';

    const galeria = el('div', 'tm-galeria');
    const principal = imagen(p.imagenes && p.imagenes[0], p.nombre);
    principal.className = 'tm-principal';
    galeria.appendChild(principal);
    const fotos = (p.imagenes || []).filter(urlSegura).slice(0, 8);
    if (fotos.length > 1) {
      const minis = el('div', 'tm-minis');
      fotos.forEach(function (u) {
        const b = el('button', 'tm-mini');
        b.type = 'button';
        b.setAttribute('aria-label', 'Ver foto');
        b.appendChild(imagen(u, ''));
        b.addEventListener('click', function () { principal.src = u; });
        minis.appendChild(b);
      });
      galeria.appendChild(minis);
    }

    const info = el('div', 'tm-info');
    if (p.marca) info.appendChild(el('span', 'prod-marca', p.marca));
    const h = el('h3', 'tm-titulo', p.nombre);
    h.id = 'tm-titulo';
    info.appendChild(h);
    info.appendChild(el('span', 'tm-codigo', 'C\u00f3digo: ' + p.codigo));

    const precio = el('div', 'tm-precio');
    precio.appendChild(el('strong', 'ahora', peso.format(precioFinal(p))));
    if (p.precio_oferta) precio.appendChild(el('s', 'antes', peso.format(p.precio)));
    info.appendChild(precio);

    let disp = 'Disponible';
    if (!p.disponible) disp = 'Agotado';
    else if (p.stock !== null && p.stock <= 5) disp = p.stock === 1 ? 'Queda 1 unidad' : 'Quedan ' + p.stock + ' unidades';
    info.appendChild(el('span', 'tm-disp' + (p.disponible ? '' : ' no'), disp));

    const desc = el('div', 'tm-desc', p.descripcion_corta || '');
    info.appendChild(desc);

    const wa = el('a', 'btn-primario', 'Consultar por WhatsApp');
    wa.href = enlaceWhatsApp(p);
    wa.target = '_blank';
    wa.rel = 'noopener';
    info.appendChild(wa);

    cuerpo.appendChild(galeria);
    cuerpo.appendChild(info);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('tm-cerrar').focus();
    cargarDescripcion(p, desc);
  }

  function cerrarDetalle() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  function enlazar() {
    const buscar = $('tienda-buscar');
    if (!buscar) return;
    let t = null;
    buscar.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        estado.texto = buscar.value;
        estado.visibles = POR_PAGINA;
        if (estado.cargado) pintarGrid();
      }, 200);
    });
    $('tienda-orden').addEventListener('change', function (e) {
      estado.orden = e.target.value;
      estado.visibles = POR_PAGINA;
      if (estado.cargado) pintarGrid();
    });
    $('tienda-mas').addEventListener('click', function () {
      estado.visibles += POR_PAGINA;
      pintarGrid();
    });
  }

  window.abrirProductoTienda = function (id) {
    const p = estado.productos.find(function (x) { return x.id === id; });
    if (p) abrirDetalle(p);
  };
  const original = window.mostrarSeccion;
  if (typeof original === 'function') {
    window.mostrarSeccion = function (id) {
      original.apply(this, arguments);
      if (id === 'tienda' && !estado.cargado) cargar();
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enlazar);
  else enlazar();
})();
