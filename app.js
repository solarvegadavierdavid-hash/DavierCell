// =============================================
// DAVIERCELL - Configuración Supabase
// =============================================

const SUPABASE_URL = 'https://fpqdtuyoujlodjqvpzkz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcWR0dXlvdWpsb2RqcXZwemt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMTY0NjksImV4cCI6MjA5ODU5MjQ2OX0.80MpUmSk5jp8wXtEwZFj-hNcUMmNnBOA438U1IUcH8M';

async function enviarASupabase(datos) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/formularios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(datos)
    });
    console.log('Status Supabase:', response.status);
    const text = await response.text();
    console.log('Respuesta Supabase:', text);
    return response.status === 200 || response.status === 201;
  } catch (err) {
    console.error('Error Supabase:', err);
    return false;
  }
}

const descripcion = "En DAVIERCELL o también conocido como TECNOMOVILSHOP, entendemos que un dispositivo móvil es mucho más que tecnología; es el centro de tu productividad y tu conexión con el mundo. Nuestra filosofía se basa en la convergencia de la arquitectura de sistemas y la microelectrónica de alta precisión. Cada equipo que ingresa a nuestro laboratorio es tratado bajo rigurosos estándares de ingeniería, analizando cada síntoma para ofrecer una solución definitiva. No solo reparamos dispositivos, garantizamos la continuidad de tu vida digital con la confianza que solo un experto puede brindar.";

const servicios = [
  { nombre: "Microsoldadura y Reconstrucción de Hardware", descripcion: "Mediante procesos de microsoldadura avanzada, intervenimos la placa base para rescatar circuitos integrados, reconstruir pistas dañadas y realizar diagnósticos profundos mediante esquemáticos profesional." },
  { nombre: "Sustitución de Pines de Carga", descripcion: "Reemplazamos pines de carga dañados con precisión absoluta, respetando la integridad original del fabricante." },
  { nombre: "Cambio de Baterías de Alto Rendimiento", descripcion: "Instalamos baterías de alto rendimiento para que tu equipo recupere su autonomía original." },
  { nombre: "Instalación de Pantallas de Última Generación", descripcion: "Instalación quirúrgica de pantallas en cualquier modelo de celular o tablet con la máxima precisión." },
  { nombre: "Recuperación de Sistemas Operativos", descripcion: "Aplicamos soluciones de lógica avanzada para la recuperación de sistemas operativos bloqueados o dañados." },
  { nombre: "Corrección de Errores de Firmware", descripcion: "Identificamos y corregimos errores de firmware para restaurar el funcionamiento óptimo de tu dispositivo." },
  { nombre: "Optimización Avanzada de Software", descripcion: "Optimización integral del rendimiento para que el software de tu equipo opere con máxima eficiencia y seguridad." }
];

const garantias = [
  { titulo: "Diagnóstico Basado en Datos", descripcion: "No adivinamos. Utilizamos herramientas de medición y análisis técnico para identificar la raíz exacta del problema." },
  { titulo: "Compromiso con la Excelencia", descripcion: "La limpieza, el orden y la metodología de ingeniería son los pilares de cada una de nuestras entregas." },
  { titulo: "Atención de Alto Nivel", descripcion: "Transparencia total. Comunicación clara y técnica sobre los procesos realizados en tu equipo." }
];

const tecnico = {
  nombre: "Davier David Solar Vega",
  titulo: "Servicio Técnico Especializado en Dispositivos Móviles",
  descripcion: "Con 5 años de trayectoria en el sector tecnológico, ofrezco soluciones integrales para la reparación y optimización de dispositivos móviles. Mi enfoque combina la precisión de la microelectrónica con el dominio avanzado de herramientas de software, garantizando diagnósticos exactos y resultados profesionales. Hardware Avanzado: Reparación de placas base, diagnóstico mediante mediciones de precisión y solución de fallas físicas complejas. Especialista en Software: optimización de sistemas y soporte técnico especializado. Compromiso de Calidad: Cada equipo es tratado con altos estándares técnicos."
};

