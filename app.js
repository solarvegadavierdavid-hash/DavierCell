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
  'revision-presupuesto': { titulo: "Revisión y Presupuesto", texto: "En nuestro centro de reparación, te ofrecemos un servicio eficiente y confiable. Las fallas comunes, como cambios de pantalla o batería, se resuelven en un plazo de 1 a 2 días hábiles. Para problemas más complejos, como dispositivos apagados, manipulados o mojados, el tiempo de reparación varía entre 4 y 7 días. Si tu dispositivo está en buen estado y no ha sido manipulado previamente, te damos prioridad para una reparación más rápida. Todos nuestros servicios incluyen un costo que varía según el modelo, y contamos con promociones especiales." },
  'pago-reparacion': { titulo: "Pago de Reparación", texto: "En nuestra empresa, no tienes que pagar nada por adelantado: la revisión y el diagnóstico inicial son 100% gratuitos. Solo pagas una vez que la reparación esté terminada y a tu total satisfacción.<br><br>Para tu comodidad, contamos con múltiples medios de pago:<br><br>📱 Pagos electrónicos: Nequi y Bancolombia.<br>💵 Efectivo." },
  'equipos-abandonados': { titulo: "Equipos Abandonados", texto: "En nuestra empresa nos tomamos muy en serio el cuidado de tus dispositivos. Sin embargo, por razones de espacio en el taller y para evitar riesgos de seguridad con las baterías, manejamos los siguientes plazos de retiro:<br><br>📅 Plazo máximo: Una vez que te notifiquemos que tu equipo está listo (o el diagnóstico terminado), tendrás un plazo máximo de dos (2) meses para recogerlo.<br><br>⚠️ Proceso de abandono: Si en este tiempo el equipo no es retirado por falta de presupuesto o desinterés, se considerará en estado de abandono.<br><br>♻️ Disposición final: Pasados los tres meses, el dispositivo será enviado a un centro especializado de reciclaje tecnológico y no podremos hacernos responsables por el mismo." },
  'reparacion': { titulo: "Reparación", texto: "Nuestro proceso es transparente de principio a fin para que dejes tu equipo en las mejores manos:<br><br>1️⃣ Diagnóstico e ingreso: Evaluamos tu dispositivo y te entregamos un presupuesto claro con el tiempo estimado de entrega.<br><br>2️⃣ Garantía de confianza: Todas nuestras reparaciones cuentan con una garantía de hasta seis (4) meses (sujeta al estado inicial del equipo).<br><br>⚠️ Notas importantes sobre el servicio técnico<br>Al reparar tecnología existen riesgos inevitables debido a los daños previos del dispositivo. Al dejar tu equipo, aceptas las siguientes condiciones:<br><br>📱 Pantallas rotas: Si la pantalla llega fisurada o muy partida, puede deteriorarse más o dañarse por completo al intentar desmontarla. El cliente asume este riesgo técnico.<br><br>🔌 Equipos con fallas intermitentes: Si un dispositivo ingresa encendido pero con daños graves, los componentes pueden fallar definitivamente durante el proceso técnico y el equipo podría quedarse apagado. Esto es un riesgo propio del daño inicial y no responsabilidad de nuestra empresa.<br><br>🛠️ Nuestro compromiso: Haremos todo lo técnicamente posible por salvar tu equipo, pero si el daño de fábrica o del golpe es irreversible, la responsabilidad no recaerá sobre nuestro laboratorio." },
  'garantia': { titulo: "Garantía", texto: "Para tu tranquilidad, respaldamos la calidad de nuestro trabajo técnico bajo las siguientes condiciones claras:<br><br>✅ Equipos sin manipulación previa (Garantía Completa): Si tu dispositivo no ha sido abierto ni revisado por otro servicio técnico antes de ingresar a nuestro taller, cuentas con una garantía de seis (4) meses.<br><br>🔄 Equipos manipulados previamente (Garantía Reducida): Si el equipo ya fue revisado, abierto o trabajado en otro taller antes de traérnoslo, la garantía será de tres (3) meses debido al riesgo de daños preexistentes.<br><br>🔧 ¿Qué cubre la garantía?: La cobertura aplica únicamente sobre la pieza o componente que fue reparado o cambiado. Por ejemplo: si cambiamos la pantalla y luego te falla la batería, esa falla externa no estará cubierta.<br><br>🚫 ¿Qué anula por completo la garantía?<br>Para mantener vigente la garantía de tu reparación, es fundamental cumplir con lo siguiente:<br><br>❌ No llevarlo a otros talleres: Si durante el periodo de garantía el equipo es abierto, revisado o manipulado por otro técnico o por ti mismo, la garantía se anulará de inmediato.<br><br>📞 Reportar directamente con nosotros: Ante cualquier fallo o novedad con la reparación, debes ponerte en contacto directamente con nuestro equipo para darte soporte." },
  'desbloqueo': { titulo: "Desbloqueo", texto: "En nuestra empresa nos esforzamos por brindar un servicio profesional, honesto y totalmente transparente. Por esta razón, recordamos a toda nuestra clientela en Cartagena y sus alrededores nuestras políticas estrictas de seguridad:<br><br>🚫 No realizamos desbloqueos: En nuestro centro de servicios NO quitamos cuentas de iCloud, ni de iOS, ni bloqueos de operador.<br><br>⚖️ Cero manipulación ilegal: No alteramos software ni recibimos equipos que se encuentren reportados. Nuestro enfoque es 100% técnico y legal (reparación de hardware, pantallas, placas, etc.).<br><br>💰 No pedimos dinero por adelantado: Nosotros no solicitamos pagos anticipados por estos servicios a través de redes sociales o WhatsApp.<br><br>Si alguien te contacta a nombre de nuestra empresa ofreciéndote desbloqueos o pidiéndote dinero por adelantado para ello, es falso y se trata de una estafa.<br><br>Nuestra única sede y canales oficiales atienden directamente para brindarte soporte técnico real, seguro y garantizado. ¡No te dejes engañar!" },
  'revision-calidad': { titulo: "Revisión de Calidad", texto: "Para tu total tranquilidad, ningún dispositivo sale de nuestro taller sin pasar por un control estricto. Al concluir cada reparación, realizamos un test riguroso de calidad para asegurarnos de que todo funcione a la perfección:<br><br>📱 En Celulares: Revisamos minuciosamente las cámaras, los sensores, la señal y conectividad de la tarjeta SIM, el táctil y la batería.<br><br>💻 En Computadores: Chequeamos pantallas, cámaras de video, teclados, puertos de conexión y rendimiento general del sistema.<br><br>🎥 Transparencia total en tus manos<br>Antes de entregarte el equipo, realizamos un chequeo final completo y te enviamos un video detallado mostrando el dispositivo en perfecto estado y con todas sus funciones operativas.<br><br>Así tienes la certeza y la seguridad del estado óptimo en el que recibes tu equipo, garantizando un servicio totalmente honesto y sin sorpresas." }
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
  const menu = document.querySelector('.condiciones-menu');
  const terminos = document.querySelector('.terminos-generales-bloque');

  if (menu) menu.classList.add('oculto');
  if (terminos) terminos.classList.add('oculto');

  detalle.innerHTML = `
    <div class="condicion-detalle">
      <span class="volver-condiciones" onclick="volverMenuCondiciones()"><i class="fas fa-arrow-left"></i> Volver al menú</span>
      <h3>${condicion.titulo}</h3>
      <p>${condicion.texto}</p>
    </div>
  `;
  detalle.scrollIntoView({ behavior: 'smooth' });
}

function volverMenuCondiciones() {
  const menu = document.querySelector('.condiciones-menu');
  const terminos = document.querySelector('.terminos-generales-bloque');
  const detalle = document.getElementById('detalle-condicion');

  if (menu) menu.classList.remove('oculto');
  if (terminos) terminos.classList.remove('oculto');
  detalle.innerHTML = '';

  const spans = document.querySelectorAll('.condiciones-menu span');
  spans.forEach(span => span.classList.remove('activo'));

  if (menu) menu.scrollIntoView({ behavior: 'smooth' });
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


