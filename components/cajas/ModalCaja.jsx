"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Ico from "@/components/ui/Ico";

export default function ModalCaja({ onClose, onSaved, tipos, categorias, centroId, cajaExistente }) {
  const [form, setForm] = useState({
    tipo_id: cajaExistente?.tipo_id || "",
    categoria_id: cajaExistente?.categoria_id || "",
    numero_caja: cajaExistente?.numero_caja || "",
    largo_cm: cajaExistente?.largo_cm || "",
    ancho_cm: cajaExistente?.ancho_cm || "",
    alto_cm: cajaExistente?.alto_cm || "",
    peso_kg: cajaExistente?.peso_kg || "",
    contenido_resumen: cajaExistente?.contenido_resumen || "",
    estado: cajaExistente?.estado || "empacado",
    fecha_empaque: cajaExistente?.fecha_empaque || new Date().toISOString().split("T")[0],
    observaciones: cajaExistente?.observaciones || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const catsFiltradas = categorias.filter(c=>c.tipo_id===form.tipo_id);

  const volumenCalculado = () => {
    const l=parseFloat(form.largo_cm), a=parseFloat(form.ancho_cm), h=parseFloat(form.alto_cm);
    if (l && a && h) return ((l*a*h)/1000000).toFixed(6);
    return null;
  };

  const handleSave = async () => {
    if (!centroId) { setError("Tu cuenta no tiene un centro de acopio asignado."); return; }
    if (!form.tipo_id || !form.categoria_id || !form.peso_kg) {
      setError("Completa: Tipo, Categoría y Peso de la caja."); return;
    }
    const pesoNum = parseFloat(form.peso_kg);
    if (isNaN(pesoNum) || pesoNum <= 0 || pesoNum > 500) {
      setError("El peso de la caja debe ser un número mayor a 0 y menor o igual a 500 kg."); return;
    }
    setError(""); setLoading(true);
    const payload = {
      centro_id: centroId,
      tipo_id: form.tipo_id,
      categoria_id: form.categoria_id,
      numero_caja: form.numero_caja || null,
      largo_cm: form.largo_cm ? parseFloat(form.largo_cm) : null,
      ancho_cm: form.ancho_cm ? parseFloat(form.ancho_cm) : null,
      alto_cm: form.alto_cm ? parseFloat(form.alto_cm) : null,
      peso_kg: pesoNum,
      contenido_resumen: form.contenido_resumen || null,
      estado: form.estado,
      fecha_empaque: form.fecha_empaque,
      observaciones: form.observaciones || null,
    };
    try {
      let err;
      if (cajaExistente) {
        ({ error: err } = await supabase.from("cajas_embalaje").update(payload).eq("id", cajaExistente.id));
      } else {
        ({ error: err } = await supabase.from("cajas_embalaje").insert(payload));
      }
      if (err) { setError(err.message); setLoading(false); return; }
      onSaved();
    } catch (e) {
      setError("No se pudo guardar: revisa tu conexión a internet e intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{cajaExistente ? "Editar Caja de Embalaje" : "Registrar Caja de Embalaje"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error mb-3">⚠️ {error}</div>}
          <div className="alert alert-info mb-4" style={{fontSize:12.5}}>
            📦 Registra aquí el peso y volumen <strong>real medido</strong> de una caja física ya empacada
            (báscula y cinta métrica), agrupando todo lo de una misma categoría.
          </div>

          <div className="section-label">Clasificación de la caja</div>
          <div className="type-tabs mb-4">
            {tipos.map(t=>(
              <button key={t.id} className={`type-tab ${form.tipo_id===t.id?"active":""}`}
                onClick={()=>{set("tipo_id",t.id);set("categoria_id","");}}>
                <Ico name={t.icono} size={13}/> {t.nombre}
              </button>
            ))}
          </div>

          {form.tipo_id && (
            <div className="form-grid mb-4">
              <div className="field">
                <label>Categoría <span className="req">*</span></label>
                <select value={form.categoria_id} onChange={e=>set("categoria_id",e.target.value)}>
                  <option value="">— Selecciona —</option>
                  {catsFiltradas.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Número / Etiqueta de caja</label>
                <input value={form.numero_caja} onChange={e=>set("numero_caja",e.target.value)} placeholder="Ej: CAJA-001"/>
              </div>
            </div>
          )}

          <div className="section-label">Contenido</div>
          <div className="field mb-4">
            <label>Resumen del contenido</label>
            <input value={form.contenido_resumen} onChange={e=>set("contenido_resumen",e.target.value)}
              placeholder="Ej: Ibuprofeno, Paracetamol, Naproxeno (bolsas ziploc)"/>
          </div>

          <div className="section-label">Peso y Volumen Real</div>
          <div className="form-grid-3 mb-2">
            <div className="field">
              <label>Largo (cm)</label>
              <input type="number" step="0.1" min="0" value={form.largo_cm} onChange={e=>set("largo_cm",e.target.value)} placeholder="40"/>
            </div>
            <div className="field">
              <label>Ancho (cm)</label>
              <input type="number" step="0.1" min="0" value={form.ancho_cm} onChange={e=>set("ancho_cm",e.target.value)} placeholder="30"/>
            </div>
            <div className="field">
              <label>Alto (cm)</label>
              <input type="number" step="0.1" min="0" value={form.alto_cm} onChange={e=>set("alto_cm",e.target.value)} placeholder="25"/>
            </div>
          </div>
          {volumenCalculado() && (
            <div className="alert alert-info mb-3" style={{fontSize:12.5}}>
              📐 Volumen calculado: <strong>{volumenCalculado()} m³</strong>
            </div>
          )}
          <div className="field mb-4">
            <label>Peso real en báscula (kg) <span className="req">*</span></label>
            <input type="number" step="0.001" min="0" value={form.peso_kg} onChange={e=>set("peso_kg",e.target.value)} placeholder="Ej: 8.400"/>
          </div>

          <div className="section-label">Estado y Observaciones</div>
          <div className="form-grid">
            <div className="field">
              <label>Fecha de empaque</label>
              <input type="date" value={form.fecha_empaque} onChange={e=>set("fecha_empaque",e.target.value)}/>
            </div>
            <div className="field">
              <label>Estado</label>
              <select value={form.estado} onChange={e=>set("estado",e.target.value)}>
                <option value="empacado">Empacado</option>
                <option value="listo_para_envio">Listo para envío</option>
                <option value="enviado">Enviado</option>
              </select>
            </div>
            <div className="field form-full">
              <label>Observaciones</label>
              <textarea value={form.observaciones} onChange={e=>set("observaciones",e.target.value)} rows={2}
                placeholder="Notas adicionales sobre esta caja..."/>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading?<><span className="spinner"/> Guardando...</>:cajaExistente?"Guardar Cambios":"Registrar Caja"}
          </button>
        </div>
      </div>
    </div>
  );
}