const condiciones = {
  'revision-presupuesto': { titulo: "Revisión y Presupuesto", texto: " estoy trabajando en ello." },
  'pago-reparacion': { titulo: "Pago de Reparación", texto: " estoy trabajando en ello." },
  'equipos-abandonados': { titulo: "Equipos Abandonados", texto: " estoy trabajando en ello." },
  'reparacion': { titulo: "Reparación", texto: " estoy trabajando en ello." },
  'garantia': { titulo: "Garantía", texto: " estoy trabajando en ello." },
  'desbloqueo': { titulo: "Desbloqueo", texto: " estoy trabajando en ello." },
  'revision-calidad': { titulo: "Revisión de Calidad", texto: " estoy trabajando en ello." }
};

const listaServicios = document.getElementById("lista-servicios");
servicios.forEach(servicio => {
  listaServicios.innerHTML += `
    <div class="servicio-card">
      <h3>${servicio.nombre}</h3>
      <p>${servicio.descripcion}</p>
    </div>
  `;
});

const listaGarantias = document.getElementById("lista-garantias");
if (listaGarantias) {
  garantias.forEach(garantia => {
    listaGarantias.innerHTML += `
      <div class="garantia-card">
        <h3>${garantia.titulo}</h3>
        <p>${garantia.descripcion}</p>
      </div>
    `;
  });
}

const infoTecnico = document.getElementById("info-tecnico");
infoTecnico.innerHTML = `
  <h3>${tecnico.titulo} | ${tecnico.nombre}</h3>
  <p>${tecnico.descripcion}</p>
`;

const listaFaq = document.getElementById("lista-faq");
const faqs = [
  { pregunta: "¿Las reparaciones tienen garantía?", respuesta: "Sí, ofrecemos garantía en nuestras reparaciones, la cual varía según el tipo de servicio realizado." },
  { pregunta: "¿Cuánto tiempo tarda una reparación?", respuesta: "Dependiendo del daño, muchas reparaciones pueden hacerse el mismo día; otras más complejas pueden requerir más tiempo." },
  { pregunta: "¿Puedo enviar mi equipo por mensajería para reparación?", respuesta: "Sí, contamos con un servicio de recepción y entrega de equipos a distancia en algunos países." },
  { pregunta: "¿Ofrecen facturación?", respuesta: "Sí, emitimos factura o comprobante de pago según la legislación de cada país." },
  { pregunta: "¿Qué métodos de pago aceptan?", respuesta: "Aceptamos pagos en efectivo, tarjetas de crédito/débito y Nequi." },
  { pregunta: "¿Atienden sin cita previa?", respuesta: "Sí, aunque recomendamos agendar para evitar esperas, especialmente en reparaciones complejas." }
];

faqs.forEach((faq, index) => {
  listaFaq.innerHTML += `
    <div class="faq-item" onclick="toggleFaq(${index})">
      <div class="faq-pregunta">
        <span>+ ${faq.pregunta}</span>
        <span>›</span>
      </div>
      <div class="faq-respuesta oculto" id="faq-${index}">
        <p>${faq.respuesta}</p>
      </div>
    </div>
  `;
});

