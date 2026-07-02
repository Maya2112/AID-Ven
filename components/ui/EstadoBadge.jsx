"use client";
import { ESTADOS_PROGRESO, claseBadgeEstado } from "@/lib/constants";

// Mapa de estado → [clase CSS, etiqueta visible]
// Los estados de progreso (donativos y cajas) usan la escala secuencial de
// lib/constants.js; los estados de centro (pendiente/aprobado/suspendido)
// mantienen su propio esquema, sin relación con el progreso de un donativo.
const ESTADOS = {
  ...Object.fromEntries(
    Object.entries(ESTADOS_PROGRESO).map(([k, v]) => [k, [claseBadgeEstado(k), v.label]])
  ),
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
