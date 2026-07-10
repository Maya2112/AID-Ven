"use client";

import { ICONOS } from "@/lib/constants";

/**
 * Renderiza un emoji de ícono por nombre.
 * Usa el mapa centralizado de ICONOS para mantener consistencia visual.
 */
export default function Ico({ name, size = 14 }) {
  if (!name) return null;
  return (
    <span style={{ fontSize: size }}>
      {ICONOS[name] || "•"}
    </span>
  );
}
