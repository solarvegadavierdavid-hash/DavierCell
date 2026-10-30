// =============================================
// TIENDA DAVIERCELL - portada tipo video con TODOS los productos
// Usa SUPABASE_URL y SUPABASE_KEY definidas en app.js
// =============================================
(function () {
  'use strict';
  const API = SUPABASE_URL + '/rest/v1/';
  const HEADERS = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY };
  const peso = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  let iniciado = false, lista = [], actual = 0, hero = null, vivo = null, relleno = null, contador = null;

  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }
  function mezclar(l) { return l.slice().sort(function () { return Math.random() - 0.5; }); }
  function abrir(p) { if (window.abrirProductoTienda) window.abrirProductoTienda(p.id); }

  function reiniciarBarra() {
    relleno.style.animationName = 'none';
    void relleno.offsetWidth;
    relleno.style.animationName = '';
  }

  function precargar() {
    const p = lista[(actual + 1) % lista.length];
    if (!p) return;
    const im = new Image();
    im.referrerPolicy = 'no-referrer';
    im.src = p.imagenes[0];
  }

  function crearSlide(p) {
    const s = el('div', 'hero-slide');
    const t = el('div', 'hh-texto');
    const dcto = p.precio_oferta ? Math.round((1 - p.precio_oferta / p.precio) * 100) : 0;
    t.appendChild(el('span', 'hh-badge', dcto ? 'OFERTA -' + dcto + '%' : (p.destacado ? 'DESTACADO' : 'DISPONIBLE')));
    t.appendChild(el('span', 'hh-marca', p.marca || 'DAVIERCELL'));
    t.appendChild(el('h2', 'hh-nombre', p.nombre));
    const pr = el('div', 'hh-precio');
    pr.appendChild(el('strong', 'ahora', peso.format(p.precio_oferta || p.precio)));
    if (p.precio_oferta) pr.appendChild(el('s', 'antes', peso.format(p.precio)));
    t.appendChild(pr);
    const b = el('button', 'btn-primario hh-cta', 'Ver producto');
    b.type = 'button';
    b.addEventListener('click', function () { abrir(p); });
    t.appendChild(b);
    const im = el('div', 'hh-img');
    const img = document.createElement('img');
    img.alt = p.nombre;
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', function () {
      if (s.classList.contains('activo')) mostrar(actual + 1); else im.style.display = 'none';
    });
    img.src = p.imagenes[0];
    im.appendChild(img);
    s.appendChild(t);
    s.appendChild(im);
    return s;
  }

  function mostrar(n) {
    actual = (n + lista.length) % lista.length;
    const nuevo = crearSlide(lista[actual]);
    hero.appendChild(nuevo);
    void nuevo.offsetWidth;
    nuevo.classList.add('activo');
    const viejo = vivo;
    if (viejo) {
      viejo.classList.remove('activo');
      setTimeout(function () { viejo.remove(); }, 700);
    }
    vivo = nuevo;
    contador.textContent = (actual + 1) + ' / ' + lista.length;
    reiniciarBarra();
    precargar();
  }

  function crearCinta(productos) {
    const cinta = document.getElementById('tienda-cinta');
    if (!cinta || !productos.length) return;
    const pista = el('div', 'cinta-pista');
    productos.concat(productos).forEach(function (p, i) {
      const b = el('button', 'cinta-item');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ver ' + p.nombre);
      if (i >= productos.length) { b.setAttribute('aria-hidden', 'true'); b.tabIndex = -1; }
      const img = document.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', function () { b.style.display = 'none'; });
      img.src = p.imagenes[0];
      b.appendChild(img);
      b.appendChild(el('span', 'cinta-precio', peso.format(p.precio_oferta || p.precio)));
      b.addEventListener('click', function () { abrir(p); });
      pista.appendChild(b);
    });
    pista.style.animationDuration = (productos.length * 3) + 's';
    cinta.appendChild(pista);
    cinta.hidden = false;
  }

  async function iniciar() {
    if (iniciado) return;
    iniciado = true;
    hero = document.getElementById('tienda-hero');
    if (!hero) return;
    try {
      const r = await fetch(API + 'productos?select=id,nombre,marca,precio,precio_oferta,imagenes,destacado&disponible=eq.true&limit=1000', { headers: HEADERS });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const todos = (await r.json()).filter(function (p) { return p.imagenes && /^https:\/\//i.test(p.imagenes[0] || ''); });
      if (!todos.length) return;
      const arriba = todos.filter(function (p) { return p.precio_oferta || p.destacado; });
      const resto = todos.filter(function (p) { return !(p.precio_oferta || p.destacado); });
      lista = mezclar(arriba).concat(mezclar(resto));

      contador = el('div', 'hh-contador');
      const barra = el('div', 'hh-barra');
      relleno = document.createElement('i');
      relleno.addEventListener('animationend', function () { mostrar(actual + 1); });
      barra.appendChild(relleno);
      const ant = el('button', 'hh-nav ant', '\u2039');
      ant.type = 'button';
      ant.setAttribute('aria-label', 'Producto anterior');
      ant.addEventListener('click', function () { mostrar(actual - 1); });
      const sig = el('button', 'hh-nav sig', '\u203a');
      sig.type = 'button';
      sig.setAttribute('aria-label', 'Producto siguiente');
      sig.addEventListener('click', function () { mostrar(actual + 1); });
      hero.appendChild(contador);
      hero.appendChild(ant);
      hero.appendChild(sig);
      hero.appendChild(barra);
      ['mouseenter', 'focusin'].forEach(function (e) { hero.addEventListener(e, function () { hero.classList.add('pausa'); }); });
      ['mouseleave', 'focusout'].forEach(function (e) { hero.addEventListener(e, function () { hero.classList.remove('pausa'); }); });
      mostrar(0);
      hero.hidden = false;
      crearCinta(mezclar(todos).slice(0, 40));
    } catch (e) {
      console.error('Error cargando portada:', e);
      iniciado = false;
    }
  }

  const original = window.mostrarSeccion;
  if (typeof original === 'function') {
    window.mostrarSeccion = function (id) {
      original.apply(this, arguments);
      if (id === 'tienda') iniciar();
    };
  }
})();
