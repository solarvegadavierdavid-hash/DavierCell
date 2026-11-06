// =============================================
// DAVIERCELL - Google Analytics 4 con consentimiento
// - No carga nada de Google hasta que el visitante acepta.
// - Si GA_ID esta vacio, este archivo no hace nada (ni banner ni medicion).
// - Nunca envia nombres, cedulas, telefonos, correos ni contenido de formularios.
// Debe cargarse DESPUES de app.js
// =============================================
(function () {
  'use strict';

  const GA_ID = ''; // Ej: 'G-XXXXXXXXXX' (ID de medicion de GA4)
  if (!/^G-[A-Z0-9]{6,}$/.test(GA_ID)) return;

  const CLAVE = 'dc-analitica';
  const FORMULARIOS = { 'form-aceptacion': 'aceptacion', 'form-pqrs': 'pqrs', 'form-calificacion': 'calificacion' };

  let activo = false;
  let seccion = null;
  const iniciados = {};

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });

  function leer() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem(CLAVE, v); } catch (e) { /* sin almacenamiento */ } }

  function borrarCookies() {
    const host = location.hostname;
    document.cookie.split(';').forEach(function (c) {
      const n = c.split('=')[0].trim();
      if (n !== '_ga' && n.indexOf('_ga_') !== 0) return;
      document.cookie = n + '=; Max-Age=0; path=/';
      document.cookie = n + '=; Max-Age=0; path=/; domain=' + host;
      document.cookie = n + '=; Max-Age=0; path=/; domain=.' + host;
    });
  }

  function cargarGa() {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
  }

  let cargado = false;
  function activar() {
    window['ga-disable-' + GA_ID] = false;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (!cargado) { cargado = true; cargarGa(); }
    activo = true;
    if (seccion) vistaDePagina(seccion);
  }

  function desactivar() {
    activo = false;
    window['ga-disable-' + GA_ID] = true;
    gtag('consent', 'update', { analytics_storage: 'denied' });
    borrarCookies();
  }

  function evento(nombre, params) { if (activo) gtag('event', nombre, params || {}); }

  function vistaDePagina(id) {
    evento('page_view', {
      page_title: document.title,
      page_location: location.origin + location.pathname + '#' + id,
      page_path: '/' + id
    });
  }

  // ---- Banner de preferencias ----
  let banner = null;
  function decidir(si) {
    guardar(si ? 'si' : 'no');
    if (si) activar(); else desactivar();
    if (banner) banner.hidden = true;
  }

  function boton(texto, clase, alClic) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = clase;
    b.textContent = texto;
    b.addEventListener('click', alClic);
    return b;
  }

  function mostrarBanner() {
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'dc-consent';
      banner.setAttribute('role', 'region');
      banner.setAttribute('aria-label', 'Preferencias de privacidad');
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Usamos Google Analytics para contar visitas y clics y así mejorar el sitio. Solo se activa si lo aceptas y no enviamos tus datos personales. '));
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = 'Política de privacidad';
      a.addEventListener('click', function (e) { e.preventDefault(); if (window.mostrarSeccion) window.mostrarSeccion('privacidad'); });
      p.appendChild(a);
      const acciones = document.createElement('div');
      acciones.className = 'dc-consent-acciones';
      acciones.appendChild(boton('Rechazar', 'dc-consent-btn', function () { decidir(false); }));
      acciones.appendChild(boton('Aceptar', 'dc-consent-btn principal', function () { decidir(true); }));
      banner.appendChild(p);
      banner.appendChild(acciones);
      document.body.appendChild(banner);
    }
    banner.hidden = false;
  }

  // ---- Eventos (todos opt-in: solo si el visitante acepto) ----
  document.addEventListener('daviercell:seccion', function (e) {
    const id = e.detail && e.detail.id;
    if (!id || id === seccion) return;
    seccion = id;
    vistaDePagina(id);
    if (id === 'servicios') evento('view_services');
  });

  document.addEventListener('daviercell:producto', function (e) {
    const d = e.detail || {};
    evento('view_products', { item_id: d.codigo, item_name: d.nombre, item_category: d.categoria });
  });

  document.addEventListener('click', function (e) {
    const a = e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (!a) return;
    const zona = a.closest('section, footer, header');
    evento('whatsapp_click', { ubicacion: (zona && (zona.id || zona.tagName.toLowerCase())) || 'flotante' });
  });

  document.addEventListener('focusin', function (e) {
    const f = e.target.closest && e.target.closest('form');
    const nombre = f && FORMULARIOS[f.id];
    if (!nombre || iniciados[nombre]) return;
    iniciados[nombre] = true;
    evento('form_start', { form_id: nombre });
  });

  document.addEventListener('daviercell:form-ok', function (e) {
    const d = e.detail || {};
    if (!d.form) return;
    iniciados[d.form] = false;
    evento('form_submit', { form_id: d.form });
    if (d.lead) evento('generate_lead', { form_id: d.form });
  });

  // ---- Arranque ----
  function iniciar() {
    const enlace = document.getElementById('pref-privacidad');
    if (enlace) {
      enlace.hidden = false;
      enlace.addEventListener('click', function (e) { e.preventDefault(); mostrarBanner(); });
    }
    const previo = leer();
    if (previo === 'si') activar();
    else if (previo === 'no') desactivar();
    else mostrarBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
