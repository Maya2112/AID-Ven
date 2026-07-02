"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { buscarOCrearCaja } from "@/lib/cajas";

export default function ModalAsignarCaja({ donacion, centroId, onClose, onSaved }) {
  const [numeroCaja, setNumeroCaja] = useState(donacion.caja?.numero_caja || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    setError(""); setLoading(true);
    const { cajaId, error: errCaja } = await buscarOCrearCaja({
      centroId, numeroCaja, tipoId: donacion.tipo_id, categoriaId: donacion.categoria_id,
    });
    if (errCaja) { setError("No se pudo asociar la caja: " + errCaja.message); setLoading(false); return; }

    const { error: errUpdate } = await supabase.from("donaciones")
      .update({ caja_id: cajaId }).eq("id", donacion.id);
    if (errUpdate) { setError("No se pudo guardar: " + errUpdate.message); setLoading(false); return; }
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Asignar caja</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error mb-3">⚠️ {error}</div>}
          <p style={{fontSize:12.5,color:"var(--slate-500)",marginBottom:14}}>
            {donacion.nombre_producto}
          </p>
          <div className="field">
            <label>Número/código de caja</label>
            <input value={numeroCaja} onChange={e=>setNumeroCaja(e.target.value)} placeholder="Ej: CAJA-01" autoFocus/>
            <span className="hint">Déjalo vacío para quitar esta donación de cualquier caja.</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={loading}>
            {loading?<><span className="spinner"/> Guardando...</>:"Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