function mostrarSeccion(idSeccion) {
  const secciones = document.querySelectorAll('section');
  secciones.forEach(sec => { sec.classList.add('oculto'); });

  const seccionActiva = document.getElementById(idSeccion);
  if (seccionActiva) { seccionActiva.classList.remove('oculto'); }

  const enlacesNav = document.querySelectorAll('nav a');
  enlacesNav.forEach(enlace => {
    enlace.classList.remove('activo');
    if (enlace.getAttribute('onclick').includes(idSeccion)) { enlace.classList.add('activo'); }
  });

  if (idSeccion === 'inicio') iniciarCircuitosInicio();
  if (idSeccion === 'tecnico') iniciarCircuitos();
  if (idSeccion === 'condiciones') iniciarCircuitosCondiciones();
  if (idSeccion === 'porque') iniciarCircuitosPorque();
  if (idSeccion === 'pqrs') iniciarCircuitosPqrs();

  const nav = document.getElementById('nav-menu');
  if (nav) nav.classList.remove('nav-abierto');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleFaq(index) {
  const respuesta = document.getElementById(`faq-${index}`);
  respuesta.classList.toggle('oculto');
}

function mostrarCondicion(id) {
  const condicion = condiciones[id];
  const detalle = document.getElementById("detalle-condicion");

  const spans = document.querySelectorAll('.condiciones-menu span');
  spans.forEach(span => span.classList.remove('activo'));
  event.target.classList.add('activo');

  detalle.innerHTML = `
    <div class="condicion-detalle">
      <h3>${condicion.titulo}</h3>
      <p>${condicion.texto}</p>
    </div>
  `;
  detalle.scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  const formPqrs = document.getElementById('form-pqrs');
  if (formPqrs) {
    formPqrs.addEventListener('submit', async (e) => {
      e.preventDefault();
      const boton = formPqrs.querySelector('button[type="submit"]');
      boton.textContent = 'Enviando...';
      boton.disabled = true;

      const datos = {
        nombre: formPqrs.querySelector('[name="nombre"]').value,
        email: formPqrs.querySelector('[name="email"]').value,
        celular: formPqrs.querySelector('[name="celular"]').value,
        rs: formPqrs.querySelector('[name="rs"]').value,
        sede: formPqrs.querySelector('[name="sede"]').value,
        mensaje: formPqrs.querySelector('[name="mensaje"]').value,
        tipo: 'pqrs'
      };

      const ok = await enviarASupabase(datos);

      if (ok) {
        boton.textContent = '¡Enviado con éxito!';
        boton.style.backgroundColor = '#28a745';
        formPqrs.reset();
        setTimeout(() => {
          boton.textContent = 'Enviar Formulario';
          boton.style.backgroundColor = '';
          boton.disabled = false;
        }, 3000);
      } else {
        boton.textContent = 'Error al enviar. Intenta de nuevo.';
        boton.style.backgroundColor = '#dc3545';
        boton.disabled = false;
      }
    });
  }
});

function calificar(n) {
  const estrellas = document.querySelectorAll('.estrellas-calificacion i');
  const inputValor = document.getElementById('input-valor');
  const botonEnvio = document.getElementById('boton-enviar-calificacion');

  inputValor.value = n;

  estrellas.forEach((estrella, index) => {
    index < n ? estrella.classList.add('activo') : estrella.classList.remove('activo');
  });

  botonEnvio.style.display = 'inline-block';
  document.getElementById('estrellas-container').style.pointerEvents = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  mostrarSeccion('inicio');

  const formCalificacion = document.getElementById('form-calificacion');
  if (formCalificacion) {
    formCalificacion.addEventListener('submit', async (e) => {
      e.preventDefault();
      const calificacion = document.getElementById('input-valor').value;
      if (calificacion === '0') return;

      const ok = await enviarASupabase({ calificacion: calificacion, tipo: 'calificacion' });

      if (ok) {
        document.getElementById('mensaje-gracias').classList.remove('oculto');
        document.getElementById('boton-enviar-calificacion').style.display = 'none';
      }
    });
  }
});

function iniciarCircuitosInicio() {
  const canvas = document.getElementById('circuitos-canvas-inicio');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  const puntos = [];
  for (let i = 0; i < 60; i++) {
    puntos.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, color: Math.random() > 0.5 ? '#00c8ff' : '#c9a84c', radio: Math.random() * 2.5 + 1.5 });
  }
  function animar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    puntos.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.fill();
    });
    for (let i = 0; i < puntos.length; i++) {
      for (let j = i + 1; j < puntos.length; j++) {
        const dx = puntos[i].x - puntos[j].x; const dy = puntos[i].y - puntos[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) { ctx.beginPath(); ctx.moveTo(puntos[i].x, puntos[i].y); ctx.lineTo(puntos[j].x, puntos[j].y); ctx.strokeStyle = `rgba(0, 200, 255, ${1 - dist / 120})`; ctx.lineWidth = 0.6; ctx.shadowBlur = 0; ctx.stroke(); }
      }
    }
    requestAnimationFrame(animar);
  }
  animar();
}

