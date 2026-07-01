"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ModalNuevaCategoria({ onClose, onCreated, tipoId, tipoNombre, esAdmin }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tieneTalla, setTieneTalla] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creada, setCreada] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setError(""); setLoading(true);
    const { error: err } = await supabase.from("categorias").insert({
      tipo_id: tipoId, nombre: nombre.trim(), descripcion: descripcion.trim() || null,
      tiene_campo_talla: tieneTalla, es_predeterminada: false,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    if (esAdmin) { onCreated(); return; }
    setCreada(true); setLoading(false);
  };

  if (creada) {
    return (
      <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
        <div className="modal" style={{maxWidth:440}}>
          <div className="modal-header"><h2>Propuesta enviada</h2><button className="modal-close" onClick={onClose}>✕</button></div>
          <div className="modal-body">
            <div className="alert alert-success">
              ✓ Ya puedes usar <strong>{nombre}</strong> dentro de {tipoNombre} para tus donaciones. Quedó en revisión
              por el administrador; una vez aprobada será visible para todos los centros.
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
          <h2>Nueva Categoría</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error mb-3">⚠️ {error}</div>}
          <div className="alert alert-info mb-4" style={{fontSize:12.5}}>
            {esAdmin
              ? <>Esta categoría se agregará dentro de <strong>{tipoNombre}</strong> y quedará disponible inmediatamente para todos los centros.</>
              : <>Esta categoría se agregará dentro de <strong>{tipoNombre}</strong>. Podrás usarla de inmediato; quedará pendiente de aprobación para mostrarse también a los demás centros.</>}
          </div>
          <div className="field mb-3">
            <label>Nombre <span className="req">*</span></label>
            <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Cuadernos y Libretas" autoFocus/>
          </div>
          <div className="field mb-3">
            <label>Leyenda / guía (opcional)</label>
            <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} rows={2}
              placeholder="Ej: Cuadernos, libretas, lápices, colores..."/>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"}}>
            <input type="checkbox" checked={tieneTalla} onChange={e=>setTieneTalla(e.target.checked)}/>
            Esta categoría necesita campo de talla/tamaño (ej. pañales, bolsas)
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading?<><span className="spinner"/> Creando...</>:"Crear Categoría"}
          </button>
        </div>
      </div>
    </div>
  );
}
