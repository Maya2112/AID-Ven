"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import EstadoBadge from "@/components/ui/EstadoBadge";
import ModalCaja from "./ModalCaja";

export default function CajasEmbalajeView({ centro, tipos, categorias }) {
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("all");

  const fetchCajas = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("cajas_embalaje")
      .select("*").eq("centro_id", centro.id).order("created_at", { ascending: false });
    setCajas(data || []);
    setLoading(false);
  }, [centro.id]);

  useEffect(() => { fetchCajas(); }, [fetchCajas]);

  const getNombre = (id, arr) => arr.find(a=>a.id===id)?.nombre || "—";
  const filtradas = filtroTipo === "all" ? cajas : cajas.filter(c=>c.tipo_id===filtroTipo);

  const totalPeso = filtradas.reduce((s,c)=>s+(parseFloat(c.peso_kg)||0),0);
  const totalVol = filtradas.reduce((s,c)=>s+(parseFloat(c.volumen_m3)||0),0);

  const cambiarEstado = async (id, estado) => {
    await supabase.from("cajas_embalaje").update({estado}).eq("id", id);
    setCajas(prev=>prev.map(c=>c.id===id?{...c,estado}:c));
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta caja registrada? No se puede deshacer.")) return;
    await supabase.from("cajas_embalaje").delete().eq("id", id);
    setCajas(prev=>prev.filter(c=>c.id!==id));
  };

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-header-text">
          <h2>Cajas de Embalaje</h2>
          <p>Peso y volumen real medido de cada caja física empacada · {centro.nombre}</p>
        </div>
        <button className="btn btn-primary" onClick={()=>{setEditando(null);setShowModal(true);}} disabled={centro.estado!=="aprobado"}>
          ＋ Registrar Caja
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent-blue">
          <div className="stat-label">Total de cajas</div>
          <div className="stat-value">{filtradas.length}</div>
        </div>
        <div className="stat-card accent-amber">
          <div className="stat-label">Peso real total</div>
          <div className="stat-value">{totalPeso.toFixed(2)}</div>
          <div className="stat-sub">kg</div>
        </div>
        <div className="stat-card accent-navy">
          <div className="stat-label">Volumen real total</div>
          <div className="stat-value">{totalVol.toFixed(3)}</div>
          <div className="stat-sub">m³</div>
        </div>
      </div>

      <div className="card card-pad mb-4">
        <div className="field" style={{maxWidth:260}}>
          <label>Filtrar por tipo</label>
          <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}>
            <option value="all">Todos los tipos</option>
            {tipos.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Cajas registradas ({filtradas.length})</h3></div>
        <div className="table-wrap">
          {loading ? <div className="empty-state"><p>Cargando...</p></div>
          : filtradas.length===0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>Sin cajas registradas</h3>
              <p>Cuando empaquen una caja física, regístrala aquí con su peso y volumen real medido.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Caja</th><th>Tipo</th><th>Categoría</th><th>Contenido</th>
                  <th>Dimensiones (cm)</th><th>Volumen (m³)</th><th>Peso (kg)</th>
                  <th>Fecha</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(c=>(
                  <tr key={c.id}>
                    <td style={{fontWeight:600}}>{c.numero_caja || "—"}</td>
                    <td style={{fontSize:12}}>{getNombre(c.tipo_id, tipos)}</td>
                    <td style={{fontSize:12}}>{getNombre(c.categoria_id, categorias)}</td>
                    <td style={{fontSize:12,maxWidth:200}}>{c.contenido_resumen || "—"}</td>
                    <td style={{fontSize:12,whiteSpace:"nowrap"}}>
                      {c.largo_cm&&c.ancho_cm&&c.alto_cm ? `${c.largo_cm}×${c.ancho_cm}×${c.alto_cm}` : "—"}
                    </td>
                    <td style={{fontSize:12}}>{c.volumen_m3 ? parseFloat(c.volumen_m3).toFixed(5) : "—"}</td>
                    <td style={{fontWeight:600}}>{parseFloat(c.peso_kg).toFixed(2)}</td>
                    <td style={{fontSize:12,whiteSpace:"nowrap"}}>{c.fecha_empaque}</td>
                    <td>
                      <select value={c.estado} onChange={e=>cambiarEstado(c.id,e.target.value)}
                        style={{fontSize:11,padding:"3px 6px",border:"1px solid var(--slate-200)",borderRadius:4,cursor:"pointer"}}>
                        <option value="empacado">Empacado</option>
                        <option value="listo_para_envio">Listo p/envío</option>
                        <option value="enviado">Enviado</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={()=>{setEditando(c);setShowModal(true);}}>✎</button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>eliminar(c.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <ModalCaja
          onClose={()=>{setShowModal(false);setEditando(null);}}
          onSaved={()=>{setShowModal(false);setEditando(null);fetchCajas();}}
          tipos={tipos} categorias={categorias} centroId={centro.id}
          cajaExistente={editando}
        />
      )}
    </div>
  );
}