function iniciarCircuitos() {
  const canvas = document.getElementById('circuitos-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  const puntos = [];
  for (let i = 0; i < 60; i++) {
    puntos.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, color: Math.random() > 0.5 ? '#00c8ff' : '#c9a84c', radio: Math.random() * 2.5 + 1.5 });
  }
  function animar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    puntos.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.fill();
    });
    for (let i = 0; i < puntos.length; i++) {
      for (let j = i + 1; j < puntos.length; j++) {
        const dx = puntos[i].x - puntos[j].x; const dy = puntos[i].y - puntos[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) { ctx.beginPath(); ctx.moveTo(puntos[i].x, puntos[i].y); ctx.lineTo(puntos[j].x, puntos[j].y); ctx.strokeStyle = `rgba(0, 200, 255, ${1 - dist / 120})`; ctx.lineWidth = 0.6; ctx.shadowBlur = 0; ctx.stroke(); }
      }
    }
    requestAnimationFrame(animar);
  }
  animar();
}

function iniciarCircuitosCondiciones() {
  const canvas = document.getElementById('circuitos-canvas-condiciones');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  const puntos = [];
  for (let i = 0; i < 60; i++) {
    puntos.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, color: Math.random() > 0.5 ? '#00c8ff' : '#c9a84c', radio: Math.random() * 2.5 + 1.5 });
  }
  function animar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    puntos.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.fill();
    });
    for (let i = 0; i < puntos.length; i++) {
      for (let j = i + 1; j < puntos.length; j++) {
        const dx = puntos[i].x - puntos[j].x; const dy = puntos[i].y - puntos[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) { ctx.beginPath(); ctx.moveTo(puntos[i].x, puntos[i].y); ctx.lineTo(puntos[j].x, puntos[j].y); ctx.strokeStyle = `rgba(0, 200, 255, ${1 - dist / 120})`; ctx.lineWidth = 0.6; ctx.shadowBlur = 0; ctx.stroke(); }
      }
    }
    requestAnimationFrame(animar);
  }
  animar();
}

function iniciarCircuitosPorque() {
  const canvas = document.getElementById('circuitos-canvas-porque');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  const puntos = [];
  for (let i = 0; i < 60; i++) {
    puntos.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, color: Math.random() > 0.5 ? '#00c8ff' : '#c9a84c', radio: Math.random() * 2.5 + 1.5 });
  }
  function animar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    puntos.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.fill();
    });
    for (let i = 0; i < puntos.length; i++) {
      for (let j = i + 1; j < puntos.length; j++) {
        const dx = puntos[i].x - puntos[j].x; const dy = puntos[i].y - puntos[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) { ctx.beginPath(); ctx.moveTo(puntos[i].x, puntos[i].y); ctx.lineTo(puntos[j].x, puntos[j].y); ctx.strokeStyle = `rgba(0, 200, 255, ${1 - dist / 120})`; ctx.lineWidth = 0.6; ctx.shadowBlur = 0; ctx.stroke(); }
      }
    }
    requestAnimationFrame(animar);
  }
  animar();
}

function iniciarCircuitosPqrs() {
  const canvas = document.getElementById('circuitos-canvas-pqrs');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  const puntos = [];
  for (let i = 0; i < 60; i++) {
    puntos.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, color: Math.random() > 0.5 ? '#00c8ff' : '#c9a84c', radio: Math.random() * 2.5 + 1.5 });
  }
  function animar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    puntos.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.fill();
    });
    for (let i = 0; i < puntos.length; i++) {
      for (let j = i + 1; j < puntos.length; j++) {
        const dx = puntos[i].x - puntos[j].x; const dy = puntos[i].y - puntos[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) { ctx.beginPath(); ctx.moveTo(puntos[i].x, puntos[i].y); ctx.lineTo(puntos[j].x, puntos[j].y); ctx.strokeStyle = `rgba(0, 200, 255, ${1 - dist / 120})`; ctx.lineWidth = 0.6; ctx.shadowBlur = 0; ctx.stroke(); }
      }
    }
    requestAnimationFrame(animar);
  }
  animar();
}

function toggleMenu() {
  const nav = document.getElementById('nav-menu');
  nav.classList.toggle('nav-abierto');
}

function marcarEstrella(n) {
  const estrellas = document.querySelectorAll('.estrellas i');
  estrellas.forEach((estrella, index) => {
    index < n ? estrella.classList.add('activo') : estrella.classList.remove('activo');
  });
}

