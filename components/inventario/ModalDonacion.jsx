"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Tooltip from "@/components/ui/Tooltip";
import Ico from "@/components/ui/Ico";
import ModalNuevoTipo from "./ModalNuevoTipo";
import ModalNuevaCategoria from "./ModalNuevaCategoria";

export default function ModalDonacion({ onClose, onSaved, tipos, categorias, catalogo, centroId, onCatalogoChange, esAdmin }) {
  const [form, setForm] = useState({
    tipo_id:"", categoria_id:"", catalogo_id:"", nombre_producto:"", presentacion_mg:"",
    unidad:"unidad", cantidad_total:"", unidades_nivel2:"", unidades_nivel3:"",
    tipo_frasco:"", volumen_ml_frasco:"",
    talla:"", peso_unitario_kg:"",
    estado:"recibido", fecha_ingreso:new Date().toISOString().split("T")[0], observaciones:""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNuevoTipo, setShowNuevoTipo] = useState(false);
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const tipoSel = tipos.find(t=>t.id===form.tipo_id);
  const esMed = tipoSel?.nombre?.toLowerCase().includes("medicamento");
  const catsFiltradas = categorias.filter(c=>c.tipo_id===form.tipo_id);
  const catSel = categorias.find(c=>c.id===form.categoria_id);
  const productosFiltrados = catalogo.filter(p=>p.categoria_id===form.categoria_id);

  const totalMin = () => {
    const c=parseInt(form.cantidad_total)||0;
    const n2=parseInt(form.unidades_nivel2)||1;
    const n3=parseInt(form.unidades_nivel3)||1;
    return c*n2*n3;
  };

  const unidades = esMed
    ? ["caja","blister","frasco","ampolla","vial","sobre","unidad"]
    : ["unidad","caja","paquete","bolsa","litro","kg","rollo","par","juego","pieza"];

  // Al elegir un producto del catalogo, autocompletar peso/volumen/unidad/presentacion
  const handleSeleccionarProducto = (nombreEscrito) => {
    set("nombre_producto", nombreEscrito);
    const match = productosFiltrados.find(p => p.nombre.toLowerCase() === nombreEscrito.toLowerCase());
    if (match) {
      setForm(f => ({
        ...f,
        nombre_producto: match.nombre,
        catalogo_id: match.id,
        presentacion_mg: match.presentacion_mg || f.presentacion_mg,
        unidad: match.unidad_base || f.unidad,
        unidades_nivel2: match.unidades_nivel2 ? String(match.unidades_nivel2) : f.unidades_nivel2,
        unidades_nivel3: match.unidades_nivel3 ? String(match.unidades_nivel3) : f.unidades_nivel3,
        tipo_frasco: match.tipo_frasco || f.tipo_frasco,
        volumen_ml_frasco: match.volumen_ml_frasco ? String(match.volumen_ml_frasco) : f.volumen_ml_frasco,
        peso_unitario_kg: match.peso_unitario_kg ? String(match.peso_unitario_kg) : f.peso_unitario_kg,
      }));
      setPesoEditadoManual(false);
    } else {
      // Producto nuevo, no en catalogo: limpiar catalogo_id pero dejar peso editable
      set("catalogo_id", "");
    }
  };

  const handleSave = async () => {
    if (!centroId) {
      setError("Tu cuenta no tiene un centro de acopio asignado. Contacta al administrador para que te asigne uno antes de registrar donaciones.");
      return;
    }
    if (!form.tipo_id||!form.categoria_id||!form.nombre_producto||!form.cantidad_total) {
      setError("Completa: Tipo, Categoría, Nombre del producto y Cantidad."); return;
    }
    setError(""); setLoading(true);

    try {
      const esFrasco = form.unidad === "frasco";

      // Si el producto no existe en el catalogo, lo guardamos para futuras donaciones (peso autocompletado la proxima vez)
      let catalogoId = form.catalogo_id || null;
      if (!catalogoId) {
        const { data: nuevoProd, error: errCat } = await supabase.from("catalogo_productos").insert({
          tipo_id: form.tipo_id,
          categoria_id: form.categoria_id,
          nombre: form.nombre_producto,
          es_medicamento: esMed,
          presentacion_mg: esMed ? (form.presentacion_mg||null) : null,
          unidad_base: form.unidad,
          unidades_nivel2: form.unidades_nivel2 ? parseInt(form.unidades_nivel2) : null,
          unidades_nivel3: form.unidades_nivel3 ? parseInt(form.unidades_nivel3) : null,
          tipo_frasco: esFrasco ? (form.tipo_frasco||null) : null,
          volumen_ml_frasco: esFrasco && form.tipo_frasco==="liquido" ? (parseFloat(form.volumen_ml_frasco)||null) : null,
          peso_unitario_kg: form.peso_unitario_kg ? parseFloat(form.peso_unitario_kg) : 0,
          es_predeterminado: false,
        }).select("id").single();
        // Si fallo crear el producto de catalogo (ej. nombre duplicado), no es fatal: seguimos sin catalogoId
        if (nuevoProd) catalogoId = nuevoProd.id;
      }

      const { error: err } = await supabase.from("donaciones").insert({
        centro_id: centroId,
        tipo_id: form.tipo_id,
        categoria_id: form.categoria_id,
        catalogo_id: catalogoId,
        nombre_producto: form.nombre_producto,
        presentacion_mg: esMed ? (form.presentacion_mg||null) : null,
        unidad: form.unidad,
        cantidad_total: parseInt(form.cantidad_total),
        unidades_nivel2: form.unidades_nivel2 ? parseInt(form.unidades_nivel2) : null,
        unidades_nivel3: esFrasco && form.tipo_frasco==="solido" ? parseInt(form.unidades_nivel3)||null : (form.unidades_nivel3 ? parseInt(form.unidades_nivel3) : null),
        tipo_frasco: esFrasco ? (form.tipo_frasco||null) : null,
        volumen_ml_frasco: esFrasco && form.tipo_frasco==="liquido" ? (parseFloat(form.volumen_ml_frasco)||null) : null,
        talla: form.talla||null,
        peso_unitario_kg: form.peso_unitario_kg ? parseFloat(form.peso_unitario_kg) : 0,
        estado: form.estado,
        fecha_ingreso: form.fecha_ingreso,
        observaciones: form.observaciones||null,
      });
      if (err) { setError(err.message); setLoading(false); return; }
      if (onCatalogoChange) onCatalogoChange();
      onSaved();
    } catch (e) {
      setError("No se pudo guardar: revisa tu conexión a internet e intenta de nuevo. Si el problema persiste, tus datos no se han perdido, solo no se han enviado todavía.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Registrar Donación</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error mb-3">⚠️ {error}</div>}

          <div className="flex justify-between items-center mb-2">
            <div className="section-label" style={{marginBottom:0}}>Tipo de producto</div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowNuevoTipo(true)}>
              ＋ Nuevo tipo
            </button>
          </div>
          <div className="type-tabs mb-4">
            {tipos.map(t=>(
              <button key={t.id} className={`type-tab ${form.tipo_id===t.id?"active":""}`}
                onClick={()=>{set("tipo_id",t.id);set("categoria_id","");set("catalogo_id","");}}>
                <Ico name={t.icono} size={13}/> {t.nombre}
              </button>
            ))}
          </div>

          {form.tipo_id && (
            <div className="form-grid mb-4">
              <div className="field">
                <div className="flex justify-between items-center">
                  <label>Categoría <span className="req">*</span></label>
                  <button type="button" onClick={()=>setShowNuevaCategoria(true)}
                    style={{background:"none",border:"none",color:"var(--blue)",fontSize:11.5,cursor:"pointer",fontFamily:"var(--font-ui)"}}>
                    ＋ Nueva categoría
                  </button>
                </div>
                <select value={form.categoria_id} onChange={e=>{set("categoria_id",e.target.value);set("catalogo_id","");}}>
                  <option value="">— Selecciona —</option>
                  {catsFiltradas.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {catSel?.descripcion && (
                  <span style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
                    <Tooltip text={catSel.descripcion}/>
                    <span style={{fontSize:11,color:"var(--blue)"}}>Ver qué incluye esta categoría</span>
                  </span>
                )}
              </div>
              <div className="field">
                <label>Fecha de ingreso</label>
                <input type="date" value={form.fecha_ingreso} onChange={e=>set("fecha_ingreso",e.target.value)}/>
              </div>
            </div>
          )}

          {form.categoria_id && <>
            <div className="section-label">Producto</div>
            <div className="form-grid mb-2">
              <div className="field form-full">
                <label>Nombre del producto <span className="req">*</span></label>
                <input
                  list={`productos-${form.categoria_id}`}
                  value={form.nombre_producto}
                  onChange={e=>handleSeleccionarProducto(e.target.value)}
                  placeholder={esMed?"Escribe o elige: Paracetamol, Ibuprofeno...":"Escribe o elige de la lista..."}
                />
                <datalist id={`productos-${form.categoria_id}`}>
                  {productosFiltrados.map(p=>(<option key={p.id} value={p.nombre}/>))}
                </datalist>
                <span className="hint">
                  {form.catalogo_id
                    ? "✓ Producto del catálogo — peso cargado automáticamente (puedes editarlo)"
                    : "Producto nuevo — el peso es opcional (se guardará para la próxima vez)"}
                </span>
              </div>
              {esMed && (
                <div className="field">
                  <label>Presentación / Concentración</label>
                  <input value={form.presentacion_mg} onChange={e=>set("presentacion_mg",e.target.value)}
                    placeholder="Ej: 500mg, 250ml, 10mg/5ml"/>
                </div>
              )}
              <div className="field">
                <label>Unidad de conteo</label>
                <select value={form.unidad} onChange={e=>set("unidad",e.target.value)}>
                  {unidades.map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              {catSel?.tiene_campo_talla && (
                <div className="field">
                  <label>Talla / Tamaño</label>
                  <input value={form.talla} onChange={e=>set("talla",e.target.value)}
                    placeholder="Ej: RN, T1, T2, Grande, 10L..."/>
                </div>
              )}
            </div>

            <div className="section-label" style={{marginTop:16}}>Cantidad</div>
            <div className="form-grid mb-3">
              <div className="field">
                <label>Cantidad ({form.unidad}s) <span className="req">*</span></label>
                <input type="number" min="1" value={form.cantidad_total} onChange={e=>set("cantidad_total",e.target.value)} placeholder="Ej: 50"/>
              </div>
              {esMed && form.unidad==="caja" && (
                <div className="field">
                  <label>Blisters por caja</label>
                  <input type="number" min="1" value={form.unidades_nivel2} onChange={e=>set("unidades_nivel2",e.target.value)} placeholder="Ej: 3"/>
                </div>
              )}
              {esMed && (form.unidad==="caja"||form.unidad==="blister") && (
                <div className="field">
                  <label>Pastillas / cápsulas por blister</label>
                  <input type="number" min="1" value={form.unidades_nivel3} onChange={e=>set("unidades_nivel3",e.target.value)} placeholder="Ej: 10"/>
                </div>
              )}
              {esMed && form.unidad==="frasco" && (
                <div className="field">
                  <label>Contenido del frasco <span className="req">*</span></label>
                  <select value={form.tipo_frasco} onChange={e=>set("tipo_frasco",e.target.value)}>
                    <option value="">— Selecciona —</option>
                    <option value="solido">Sólido (pastillas/cápsulas)</option>
                    <option value="liquido">Líquido (jarabe, solución)</option>
                  </select>
                </div>
              )}
              {esMed && form.unidad==="frasco" && form.tipo_frasco==="solido" && (
                <div className="field">
                  <label>Pastillas / cápsulas por frasco</label>
                  <input type="number" min="1" value={form.unidades_nivel3} onChange={e=>set("unidades_nivel3",e.target.value)} placeholder="Ej: 100"/>
                </div>
              )}
              {esMed && form.unidad==="frasco" && form.tipo_frasco==="liquido" && (
                <div className="field">
                  <label>Volumen por frasco (ml)</label>
                  <input type="number" min="1" value={form.volumen_ml_frasco} onChange={e=>set("volumen_ml_frasco",e.target.value)} placeholder="Ej: 120"/>
                  <span className="hint">Solo informativo de la presentación (ej. jarabe 120ml)</span>
                </div>
              )}
            </div>
            {esMed && form.cantidad_total && (form.unidad!=="frasco" || form.tipo_frasco==="solido") && (
              <div className="alert alert-info mb-4" style={{fontSize:12.5}}>
                📊 Total de pastillas/cápsulas: <strong>{totalMin().toLocaleString()}</strong>
              </div>
            )}

            <div className="section-label">Peso (opcional) {form.catalogo_id && form.peso_unitario_kg && <span style={{color:"var(--green)",fontWeight:400}}>· autocompletado</span>}</div>
            <div className="form-grid mb-4">
              <div className="field">
                <label>Peso por {form.unidad} (kg)</label>
                <input type="number" step="0.001" min="0" value={form.peso_unitario_kg}
                  onChange={e=>{set("peso_unitario_kg",e.target.value);setPesoEditadoManual(true);}} placeholder="0.050 (opcional)"/>
                {form.peso_unitario_kg&&form.cantidad_total&&(
                  <span className="hint">Total: {(parseFloat(form.peso_unitario_kg)*parseInt(form.cantidad_total||0)).toFixed(2)} kg</span>
                )}
              </div>
            </div>

            <div className="section-label">Estado y Observaciones</div>
            <div className="form-grid">
              <div className="field">
                <label>Estado inicial</label>
                <select value={form.estado} onChange={e=>set("estado",e.target.value)}>
                  <option value="recibido">Recibido</option>
                  <option value="clasificado">Clasificado</option>
                  <option value="empacado">Empacado</option>
                  <option value="listo_para_envio">Listo para envío</option>
                  <option value="enviado">Enviado</option>
                </select>
              </div>
              <div className="field form-full">
                <label>Observaciones</label>
                <textarea value={form.observaciones} onChange={e=>set("observaciones",e.target.value)}
                  placeholder="Lote, vencimiento, condición del producto, donante, notas..." rows={2}/>
              </div>
            </div>
          </>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading?<><span className="spinner"/> Guardando...</>:"Guardar Donación"}
          </button>
        </div>
      </div>

      {showNuevoTipo && (
        <ModalNuevoTipo
          onClose={()=>setShowNuevoTipo(false)}
          esAdmin={esAdmin}
          onCreated={async ()=>{ setShowNuevoTipo(false); if(onCatalogoChange) await onCatalogoChange(); }}
        />
      )}
      {showNuevaCategoria && form.tipo_id && (
        <ModalNuevaCategoria
          onClose={()=>setShowNuevaCategoria(false)}
          tipoId={form.tipo_id}
          tipoNombre={tipoSel?.nombre || ""}
          esAdmin={esAdmin}
          onCreated={async ()=>{ setShowNuevaCategoria(false); if(onCatalogoChange) await onCatalogoChange(); }}
        />
      )}
    </div>
  );
}
