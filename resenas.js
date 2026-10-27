// =============================================
// RESENAS (Supabase: tabla "resenas")
// Usa SUPABASE_URL y SUPABASE_KEY definidas en app.js
// =============================================

const RESENAS_URL = `${SUPABASE_URL}/rest/v1/resenas`;
const RESENAS_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
};

function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function estrellasTexto(n) {
  return '\u2605'.repeat(n) + '\u2606'.repeat(5 - n);
}

async function cargarResenas() {
  const grid = document.getElementById('cal-grid');
  if (!grid) return;
  try {
    const r = await fetch(
      `${RESENAS_URL}?select=nombre,estrellas,comentario&aprobada=eq.true&order=created_at.desc&limit=100`,
      { headers: RESENAS_HEADERS }
    );
    if (!r.ok) throw new Error('HTTP ' + r.status);
    pintarResenas(grid, await r.json());
  } catch (err) {
    console.error('Error cargando resenas:', err);
    grid.innerHTML = '';
  }
}

function pintarResenas(grid, resenas) {
  grid.innerHTML = '';

  if (resenas.length === 0) {
    const vacio = el('div', 'cal-card');
    vacio.appendChild(el('p', '', 'A\u00fan no hay opiniones publicadas. \u00a1S\u00e9 el primero en calificarnos!'));
    grid.appendChild(vacio);
    return;
  }

  const total = resenas.length;
  const promedio = resenas.reduce((suma, x) => suma + x.estrellas, 0) / total;

  const score = el('div', 'cal-score');
  score.appendChild(el('div', 'cal-num', promedio.toFixed(1)));
  score.appendChild(el('div', 'cal-est', estrellasTexto(Math.round(promedio))));
  score.appendChild(el('small', '', `(${total} ${total === 1 ? 'opini\u00f3n' : 'opiniones'})`));
  grid.appendChild(score);

  resenas.slice(0, 6).forEach(r => {
    const card = el('div', 'cal-card');
    const user = el('div', 'cal-user');
    user.appendChild(el('div', 'cal-av', r.nombre.trim().charAt(0).toUpperCase()));
    const info = document.createElement('div');
    info.appendChild(el('strong', '', r.nombre));
    info.appendChild(el('span', 'est', estrellasTexto(r.estrellas)));
    user.appendChild(info);
    card.appendChild(user);
    card.appendChild(el('p', '', r.comentario));
    grid.appendChild(card);
  });
}

function calificar(n) {
  document.getElementById('input-valor').value = n;
  document.querySelectorAll('.estrellas-calificacion i').forEach((s, i) => {
    s.classList.toggle('activo', i < n);
  });
  document.getElementById('boton-enviar-calificacion').style.display = 'inline-block';
}

document.addEventListener('DOMContentLoaded', () => {
  cargarResenas();

  const form = document.getElementById('form-calificacion');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const estrellas = parseInt(document.getElementById('input-valor').value, 10);
    const nombre = document.getElementById('resena-nombre').value.trim();
    const comentario = document.getElementById('resena-comentario').value.trim();
    const boton = document.getElementById('boton-enviar-calificacion');

    if (!estrellas) { alert('Selecciona de 1 a 5 estrellas.'); return; }

    boton.disabled = true;
    boton.textContent = 'Enviando...';

    try {
      const r = await fetch(RESENAS_URL, {
        method: 'POST',
        headers: { ...RESENAS_HEADERS, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ nombre, estrellas, comentario })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.style.display = 'none';
      document.getElementById('mensaje-gracias').classList.remove('oculto');
    } catch (err) {
      console.error('Error enviando resena:', err);
      boton.disabled = false;
      boton.textContent = 'Enviar Calificaci\u00f3n';
      alert('No se pudo enviar tu calificaci\u00f3n. Intenta de nuevo.');
    }
  });
});
