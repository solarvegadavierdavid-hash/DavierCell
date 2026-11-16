// =============================================
// DAVIERCELL - configuracion PUBLICA del registro de clientes
// Aqui solo van claves publicas. La Secret Key de Turnstile NUNCA va aqui: vive solo en Supabase.
// =============================================
window.DC_CONFIG = {
  // Interruptor del registro obligatorio al agregar al carrito.
  // Dejar en false hasta terminar de configurar Supabase (SQL, direcciones, correo) y publicar.
  registroActivo: false,

  // Site Key de Cloudflare Turnstile (clave PUBLICA)
  turnstileSiteKey: '0x4AAAAAAGC1YsoEDWV-I4yu'
};
