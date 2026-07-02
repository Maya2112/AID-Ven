"use client";
import { ESTADOS_PROGRESO } from "@/lib/constants";

// Leyenda de colores para la escala secuencial de progreso. `estados` filtra
// cuáles mostrar (ej. las cajas solo usan empacado en adelante).
export default function LeyendaEstados({ estados }) {
  const entradas = Object.entries(ESTADOS_PROGRESO)
    .filter(([k]) => !estados || estados.includes(k))
    .sort((a,b) => a[1].paso - b[1].paso);

  return (
    <div className="leyenda-estados">
      <span style={{fontWeight:600,color:"var(--slate-700)"}}>Progreso:</span>
      {entradas.map(([k, v]) => (
        <span className="item" key={k}>
          <span className="swatch" style={{background:`var(--estado-${v.paso}-bg)`}}/>
          {v.label}
        </span>
      ))}
    </div>
  );
}
