// =============================================
// TIENDA DAVIERCELL - portada animada
// Usa SUPABASE_URL y SUPABASE_KEY definidas en app.js
// =============================================
(function () {
  'use strict';
  const API = SUPABASE_URL + '/rest/v1/';
  const HEADERS = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY };
  const VIDEO = 'videos/hero-tienda.mp4';
  const peso = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  let iniciado = false, pausado = false, actual = 0;
  const slides = [], dots = [];

  function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function ir(n) {
    if (!slides.length) return;
    actual = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      s.classList.toggle('activo', i === actual);
      dots[i].classList.toggle('activo', i === actual);
    });
  }

  function crearSlide(p) {
    const s = el('div', 'hero-slide');
    const t = el('div', 'hh-texto');
    const dcto = p.precio_oferta ? Math.round((1 - p.precio_oferta / p.precio) * 100) : 0;
    t.appendChild(el('span', 'hh-badge', dcto ? 'OFERTA -' + dcto + '%' : 'DESTACADO'));
    if (p.marca) t.appendChild(el('span', 'hh-marca', p.marca));
    t.appendChild(el('h2', 'hh-nombre', p.nombre));
    const pr = el('div', 'hh-precio');
    pr.appendChild(el('strong', 'ahora', peso.format(p.precio_oferta || p.precio)));
    if (p.precio_oferta) pr.appendChild(el('s', 'antes', peso.format(p.precio)));
    t.appendChild(pr);
    const b = el('button', 'btn-primario hh-cta', 'Ver producto');
    b.type = 'button';
    b.addEventListener('click', function () {
      if (window.abrirProductoTienda) window.abrirProductoTienda(p.id);
    });
    t.appendChild(b);
    const im = el('div', 'hh-img');
    const img = document.createElement('img');
    img.alt = p.nombre;
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', function () { im.style.display = 'none'; });
    img.src = p.imagenes[0];
    im.appendChild(img);
    s.appendChild(t);
    s.appendChild(im);
    return s;
  }

  async function hayVideo() {
    try {
      const r = await fetch(VIDEO, { method: 'HEAD' });
      return r.ok && /video/.test(r.headers.get('content-type') || '');
    } catch (e) { return false; }
  }

  async function iniciar() {
    if (iniciado) return;
    iniciado = true;
    const hero = document.getElementById('tienda-hero');
    if (!hero) return;
    try {
      const r = await fetch(API + 'productos?select=id,nombre,marca,precio,precio_oferta,imagenes,destacado' +
        '&disponible=eq.true&or=(destacado.eq.true,precio_oferta.not.is.null)&limit=60', { headers: HEADERS });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const lista = (await r.json())
        .filter(function (p) { return p.imagenes && /^https:\/\//i.test(p.imagenes[0] || ''); })
        .sort(function () { return Math.random() - 0.5; })
        .slice(0, 6);
      if (!lista.length) return;

      if (await hayVideo()) {
        const v = document.createElement('video');
        v.className = 'hero-bg';
        v.src = VIDEO;
        v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
        v.preload = 'metadata';
        v.setAttribute('aria-hidden', 'true');
        hero.appendChild(v);
        v.play().catch(function () {});
      }

      const caja = el('div', 'hh-dots');
      lista.forEach(function (p, i) {
        const s = crearSlide(p);
        hero.appendChild(s);
        slides.push(s);
        const d = el('button', 'hh-dot');
        d.type = 'button';
        d.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1));
        d.addEventListener('click', function () { ir(i); });
        caja.appendChild(d);
        dots.push(d);
      });
      hero.appendChild(caja);
      ['mouseenter', 'focusin'].forEach(function (e) { hero.addEventListener(e, function () { pausado = true; }); });
      ['mouseleave', 'focusout'].forEach(function (e) { hero.addEventListener(e, function () { pausado = false; }); });
      ir(0);
      hero.hidden = false;
      if (slides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setInterval(function () { if (!pausado && !document.hidden) ir(actual + 1); }, 6000);
      }
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
