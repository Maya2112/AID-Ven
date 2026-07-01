"use client";

// Mapa de estado → [clase CSS, etiqueta visible]
const ESTADOS = {
  recibido:         ["badge-slate",  "Recibido"],
  clasificado:      ["badge-blue",   "Clasificado"],
  empacado:         ["badge-amber",  "Empacado"],
  listo_para_envio: ["badge-green",  "Listo para envío"],
  enviado:          ["badge-navy",   "Enviado"],
  pendiente:        ["badge-amber",  "Pendiente"],
  aprobado:         ["badge-green",  "Aprobado"],
  suspendido:       ["badge-red",    "Suspendido"],
};

/**
 * Badge de estado con color semántico.
 * Funciona tanto para estados de donación como de centro de acopio.
 */
export default function EstadoBadge({ estado }) {
  const [cls, label] = ESTADOS[estado] ?? ["badge-slate", estado];
  return <span className={`badge ${cls}`}>{label}</span>;
}
