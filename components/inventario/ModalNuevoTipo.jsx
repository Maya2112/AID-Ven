"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ModalNuevoTipo({ onClose, onCreated, esAdmin }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creado, setCreado] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setError(""); setLoading(true);
    const { error: err } = await supabase.from("tipos_producto").insert({
      nombre: nombre.trim(), descripcion: descripcion.trim() || null,
      icono: "package", es_predeterminado: false,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    if (esAdmin) { onCreated(); return; }
    setCreado(true); setLoading(false);
  };

  if (creado) {
    return (
      <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
        <div className="modal" style={{maxWidth:440}}>
          <div className="modal-header"><h2>Propuesta enviada</h2><button className="modal-close" onClick={onClose}>✕</button></div>
          <div className="modal-body">
            <div className="alert alert-success">
              ✓ Ya puedes usar <strong>{nombre}</strong> para tus donaciones. Quedó en revisión por el administrador;
              una vez aprobado será visible para todos los centros.
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onCreated}>Listo</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:440}}>
        <div className="modal-header">
          <h2>Nuevo Tipo de Producto</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error mb-3">⚠️ {error}</div>}
          <div className="alert alert-info mb-4" style={{fontSize:12.5}}>
            {esAdmin
              ? "Este tipo quedará disponible inmediatamente para todos los centros de acopio."
              : "Podrás usarlo de inmediato en tu centro. Quedará pendiente de aprobación para que se muestre también a los demás centros."}
          </div>
          <div className="field mb-3">
            <label>Nombre <span className="req">*</span></label>
            <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Material Escolar" autoFocus/>
          </div>
          <div className="field">
            <label>Descripción (opcional)</label>
            <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} rows={2}
              placeholder="Breve descripción de qué incluye este tipo"/>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading?<><span className="spinner"/> Creando...</>:"Crear Tipo"}
          </button>
        </div>
      </div>
    </div>
  );
}
