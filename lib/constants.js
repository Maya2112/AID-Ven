// ─── Íconos por nombre ────────────────────────────────────────────────────────
// Mapeados a emojis para uso en componentes de navegación y formularios
export const ICONOS = {
  pill: "💊",
  baby: "👶",
  stethoscope: "🩺",
  sparkles: "✨",
  utensils: "🍽️",
  shield: "🛡️",
  "spray-can": "🧴",
  package: "📦",
  home: "🏠",
  list: "📋",
  plus: "＋",
  globe: "🌍",
  chart: "📊",
  truck: "🚛",
  admin: "🔑",
  logout: "⇒",
};

// ─── Colores para exportación PDF (jsPDF usa arrays RGB) ──────────────────────
export const NAVY_RGB = [15, 31, 61];
export const SLATE_RGB = [100, 116, 139];

// ─── Progreso de donativos/cajas ───────────────────────────────────────────────
// Escala secuencial de un solo tono (más oscuro = más avanzado). Las cajas solo
// usan los últimos 3 pasos (empacado en adelante) — son el mismo enum compartido,
// así que el color de "empacado" es idéntico se vea en un donativo o en una caja.
export const ESTADOS_PROGRESO = {
  recibido:         { paso: 1, label: "Recibido" },
  clasificado:      { paso: 2, label: "Clasificado" },
  empacado:         { paso: 3, label: "Empacado" },
  listo_para_envio: { paso: 4, label: "Listo para envío" },
  enviado:          { paso: 5, label: "Enviado" },
};
export const claseBadgeEstado = (estado) => `badge-estado-${ESTADOS_PROGRESO[estado]?.paso ?? 1}`;
// Sin fallback a paso 1: una fila con un estado no reconocido no debe pintarse
// como si estuviera "recibido" (paso 1) — mejor sin estilo, igual que el
// fallback explícito de EstadoBadge para estados desconocidos.
export const claseFilaEstado = (estado) => ESTADOS_PROGRESO[estado] ? `fila-estado-${ESTADOS_PROGRESO[estado].paso}` : "";
