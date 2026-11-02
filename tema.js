// =============================================
// DAVIERCELL - modo oscuro / claro
// Se carga en el <head> para evitar parpadeos.
// =============================================
(function () {
  'use strict';
  var CLAVE = 'dc-tema';
  var raiz = document.documentElement;

  function leer() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem(CLAVE, v); } catch (e) { /* sin almacenamiento */ } }

  function aplicar(t) {
    raiz.setAttribute('data-tema', t);
    var b = document.getElementById('btn-tema');
    if (!b) return;
    var claro = t === 'claro';
    b.setAttribute('aria-pressed', claro ? 'true' : 'false');
    b.setAttribute('aria-label', claro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
    b.title = claro ? 'Modo oscuro' : 'Modo claro';
    var i = b.querySelector('i');
    if (i) i.className = claro ? 'fas fa-moon' : 'fas fa-sun';
  }

  aplicar(leer() === 'claro' ? 'claro' : 'oscuro');

  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('btn-tema');
    if (!b) return;
    aplicar(raiz.getAttribute('data-tema'));
    b.addEventListener('click', function () {
      var nuevo = raiz.getAttribute('data-tema') === 'claro' ? 'oscuro' : 'claro';
      aplicar(nuevo);
      guardar(nuevo);
    });
  });
})();
